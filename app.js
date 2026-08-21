import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   FIREBASE
   ========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyAmtIokqk2p4d_PpGi-6psdvHtwBGJBh1o",
  authDomain: "catracvoice.firebaseapp.com",
  projectId: "catracvoice",
  storageBucket: "catracvoice.firebasestorage.app",
  messagingSenderId: "154787555675",
  appId: "1:154787555675:web:efd310773446d4f45d927e",
  measurementId: "G-0QTJETS9G5"
};

const firebaseApp = initializeApp(firebaseConfig);

const auth = getAuth(firebaseApp);

const db = getFirestore(firebaseApp);


/* =========================================================
   ESTADO
   ========================================================= */

let currentUser = null;

let currentChannel = "general";

let unsubscribeMessages = null;

let unsubscribeChannels = null;

let unsubscribeUsers = null;

const serverId = "catracvoice";


/* =========================================================
   UTILIDADES
   ========================================================= */

const $ = id => document.getElementById(id);


function escapeHTML(value) {

  const div = document.createElement("div");

  div.textContent = value ?? "";

  return div.innerHTML;
}


function showToast(text) {

  const toast = $("toast");

  if (!toast) return;

  toast.textContent = text;

  toast.classList.add("show");

  clearTimeout(window.toastTimer);

  window.toastTimer = setTimeout(() => {

    toast.classList.remove("show");

  }, 2500);
}


function getUsernameFromEmail(email) {

  return email
    .split("@")[0]
    .replace(/[._-]/g, " ")
    .trim() || "Usuario";
}


function getInitial(name) {

  return (name || "U")
    .charAt(0)
    .toUpperCase();
}


function getColor(name) {

  const colors = [
    "green",
    "purple",
    "orange",
    ""
  ];

  let total = 0;

  for (const char of name) {
    total += char.charCodeAt(0);
  }

  return colors[total % colors.length];
}


/* =========================================================
   AUTENTICACIÓN
   ========================================================= */

$("authForm").addEventListener("submit", async event => {

  event.preventDefault();

  const email = $("email").value.trim();

  const password = $("password").value;

  if (!email || !password) {

    showToast("Escribe tu correo y contraseña.");

    return;
  }

  const button =
    event.submitter ||
    document.querySelector(".login-button");

  if (button) {

    button.disabled = true;

    button.textContent = "Entrando...";
  }

  try {

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

  } catch (error) {

    console.error(error);

    if (
      error.code ===
      "auth/invalid-credential"
    ) {

      showToast(
        "Correo o contraseña incorrectos."
      );

    } else if (
      error.code ===
      "auth/invalid-email"
    ) {

      showToast(
        "El correo no es válido."
      );

    } else if (
      error.code ===
      "auth/too-many-requests"
    ) {

      showToast(
        "Demasiados intentos. Espera un momento."
      );

    } else {

      showToast(
        "No se pudo iniciar sesión."
      );
    }

  } finally {

    if (button) {

      button.disabled = false;

      button.textContent = "Entrar";
    }
  }

});


/* =========================================================
   REGISTRO
   ========================================================= */

$("registerBtn").addEventListener(
  "click",
  async () => {

    const email =
      $("email").value.trim();

    const password =
      $("password").value;

    if (!email) {

      showToast(
        "Escribe primero tu correo."
      );

      $("email").focus();

      return;
    }

    if (password.length < 8) {

      showToast(
        "La contraseña debe tener al menos 8 caracteres."
      );

      $("password").focus();

      return;
    }

    try {

      const credential =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

      const user =
        credential.user;

      const username =
        getUsernameFromEmail(email);

      await setDoc(
        doc(db, "users", user.uid),
        {
          name: username,
          email: email,
          createdAt: serverTimestamp()
        },
        {
          merge: true
        }
      );

      showToast(
        "¡Cuenta creada correctamente!"
      );

    } catch (error) {

      console.error(error);

      if (
        error.code ===
        "auth/email-already-in-use"
      ) {

        showToast(
          "Ese correo ya tiene una cuenta."
        );

      } else if (
        error.code ===
        "auth/invalid-email"
      ) {

        showToast(
          "El correo no es válido."
        );

      } else if (
        error.code ===
        "auth/weak-password"
      ) {

        showToast(
          "La contraseña es demasiado débil."
        );

      } else {

        showToast(
          "No se pudo crear la cuenta."
        );
      }
    }
  }
);


