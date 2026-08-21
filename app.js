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
      text: "Genial 👍"
    }
  ]
};

let currentChannel = "general";
let screenStream = null;

function $(id) {
  return document.getElementById(id);
}

function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function toast(text) {
  const element = $("toast");

  if (!element) return;

  element.textContent = text;
  element.classList.add("show");

  clearTimeout(window.toastTimer);

  window.toastTimer = setTimeout(() => {
    element.classList.remove("show");
  }, 2500);
}

/* =========================
   MENSAJES
========================= */

function renderMessages() {
  const container = $("messages");

  if (!container) return;

  const list = messages[currentChannel] || [];

  container.innerHTML = `
    <div class="welcome">
      <div class="welcome-icon">#</div>
      <h2>¡Bienvenido a #${escapeHTML(currentChannel)}!</h2>
      <p>Este es el comienzo del canal.</p>
    </div>
  `;

  list.forEach(message => {
    const article = document.createElement("article");

    article.className = "msg";

    article.innerHTML = `
      <div class="avatar ${escapeHTML(message.color || "")}">
        ${escapeHTML(message.initial)}
      </div>

      <div>
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

/* =========================
   LOGIN
========================= */

const loginForm = $("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", event => {
    event.preventDefault();

    const email = $("email").value.trim();

    if (!email) return;

    const username =
      email
        .split("@")[0]
        .replace(/[._-]/g, " ")
        .trim();

    $("name").textContent = username || "Tú";

    $("login").style.display = "none";
    $("app").style.display = "grid";

    renderMessages();
  });
}

/* =========================
   LOGOUT
========================= */

const logout = $("logout");

if (logout) {
  logout.addEventListener("click", () => {
    $("app").style.display = "none";
    $("login").style.display = "grid";

    $("email").value = "";
    $("pass").value = "";
  });
}

/* =========================
   CANALES
========================= */

document.querySelectorAll("[data-c]").forEach(button => {
  button.addEventListener("click", () => {

    currentChannel = button.dataset.c;

    document
      .querySelectorAll("[data-c]")
      .forEach(item => {
        item.classList.toggle(
          "active",
          item === button
        );
      });

    $("channel").textContent = currentChannel;

    renderMessages();
  });
});

/* =========================
   ENVIAR MENSAJES
========================= */

const form = $("form");

if (form) {
  form.addEventListener("submit", event => {
    event.preventDefault();

    const input = $("message");
    const text = input.value.trim();

    if (!text) return;

    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });

    messages[currentChannel].push({
      name: "Tú",
      initial: "T",
      color: "",
      time,
      text
    });

    input.value = "";

    renderMessages();
  });
}

/* =========================
   EMOJI
========================= */

const emoji = $("emoji");

if (emoji) {
  emoji.addEventListener("click", () => {
    $("message").value += " 😊";
    $("message").focus();
  });
}

/* =========================
   ARCHIVOS
========================= */

const plus = $("plus");

if (plus) {
  plus.addEventListener("click", () => {
    toast("La subida de archivos estará disponible próximamente.");
  });
}

/* =========================
   CREAR CANAL
========================= */

const add = $("add");

if (add) {
  add.addEventListener("click", () => {
    toast("La creación de canales estará disponible próximamente.");
  });
}

/* =========================
   MENÚ
========================= */

const workspaceButton =
  document.querySelector(".workspace button");

if (workspaceButton) {
  workspaceButton.addEventListener("click", () => {
    toast("Configuración de CatracVoice próximamente.");
  });
}

/* =========================
   LLAMADAS
========================= */

function openCall(type) {
  const modal = $("modal");

  if (!modal) return;

  modal.style.display = "flex";

  if (type === "voice") {
    $("callTitle").textContent = "Llamada de voz";
    $("callStatus").textContent =
      "Modo de demostración local.";
  }

  if (type === "video") {
    $("callTitle").textContent = "Videollamada";
    $("callStatus").textContent =
      "Modo de demostración local.";
  }
}

const call = $("call");

if (call) {
  call.addEventListener("click", () => {
    openCall("voice");
  });
}

const videoCall = $("videoCall");

if (videoCall) {
  videoCall.addEventListener("click", () => {
    openCall("video");
  });
}

const voiceRoom = $("voiceRoom");

if (voiceRoom) {
  voiceRoom.addEventListener("click", () => {
    openCall("voice");
  });
}

/* =========================
   CERRAR LLAMADA
========================= */

function closeModal() {
  const modal = $("modal");

  if (modal) {
    modal.style.display = "none";
  }

  stopScreenShare();
}

const closeButton = $("close");

if (closeButton) {
  closeButton.addEventListener("click", closeModal);
}

const hangButton = $("hang");

if (hangButton) {
  hangButton.addEventListener("click", closeModal);
}

/* =========================
   MICRÓFONO
========================= */

let microphoneEnabled = true;

const muteButton = $("mute");

if (muteButton) {
  muteButton.addEventListener("click", () => {

    microphoneEnabled = !microphoneEnabled;

    muteButton.textContent =
      microphoneEnabled ? "🎤" : "🔇";

    toast(
      microphoneEnabled
        ? "Micrófono activado"
        : "Micrófono silenciado"
    );
  });
}

/* =========================
   CÁMARA
========================= */

let cameraEnabled = true;

const cameraButton = $("camera");

if (cameraButton) {
  cameraButton.addEventListener("click", () => {

    cameraEnabled = !cameraEnabled;

    cameraButton.textContent =
      cameraEnabled ? "📹" : "🚫";

    toast(
      cameraEnabled
        ? "Cámara activada"
        : "Cámara desactivada"
    );
  });
}

/* =========================
   COMPARTIR PANTALLA
========================= */

async function shareScreen() {

  if (
    !navigator.mediaDevices ||
    !navigator.mediaDevices.getDisplayMedia
  ) {
    toast(
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

    const modal = $("modal");

    const video = $("screenVideo");

    const placeholder = $("placeholder");

    modal.style.display = "flex";

    $("callTitle").textContent =
      "Compartiendo pantalla";

    $("callStatus").textContent =
      "La pantalla se está mostrando en esta demo.";

    placeholder.style.display = "none";

    video.style.display = "block";

    video.srcObject = screenStream;

    const track =
      screenStream.getVideoTracks()[0];

    track.addEventListener(
      "ended",
      () => {
        stopScreenShare();
        toast("Has dejado de compartir la pantalla.");
      }
    );

  } catch (error) {

    toast("Has cancelado compartir pantalla.");
  }
}

function stopScreenShare() {

  if (screenStream) {

    screenStream
      .getTracks()
      .forEach(track => track.stop());

    screenStream = null;
  }

  const video = $("screenVideo");

  const placeholder = $("placeholder");

  if (video) {
    video.srcObject = null;
    video.style.display = "none";
  }

  if (placeholder) {
    placeholder.style.display = "block";
  }
}

const screenButton = $("screen");

if (screenButton) {
  screenButton.addEventListener(
    "click",
    shareScreen
  );
}

const modalScreenButton = $("modalScreen");

if (modalScreenButton) {
  modalScreenButton.addEventListener(
    "click",
    shareScreen
  );
}

/* =========================
   MIEMBROS
========================= */

const membersButton = $("membersBtn");

if (membersButton) {
  membersButton.addEventListener("click", () => {

    const members = $("members");

    if (!members) return;

    if (window.innerWidth <= 800) {
      toast("Los miembros aparecen en la versión de escritorio.");
      return;
    }

    if (members.style.display === "none") {
      members.style.display = "";
    } else {
      members.style.display = "none";
    }
  });
}

/* =========================
   SERVIDORES
========================= */

document
  .querySelectorAll(".server")
  .forEach(button => {

    button.addEventListener("click", () => {

      if (button.classList.contains("add")) {

        toast(
          "Crear un nuevo servidor estará disponible próximamente."
        );

        return;
      }

      document
        .querySelectorAll(".server")
        .forEach(item =>
          item.classList.remove("active")
        );

      button.classList.add("active");
    });
  });

/* =========================
   MENÚ MÓVIL
========================= */

const mobileButton =
  document.querySelector(".mobile");

if (mobileButton) {

  mobileButton.addEventListener(
    "click",
    () => {
      toast("Menú móvil próximamente.");
    }
  );
}
