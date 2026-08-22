/* =========================================================
   CATRACVOICE - APP.JS
   Firebase Authentication + Firestore
   ========================================================= */

/* =========================================================
   FIREBASE
   ========================================================= */

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


/* =========================================================
   CONFIGURACIÓN DE TU PROYECTO FIREBASE
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

const firebaseApp = initializeApp(firebaseConfig);

const auth = getAuth(firebaseApp);

const db = getFirestore(firebaseApp);


/* =========================================================
   UTILIDADES
   ========================================================= */

const $ = id => document.getElementById(id);

let currentChannel = "general";

let currentUser = null;

let unsubscribeMessages = null;

let unsubscribeChannels = null;

let screenStream = null;


/* =========================================================
   TOAST
   ========================================================= */

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


/* =========================================================
   ESCAPAR HTML
   ========================================================= */

function escapeHTML(text) {

  const element = document.createElement("div");

  element.textContent = text ?? "";

  return element.innerHTML;

}


/* =========================================================
   INICIALES
   ========================================================= */

function getInitial(name) {

  if (!name) return "T";

  return name.charAt(0).toUpperCase();

}


/* =========================================================
   COLORES AVATAR
   ========================================================= */

function getAvatarColor(name) {

  if (!name) return "";

  const colors = [
    "green",
    "purple",
    "orange"
  ];

  let total = 0;

  for (let i = 0; i < name.length; i++) {

    total += name.charCodeAt(i);

  }

  return colors[total % colors.length];

}


/* =========================================================
   MOSTRAR MENSAJES
   ========================================================= */

function renderMessages(messages) {

  const container = $("messages");

  if (!container) return;

  container.innerHTML = "";


  /* BIENVENIDA */

  const welcome = document.createElement("div");

  welcome.className = "welcome";

  welcome.innerHTML = `
    <div class="welcome-icon">#</div>

    <h2>
      ¡Bienvenido a #${escapeHTML(currentChannel)}!
    </h2>

    <p>
      Este es el comienzo del canal.
    </p>
  `;

  container.appendChild(welcome);


  /* MENSAJES */

  messages.forEach(message => {

    const article = document.createElement("article");

    article.className = "message";


    let time = "";

    if (message.createdAt?.toDate) {

      time = message.createdAt
        .toDate()
        .toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        });

    } else if (message.time) {

      time = message.time;

    }


    const name = message.name || "Usuario";

    const initial =
      message.initial ||
      getInitial(name);


    const color =
      message.color ||
      getAvatarColor(name);


    article.innerHTML = `

      <div class="avatar ${escapeHTML(color)}">
        ${escapeHTML(initial)}
      </div>

      <div class="message-info">

        <div class="message-meta">

          <strong>
            ${escapeHTML(name)}
          </strong>

          <time>
            ${escapeHTML(time)}
          </time>

        </div>

        <p class="message-text">
          ${escapeHTML(message.text || "")}
        </p>

      </div>

    `;


    container.appendChild(article);

  });


  container.scrollTop =
    container.scrollHeight;

}


/* =========================================================
   ESCUCHAR MENSAJES EN TIEMPO REAL
   ========================================================= */

function listenMessages() {

  if (!currentUser) return;


  if (unsubscribeMessages) {

    unsubscribeMessages();

    unsubscribeMessages = null;

  }


  const messagesRef = collection(
    db,
    "messages"
  );


  const messagesQuery = query(
    messagesRef,
    orderBy("createdAt", "asc")
  );


  unsubscribeMessages = onSnapshot(
    messagesQuery,
    snapshot => {

      const messages = [];


      snapshot.forEach(documentSnapshot => {

        const data = documentSnapshot.data();


        /*
          Solo mostramos mensajes
          del canal actual.
        */

        if (
          data.channel === currentChannel
        ) {

          messages.push({

            id: documentSnapshot.id,

            ...data

          });

        }

      });


      renderMessages(messages);

    },

    error => {

      console.error(
        "Error leyendo mensajes:",
        error
      );

      showToast(
        "No se pueden cargar los mensajes."
      );

    }
  );

}


/* =========================================================
   CAMBIAR CANAL
   ========================================================= */

function changeChannel(channel) {

  currentChannel = channel;


  document
    .querySelectorAll("[data-channel]")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.channel === channel
      );

    });


  if ($("channelTitle")) {

    $("channelTitle").textContent =
      channel;

  }


  if ($("messageInput")) {

    $("messageInput").placeholder =
      `Escribe un mensaje en #${channel}...`;

  }


  listenMessages();

}


