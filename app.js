/* =========================================================
   CATRACVOICE — APP.JS
   Frontend funcional para GitHub Pages
   ========================================================= */

"use strict";

/* =========================================================
   DATOS
   ========================================================= */

const messages = {
  general: [
    {
      name: "Alex",
      initial: "A",
      color: "green",
      time: "11:42",
      text: "¡Bienvenidos a CatracVoice! 👋"
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
      text: "Perfecto 👍"
    }
  ]
};

let currentChannel = "general";
let currentUser = "Tú";
let screenStream = null;
let localStream = null;

/* =========================================================
   UTILIDADES
   ========================================================= */

function $(id) {
  return document.getElementById(id);
}

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

function show(element) {
  if (!element) return;
  element.classList.remove("hidden");
}

function hide(element) {
  if (!element) return;
  element.classList.add("hidden");
}

/* =========================================================
   MENSAJES
   ========================================================= */

function renderMessages() {
  const container = $("messages");

  if (!container) return;

  const list = messages[currentChannel] || [];

  container.innerHTML = `
    <div class="welcome">
      <div class="welcome-icon">#</div>
      <h2>¡Bienvenido a #${escapeHTML(currentChannel)}!</h2>
      <p>
        Este es el comienzo del canal.
        Envía un mensaje para empezar a hablar.
      </p>
    </div>
  `;

  list.forEach(message => {
    const article = document.createElement("article");

    article.className = "msg";

    article.innerHTML = `
      <div class="avatar ${escapeHTML(message.color || "")}">
        ${escapeHTML(message.initial)}
      </div>

      <div class="message-info">
        <div class="meta">
          <strong>${escapeHTML(message.name)}</strong>
          <time>${escapeHTML(message.time)}</time>
        </div>

        <p class="text">
          ${escapeHTML(message.text)}
        </p>
      </div>
    `;

    container.appendChild(article);
  });

  container.scrollTop = container.scrollHeight;
}

/* =========================================================
   LOGIN
   ========================================================= */

function setupLogin() {
  const form = $("authForm");

  if (!form) {
    console.warn("No se encontró #authForm");
    return;
  }

  form.addEventListener("submit", event => {
    event.preventDefault();

    const emailInput = $("email");
    const passwordInput = $("password");

    const email = emailInput ? emailInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value : "";

    if (!email) {
      showToast("Introduce tu correo.");
      return;
    }

    if (!password) {
      showToast("Introduce tu contraseña.");
      return;
    }

    if (password.length < 8) {
      showToast("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    const username =
      email
        .split("@")[0]
        .replace(/[._-]/g, " ")
        .trim();

    currentUser = username || "Tú";

    const userName = $("userName");

    if (userName) {
      userName.textContent = currentUser;
    }

    hide($("authScreen"));
    show($("app"));

    renderMessages();

    showToast("¡Has entrado en CatracVoice! 🎉");
  });
}

/* =========================================================
   REGISTRO
   ========================================================= */

function setupRegister() {
  const button = $("registerBtn");

  if (!button) return;

  button.addEventListener("click", () => {
    showToast(
      "El registro real necesita un servidor y una base de datos."
    );
  });
}

/* =========================================================
   CERRAR SESIÓN
   ========================================================= */

function setupLogout() {
  const button = $("logoutBtn");

  if (!button) return;

  button.addEventListener("click", () => {
    hide($("app"));
    show($("authScreen"));

    if ($("email")) {
      $("email").value = "";
    }

    if ($("password")) {
      $("password").value = "";
    }

    showToast("Has cerrado sesión.");
  });
}

/* =========================================================
   CANALES
   ========================================================= */

function setupChannels() {
  document
    .querySelectorAll("[data-channel]")
    .forEach(button => {

      button.addEventListener("click", () => {

        const channel =
          button.dataset.channel;

        if (!messages[channel]) {
          messages[channel] = [];
        }

        currentChannel = channel;

        document
          .querySelectorAll("[data-channel]")
          .forEach(item => {
            item.classList.toggle(
              "active",
              item === button
            );
          });

        const channelTitle =
          $("channelTitle");

        if (channelTitle) {
          channelTitle.textContent = channel;
        }

        const input =
          $("messageInput");

        if (input) {
          input.placeholder =
            `Escribe un mensaje en #${channel}...`;
        }

        renderMessages();
      });
    });
}

/* =========================================================
   ENVIAR MENSAJES
   ========================================================= */

function setupMessages() {
  const form = $("messageForm");

  if (!form) return;

  form.addEventListener("submit", event => {

    event.preventDefault();

    const input = $("messageInput");

    if (!input) return;

    const text = input.value.trim();

    if (!text) return;

    if (!messages[currentChannel]) {
      messages[currentChannel] = [];
    }

    const time =
      new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      });

    messages[currentChannel].push({
      name: currentUser,
      initial:
        currentUser.charAt(0).toUpperCase() || "T",
      color: "",
      time,
      text
    });

    input.value = "";

    renderMessages();
  });
}

