/* =========================================================
   CATRACVOICE
   FIREBASE + SERVIDORES + CANALES + CHAT
   ========================================================= */


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

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();


/* =========================================================
   VARIABLES
   ========================================================= */

let currentUser = null;
let currentServer = null;
let currentChannel = null;

let unsubscribeServers = null;
let unsubscribeChannels = null;
let unsubscribeMessages = null;

let micEnabled = true;
let cameraEnabled = true;

let screenStream = null;


/* =========================================================
   HELPERS
   ========================================================= */

const $ = id => document.getElementById(id);


function escapeHTML(text) {

  const element = document.createElement("div");

  element.textContent = text;

  return element.innerHTML;
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


function formatTime(timestamp) {

  if (!timestamp) return "";

  let date;

  if (timestamp.toDate) {

    date = timestamp.toDate();

  } else {

    date = new Date(timestamp);

  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}


/* =========================================================
   AUTENTICACIÓN
   ========================================================= */

auth.onAuthStateChanged(async user => {

  if (user) {

    currentUser = user;

    await loadUserInterface();

  } else {

    currentUser = null;

    showLogin();

  }

});


function showLogin() {

  const authScreen = $("authScreen");
  const app = $("app");

  if (authScreen) {
    authScreen.classList.remove("hidden");
  }

  if (app) {
    app.classList.add("hidden");
  }
}


function showApp() {

  const authScreen = $("authScreen");
  const app = $("app");

  if (authScreen) {
    authScreen.classList.add("hidden");
  }

  if (app) {
    app.classList.remove("hidden");
  }
}


/* =========================================================
   LOGIN
   ========================================================= */

if ($("authForm")) {

  $("authForm").addEventListener("submit", async event => {

    event.preventDefault();

    const email = $("email").value.trim();
    const password = $("password").value;

    if (!email || !password) return;

    try {

      await auth.signInWithEmailAndPassword(
        email,
        password
      );

      showToast("Has iniciado sesión.");

    } catch (error) {

      console.error(error);

      let message = "No se pudo iniciar sesión.";

      if (
        error.code ===
        "auth/invalid-credential"
      ) {
        message = "Correo o contraseña incorrectos.";
      }

      if (
        error.code ===
        "auth/user-not-found"
      ) {
        message = "No existe una cuenta con ese correo.";
      }

      if (
        error.code ===
        "auth/wrong-password"
      ) {
        message = "Contraseña incorrecta.";
      }

      showToast(message);

    }

  });

}


/* =========================================================
   REGISTRO
   ========================================================= */

if ($("registerBtn")) {

  $("registerBtn").addEventListener(
    "click",
    async () => {

      const email = $("email").value.trim();
      const password = $("password").value;

      if (!email || !password) {

        showToast(
          "Escribe primero tu correo y contraseña."
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

        const result =
          await auth.createUserWithEmailAndPassword(
            email,
            password
          );

        const username =
          email
            .split("@")[0]
            .replace(/[._-]/g, " ");

        await db
          .collection("users")
          .doc(result.user.uid)
          .set({

            uid: result.user.uid,

            email: email,

            username:
              username || "Usuario",

            createdAt:
              firebase.firestore.FieldValue.serverTimestamp()

          }, {
            merge: true
          });

        showToast(
          "Cuenta creada correctamente."
        );

      } catch (error) {

        console.error(error);

        let message =
          "No se pudo crear la cuenta.";

        if (
          error.code ===
          "auth/email-already-in-use"
        ) {

          message =
            "Ese correo ya tiene una cuenta.";

        }

        if (
          error.code ===
          "auth/invalid-email"
        ) {

          message =
            "El correo no es válido.";

        }

        if (
          error.code ===
          "auth/weak-password"
        ) {

          message =
            "La contraseña es demasiado débil.";

        }

        showToast(message);

      }

    }
  );

}


/* =========================================================
   CARGAR INTERFAZ DEL USUARIO
   ========================================================= */

async function loadUserInterface() {

  showApp();

  const email =
    currentUser.email || "";

  let username =
    email
      .split("@")[0]
      .replace(/[._-]/g, " ");

  try {

    const userDoc =
      await db
        .collection("users")
        .doc(currentUser.uid)
        .get();

    if (userDoc.exists) {

      const data = userDoc.data();

      if (data.username) {

        username = data.username;

      }

    } else {

      await db
        .collection("users")
        .doc(currentUser.uid)
        .set({

          uid: currentUser.uid,

          email: email,

          username:
            username || "Usuario",

          createdAt:
            firebase.firestore.FieldValue.serverTimestamp()

        }, {
          merge: true
        });

    }

  } catch (error) {

    console.error(
      "Error cargando usuario:",
      error
    );

  }

  if ($("userName")) {

    $("userName").textContent =
      username || "Tú";

  }

  if ($("memberCurrentUser")) {

    $("memberCurrentUser").textContent =
      username || "Tú";

  }

  if ($("userInitial")) {

    $("userInitial").textContent =
      (username || "T")
        .charAt(0)
        .toUpperCase();

  }

  loadServers();

}


/* =========================================================
   SERVIDORES
   ========================================================= */

function loadServers() {

  if (unsubscribeServers) {

    unsubscribeServers();

  }

  unsubscribeServers =
    db
      .collection("servers")
      .where(
        "memberIds",
        "array-contains",
        currentUser.uid
      )
      .onSnapshot(
        snapshot => {

          renderServers(snapshot);

        },

        error => {

          console.error(
            "Error cargando servidores:",
            error
          );

          showToast(
            "No se pudieron cargar los servidores."
          );

        }
      );

}


function renderServers(snapshot) {

  const container =
    document.querySelector(".server-sidebar");

  if (!container) return;

  const addButton =
    $("addServer");

  container
    .querySelectorAll(".server[data-server-id]")
    .forEach(button => button.remove());

  const servers = [];

  snapshot.forEach(doc => {

    servers.push({
      id: doc.id,
      ...doc.data()
    });

  });


  /*
     Crear botones dinámicamente
  */

  servers.forEach(server => {

    const button =
      document.createElement("button");

    button.className =
      "server";

    button.dataset.serverId =
      server.id;

    button.title =
      server.name || "Servidor";

    button.textContent =
      getServerInitial(
        server.name
      );

    button.addEventListener(
      "click",
      () => {

        selectServer(server);

      }
    );

    container.insertBefore(
      button,
      addButton
    );

  });


  /*
     Si todavía no tenemos servidor seleccionado
  */

  if (!currentServer && servers.length > 0) {

    selectServer(servers[0]);

  }


  /*
     Si el servidor seleccionado fue eliminado
  */

  if (
    currentServer &&
    !servers.some(
      server =>
        server.id === currentServer.id
    )
  ) {

    currentServer = null;

    currentChannel = null;

    clearChannels();

  }

}


function getServerInitial(name) {

  if (!name) return "CV";

  const clean =
    name.trim();

  if (!clean) return "CV";

  const words =
    clean.split(/\s+/);

  if (words.length >= 2) {

    return (
      words[0].charAt(0) +
      words[1].charAt(0)
    ).toUpperCase();

  }

  return clean
    .substring(0, 2)
    .toUpperCase();

}


/* =========================================================
   CREAR SERVIDOR
   ========================================================= */

async function createServer() {

  if (!currentUser) {

    showToast(
      "Primero tienes que iniciar sesión."
    );

    return;

  }


  const name =
    prompt(
      "¿Cómo quieres llamar al servidor?"
    );


  if (name === null) return;


  const serverName =
    name.trim();


  if (!serverName) {

    showToast(
      "Escribe un nombre para el servidor."
    );

    return;

  }


  if (serverName.length > 50) {

    showToast(
      "El nombre es demasiado largo."
    );

    return;

  }


  try {

    /*
       Crear servidor
    */

    const serverRef =
      await db
        .collection("servers")
        .add({

          name: serverName,

          ownerId:
            currentUser.uid,

          memberIds: [
            currentUser.uid
          ],

          createdAt:
            firebase.firestore.FieldValue
              .serverTimestamp()

        });


    /*
       Crear canal general
    */

    const channelRef =
      await db
        .collection("channels")
        .add({

          serverId:
            serverRef.id,

          name:
            "general",

          type:
            "text",

          createdAt:
            firebase.firestore.FieldValue
              .serverTimestamp()

        });


    /*
       Guardamos el servidor seleccionado
    */

    const newServer = {

      id: serverRef.id,

      name: serverName,

      ownerId:
        currentUser.uid,

      memberIds: [
        currentUser.uid
      ]

    };


    currentServer =
      newServer;


    showToast(
      `Servidor "${serverName}" creado.`
    );


    /*
       Cargar canales
    */

    await loadChannels(
      serverRef.id
    );


  } catch (error) {

    console.error(
      "Error creando servidor:",
      error
    );

    showToast(
      "No se pudo crear el servidor."
    );

  }

}


/* =========================================================
   SELECCIONAR SERVIDOR
   ========================================================= */

async function selectServer(server) {

  currentServer =
    server;

  currentChannel =
    null;


  document
    .querySelectorAll(
      ".server"
    )
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.serverId ===
          server.id
      );

    });


  /*
     Actualizar nombre
  */

  const workspace =
    document.querySelector(
      ".workspace-title"
    );

  if (workspace) {

    workspace.textContent =
      server.name;

  }


  const subtitle =
    document.querySelector(
      ".workspace-sub"
    );

  if (subtitle) {

    subtitle.textContent =
      "Servidor";

  }


  await loadChannels(
    server.id
  );

}