/* =========================================================
   CERRAR SESIÓN
   ========================================================= */

$("logoutBtn").addEventListener(
  "click",
  async () => {

    try {

      await signOut(auth);

    } catch (error) {

      console.error(error);

      showToast(
        "No se pudo cerrar sesión."
      );
    }
  }
);


/* =========================================================
   ESTADO DE AUTENTICACIÓN
   ========================================================= */

onAuthStateChanged(
  auth,
  async user => {

    currentUser = user;

    if (!user) {

      $("authScreen")
        .classList.remove("hidden");

      $("app")
        .classList.add("hidden");

      if (unsubscribeMessages) {

        unsubscribeMessages();

        unsubscribeMessages = null;
      }

      if (unsubscribeChannels) {

        unsubscribeChannels();

        unsubscribeChannels = null;
      }

      if (unsubscribeUsers) {

        unsubscribeUsers();

        unsubscribeUsers = null;
      }

      return;
    }


    $("authScreen")
      .classList.add("hidden");

    $("app")
      .classList.remove("hidden");


    let username =
      getUsernameFromEmail(
        user.email || ""
      );


    try {

      const userRef =
        doc(db, "users", user.uid);

      await setDoc(
        userRef,
        {
          name: username,
          email: user.email,
          createdAt: serverTimestamp()
        },
        {
          merge: true
        }
      );

    } catch (error) {

      console.error(
        "Error guardando usuario:",
        error
      );
    }


    $("userName").textContent =
      username;

    $("memberCurrentUser").textContent =
      username;

    $("userInitial").textContent =
      getInitial(username);


    await loadChannels();

    listenToUsers();

    listenToMessages();
  }
);


/* =========================================================
   CANALES
   ========================================================= */

async function loadChannels() {

  const container =
    $("textChannels");

  container.innerHTML = "";

  try {

    const channelsQuery =
      query(
        collection(db, "channels"),
        where(
          "serverId",
          "==",
          serverId
        )
      );


    if (unsubscribeChannels) {

      unsubscribeChannels();

    }


    unsubscribeChannels =
      onSnapshot(
        channelsQuery,
        snapshot => {

          container.innerHTML = "";

          const channels =
            snapshot.docs
              .map(document => ({
                id: document.id,
                ...document.data()
              }))
              .sort(
                (a, b) =>
                  (a.name || "")
                    .localeCompare(
                      b.name || ""
                    )
              );


          if (!channels.length) {

            createDefaultChannel();

            return;
          }


          channels.forEach(channel => {

            const button =
              document.createElement(
                "button"
              );

            button.type = "button";

            button.className =
              "channel";


            if (
              channel.id ===
              currentChannel
            ) {

              button.classList.add(
                "active"
              );
            }


            button.dataset.channel =
              channel.id;


            button.innerHTML = `
              <span class="channel-icon">#</span>
              <span>${escapeHTML(
                channel.name ||
                channel.id
              )}</span>
            `;


            button.addEventListener(
              "click",
              () => {

                selectChannel(
                  channel.id,
                  channel.name ||
                  channel.id
                );

              }
            );


            container.appendChild(
              button
            );

          });


          const currentExists =
            channels.some(
              channel =>
                channel.id ===
                currentChannel
            );


          if (!currentExists) {

            const first =
              channels[0];

            currentChannel =
              first.id;

            $("channelTitle")
              .textContent =
              first.name ||
              first.id;

          }

        },
        error => {

          console.error(
            "Error canales:",
            error
          );

          showToast(
            "No se pudieron cargar los canales."
          );
        }
      );

  } catch (error) {

    console.error(error);

    showToast(
      "Error conectando con los canales."
    );
  }
}