/* =========================================================
   CARGAR CANALES
   ========================================================= */

function loadChannels() {

  const container = $("textChannels");

  if (!container) return;


  if (unsubscribeChannels) {

    unsubscribeChannels();

    unsubscribeChannels = null;

  }


  const channelsRef =
    collection(db, "channels");


  unsubscribeChannels =
    onSnapshot(

      channelsRef,

      snapshot => {

        container.innerHTML = "";


        const channels = [];


        snapshot.forEach(documentSnapshot => {

          channels.push({

            id: documentSnapshot.id,

            ...documentSnapshot.data()

          });

        });


        /*
          Si no hay canales,
          creamos los canales iniciales.
        */

        if (channels.length === 0) {

          createDefaultChannels();

          return;

        }


        channels.sort((a, b) => {

          return (a.order || 0) -
                 (b.order || 0);

        });


        channels.forEach(channel => {

          const button =
            document.createElement("button");


          button.className =
            "channel";


          if (
            channel.id === currentChannel
          ) {

            button.classList.add("active");

          }


          button.dataset.channel =
            channel.id;


          button.type = "button";


          button.innerHTML = `

            <span class="channel-icon">
              #
            </span>

            <span>
              ${escapeHTML(
                channel.name ||
                channel.id
              )}
            </span>

          `;


          button.addEventListener(
            "click",
            () => {

              changeChannel(
                channel.id
              );

            }
          );


          container.appendChild(button);

        });


        /*
          Si el canal actual ya no existe,
          utilizamos el primero.
        */

        if (
          !channels.some(
            channel =>
              channel.id === currentChannel
          )
        ) {

          currentChannel =
            channels[0].id;

        }


        changeChannel(currentChannel);

      },

      error => {

        console.error(
          "Error cargando canales:",
          error
        );

        showToast(
          "No se pueden cargar los canales."
        );

      }

    );

}


/* =========================================================
   CREAR CANALES INICIALES
   ========================================================= */

async function createDefaultChannels() {

  const defaults = [

    {
      id: "general",
      name: "general",
      order: 1
    },

    {
      id: "gaming",
      name: "gaming",
      order: 2
    },

    {
      id: "planes",
      name: "planes",
      order: 3
    }

  ];


  try {

    for (const channel of defaults) {

      await setDoc(
        doc(
          db,
          "channels",
          channel.id
        ),
        {

          name: channel.name,

          order: channel.order,

          createdAt:
            serverTimestamp(),

          createdBy:
            currentUser?.uid || null

        }
      );

    }

  } catch (error) {

    console.error(
      "Error creando canales:",
      error
    );

  }

}


/* =========================================================
   ENVIAR MENSAJE
   ========================================================= */

async function sendMessage(text) {

  if (!currentUser) {

    showToast(
      "Debes iniciar sesión."
    );

    return;

  }


  if (!text.trim()) return;


  try {

    const userName =
      currentUser.displayName ||
      currentUser.email
        ?.split("@")[0] ||
      "Usuario";


    await addDoc(
      collection(
        db,
        "messages"
      ),
      {

        text: text.trim(),

        channel:
          currentChannel,

        uid:
          currentUser.uid,

        name:
          userName,

        initial:
          getInitial(userName),

        color:
          getAvatarColor(userName),

        createdAt:
          serverTimestamp()

      }
    );


  } catch (error) {

    console.error(
      "Error enviando mensaje:",
      error
    );

    showToast(
      "No se pudo enviar el mensaje."
    );

  }

}


/* =========================================================
   CREAR USUARIO EN FIRESTORE
   ========================================================= */

