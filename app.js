/* =========================================================
   CATRACVOICE
   app.js
   Firebase Auth + Firestore + Firebase Storage
   ========================================================= */


/* =========================================================
   CONFIGURACIÓN FIREBASE
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
   CARGAR FIREBASE AUTOMÁTICAMENTE
   ========================================================= */

function loadFirebaseScript(src) {
  return new Promise((resolve, reject) => {

    const existing = document.querySelector(
      `script[src="${src}"]`
    );

    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement("script");

    script.src = src;
    script.onload = resolve;
    script.onerror = reject;

    document.head.appendChild(script);
  });
}


async function loadFirebase() {

  await loadFirebaseScript(
    "https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js"
  );

  await loadFirebaseScript(
    "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth-compat.js"
  );

  await loadFirebaseScript(
    "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore-compat.js"
  );

  await loadFirebaseScript(
    "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage-compat.js"
  );
}


/* =========================================================
   FIREBASE
   ========================================================= */

let auth;
let db;
let storage;

let currentUser = null;
let currentChannel = "general";

let unsubscribeMessages = null;

let screenStream = null;


/* =========================================================
   UTILIDADES
   ========================================================= */

const $ = id => document.getElementById(id);


function escapeHTML(text) {

  const element =
    document.createElement("div");

  element.textContent =
    text ?? "";

  return element.innerHTML;
}