async function createDefaultChannel() {

  try {

    await setDoc(
      doc(
        db,
        "channels",
        "general"
      ),
      {
        name: "general",
        serverId: serverId,
        type: "text",
        createdAt: serverTimestamp()
      },
      {
        merge: true
      }
    );

  } catch (error) {

    console.error(error);
  }
}


function selectChannel(id, name) {

  currentChannel = id;

  $("channelTitle")
    .textContent = name;


  $("messageInput")
    .placeholder =
    `Escribe un mensaje en #${name}...`;


  document
    .querySelectorAll(
      "[data-channel]"
    )
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.channel === id
      );

    });


  listenToMessages();
}


/* =========================================================
   CREAR CANAL
   ========================================================= */

$("addChannel").addEventListener(
  "click",
  async () => {

    if (!currentUser) return;


    const name =
      prompt(
        "Nombre del nuevo canal:"
      );


    if (!name) return;


    const cleanName =
      name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9áéíóúüñ_-]/gi, "");


    if (!cleanName) {

      showToast(
        "Nombre de canal no válido."
      );

      return;
    }


    try {

      const channelRef =
        doc(
          collection(
            db,
            "channels"
          )
        );


      await setDoc(
        channelRef,
        {
          name: cleanName,
          serverId: serverId,
          type: "text",
          createdBy: currentUser.uid,
          createdAt: serverTimestamp()
        }
      );


      selectChannel(
        channelRef.id,
        cleanName
      );


      showToast(
        `Canal #${cleanName} creado.`
      );

    } catch (error) {

      console.error(error);

      showToast(
        "No se pudo crear el canal."
      );
    }
  }
);


/* =========================================================
   MENSAJES EN TIEMPO REAL
   ========================================================= */

function listenToMessages() {

  if (unsubscribeMessages) {

    unsubscribeMessages();

    unsubscribeMessages = null;
  }


  const container =
    $("messages");

  container.innerHTML =
    `
      <div class="welcome">
        <div class="welcome-icon">#</div>
        <h2>
          Bienvenido a #${escapeHTML(
            currentChannel
          )}
        </h2>
        <p>
          Este es el comienzo del canal.
        </p>
      </div>
    `;


  const messagesQuery =
    query(
      collection(db, "messages"),
      where(
        "channelId",
        "==",
        currentChannel
      )
    );


  unsubscribeMessages =
    onSnapshot(
      messagesQuery,
      snapshot => {

        const messages =
          snapshot.docs
            .map(document => ({
              id: document.id,
              ...document.data()
            }))
            .sort(
              (a, b) => {

                const aTime =
                  a.createdAt?.toMillis?.() ||
                  0;

                const bTime =
                  b.createdAt?.toMillis?.() ||
                  0;

                return aTime - bTime;
              }
            );


        renderMessages(
          messages
        );

      },
      error => {

        console.error(
          "Error mensajes:",
          error
        );

        showToast(
          "No se pudieron cargar los mensajes."
        );
      }
    );
}


function renderMessages(list) {

  const container =
    $("messages");


  container.innerHTML = `
    <div class="welcome">
      <div class="welcome-icon">#</div>

      <h2>
        Bienvenido a #${escapeHTML(
          currentChannel
        )}
      </h2>

      <p>
        Este es el comienzo del canal.
      </p>
    </div>
  `;


  list.forEach(message => {

    const article =
      document.createElement(
        "article"
      );


    article.className =
      "message";


    const username =
      message.userName ||
      "Usuario";


    let time = "";

    if (
      message.createdAt &&
      message.createdAt.toDate
    ) {

      time =
        message.createdAt
          .toDate()
          .toLocaleTimeString(
            "es-ES",
            {
              hour: "2-digit",
              minute: "2-digit"
            }
          );
    }


    article.innerHTML = `
      <div class="avatar ${escapeHTML(
        getColor(username)
      )}">
        ${escapeHTML(
          getInitial(username)
        )}
      </div>

      <div class="message-info">

        <div class="message-meta">

          <strong>
            ${escapeHTML(username)}
          </strong>

          <time>
            ${escapeHTML(time)}
          </time>

        </div>

        <p class="message-text">
          ${escapeHTML(
            message.text || ""
          )}
        </p>

      </div>
    `;


    container.appendChild(
      article
    );

  });


  container.scrollTop =
    container.scrollHeight;
}