async function createUserDocument(user) {

  if (!user) return;


  const userRef =
    doc(
      db,
      "users",
      user.uid
    );


  const username =
    user.displayName ||
    user.email
      ?.split("@")[0] ||
    "Usuario";


  try {

    await setDoc(

      userRef,

      {

        uid:
          user.uid,

        email:
          user.email || "",

        username,

        online:
          true,

        lastSeen:
          serverTimestamp(),

        createdAt:
          serverTimestamp()

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

}


/* =========================================================
   REGISTRO
   ========================================================= */

async function registerUser() {

  const email =
    $("email")?.value.trim();


  const password =
    $("password")?.value;


  if (!email || !password) {

    showToast(
      "Escribe correo y contraseña."
    );

    return;

  }


  if (password.length < 8) {

    showToast(
      "La contraseña debe tener al menos 8 caracteres."
    );

    return;

  }


  try {

    await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );


    showToast(
      "Cuenta creada correctamente."
    );


  } catch (error) {

    console.error(error);


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


/* =========================================================
   LOGIN
   ========================================================= */

async function loginUser(event) {

  event.preventDefault();


  const email =
    $("email")?.value.trim();


  const password =
    $("password")?.value;


  if (!email || !password) {

    showToast(
      "Escribe correo y contraseña."
    );

    return;

  }


  try {

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );


    showToast(
      "Sesión iniciada."
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
      "auth/user-not-found"
    ) {

      showToast(
        "No existe una cuenta con ese correo."
      );

    } else if (
      error.code ===
      "auth/wrong-password"
    ) {

      showToast(
        "Contraseña incorrecta."
      );

    } else {

      showToast(
        "No se pudo iniciar sesión."
      );

    }

  }

}


/* =========================================================
   ESTADO DE AUTENTICACIÓN
   ========================================================= */

onAuthStateChanged(
  auth,
  async user => {

    if (user) {

      currentUser = user;


      await createUserDocument(
        user
      );


      /*
        OCULTAR LOGIN
      */

      $("authScreen")
        ?.classList.add("hidden");


      /*
        MOSTRAR APP
      */

      $("app")
        ?.classList.remove("hidden");


      const username =
        user.displayName ||
        user.email
          ?.split("@")[0] ||
        "Tú";


      if ($("userName")) {

        $("userName").textContent =
          username;

      }


      if ($("userInitial")) {

        $("userInitial").textContent =
          getInitial(username);

      }


      if ($("memberCurrentUser")) {

        $("memberCurrentUser")
          .textContent =
          username;

      }


      /*
        CARGAR CANALES
      */

      loadChannels();


      /*
        CARGAR MENSAJES
      */

      listenMessages();

    } else {

      currentUser = null;


      $("app")
        ?.classList.add("hidden");


      $("authScreen")
        ?.classList.remove("hidden");


      if (unsubscribeMessages) {

        unsubscribeMessages();

        unsubscribeMessages = null;

      }


      if (unsubscribeChannels) {

        unsubscribeChannels();

        unsubscribeChannels = null;

      }

    }

  }
);


/* =========================================================
   REGISTRO
   ========================================================= */

$("registerBtn")
  ?.addEventListener(
    "click",
    registerUser
  );


/* =========================================================
   LOGIN
   ========================================================= */

$("authForm")
  ?.addEventListener(
    "submit",
    loginUser
  );


/* =========================================================
   LOGOUT
   ========================================================= */

$("logoutBtn")
  ?.addEventListener(
    "click",
    async () => {

      try {

        await signOut(auth);

        showToast(
          "Has cerrado sesión."
        );

      } catch (error) {

        console.error(error);

        showToast(
          "No se pudo cerrar sesión."
        );

      }

    }
  );


/* =========================================================
   CANALES
   ========================================================= */

$("addChannel")
  ?.addEventListener(
    "click",
    async () => {

      if (!currentUser) {

        showToast(
          "Debes iniciar sesión."
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
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-_]/g, "");


      if (!cleanName) {

        showToast(
          "Nombre de canal no válido."
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

            order:
              Date.now(),

            createdBy:
              currentUser.uid,

            createdAt:
              serverTimestamp()

          }

        );


        currentChannel =
          cleanName;


        showToast(
          `Canal #${cleanName} creado.`
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
   MENÚ DEL GRUPO
   ========================================================= */

$("groupMenu")
  ?.addEventListener(
    "click",
    () => {

      showToast(
        "Configuración de CatracVoice próximamente."
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
            "Crear servidores llegará próximamente."
          );

          return;

        }


        document
          .querySelectorAll(".server")
          .forEach(item => {

            item.classList.remove(
              "active"
            );

          });


        button.classList.add(
          "active"
        );

      }
    );

  });


/* =========================================================
   EMOJI
   ========================================================= */

$("emojiBtn")
  ?.addEventListener(
    "click",
    () => {

      const input =
        $("messageInput");

      if (!input) return;


      input.value += " 😊";

      input.focus();

    }
  );


/* =========================================================
   ADJUNTAR
   ========================================================= */

$("attachBtn")
  ?.addEventListener(
    "click",
    () => {

      showToast(
        "El almacenamiento de archivos se añadirá con Firebase Storage."
      );

    }
  );


/* =========================================================
   MENSAJES
   ========================================================= */

$("messageForm")
  ?.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const input =
        $("messageInput");


      const text =
        input.value.trim();


      if (!text) return;


      input.disabled = true;


      await sendMessage(text);


      input.value = "";

      input.disabled = false;

      input.focus();

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
        window.innerWidth <= 1000
      ) {

        showToast(
          "La lista de miembros está en el panel."
        );

        return;

      }


      panel.style.display =
        panel.style.display === "none"
          ? ""
          : "none";

    }
  );