function formatFileSize(bytes) {

  if (!bytes) return "0 B";

  const units = [
    "B",
    "KB",
    "MB",
    "GB"
  ];

  let size = bytes;
  let index = 0;

  while (
    size >= 1024 &&
    index < units.length - 1
  ) {

    size /= 1024;
    index++;

  }

  return `${size.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}


function showToast(text) {

  const toast = $("toast");

  if (!toast) return;

  toast.textContent =
    text;

  toast.classList.add("show");

  clearTimeout(window.toastTimer);

  window.toastTimer =
    setTimeout(() => {

      toast.classList.remove("show");

    }, 3000);
}


/* =========================================================
   ESTILOS PARA ARCHIVOS
   ========================================================= */

function addAttachmentStyles() {

  if ($("attachmentStyles")) return;

  const style =
    document.createElement("style");

  style.id =
    "attachmentStyles";

  style.textContent = `

    .message-attachment {
      margin-top: 8px;
      max-width: 420px;
    }

    .message-image {
      display: block;
      max-width: 100%;
      max-height: 350px;
      border-radius: 10px;
      object-fit: contain;
      background: #11151d;
    }

    .file-card {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 9px;
      background: #202632;
      border: 1px solid #30394a;
      text-decoration: none;
      color: white;
      max-width: 350px;
    }

    .file-card:hover {
      background: #293141;
    }

    .file-icon {
      font-size: 25px;
    }

    .file-info {
      min-width: 0;
    }

    .file-name {
      display: block;
      font-size: 13px;
      font-weight: 700;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .file-size {
      display: block;
      margin-top: 2px;
      color: #8d98aa;
      font-size: 10px;
    }

    .upload-progress {
      margin-top: 8px;
      width: 100%;
      height: 5px;
      border-radius: 5px;
      overflow: hidden;
      background: #0b0e14;
    }

    .upload-progress-bar {
      width: 0%;
      height: 100%;
      background: #5865f2;
      transition: width .15s;
    }

    .uploading-message {
      opacity: .7;
    }

  `;

  document.head.appendChild(style);
}


/* =========================================================
   INICIAR FIREBASE
   ========================================================= */

async function initializeFirebase() {

  try {

    await loadFirebase();

    if (!firebase.apps.length) {

      firebase.initializeApp(
        firebaseConfig
      );

    }

    auth =
      firebase.auth();

    db =
      firebase.firestore();

    storage =
      firebase.storage();

    console.log(
      "Firebase iniciado correctamente."
    );

    addAttachmentStyles();

    startApplication();

  } catch (error) {

    console.error(
      "Error iniciando Firebase:",
      error
    );

    showToast(
      "No se ha podido conectar con Firebase."
    );

  }

}


/* =========================================================
   LOGIN
   ========================================================= */

function setupAuthentication() {

  const authForm =
    $("authForm");

  if (!authForm) return;


  authForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      const email =
        $("email").value.trim();

      const password =
        $("password").value;

      if (!email || !password)
        return;


      try {

        showToast(
          "Iniciando sesión..."
        );

        await auth.signInWithEmailAndPassword(
          email,
          password
        );

      } catch (error) {

        console.error(error);

        let message =
          "No se ha podido iniciar sesión.";

        if (
          error.code ===
          "auth/invalid-credential"
        ) {

          message =
            "Correo o contraseña incorrectos.";

        }

        if (
          error.code ===
          "auth/user-not-found"
        ) {

          message =
            "No existe una cuenta con ese correo.";

        }

        if (
          error.code ===
          "auth/wrong-password"
        ) {

          message =
            "Contraseña incorrecta.";

        }

        if (
          error.code ===
          "auth/too-many-requests"
        ) {

          message =
            "Demasiados intentos. Espera un poco.";

        }

        showToast(message);

      }

    }
  );


  const registerBtn =
    $("registerBtn");

  if (registerBtn) {

    registerBtn.addEventListener(
      "click",
      registerUser
    );

  }


  const logoutBtn =
    $("logoutBtn");

  if (logoutBtn) {

    logoutBtn.addEventListener(
      "click",
      async () => {

        try {

          await auth.signOut();

        } catch (error) {

          console.error(error);

        }

      }
    );

  }


  auth.onAuthStateChanged(
    async user => {

      currentUser =
        user;

      if (user) {

        await enterApplication(user);

      } else {

        leaveApplication();

      }

    }
  );

}


/* =========================================================
   REGISTRO
   ========================================================= */

async function registerUser() {

  const email =
    $("email").value.trim();

  const password =
    $("password").value;


  if (!email) {

    showToast(
      "Escribe tu correo primero."
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

    showToast(
      "Creando cuenta..."
    );

    const result =
      await auth.createUserWithEmailAndPassword(
        email,
        password
      );


    const username =
      email
        .split("@")[0]
        .replace(/[._-]/g, " ")
        .trim();


    await db
      .collection("users")
      .doc(result.user.uid)
      .set({

        uid: result.user.uid,

        email: result.user.email,

        username:
          username || "Usuario",

        createdAt:
          firebase.firestore.FieldValue.serverTimestamp(),

        online: true

      }, {
        merge: true
      });


    showToast(
      "Cuenta creada correctamente."
    );


  } catch (error) {

    console.error(error);

    let message =
      "No se ha podido crear la cuenta.";

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


/* =========================================================
   ENTRAR EN LA APLICACIÓN
   ========================================================= */

async function enterApplication(user) {

  $("authScreen")
    ?.classList.add("hidden");

  $("app")
    ?.classList.remove("hidden");


  let username =
    user.email
      ?.split("@")[0]
      ?.replace(/[._-]/g, " ")
      ?.trim();


  try {

    const userDoc =
      await db
        .collection("users")
        .doc(user.uid)
        .get();


    if (userDoc.exists) {

      const data =
        userDoc.data();

      username =
        data.username ||
        username;

    }

  } catch (error) {

    console.warn(
      "No se pudo cargar el usuario:",
      error
    );

  }


  username =
    username || "Tú";


  $("userName").textContent =
    username;

  $("memberCurrentUser").textContent =
    username;


  const initial =
    username
      .charAt(0)
      .toUpperCase();


  $("userInitial").textContent =
    initial;


  try {

    await db
      .collection("users")
      .doc(user.uid)
      .set({

        uid: user.uid,

        email: user.email,

        username,

        online: true,

        lastSeen:
          firebase.firestore.FieldValue.serverTimestamp()

      }, {
        merge: true
      });

  } catch (error) {

    console.warn(
      "No se pudo actualizar el usuario:",
      error
    );

  }


  loadChannels();

  subscribeToMessages();

}


/* =========================================================
   SALIR
   ========================================================= */

function leaveApplication() {

  if (unsubscribeMessages) {

    unsubscribeMessages();

    unsubscribeMessages =
      null;

  }


  $("app")
    ?.classList.add("hidden");

  $("authScreen")
    ?.classList.remove("hidden");

}


/* =========================================================
   CANALES
   ========================================================= */

async function loadChannels() {

  const container =
    $("textChannels");

  if (!container) return;


  container.innerHTML =
    `<div class="channel active"
          style="padding:9px 10px">
       <span class="channel-icon">#</span>
       general
     </div>`;


  try {

    const snapshot =
      await db
        .collection("channels")
        .orderBy("name")
        .get();


    if (!snapshot.empty) {

      container.innerHTML = "";


      snapshot.forEach(doc => {

        const channel =
          doc.data();


        const button =
          document.createElement("button");


        button.className =
          "channel";


        button.dataset.channel =
          channel.name;


        button.type =
          "button";


        button.innerHTML = `
          <span class="channel-icon">#</span>
          ${escapeHTML(channel.name)}
        `;


        container.appendChild(
          button
        );

      });

    }


    ensureChannelExists();

    attachChannelListeners();


  } catch (error) {

    console.warn(
      "No se pudieron cargar los canales:",
      error
    );

    createDefaultChannelUI();

  }

}


/* =========================================================
   CREAR CANAL GENERAL
   ========================================================= */

async function ensureChannelExists() {

  try {

    const ref =
      db
        .collection("channels")
        .doc("general");


    const doc =
      await ref.get();


    if (!doc.exists) {

      await ref.set({

        name: "general",

        type: "text",

        createdAt:
          firebase.firestore.FieldValue.serverTimestamp(),

        createdBy:
          currentUser?.uid || null

      });

    }

  } catch (error) {

    console.warn(
      "No se pudo crear general:",
      error
    );

  }

}


/* =========================================================
   INTERFAZ DE CANALES
   ========================================================= */

function createDefaultChannelUI() {

  const container =
    $("textChannels");

  if (!container) return;


  container.innerHTML = `

    <button
      class="channel active"
      data-channel="general"
      type="button"
    >

      <span class="channel-icon">
        #
      </span>

      general

    </button>

  `;

  attachChannelListeners();

}


function attachChannelListeners() {

  document
    .querySelectorAll("[data-channel]")
    .forEach(button => {

      button.onclick = () => {

        currentChannel =
          button.dataset.channel;

        document
          .querySelectorAll("[data-channel]")
          .forEach(item => {

            item.classList.toggle(
              "active",
              item === button
            );

          });


        $("channelTitle")
          .textContent =
          currentChannel;


        $("messageInput")
          .placeholder =
          `Escribe un mensaje en #${currentChannel}...`;


        subscribeToMessages();

      };

    });

}


