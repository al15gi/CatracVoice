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
    }
  ]

};


let currentChannel = "general";


const $ = id =>
  document.getElementById(id);


function escapeHTML(text) {

  const element =
    document.createElement("div");

  element.textContent = text;

  return element.innerHTML;

}


function showToast(text) {

  const toast = $("toast");

  toast.textContent = text;

  toast.classList.add("show");

  clearTimeout(window.toastTimer);

  window.toastTimer =
    setTimeout(
      () => toast.classList.remove("show"),
      2500
    );

}


function renderMessages() {

  const container =
    $("messages");

  const list =
    messages[currentChannel] || [];

  container.innerHTML =
    list.map(message => `

      <article class="message">

        <div class="avatar ${message.color}">
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

      </article>

    `).join("");

  container.scrollTop =
    container.scrollHeight;

}


/* LOGIN DE PRUEBA */

$("authForm")
  .addEventListener("submit", event => {

    event.preventDefault();

    const email =
      $("email").value.trim();

    if (!email) return;

    $("authScreen")
      .classList.add("hidden");

    $("app")
      .classList.remove("hidden");

    const username =
      email
        .split("@")[0]
        .replace(/[._-]/g, " ");

    $("userName").textContent =
      username || "Tú";

    renderMessages();

  });


$("registerBtn")
  .addEventListener("click", () => {

    showToast(
      "El registro real se conectará al backend seguro."
    );

  });


$("logoutBtn")
  .addEventListener("click", () => {

    $("app").classList.add("hidden");

    $("authScreen")
      .classList.remove("hidden");

    $("email").value = "";

    $("password").value = "";

  });


/* CANALES */

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


/* MENSAJES */

$("messageForm")
  .addEventListener("submit", event => {

    event.preventDefault();

    const input =
      $("messageInput");

    const text =
      input.value.trim();

    if (!text) return;

    const time =
      new Date()
        .toLocaleTimeString(
          [],
          {
            hour: "2-digit",
            minute: "2-digit"
          }
        );

    messages[currentChannel]
      .push({

        name: "Tú",
        initial: "T",
        color: "",
        time,
        text

      });

    input.value = "";

    renderMessages();

  });


/* EMOJI */

$("emojiBtn")
  .addEventListener("click", () => {

    $("messageInput").value += " 😊";

    $("messageInput").focus();

  });


/* ARCHIVOS */

$("attachBtn")
  .addEventListener("click", () => {

    showToast(
      "Los archivos se añadirán con el almacenamiento seguro."
    );

  });


/* MIEMBROS */

$("membersBtn")
  .addEventListener("click", () => {

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

  });


/* CREAR CANAL */

$("addChannel")
  .addEventListener("click", () => {

    showToast(
      "La creación de canales llegará con la base de datos."
    );

  });


/* MENÚ GRUPO */

$("groupMenu")
  .addEventListener("click", () => {

    showToast(
      "Configuración del grupo próximamente."
    );

  });


/* SERVIDORES */

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


/* LLAMADA */

function openCall(type) {

  $("callModal")
    .classList.remove("hidden");

  if (type === "voice") {

    $("callTitle")
      .textContent =
      "Llamada de voz";

    $("callStatus")
      .textContent =
      "La llamada real se conectará mediante WebRTC.";

    $("videoArea")
      .classList.add("hidden");

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


$("voiceCallBtn")
  .addEventListener(
    "click",
    () => openCall("voice")
  );


$("videoCallBtn")
  .addEventListener(
    "click",
    () => openCall("video")
  );


$("closeCall")
  .addEventListener(
    "click",
    () =>
      $("callModal")
        .classList.add("hidden")
  );


$("hangupBtn")
  .addEventListener(
    "click",
    () =>
      $("callModal")
        .classList.add("hidden")
  );


/* COMPARTIR PANTALLA */

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

    const stream =
      await navigator.mediaDevices
        .getDisplayMedia({
          video: true,
          audio: true
        });

    showToast(
      "Pantalla compartida. La conexión con tus amigos llegará con WebRTC."
    );

    stream
      .getTracks()
      .forEach(track => {

        track.addEventListener(
          "ended",
          () => {

            showToast(
              "Has dejado de compartir la pantalla."
            );

          }
        );

      });

  } catch {

    showToast(
      "Has cancelado compartir pantalla."
    );

  }

}


$("screenShareBtn")
  .addEventListener(
    "click",
    shareScreen
  );


$("modalScreenBtn")
  .addEventListener(
    "click",
    shareScreen
  );


/* SALA DE VOZ */

$("voiceChannel")
  .addEventListener(
    "click",
    () => openCall("voice")
  );


/* MÓVIL */

$("mobileMenu")
  .addEventListener(
    "click",
    () => {

      showToast(
        "El menú móvil estará disponible en la siguiente versión."
      );

    }
  );


/* INICIO */

renderMessages();