/* =========================================================
   MÓVIL
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
   LLAMADAS
   ========================================================= */

function openCall(type) {

  const modal =
    $("callModal");


  if (!modal) return;


  modal.classList.remove(
    "hidden"
  );


  if (type === "voice") {

    $("callTitle").textContent =
      "Llamada de voz";


    $("callStatus").textContent =
      "La llamada real se conectará mediante WebRTC.";


    $("videoArea")
      ?.classList.add("hidden");

  }


  if (type === "video") {

    $("callTitle").textContent =
      "Videollamada";


    $("callStatus").textContent =
      "La videollamada real se conectará mediante WebRTC.";


    $("videoArea")
      ?.classList.remove("hidden");

  }

}


$("voiceCallBtn")
  ?.addEventListener(
    "click",
    () => openCall("voice")
  );


$("videoCallBtn")
  ?.addEventListener(
    "click",
    () => openCall("video")
  );


$("voiceChannel")
  ?.addEventListener(
    "click",
    () => openCall("voice")
  );


/* =========================================================
   CERRAR LLAMADA
   ========================================================= */

function closeCall() {

  $("callModal")
    ?.classList.add("hidden");


  stopScreen();

}


$("closeCall")
  ?.addEventListener(
    "click",
    closeCall
  );


$("hangupBtn")
  ?.addEventListener(
    "click",
    closeCall
  );


/* =========================================================
   MICRÓFONO
   ========================================================= */

let microphoneEnabled = true;


$("muteBtn")
  ?.addEventListener(
    "click",
    event => {

      microphoneEnabled =
        !microphoneEnabled;


      event.currentTarget.textContent =
        microphoneEnabled
          ? "🎤"
          : "🔇";


      showToast(
        microphoneEnabled
          ? "Micrófono activado"
          : "Micrófono silenciado"
      );

    }
  );


/* =========================================================
   CÁMARA
   ========================================================= */

let cameraEnabled = true;


$("cameraBtn")
  ?.addEventListener(
    "click",
    event => {

      cameraEnabled =
        !cameraEnabled;


      event.currentTarget.textContent =
        cameraEnabled
          ? "📹"
          : "🚫";


      showToast(
        cameraEnabled
          ? "Cámara activada"
          : "Cámara desactivada"
      );

    }
  );


/* =========================================================
   COMPARTIR PANTALLA
   ========================================================= */

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
      ?.classList.remove("hidden");


    $("callTitle").textContent =
      "Compartiendo pantalla";


    $("callStatus").textContent =
      "Pantalla compartida en esta sesión";


    $("videoArea")
      ?.classList.remove("hidden");


    const video =
      $("screenVideo");


    const placeholder =
      $("videoPlaceholder");


    if (video) {

      video.srcObject =
        screenStream;

      video.style.display =
        "block";

    }


    if (placeholder) {

      placeholder.style.display =
        "none";

    }


    const videoTrack =
      screenStream.getVideoTracks()[0];


    if (videoTrack) {

      videoTrack.addEventListener(
        "ended",
        () => {

          stopScreen();

          showToast(
            "Has dejado de compartir la pantalla."
          );

        }
      );

    }


    showToast(
      "Compartiendo pantalla."
    );


  } catch (error) {

    console.error(error);

    showToast(
      "Has cancelado compartir la pantalla."
    );

  }

}


/* =========================================================
   DETENER PANTALLA
   ========================================================= */

function stopScreen() {

  if (screenStream) {

    screenStream
      .getTracks()
      .forEach(track => {

        track.stop();

      });

    screenStream = null;

  }


  const video =
    $("screenVideo");


  const placeholder =
    $("videoPlaceholder");


  if (video) {

    video.srcObject = null;

    video.style.display =
      "none";

  }


  if (placeholder) {

    placeholder.style.display =
      "flex";

  }

}


/* =========================================================
   BOTONES COMPARTIR PANTALLA
   ========================================================= */

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
   FIN
   ========================================================= */

console.log(
  "CatracVoice conectado a Firebase correctamente."
);