/* =========================================================
   MENSAJES EN TIEMPO REAL
   ========================================================= */

function subscribeToMessages() {

  if (!db) return;


  if (unsubscribeMessages) {

    unsubscribeMessages();

    unsubscribeMessages =
      null;

  }


  const container =
    $("messages");

  if (!container) return;


  container.innerHTML = `
    <div class="welcome">
      <div class="welcome-icon">#</div>
      <h2>
        ¡Bienvenido a #${escapeHTML(currentChannel)}!
      </h2>
      <p>
        Este es el comienzo del canal.
      </p>
    </div>
  `;


  unsubscribeMessages =
    db
      .collection("messages")
      .orderBy("createdAt", "asc")
      .onSnapshot(
        snapshot => {

          const messages =
            [];


          snapshot.forEach(doc => {

            const data =
              doc.data();


            if (
              data.channel ===
              currentChannel
            ) {

              messages.push({
                id: doc.id,
                ...data
              });

            }

          });


          renderMessages(
            messages
          );

        },
        error => {

          console.error(
            "Error escuchando mensajes:",
            error
          );


          showToast(
            "No se pueden cargar los mensajes."
          );

        }
      );

}


/* =========================================================
   RENDER MENSAJES
   ========================================================= */

function renderMessages(list) {

  const container =
    $("messages");

  if (!container) return;


  container.innerHTML = `

    <div class="welcome">

      <div class="welcome-icon">
        #
      </div>

      <h2>
        ¡Bienvenido a #${escapeHTML(currentChannel)}!
      </h2>

      <p>
        Este es el comienzo del canal.
      </p>

    </div>

  `;


  list.forEach(message => {

    const article =
      document.createElement("article");


    article.className =
      "message";


    const username =
      message.username ||
      "Usuario";


    const initial =
      message.initial ||
      username.charAt(0).toUpperCase();


    let time =
      "";


    if (
      message.createdAt &&
      message.createdAt.toDate
    ) {

      time =
        message.createdAt
          .toDate()
          .toLocaleTimeString(
            [],
            {
              hour: "2-digit",
              minute: "2-digit"
            }
          );

    } else if (message.time) {

      time =
        message.time;

    }


    article.innerHTML = `

      <div class="avatar ${escapeHTML(message.color || "")}">
        ${escapeHTML(initial)}
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

        ${
          message.text
            ? `
              <p class="message-text">
                ${escapeHTML(message.text)}
              </p>
            `
            : ""
        }

      </div>

    `;


    const info =
      article.querySelector(
        ".message-info"
      );


    /* IMAGEN */

    if (
      message.type === "image" &&
      message.fileUrl
    ) {

      const image =
        document.createElement("img");


      image.className =
        "message-image message-attachment";


      image.src =
        message.fileUrl;


      image.alt =
        message.fileName ||
        "Imagen";


      image.loading =
        "lazy";


      image.onclick =
        () => window.open(
          message.fileUrl,
          "_blank"
        );


      image.style.cursor =
        "pointer";


      info.appendChild(
        image
      );

    }


    /* ARCHIVO */

    else if (
      message.type === "file" &&
      message.fileUrl
    ) {

      const link =
        document.createElement("a");


      link.className =
        "file-card message-attachment";


      link.href =
        message.fileUrl;


      link.target =
        "_blank";


      link.rel =
        "noopener noreferrer";


      link.innerHTML = `

        <span class="file-icon">
          📎
        </span>

        <span class="file-info">

          <span class="file-name">
            ${escapeHTML(message.fileName || "Archivo")}
          </span>

          <span class="file-size">
            ${formatFileSize(message.fileSize)}
          </span>

        </span>

      `;


      info.appendChild(
        link
      );

    }


    container.appendChild(
      article
    );

  });


  container.scrollTop =
    container.scrollHeight;

}


