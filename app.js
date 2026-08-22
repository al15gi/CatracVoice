/* =========================================================
   CATRACVOICE
   APP.JS
   Firebase Authentication + Firestore
   ========================================================= */


/* =========================================================
   FIREBASE
   ========================================================= */

import { initializeApp } from
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* =========================================================
   CONFIGURACIÓN DE TU FIREBASE
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


/* =========================================================
   INICIAR FIREBASE
   ========================================================= */

const firebaseApp =
  initializeApp(firebaseConfig);

const auth =
  getAuth(firebaseApp);

const db =
  getFirestore(firebaseApp);


/* =========================================================
   UTILIDAD
   ========================================================= */

const $ = id =>
  document.getElementById(id);


function escapeHTML(text) {

  const div =
    document.createElement("div");

  div.textContent =
    text ?? "";

  return div.innerHTML;

}


function showToast(text) {

  const toast =
    $("toast");

  if (!toast) return;

  toast.textContent =
    text;

  toast.classList.add("show");

  clearTimeout(
    window.toastTimer
  );

  window.toastTimer =
    setTimeout(() => {

      toast.classList.remove("show");

    }, 2500);

}


/* =========================================================
   VARIABLES
   ========================================================= */

let currentChannel =
  "general";

let currentUser =
  null;

let unsubscribeMessages =
  null;

let screenStream =
  null;

let microphoneEnabled =
  true;

let cameraEnabled =
  true;


/* =========================================================
   AUTENTICACIÓN
   ========================================================= */

onAuthStateChanged(
  auth,
  async user => {

    if (user) {

      currentUser =
        user;

      console.log(
        "Usuario conectado:",
        user.email
      );

      await saveUser(user);

      $("authScreen")
        ?.classList
        .add("hidden");

      $("app")
        ?.classList
        .remove("hidden");


      const username =
        user.email
          ?.split("@")[0] ||
        "Tú";


      if ($("userName")) {

        $("userName")
          .textContent =
          username;

      }


      if ($("memberCurrentUser")) {

        $("memberCurrentUser")
          .textContent =
          username;

      }


      if ($("userInitial")) {

        $("userInitial")
          .textContent =
          username
            .charAt(0)
            .toUpperCase();

      }


      await loadChannels();

      subscribeToMessages();

    } else {

      currentUser =
        null;

      $("app")
        ?.classList
        .add("hidden");

      $("authScreen")
        ?.classList
        .remove("hidden");

    }

  }
);


/* =========================================================
   GUARDAR USUARIO
   ========================================================= */

async function saveUser(user) {

  try {

    const username =
      user.email
        ?.split("@")[0] ||
      "Usuario";

    await setDoc(
      doc(
        db,
        "users",
        user.uid
      ),
      {
        uid:
          user.uid,

        email:
          user.email,

        username:
          username,

        online:
          true,

        updatedAt:
          serverTimestamp()
      },
      {
        merge:
          true
      }
    );

  } catch (error) {

    console.error(
      "Error guardando usuario:",
      error
    );

  }

}


/* =========================================================
   LOGIN
   ========================================================= */

$("authForm")
  ?.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      const email =
        $("email")
          .value
          .trim();

      const password =
        $("password")
          .value;


      if (!email ||
          !password) {

        showToast(
          "Escribe tu correo y contraseña."
        );

        return;

      }


      try {

        showToast(
          "Iniciando sesión..."
        );

        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

      } catch (error) {

        console.error(
          error
        );

        if (
          error.code ===
          "auth/invalid-credential"
        ) {

          showToast(
            "Correo o contraseña incorrectos."
          );

        } else {

          showToast(
            "Error al iniciar sesión."
          );

        }

      }

    }
  );


/* =========================================================
   CREAR CUENTA
   ========================================================= */

