const messages = {

  general: [
    {
      name: "Alex",
      initial: "A",
      color: "green",
      time: "11:42",
      text: "¡Bienvenidos al nuevo chat! 👋"
    },
    {
      name: "Mario",
      initial: "M",
      color: "purple",
      time: "11:44",
      text: "Tiene muy buena pinta 😎"
    },
    {
      name: "Laura",
      initial: "L",
      color: "orange",
      time: "11:47",
      text: "¿Probamos a organizar aquí los planes del finde?"
    }
  ],

  gaming: [
    {
      name: "Mario",
      initial: "M",
      color: "purple",
      time: "11:20",
      text: "¿Jugamos esta tarde? 🎮"
    },
    {
      name: "Alex",
      initial: "A",
      color: "green",
      time: "11:22",
      text: "Yo me apunto."
    }
  ],

  planes: [
    {
      name: "Laura",
      initial: "L",
      color: "orange",
      time: "10:58",
      text: "He creado este canal para organizar los planes."
    },
    {
      name: "Alex",
      initial: "A",
      color: "green",
      time: "11:02",
      text: "Genial 👍"
    }
  ]

};


let currentChannel = "general";
let screenStream = null;
let microphoneOn = true;
let cameraOn = true;


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


/* ==============================
   MENSAJES
   ============================== */

function renderMessages() {

  const container = $("messages");

  if (!container) return;

  const list = messages[currentChannel] || [];

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

    article.className = "message";


    article.innerHTML = `

      <div class="avatar ${escapeHTML(message.color || "")}">
        ${escapeHTML(message.initial)}
      </div>

      <div class="message-info">

        <div class="message-meta">

          <strong>
            ${escapeHTML(message.name)}
          </strong>

          <time>
            ${escapeHTML(message.time)}
          </time>

        </div>

        <p class="message-text">
          ${escapeHTML(message.text)}
        </p>

      </div>

    `;


    container.appendChild(article);

  });


  container.scrollTop =
    container.scrollHeight;

}


/* ==============================
   LOGIN
   ============================== */

$("authForm").addEventListener(
  "submit",
  event => {

    event.preventDefault();

    const email =
      $("email").value.trim();

    if (!email) return;


    const username =
      email
        .split("@")[0]
        .replace(/[._-]/g, " ")
        .trim();


    $("userName").textContent =
      username || "Tú";


    $("authScreen")
      .classList.add("hidden");


    $("app")
      .classList.remove("hidden");


    renderMessages();

  }
);


/* REGISTRO */

$("registerBtn").addEventListener(
  "click",
  () => {

    showToast(
      "El registro real se conectará al backend seguro."
    );

  }
);


/* CERRAR SESIÓN */

$("logoutBtn").addEventListener(
  "click",
  () => {

    $("app")
      .classList.add("hidden");

    $("authScreen")
      .classList.remove("hidden");

    $("email").value = "";

    $("password").value = "";

  }
);


/* ==============================
   CANALES
   ============================== */

document
  .querySelectorAll("[data-channel]")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

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


        renderMessages();

      }
    );

  });


/* ==============================
   ENVIAR MENSAJE
   ============================== */

$("messageForm").addEventListener(
  "submit",
  event => {

    event.preventDefault();


    const input =
      $("messageInput");


    const text =
      input.value.trim();


    if (!text) return;


    const time =
      new Date().toLocaleTimeString(
        [],
        {
          hour: "2-digit",
          minute: "2-digit"
        }
      );


    messages[currentChannel].push({

      name: "Tú",

      initial: "T",

      color: "",

      time,

      text

    });


    input.value = "";

    renderMessages();

  }
);


/* ==============================
   EMOJI
   ============================== */

$("emojiBtn").addEventListener(
  "click",
  () => {

    $("messageInput").value += " 😊";

    $("messageInput").focus();

  }
);


/* ==============================
   ARCHIVOS
   ============================== */

$("attachBtn").addEventListener(
  "click",
  () => {

    showToast(
      "Los archivos se añadirán con el almacenamiento seguro."
    );

  }
);


/* ==============================
   MIEMBROS
   ============================== */