/* =========================================================
   ENVIAR MENSAJES
   ========================================================= */

function setupMessages() {

  const form =
    $("messageForm");

  if (!form) return;


  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const input =
        $("messageInput");


      const text =
        input.value.trim();


      if (!text) return;


      if (!currentUser) {

        showToast(
          "Inicia sesión primero."
        );

        return;

      }


      input.disabled =
        true;


      try {

        const username =
          $("userName").textContent ||
          "Tú";


        await db
          .collection("messages")
          .add({

            channel:
              currentChannel,

            uid:
              currentUser.uid,

            username:
              username,

            initial:
              username
                .charAt(0)
                .toUpperCase(),

            color:
              "",

            text:
              text,

            type:
              "text",

            createdAt:
              firebase.firestore.FieldValue.serverTimestamp()

          });


        input.value =
          "";


      } catch (error) {

        console.error(error);

        showToast(
          "No se pudo enviar el mensaje."
        );

      }


      input.disabled =
        false;

      input.focus();

    }
  );


  $("emojiBtn")
    ?.addEventListener(
      "click",
      () => {

        $("messageInput").value +=
          " 😊";

        $("messageInput").focus();

      }
    );

}


/* =========================================================
   ARCHIVOS
   ========================================================= */

function setupFileUpload() {

  const attachBtn =
    $("attachBtn");

  if (!attachBtn) return;


  const fileInput =
    document.createElement("input");


  fileInput.type =
    "file";


  fileInput.id =
    "hiddenFileInput";


  fileInput.style.display =
    "none";


  fileInput.multiple =
    false;


  document.body.appendChild(
    fileInput
  );


  attachBtn.addEventListener(
    "click",
    () => {

      if (!currentUser) {

        showToast(
          "Inicia sesión para subir archivos."
        );

        return;

      }


      fileInput.click();

    }
  );


  fileInput.addEventListener(
    "change",
    async () => {

      const file =
        fileInput.files?.[0];


      if (!file) return;


      await uploadFile(file);


      fileInput.value =
        "";

    }
  );

}