/* =========================================================
   CANALES
   ========================================================= */

async function loadChannels(serverId) {

  if (unsubscribeChannels) {

    unsubscribeChannels();

  }


  unsubscribeChannels =
    db
      .collection("channels")
      .where(
        "serverId",
        "==",
        serverId
      )
      .onSnapshot(
        snapshot => {

          renderChannels(
            snapshot
          );

        },

        error => {

          console.error(
            "Error cargando canales:",
            error
          );

          showToast(
            "No se pudieron cargar los canales."
          );

        }
      );

}


function renderChannels(snapshot) {

  const container =
    $("textChannels");

  if (!container) return;


  container.innerHTML = "";


  const channels = [];


  snapshot.forEach(doc => {

    channels.push({
      id: doc.id,
      ...doc.data()
    });

  });


  channels.forEach(channel => {

    const button =
      document.createElement("button");

    button.className =
      "channel";

    button.dataset.channelId =
      channel.id;

    button.innerHTML = `
      <span class="channel-icon">#</span>
      <span>${escapeHTML(channel.name)}</span>
    `;


    button.addEventListener(
      "click",
      () => {

        selectChannel(channel);

      }
    );


    container.appendChild(
      button
    );

  });


  /*
     Seleccionar general automáticamente
  */

  if (!currentChannel && channels.length > 0) {

    const general =
      channels.find(
        channel =>
          channel.name === "general"
      );

    selectChannel(
      general || channels[0]
    );

  }

}