/* =========================================================
   EMOJIS
   ========================================================= */

function setupEmoji() {
  const button = $("emojiBtn");

  if (!button) return;

  button.addEventListener("click", () => {

    const input = $("messageInput");

    if (!input) return;

    input.value += " 😊";
    input.focus();
  });
}

/* =========================================================
   ADJUNTOS
   ========================================================= */

function setupAttachments() {
  const button = $("attachBtn");

  if (!button) return;

  button.addEventListener("click", () => {

    const input =
      document.createElement("input");

    input.type = "file";
    input.multiple = true;

    input.onchange = () => {

      if (!input.files.length) return;

      const names =
        Array.from(input.files)
          .map(file => file.name)
          .join(", ");

      showToast(
        `Archivo seleccionado: ${names}`
      );
    };

    input.click();
  });
}

/* =========================================================
   CREAR CANAL
   ========================================================= */

function setupAddChannel() {
  const button = $("addChannel");

  if (!button) return;

  button.addEventListener("click", () => {

    const name =
      prompt("Nombre del nuevo canal:");

    if (!name) return;

    const cleanName =
      name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-_]/g, "");

    if (!cleanName) {
      showToast("Nombre de canal no válido.");
      return;
    }

    if (messages[cleanName]) {
      showToast("Ese canal ya existe.");
      return;
    }

    messages[cleanName] = [];

    showToast(
      `Canal #${cleanName} creado.`
    );

    /* Crear botón visual */

    const channels =
      document.querySelector(".channels");

    if (!channels) return;

    const button =
      document.createElement("button");

    button.className = "channel";

    button.dataset.channel =
      cleanName;

    button.innerHTML = `
      <span class="channel-icon">#</span>
      ${escapeHTML(cleanName)}
    `;

    channels.appendChild(button);

    button.addEventListener("click", () => {

      currentChannel = cleanName;

      document
        .querySelectorAll("[data-channel]")
        .forEach(item => {
          item.classList.toggle(
            "active",
            item === button
          );
        });

      if ($("channelTitle")) {
        $("channelTitle").textContent =
          cleanName;
      }

      renderMessages();
    });
  });
}

/* =========================================================
   MENÚ DEL GRUPO
   ========================================================= */

function setupGroupMenu() {
  const button = $("groupMenu");

  if (!button) return;

  button.addEventListener("click", () => {
    showToast(
      "Configuración del grupo próximamente."
    );
  });
}

/* =========================================================
   SERVIDORES
   ========================================================= */

function setupServers() {

  document
    .querySelectorAll(".server")
    .forEach(button => {

      button.addEventListener("click", () => {

        if (
          button.classList.contains(
            "add-server"
          )
        ) {

          showToast(
            "Crear un nuevo servidor próximamente."
          );

          return;
        }

        document
          .querySelectorAll(".server")
          .forEach(server => {
            server.classList.remove("active");
          });

        button.classList.add("active");

        showToast(
          "Servidor seleccionado."
        );
      });
    });
}

/* =========================================================
   MIEMBROS
   ========================================================= */

function setupMembers() {

  const button = $("membersBtn");

  if (!button) return;

  button.addEventListener("click", () => {

    const panel =
      $("membersPanel");

    if (!panel) {
      showToast("No se encontró el panel de miembros.");
      return;
    }

    if (window.innerWidth <= 1000) {
      showToast("Panel de miembros disponible en escritorio.");
      return;
    }

    if (
      panel.style.display === "none"
    ) {
      panel.style.display = "";
    } else {
      panel.style.display = "none";
    }
  });
}

/* =========================================================
   LLAMADAS
   ========================================================= */