/* =========================================================
   SUBIR ARCHIVO A FIREBASE STORAGE
   ========================================================= */

async function uploadFile(file) {

  if (!currentUser) {

    showToast(
      "Debes iniciar sesión."
    );

    return;

  }


  /*
     Límite de 50 MB para evitar
     subidas accidentales gigantes.
  */

  const MAX_SIZE =
    50 * 1024 * 1024;


  if (file.size > MAX_SIZE) {

    showToast(
      "El archivo no puede superar 50 MB."
    );

    return;

  }


  try {

    showToast(
      "Subiendo archivo..."
    );


    const safeName =
      file.name
        .replace(/[^\w.\- áéíóúÁÉÍÓÚñÑ()]/g, "_");


    const path =
      `uploads/${currentUser.uid}/${Date.now()}_${safeName}`;


    const storageRef =
      storage.ref().child(path);


    const uploadTask =
      storageRef.put(file);


    await new Promise(
      (resolve, reject) => {

        uploadTask.on(
          "state_changed",

          snapshot => {

            const percent =
              Math.round(
                (
                  snapshot.bytesTransferred /
                  snapshot.totalBytes
                ) * 100
              );


            console.log(
              `Subiendo: ${percent}%`
            );

          },

          error => {

            reject(error);

          },

          () => {

            resolve();

          }
        );

      }
    );


    const fileUrl =
      await storageRef.getDownloadURL();


    const username =
      $("userName").textContent ||
      "Tú";


    const isImage =
      file.type.startsWith(
        "image/"
      );


    await db
      .collection("messages")
      .add({

        channel:
          currentChannel,

        uid:
          currentUser.uid,

        username:
          username,

        initial:
          username
            .charAt(0)
            .toUpperCase(),

        color:
          "",

        text:
          "",

        type:
          isImage
            ? "image"
            : "file",

        fileName:
          file.name,

        fileUrl:
          fileUrl,

        filePath:
          path,

        fileSize:
          file.size,

        contentType:
          file.type,

        createdAt:
          firebase.firestore.FieldValue.serverTimestamp()

      });


    showToast(
      "Archivo enviado correctamente."
    );


  } catch (error) {

    console.error(
      "Error subiendo archivo:",
      error
    );


    if (
      error.code ===
      "storage/unauthorized"
    ) {

      showToast(
        "Firebase Storage no permite esta subida. Revisa sus reglas."
      );

    } else {

      showToast(
        "No se pudo subir el archivo."
      );

    }

  }

}


/* =========================================================
   CREAR CANAL
   ========================================================= */

function setupChannelCreation() {

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
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9áéíóúñ_-]/gi, "");


        if (!cleanName) {

          showToast(
            "Nombre de canal no válido."
          );

          return;

        }


        try {

          await db
            .collection("channels")
            .doc(cleanName)
            .set({

              name:
                cleanName,

              type:
                "text",

              createdBy:
                currentUser.uid,

              createdAt:
                firebase.firestore.FieldValue.serverTimestamp()

            });


          showToast(
            `Canal #${cleanName} creado.`
          );


          await loadChannels();


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
   SERVIDORES
   ========================================================= */

function setupServers() {

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
              "Crear servidores estará disponible próximamente."
            );

            return;

          }


          document
            .querySelectorAll(".server")
            .forEach(item =>
              item.classList.remove(
                "active"
              )
            );


          button.classList.add(
            "active"
          );

        }
      );

    });

}