/* =========================================================
   SELECCIONAR CANAL
   ========================================================= */

async function selectChannel(channel) {

  if (!channel) return;


  currentChannel =
    channel;


  document
    .querySelectorAll(
      "#textChannels .channel"
    )
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.channelId ===
          channel.id
      );

    });


  if ($("channelTitle")) {

    $("channelTitle").textContent =
      channel.name;

  }


  if ($("messageInput")) {

    $("messageInput").placeholder =
      `Escribe un mensaje en #${channel.name}...`;

  }


  renderMessages();


  loadMessages(
    channel.id
  );

}


/* =========================================================
   LIMPIAR CANALES
   ========================================================= */

function clearChannels() {

  if ($("textChannels")) {

    $("textChannels").innerHTML = "";

  }

  if ($("channelTitle")) {

    $("channelTitle").textContent =
      "general";

  }

  if ($("messages")) {

    $("messages").innerHTML = "";

  }

}


/* =========================================================
   MENSAJES
   ========================================================= */

function loadMessages(channelId) {

  if (unsubscribeMessages) {

    unsubscribeMessages();

  }


  unsubscribeMessages =
    db
      .collection("messages")
      .where(
        "channelId",
        "==",
        channelId
      )
      .onSnapshot(
        snapshot => {

          const messages = [];

          snapshot.forEach(doc => {

            messages.push({
              id: doc.id,
              ...doc.data()
            });

          });


          messages.sort(
            (a, b) => {

              const timeA =
                a.createdAt?.toMillis
                  ? a.createdAt.toMillis()
                  : 0;

              const timeB =
                b.createdAt?.toMillis
                  ? b.createdAt.toMillis()
                  : 0;

              return timeA - timeB;

            }
          );


          renderMessages(
            messages
          );

        },

        error => {

          console.error(
            "Error cargando mensajes:",
            error
          );

          showToast(
            "No se pudieron cargar los mensajes."
          );

        }
      );

}