/* =========================================================
   ENVIAR MENSAJE
   ========================================================= */

$("messageForm").addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    if (!currentUser) {

      showToast(
        "Inicia sesión primero."
      );

      return;
    }


    const input =
      $("messageInput");


    const text =
      input.value.trim();


    if (!text) return;


    input.disabled = true;


    try {

      const username =
        $("userName")
          .textContent ||
        "Usuario";


      await addDoc(
        collection(
          db,
          "messages"
        ),
        {
          text: text,
          userId: currentUser.uid,
          userName: username,
          channelId: currentChannel,
          createdAt: serverTimestamp()
        }
      );


      input.value = "";

    } catch (error) {

      console.error(error);

      showToast(
        "No se pudo enviar el mensaje."
      );

    } finally {

      input.disabled = false;

      input.focus();
    }
  }
);


/* =========================================================
   EMOJI
   ========================================================= */

$("emojiBtn").addEventListener(
  "click",
  () => {

    $("messageInput").value +=
      " 😊";

    $("messageInput").focus();
  }
);


/* =========================================================
   ARCHIVOS
   ========================================================= */

$("attachBtn").addEventListener(
  "click",
  () => {

    showToast(
      "Los archivos los añadiremos con Firebase Storage."
    );
  }
);


/* =========================================================
   MIEMBROS EN TIEMPO REAL
   ========================================================= */

function listenToUsers() {

  if (unsubscribeUsers) {

    unsubscribeUsers();

  }


  const usersQuery =
    collection(
      db,
      "users"
    );


  unsubscribeUsers =
    onSnapshot(
      usersQuery,
      snapshot => {

        const users =
          snapshot.docs.map(
            document => ({
              id: document.id,
              ...document.data()
            })
          );


        const title =
          document.querySelector(
            ".members-title"
          );


        if (title) {

          title.textContent =
            `MIEMBROS — ${users.length}`;
        }

      },
      error => {

        console.error(
          "Error usuarios:",
          error
        );
      }
    );
}


/* =========================================================
   MIEMBROS
   ========================================================= */

$("membersBtn").addEventListener(
  "click",
  () => {

    const panel =
      $("membersPanel");


    if (
      window.innerWidth <= 1000
    ) {

      showToast(
        "Abre CatracVoice en una pantalla más grande para ver los miembros."
      );

      return;
    }


    if (
      panel.style.display ===
      "none"
    ) {

      panel.style.display = "";

    } else {

      panel.style.display =
        "none";
    }
  }
);


/* =========================================================
   MENÚ DEL GRUPO
   ========================================================= */

$("groupMenu").addEventListener(
  "click",
  () => {

    showToast(
      "Configuración del servidor próximamente."
    );
  }
);


/* =========================================================
   SERVIDORES
   ========================================================= */

document
  .querySelectorAll(".server")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        if (
          button.classList.contains(
            "add-server"
          )
        ) {

          showToast(
            "La creación de servidores llegará después."
          );

          return;
        }


        document
          .querySelectorAll(
            ".server"
          )
          .forEach(item => {

            item.classList.remove(
              "active"
            );

          });


        button.classList.add(
          "active"
        );


        showToast(
          "Servidor seleccionado."
        );
      }
    );
  });


/* =========================================================
   SALA DE VOZ
   ========================================================= */

$("voiceChannel").addEventListener(
  "click",
  () => openCall("voice")
);


/* =========================================================
   LLAMADAS
   ========================================================= */