/* =========================================================
   MENÚ GRUPO
   ========================================================= */

function setupGroupMenu() {

  $("groupMenu")
    ?.addEventListener(
      "click",
      () => {

        showToast(
          "Configuración del grupo próximamente."
        );

      }
    );

}


/* =========================================================
   MIEMBROS
   ========================================================= */

function setupMembers() {

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

    $("callTitle")
      .textContent =
      "Llamada de voz";


    $("callStatus")
      .textContent =
      "La conexión de voz real se añadirá mediante WebRTC.";


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
      "La videollamada real se añadirá mediante WebRTC.";


    $("videoArea")
      .classList.remove(
        "hidden"
      );

  }

}


function setupCalls() {

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


  $("muteBtn")
    ?.addEventListener(
      "click",
      function () {

        this.dataset.muted =
          this.dataset.muted !== "true";


        const muted =
          this.dataset.muted === "true";


        this.textContent =
          muted
            ? "🔇"
            : "🎤";

      }
    );


  $("cameraBtn")
    ?.addEventListener(
      "click",
      function () {

        this.dataset.off =
          this.dataset.off !== "true";


        const off =
          this.dataset.off === "true";


        this.textContent =
          off
            ? "🚫"
            : "📹";

      }
    );

}


function closeCall() {

  $("callModal")
    ?.classList.add(
      "hidden"
    );


  stopScreen();

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


    $("callModal")
      ?.classList.remove(
        "hidden"
      );


    $("callTitle")
      .textContent =
      "Compartiendo pantalla";


    $("callStatus")
      .textContent =
      "Vista previa local";


    $("videoArea")
      ?.classList.remove(
        "hidden"
      );


    $("videoPlaceholder")
      ?.classList.add(
        "hidden"
      );


    const video =
      $("screenVideo");


    video.srcObject =
      screenStream;


    video.style.display =
      "block";


    const track =
      screenStream
        .getVideoTracks()[0];


    track.addEventListener(
      "ended",
      () => {

        stopScreen();

        showToast(
          "Has dejado de compartir la pantalla."
        );

      }
    );


  } catch (error) {

    console.log(error);

    showToast(
      "Has cancelado compartir la pantalla."
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

    screenStream =
      null;

  }


  const video =
    $("screenVideo");


  if (video) {

    video.srcObject =
      null;

    video.style.display =
      "none";

  }


  $("videoPlaceholder")
    ?.classList.remove(
      "hidden"
    );

}


function setupScreenShare() {

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

}


/* =========================================================
   MÓVIL
   ========================================================= */

function setupMobile() {

  $("mobileMenu")
    ?.addEventListener(
      "click",
      () => {

        showToast(
          "El menú móvil estará disponible próximamente."
        );

      }
    );

}


/* =========================================================
   ESTADO ONLINE
   ========================================================= */

function setupPresence() {

  if (!currentUser) return;


  window.addEventListener(
    "beforeunload",
    () => {

      try {

        db
          .collection("users")
          .doc(currentUser.uid)
          .set({

            online: false,

            lastSeen:
              firebase.firestore.FieldValue.serverTimestamp()

          }, {
            merge: true
          });

      } catch {}

    }
  );

}


/* =========================================================
   INICIAR TODA LA APP
   ========================================================= */

function startApplication() {

  setupAuthentication();

  setupMessages();

  setupFileUpload();

  setupChannelCreation();

  setupServers();

  setupGroupMenu();

  setupMembers();

  setupCalls();

  setupScreenShare();

  setupMobile();

}


/* =========================================================
   ARRANQUE
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    initializeFirebase();

  }
);