function renderMessages(list = []) {

  const container =
    $("messages");

  if (!container) return;


  if (!list.length) {

    container.innerHTML = `
      <div class="welcome">

        <div class="welcome-icon">
          #
        </div>

        <h2>
          ¡Bienvenido a #${
            escapeHTML(
              currentChannel?.name ||
              "general"
            )
          }!
        </h2>

        <p>
          Este es el comienzo del canal.
        </p>

      </div>
    `;

    return;

  }


  container.innerHTML = "";


  const welcome =
    document.createElement("div");

  welcome.className =
    "welcome";

  welcome.innerHTML = `
    <div class="welcome-icon">
      #
    </div>

    <h2>
      ¡Bienvenido a #${
        escapeHTML(
          currentChannel?.name ||
          "general"
        )
      }!
    </h2>

    <p>
      Este es el comienzo del canal.
    </p>
  `;

  container.appendChild(
    welcome
  );


  list.forEach(message => {

    const article =
      document.createElement("article");

    article.className =
      "message";


    const initial =
      message.initial ||
      (message.username || "T")
        .charAt(0)
        .toUpperCase();


    article.innerHTML = `

      <div class="avatar ${escapeHTML(
        message.color || ""
      )}">
        ${escapeHTML(initial)}
      </div>

      <div class="message-info">

        <div class="message-meta">

          <strong>
            ${escapeHTML(
              message.username ||
              "Usuario"
            )}
          </strong>

          <time>
            ${escapeHTML(
              formatTime(
                message.createdAt
              )
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

  });


  container.scrollTop =
    container.scrollHeight;

}


/* =========================================================
   ENVIAR MENSAJE
   ========================================================= */

if ($("messageForm")) {

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


      if (!currentServer) {

        showToast(
          "Selecciona un servidor."
        );

        return;

      }


      if (!currentChannel) {

        showToast(
          "Selecciona un canal."
        );

        return;

      }


      const input =
        $("messageInput");

      const text =
        input.value.trim();


      if (!text) return;


      try {

        const userDoc =
          await db
            .collection("users")
            .doc(currentUser.uid)
            .get();


        const userData =
          userDoc.exists
            ? userDoc.data()
            : {};


        const username =
          userData.username ||
          currentUser.email
            ?.split("@")[0] ||
          "Usuario";


        await db
          .collection("messages")
          .add({

            serverId:
              currentServer.id,

            channelId:
              currentChannel.id,

            userId:
              currentUser.uid,

            username:
              username,

            initial:
              username
                .charAt(0)
                .toUpperCase(),

            text:
              text,

            createdAt:
              firebase.firestore.FieldValue
                .serverTimestamp()

          });


        input.value = "";

        input.focus();


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
  );

}


/* =========================================================
   CREAR CANAL
   ========================================================= */

if ($("addChannel")) {

  $("addChannel").addEventListener(
    "click",
    async () => {

      if (!currentServer) {

        showToast(
          "Primero selecciona un servidor."
        );

        return;

      }


      const name =
        prompt(
          "Nombre del nuevo canal:"
        );


      if (name === null) return;


      const channelName =
        name
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "-");


      if (!channelName) {

        showToast(
          "Escribe un nombre."
        );

        return;

      }


      try {

        await db
          .collection("channels")
          .add({

            serverId:
              currentServer.id,

            name:
              channelName,

            type:
              "text",

            createdAt:
              firebase.firestore.FieldValue
                .serverTimestamp()

          });


        showToast(
          `#${channelName} creado.`
        );


      } catch (error) {

        console.error(error);

        showToast(
          "No se pudo crear el canal."
        );

      }

    }
  );

}


/* =========================================================
   BOTÓN CREAR SERVIDOR
   ========================================================= */

if ($("addServer")) {

  $("addServer").addEventListener(
    "click",
    createServer
  );

}


/* =========================================================
   EMOJI
   ========================================================= */

if ($("emojiBtn")) {

  $("emojiBtn").addEventListener(
    "click",
    () => {

      const input =
        $("messageInput");

      input.value += " 😊";

      input.focus();

    }
  );

}


/* =========================================================
   ADJUNTAR
   ========================================================= */

if ($("attachBtn")) {

  $("attachBtn").addEventListener(
    "click",
    () => {

      showToast(
        "El sistema de archivos se conectará con Firebase Storage."
      );

    }
  );

}


/* =========================================================
   LOGOUT
   ========================================================= */

if ($("logoutBtn")) {

  $("logoutBtn").addEventListener(
    "click",
    async () => {

      try {

        if (unsubscribeServers)
          unsubscribeServers();

        if (unsubscribeChannels)
          unsubscribeChannels();

        if (unsubscribeMessages)
          unsubscribeMessages();

        await auth.signOut();

      } catch (error) {

        console.error(error);

        showToast(
          "No se pudo cerrar sesión."
        );

      }

    }
  );

}


/* =========================================================
   MENÚ DEL GRUPO
   ========================================================= */