function openCall(type) {

  const modal = $("callModal");

  if (!modal) return;

  show(modal);

  const title = $("callTitle");
  const status = $("callStatus");
  const videoArea = $("videoArea");

  if (type === "voice") {

    if (title) {
      title.textContent =
        "Llamada de voz";
    }

    if (status) {
      status.textContent =
        "Llamada de voz — modo local.";
    }

    if (videoArea) {
      videoArea.classList.add("hidden");
    }

  } else {

    if (title) {
      title.textContent =
        "Videollamada";
    }

    if (status) {
      status.textContent =
        "Videollamada — modo local.";
    }

    if (videoArea) {
      videoArea.classList.remove("hidden");
    }
  }
}

function setupCalls() {

  const voice =
    $("voiceCallBtn");

  const video =
    $("videoCallBtn");

  const close =
    $("closeCall");

  const hangup =
    $("hangupBtn");

  if (voice) {
    voice.addEventListener(
      "click",
      () => openCall("voice")
    );
  }

  if (video) {
    video.addEventListener(
      "click",
      () => openCall("video")
    );
  }

  if (close) {
    close.addEventListener(
      "click",
      closeCall
    );
  }

  if (hangup) {
    hangup.addEventListener(
      "click",
      closeCall
    );
  }
}

function closeCall() {

  const modal =
    $("callModal");

  if (modal) {
    hide(modal);
  }

  stopCamera();
}

/* =========================================================
   CÁMARA
   ========================================================= */

async function startCamera() {

  if (
    !navigator.mediaDevices ||
    !navigator.mediaDevices.getUserMedia
  ) {
    showToast(
      "Tu navegador no permite utilizar la cámara."
    );
    return;
  }

  try {

    localStream =
      await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

    const video =
      $("localVideo");

    if (video) {
      video.srcObject =
        localStream;

      video.play().catch(() => {});
    }

    showToast(
      "Cámara y micrófono activados."
    );

  } catch (error) {

    console.error(error);

    showToast(
      "No se pudo acceder a la cámara o micrófono."
    );
  }
}

function stopCamera() {

  if (!localStream) return;

  localStream
    .getTracks()
    .forEach(track => track.stop());

  localStream = null;

  const video =
    $("localVideo");

  if (video) {
    video.srcObject = null;
  }
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

    if (video) {

      video.srcObject =
        screenStream;

      video.style.display =
        "block";

      video.play().catch(() => {});
    }

    showToast(
      "Estás compartiendo pantalla."
    );

    const track =
      screenStream.getVideoTracks()[0];

    if (track) {

      track.addEventListener(
        "ended",
        stopScreenShare
      );
    }

  } catch (error) {

    console.log(error);

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

  showToast(
    "Has dejado de compartir pantalla."
  );
}

function setupScreenShare() {

  const button =
    $("screenShareBtn");

  const modalButton =
    $("modalScreenBtn");

  if (button) {
    button.addEventListener(
      "click",
      shareScreen
    );
  }

  if (modalButton) {
    modalButton.addEventListener(
      "click",
      shareScreen
    );
  }
}

/* =========================================================
   SALA DE VOZ
   ========================================================= */

function setupVoiceChannel() {

  const button =
    $("voiceChannel");

  if (!button) return;

  button.addEventListener(
    "click",
    () => openCall("voice")
  );
}

/* =========================================================
   BOTÓN MÓVIL
   ========================================================= */

function setupMobileMenu() {

  const button =
    $("mobileMenu");

  if (!button) return;

  button.addEventListener(
    "click",
    () => {

      const sidebar =
        document.querySelector(".sidebar");

      if (!sidebar) {
        showToast("Menú móvil.");
        return;
      }

      sidebar.classList.toggle("open");
    }
  );
}

/* =========================================================
   TECLA ESC
   ========================================================= */

document.addEventListener(
  "keydown",
  event => {

    if (event.key !== "Escape") return;

    const modal =
      $("callModal");

    if (
      modal &&
      !modal.classList.contains("hidden")
    ) {
      closeCall();
    }
  }
);

/* =========================================================
   INICIO
   ========================================================= */

function initializeApp() {

  setupLogin();
  setupRegister();
  setupLogout();

  setupChannels();
  setupMessages();
  setupEmoji();
  setupAttachments();

  setupAddChannel();
  setupGroupMenu();

  setupServers();
  setupMembers();

  setupCalls();
  setupScreenShare();
  setupVoiceChannel();

  setupMobileMenu();

  renderMessages();

  console.log(
    "CatracVoice iniciado correctamente."
  );
}

if (
  document.readyState === "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initializeApp
  );

} else {

  initializeApp();
}