$("membersBtn").addEventListener(
  "click",
  () => {

    const panel =
      $("membersPanel");


    if (window.innerWidth <= 1000) {

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


/* ==============================
   CREAR CANAL
   ============================== */

$("addChannel").addEventListener(
  "click",
  () => {

    showToast(
      "La creación de canales llegará con la base de datos."
    );

  }
);


/* ==============================
   MENÚ DEL GRUPO
   ============================== */

$("groupMenu").addEventListener(
  "click",
  () => {

    showToast(
      "Configuración del grupo próximamente."
    );

  }
);


/* ==============================
   SERVIDORES
   ============================== */

document
  .querySelectorAll(".server")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        if (
          button.classList.contains("add-server")
        ) {

          showToast(
            "Crear un grupo llegará próximamente."
          );

          return;

        }


        document
          .querySelectorAll(".server")
          .forEach(item =>
            item.classList.remove("active")
          );


        button.classList.add("active");

      }
    );

  });


/* ==============================
   LLAMADAS
   ============================== */

function openCall(type) {

  $("callModal")
    .classList.remove("hidden");


  $("videoArea")
    .classList.add("hidden");


  if (type === "voice") {

    $("callTitle")
      .textContent =
      "Llamada de voz";


    $("callStatus")
      .textContent =
      "La llamada real se conectará mediante WebRTC.";

  }


  if (type === "video") {

    $("callTitle")
      .textContent =
      "Videollamada";


    $("callStatus")
      .textContent =
      "La videollamada real se conectará mediante WebRTC.";


    $("videoArea")
      .classList.remove("hidden");

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


$("voiceChannel").addEventListener(
  "click",
  () => openCall("voice")
);


/* CERRAR LLAMADA */

function closeCall() {

  $("callModal")
    .classList.add("hidden");

  stopScreenShare();

}


$("closeCall").addEventListener(
  "click",
  closeCall
);


$("hangupBtn").addEventListener(
  "click",
  closeCall
);


/* ==============================
   MICRÓFONO
   ============================== */

$("muteBtn").addEventListener(
  "click",
  () => {

    microphoneOn =
      !microphoneOn;


    $("muteBtn").textContent =
      microphoneOn
        ? "🎤"
        : "🔇";


    showToast(
      microphoneOn
        ? "Micrófono activado"
        : "Micrófono silenciado"
    );

  }
);


/* ==============================
   CÁMARA
   ============================== */

$("cameraBtn").addEventListener(
  "click",
  () => {

    cameraOn =
      !cameraOn;


    $("cameraBtn").textContent =
      cameraOn
        ? "📹"
        : "🚫";


    showToast(
      cameraOn
        ? "Cámara activada"
        : "Cámara desactivada"
    );

  }
);


/* ==============================
   COMPARTIR PANTALLA
   ============================== */

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
      await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });


    $("callModal")
      .classList.remove("hidden");


    $("callTitle")
      .textContent =
      "Compartiendo pantalla";


    $("callStatus")
      .textContent =
      "Solo visible para ti en esta demo.";


    $("videoArea")
      .classList.remove("hidden");


    $("videoPlaceholder")
      .style.display =
      "none";


    const video =
      $("screenVideo");


    video.style.display =
      "block";


    video.srcObject =
      screenStream;


    const track =
      screenStream.getVideoTracks()[0];


    track.addEventListener(
      "ended",
      () => {

        stopScreenShare();

        showToast(
          "Has dejado de compartir la pantalla."
        );

      }
    );


  } catch {

    showToast(
      "Has cancelado compartir pantalla."
    );

  }

}


function stopScreenShare() {

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


  const placeholder =
    $("videoPlaceholder");


  if (placeholder) {

    placeholder.style.display =
      "";

  }

}


$("screenShareBtn").addEventListener(
  "click",
  shareScreen
);


$("modalScreenBtn").addEventListener(
  "click",
  shareScreen
);


/* ==============================
   MÓVIL
   ============================== */

$("mobileMenu").addEventListener(
  "click",
  () => {

    showToast(
      "El menú móvil estará disponible en la siguiente versión."
    );

  }
);


/* ==============================
   INICIO
   ============================== */

renderMessages();