function openCall(type) {

  $("callModal")
    .classList.remove(
      "hidden"
    );


  if (type === "voice") {

    $("callTitle")
      .textContent =
      "Llamada de voz";


    $("callStatus")
      .textContent =
      "Sala de voz de CatracVoice";


    $("videoArea")
      .classList.add(
        "hidden"
      );

  }


  if (type === "video") {

    $("callTitle")
      .textContent =
      "Videollamada";


    $("callStatus")
      .textContent =
      "Videollamada de CatracVoice";


    $("videoArea")
      .classList.remove(
        "hidden"
      );
  }
}


$("voiceCallBtn").addEventListener(
  "click",
  () => openCall("voice")
);


$("videoCallBtn").addEventListener(
  "click",
  () => openCall("video")
);


$("closeCall").addEventListener(
  "click",
  () => {

    $("callModal")
      .classList.add(
        "hidden"
      );

  }
);


$("hangupBtn").addEventListener(
  "click",
  () => {

    $("callModal")
      .classList.add(
        "hidden"
      );

  }
);


/* =========================================================
   MICRÓFONO / CÁMARA
   ========================================================= */

let microphoneEnabled = true;

let cameraEnabled = true;


$("muteBtn").addEventListener(
  "click",
  () => {

    microphoneEnabled =
      !microphoneEnabled;


    $("muteBtn")
      .textContent =
      microphoneEnabled
        ? "🎤"
        : "🔇";


    showToast(
      microphoneEnabled
        ? "Micrófono activado."
        : "Micrófono silenciado."
    );
  }
);


$("cameraBtn").addEventListener(
  "click",
  () => {

    cameraEnabled =
      !cameraEnabled;


    $("cameraBtn")
      .textContent =
      cameraEnabled
        ? "📹"
        : "🚫";


    showToast(
      cameraEnabled
        ? "Cámara activada."
        : "Cámara desactivada."
    );
  }
);


/* =========================================================
   COMPARTIR PANTALLA
   ========================================================= */

let screenStream = null;


async function shareScreen() {

  if (
    !navigator.mediaDevices ||
    !navigator.mediaDevices.getDisplayMedia
  ) {

    showToast(
      "Tu navegador no permite compartir pantalla."
    );

    return;
  }


  try {

    screenStream =
      await navigator.mediaDevices
        .getDisplayMedia({
          video: true,
          audio: true
        });


    $("callModal")
      .classList.remove(
        "hidden"
      );


    $("callTitle")
      .textContent =
      "Compartiendo pantalla";


    $("callStatus")
      .textContent =
      "Vista previa de tu pantalla";


    $("videoArea")
      .classList.remove(
        "hidden"
      );


    $("videoPlaceholder")
      .classList.add(
        "hidden"
      );


    const video =
      $("screenVideo");


    video.style.display =
      "block";


    video.srcObject =
      screenStream;


    const track =
      screenStream
        .getVideoTracks()[0];


    track.addEventListener(
      "ended",
      stopScreenShare
    );


  } catch (error) {

    console.error(error);

    showToast(
      "Has cancelado compartir pantalla."
    );
  }
}


function stopScreenShare() {

  if (screenStream) {

    screenStream
      .getTracks()
      .forEach(
        track =>
          track.stop()
      );

    screenStream = null;
  }


  const video =
    $("screenVideo");


  video.srcObject =
    null;


  video.style.display =
    "none";


  $("videoPlaceholder")
    .classList.remove(
      "hidden"
    );
}


$("screenShareBtn").addEventListener(
  "click",
  shareScreen
);


$("modalScreenBtn").addEventListener(
  "click",
  shareScreen
);


/* =========================================================
   MENÚ MÓVIL
   ========================================================= */

$("mobileMenu").addEventListener(
  "click",
  () => {

    showToast(
      "Menú móvil."
    );
  }
);


/* =========================================================
   INICIO
   ========================================================= */

console.log(
  "CatracVoice conectado a Firebase."
);