if ($("groupMenu")) {

  $("groupMenu").addEventListener(
    "click",
    () => {

      if (!currentServer) {

        showToast(
          "Selecciona un servidor."
        );

        return;

      }

      showToast(
        `${currentServer.name} seleccionado.`
      );

    }
  );

}


/* =========================================================
   SERVIDORES DEMO ANTIGUOS
   ========================================================= */

document
  .querySelectorAll(
    ".server:not([data-server-id])"
  )
  .forEach(button => {

    if (
      button.id === "addServer"
    ) return;


    button.addEventListener(
      "click",
      () => {

        showToast(
          "Este servidor es de ejemplo. Crea uno con +."
        );

      }
    );

  });


/* =========================================================
   MIEMBROS
   ========================================================= */

if ($("membersBtn")) {

  $("membersBtn").addEventListener(
    "click",
    () => {

      const panel =
        $("membersPanel");

      if (!panel) return;


      if (
        window.innerWidth <= 1000
      ) {

        showToast(
          "La lista de miembros aparecerá aquí."
        );

        return;

      }


      panel.style.display =
        panel.style.display === "none"
          ? ""
          : "none";

    }
  );

}


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


if ($("voiceCallBtn")) {

  $("voiceCallBtn").addEventListener(
    "click",
    () => openCall("voice")
  );

}


if ($("videoCallBtn")) {

  $("videoCallBtn").addEventListener(
    "click",
    () => openCall("video")
  );

}


if ($("voiceChannel")) {

  $("voiceChannel").addEventListener(
    "click",
    () => openCall("voice")
  );

}


if ($("closeCall")) {

  $("closeCall").addEventListener(
    "click",
    () => {

      $("callModal")
        .classList.add("hidden");

      stopScreen();

    }
  );

}


if ($("hangupBtn")) {

  $("hangupBtn").addEventListener(
    "click",
    () => {

      $("callModal")
        .classList.add("hidden");

      stopScreen();

    }
  );

}


/* =========================================================
   MICRÓFONO
   ========================================================= */

if ($("muteBtn")) {

  $("muteBtn").addEventListener(
    "click",
    function () {

      micEnabled =
        !micEnabled;

      this.textContent =
        micEnabled
          ? "🎤"
          : "🔇";

      showToast(
        micEnabled
          ? "Micrófono activado"
          : "Micrófono silenciado"
      );

    }
  );

}


/* =========================================================
   CÁMARA
   ========================================================= */

if ($("cameraBtn")) {

  $("cameraBtn").addEventListener(
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
          ? "Cámara activada"
          : "Cámara desactivada"
      );

    }
  );

}


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


    const video =
      $("screenVideo");


    const videoArea =
      $("videoArea");


    const placeholder =
      $("videoPlaceholder");


    if (videoArea) {

      videoArea.classList.remove(
        "hidden"
      );

    }


    if (placeholder) {

      placeholder.classList.add(
        "hidden"
      );

    }


    if (video) {

      video.srcObject =
        screenStream;

      video.style.display =
        "block";

    }


    $("callModal")
      ?.classList.remove("hidden");


    $("callTitle").textContent =
      "Compartiendo pantalla";


    $("callStatus").textContent =
      "La pantalla se está compartiendo.";


    const track =
      screenStream.getVideoTracks()[0];


    if (track) {

      track.addEventListener(
        "ended",
        () => {

          stopScreen();

          showToast(
            "Has dejado de compartir pantalla."
          );

        }
      );

    }


  } catch (error) {

    console.error(error);

    showToast(
      "Has cancelado compartir pantalla."
    );

  }

}


function stopScreen() {

  if (screenStream) {

    screenStream
      .getTracks()
      .forEach(track =>
        track.stop()
      );

    screenStream = null;

  }


  const video =
    $("screenVideo");


  if (video) {

    video.srcObject = null;

    video.style.display =
      "none";

  }


  $("videoPlaceholder")
    ?.classList.remove("hidden");

}


if ($("screenShareBtn")) {

  $("screenShareBtn").addEventListener(
    "click",
    shareScreen
  );

}


if ($("modalScreenBtn")) {

  $("modalScreenBtn").addEventListener(
    "click",
    shareScreen
  );

}


/* =========================================================
   MÓVIL
   ========================================================= */

if ($("mobileMenu")) {

  $("mobileMenu").addEventListener(
    "click",
    () => {

      showToast(
        "Menú móvil próximamente."
      );

    }
  );

}


/* =========================================================
   INICIO
   ========================================================= */

console.log(
  "CatracVoice conectado a Firebase correctamente."
);