$("registerBtn")
  ?.addEventListener(
    "click",
    async () => {

      const email =
        $("email")
          .value
          .trim();

      const password =
        $("password")
          .value;


      if (!email) {

        showToast(
          "Escribe primero tu correo."
        );

        return;

      }


      if (password.length < 6) {

        showToast(
          "La contraseña debe tener al menos 6 caracteres."
        );

        return;

      }


      try {

        showToast(
          "Creando cuenta..."
        );

        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        showToast(
          "Cuenta creada correctamente."
        );

      } catch (error) {

        console.error(
          error
        );


        if (
          error.code ===
          "auth/email-already-in-use"
        ) {

          showToast(
            "Ese correo ya está registrado."
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

$("logoutBtn")
  ?.addEventListener(
    "click",
    async () => {

      try {

        if (
          unsubscribeMessages
        ) {

          unsubscribeMessages();

          unsubscribeMessages =
            null;

        }

        await signOut(auth);

      } catch (error) {

        console.error(
          error
        );

      }

    }
  );


/* =========================================================
   CARGAR CANALES
   ========================================================= */

async function loadChannels() {

  const container =
    $("textChannels");

  if (!container) return;


  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "channels"
        )
      );


    let channels = [];


    snapshot.forEach(
      channelDoc => {

        channels.push({

          id:
            channelDoc.id,

          ...channelDoc.data()

        });

      }
    );


    /*
      Si no existen canales,
      creamos los básicos.
    */

    if (
      channels.length === 0
    ) {

      const defaultChannels = [

        {
          id: "general",
          name: "general"
        },

        {
          id: "gaming",
          name: "gaming"
        },

        {
          id: "planes",
          name: "planes"
        }

      ];


      for (
        const channel
        of defaultChannels
      ) {

        await setDoc(
          doc(
            db,
            "channels",
            channel.id
          ),
          {
            name:
              channel.name,

            type:
              "text",

            createdAt:
              serverTimestamp()
          }
        );

      }


      channels =
        defaultChannels;

    }


    container.innerHTML =
      "";


    channels.sort(
      (a, b) =>
        (a.name || "")
          .localeCompare(
            b.name || ""
          )
    );


    channels.forEach(
      channel => {

        const button =
          document.createElement(
            "button"
          );


        button.type =
          "button";


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

          <span class="channel-icon">
            #
          </span>

          <span>
            ${escapeHTML(
              channel.name
            )}
          </span>

        `;


        button.addEventListener(
          "click",
          () => {

            selectChannel(
              channel.id
            );

          }
        );


        container.appendChild(
          button
        );

      }
    );


  } catch (error) {

    console.error(
      "Error cargando canales:",
      error
    );

    showToast(
      "Error cargando los canales."
    );

  }

}


/* =========================================================
   CAMBIAR DE CANAL
   ========================================================= */

function selectChannel(
  channel
) {

  currentChannel =
    channel;


  document
    .querySelectorAll(
      "[data-channel]"
    )
    .forEach(
      button => {

        button.classList.toggle(
          "active",
          button.dataset.channel ===
          channel
        );

      }
    );


  if (
    $("channelTitle")
  ) {

    $("channelTitle")
      .textContent =
      channel;

  }


  if (
    $("messageInput")
  ) {

    $("messageInput")
      .placeholder =
      `Escribe un mensaje en #${channel}...`;

  }


  subscribeToMessages();

}


/* =========================================================
   CREAR CANAL
   ========================================================= */

$("addChannel")
  ?.addEventListener(
    "click",
    async () => {

      if (!currentUser) {

        showToast(
          "Inicia sesión primero."
        );

        return;

      }


      const name =
        prompt(
          "Nombre del nuevo canal:"
        );


      if (!name) return;


      const cleanName =
        name
          .trim()
          .toLowerCase()
          .replace(
            /\s+/g,
            "-"
          )
          .replace(
            /[^a-z0-9-_]/g,
            ""
          );


      if (!cleanName) {

        showToast(
          "Nombre no válido."
        );

        return;

      }


      try {

        await setDoc(
          doc(
            db,
            "channels",
            cleanName
          ),
          {
            name:
              cleanName,

            type:
              "text",

            createdBy:
              currentUser.uid,

            createdAt:
              serverTimestamp()
          }
        );


        await loadChannels();

        selectChannel(
          cleanName
        );


        showToast(
          "Canal creado correctamente."
        );


      } catch (error) {

        console.error(
          "Error creando canal:",
          error
        );

        showToast(
          "No se pudo crear el canal."
        );

      }

    }
  );


/* =========================================================
   ESCUCHAR MENSAJES EN TIEMPO REAL
   ========================================================= */

function subscribeToMessages() {

  if (
    unsubscribeMessages
  ) {

    unsubscribeMessages();

    unsubscribeMessages =
      null;

  }


  if (!currentUser) return;


  const messagesRef =
    collection(
      db,
      "messages"
    );


  const messagesQuery =
    query(
      messagesRef,
      orderBy(
        "createdAt",
        "asc"
      )
    );


  unsubscribeMessages =
    onSnapshot(
      messagesQuery,
      snapshot => {

        const messages =
          [];


        snapshot.forEach(
          messageDoc => {

            const data =
              messageDoc.data();


            if (
              data.channelId ===
              currentChannel
            ) {

              messages.push({

                id:
                  messageDoc.id,

                ...data

              });

            }

          }
        );


        renderMessages(
          messages
        );

      },
      error => {

        console.error(
          "Error Firestore:",
          error
        );

        showToast(
          "Error leyendo mensajes de Firestore."
        );

      }
    );

}


/* =========================================================
   MOSTRAR MENSAJES
   ========================================================= */

function renderMessages(
  messages
) {

  const container =
    $("messages");

  if (!container) return;


  container.innerHTML = `

    <div class="welcome">

      <div class="welcome-icon">
        #
      </div>

      <h2>
        ¡Bienvenido a #${escapeHTML(
          currentChannel
        )}!
      </h2>

      <p>
        Este es el comienzo del canal.
      </p>

    </div>

  `;


  messages.forEach(
    message => {

      const article =
        document.createElement(
          "article"
        );


      article.className =
        "message";


      let time =
        "";


      if (
        message.createdAt &&
        typeof
          message.createdAt.toDate ===
          "function"
      ) {

        time =
          message.createdAt
            .toDate()
            .toLocaleTimeString(
              [],
              {
                hour:
                  "2-digit",

                minute:
                  "2-digit"
              }
            );

      }


      const name =
        message.name ||
        "Usuario";


      const initial =
        (
          message.initial ||
          name.charAt(0) ||
          "T"
        )
          .charAt(0)
          .toUpperCase();


      article.innerHTML = `

        <div class="avatar ${escapeHTML(
          message.color || ""
        )}">
          ${escapeHTML(
            initial
          )}
        </div>

        <div class="message-info">

          <div class="message-meta">

            <strong>
              ${escapeHTML(
                name
              )}
            </strong>

            <time>
              ${escapeHTML(
                time
              )}
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

    }
  );


  container.scrollTop =
    container.scrollHeight;

}


/* =========================================================
   ENVIAR MENSAJE
   ========================================================= */

$("messageForm")
  ?.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      if (!currentUser) {

        showToast(
          "Debes iniciar sesión."
        );

        return;

      }


      const input =
        $("messageInput");


      const text =
        input.value.trim();


      if (!text) return;


      try {

        input.disabled =
          true;


        await addDoc(
          collection(
            db,
            "messages"
          ),
          {

            channelId:
              currentChannel,

            text:
              text,

            uid:
              currentUser.uid,

            name:
              currentUser.email
                ?.split("@")[0] ||
              "Usuario",

            initial:
              (
                currentUser.email
                  ?.charAt(0) ||
                "T"
              )
                .toUpperCase(),

            color:
              "",

            createdAt:
              serverTimestamp()

          }
        );


        input.value =
          "";


      } catch (error) {

        console.error(
          "ERROR ENVIANDO MENSAJE:",
          error
        );


        showToast(
          "No se pudo enviar el mensaje."
        );


      } finally {

        input.disabled =
          false;

        input.focus();

      }

    }
  );


/* =========================================================
   EMOJI
   ========================================================= */

$("emojiBtn")
  ?.addEventListener(
    "click",
    () => {

      const input =
        $("messageInput");

      input.value +=
        " 😊";

      input.focus();

    }
  );


/* =========================================================
   ARCHIVOS
   ========================================================= */

$("attachBtn")
  ?.addEventListener(
    "click",
    () => {

      showToast(
        "Los archivos llegarán con Firebase Storage."
      );

    }
  );


/* =========================================================
   MIEMBROS
   ========================================================= */

$("membersBtn")
  ?.addEventListener(
    "click",
    () => {

      const panel =
        $("membersPanel");

      if (!panel) return;


      if (
        window.innerWidth <=
        1000
      ) {

        showToast(
          "Panel de miembros."
        );

        return;

      }


      panel.style.display =
        panel.style.display ===
        "none"
          ? ""
          : "none";

    }
  );


/* =========================================================
   MENÚ DEL GRUPO
   ========================================================= */

$("groupMenu")
  ?.addEventListener(
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
  .querySelectorAll(
    ".server"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          if (
            button.classList.contains(
              "add-server"
            )
          ) {

            showToast(
              "Crear servidores próximamente."
            );

            return;

          }


          document
            .querySelectorAll(
              ".server"
            )
            .forEach(
              item =>
                item.classList
                  .remove(
                    "active"
                  )
            );


          button.classList.add(
            "active"
          );

        }
      );

    }
  );


/* =========================================================
   LLAMADAS
   ========================================================= */

function openCall(
  type
) {

  const modal =
    $("callModal");

  if (!modal) return;


  modal.classList.remove(
    "hidden"
  );


  if (
    type ===
    "voice"
  ) {

    $("callTitle")
      .textContent =
      "Llamada de voz";

    $("callStatus")
      .textContent =
      "Llamada de voz";

    $("videoArea")
      .classList.add(
        "hidden"
      );

  } else {

    $("callTitle")
      .textContent =
      "Videollamada";

    $("callStatus")
      .textContent =
      "Videollamada";

    $("videoArea")
      .classList.remove(
        "hidden"
      );

  }

}


$("voiceCallBtn")
  ?.addEventListener(
    "click",
    () =>
      openCall(
        "voice"
      )
  );


$("videoCallBtn")
  ?.addEventListener(
    "click",
    () =>
      openCall(
        "video"
      )
  );


$("voiceChannel")
  ?.addEventListener(
    "click",
    () =>
      openCall(
        "voice"
      )
  );


$("closeCall")
  ?.addEventListener(
    "click",
    () => {

      $("callModal")
        .classList.add(
          "hidden"
        );

      stopScreen();

    }
  );


$("hangupBtn")
  ?.addEventListener(
    "click",
    () => {

      $("callModal")
        .classList.add(
          "hidden"
        );

      stopScreen();

    }
  );


/* =========================================================
   MICRÓFONO
   ========================================================= */

$("muteBtn")
  ?.addEventListener(
    "click",
    function () {

      microphoneEnabled =
        !microphoneEnabled;

      this.textContent =
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


/* =========================================================
   CÁMARA
   ========================================================= */

$("cameraBtn")
  ?.addEventListener(
    "click",
    function () {

      cameraEnabled =
        !cameraEnabled;

      this.textContent =
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

async function shareScreen() {

  if (
    !navigator.mediaDevices ||
    !navigator.mediaDevices
      .getDisplayMedia
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
          video:
            true,

          audio:
            true
        });


    $("callModal")
      .classList
      .remove(
        "hidden"
      );


    $("callTitle")
      .textContent =
      "Compartiendo pantalla";


    $("callStatus")
      .textContent =
      "Pantalla compartida";


    $("videoArea")
      .classList
      .remove(
        "hidden"
      );


    const video =
      $("screenVideo");


    video.srcObject =
      screenStream;


    video.classList
      .remove(
        "hidden"
      );


    $("videoPlaceholder")
      ?.classList
      .add(
        "hidden"
      );


    const track =
      screenStream
        .getVideoTracks()[0];


    track.addEventListener(
      "ended",
      () => {

        stopScreen();

        showToast(
          "Has dejado de compartir."
        );

      }
    );


  } catch (error) {

    console.log(
      error
    );

    showToast(
      "Has cancelado compartir pantalla."
    );

  }

}


function stopScreen() {

  if (
    screenStream
  ) {

    screenStream
      .getTracks()
      .forEach(
        track =>
          track.stop()
      );

    screenStream =
      null;

  }


  const video =
    $("screenVideo");


  if (video) {

    video.srcObject =
      null;

  }


  $("videoPlaceholder")
    ?.classList
    .remove(
      "hidden"
    );

}


$("screenShareBtn")
  ?.addEventListener(
    "click",
    shareScreen
  );


$("modalScreenBtn")
  ?.addEventListener(
    "click",
    shareScreen
  );


/* =========================================================
   MENÚ MÓVIL
   ========================================================= */

$("mobileMenu")
  ?.addEventListener(
    "click",
    () => {

      showToast(
        "Menú móvil próximamente."
      );

    }
  );


/* =========================================================
   LISTO
   ========================================================= */

console.log(
  "✅ CatracVoice conectado a Firebase"
);
