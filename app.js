/* =========================================================
   CATRACVOICE — APP.JS
   Chat + canales + login + llamadas + pantalla
   ========================================================= */

"use strict";

/* =========================================================
   DATOS
   ========================================================= */

const defaultMessages = {
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


/* =========================================================
   ESTADO
   ========================================================= */

let currentChannel = "general";
let currentUser = "Tú";

let messages = loadData(
  "catracvoice_messages",
  defaultMessages
);

let channels = loadData(
  "catracvoice_channels",
  ["general", "gaming", "planes"]
);

let stream = null;


/* =========================================================
   UTILIDADES
   ========================================================= */

const $ = id => document.getElementById(id);


function escapeHTML(text) {
  const element = document.createElement("div");
  element.textContent = String(text);
  return element.innerHTML;
}


function loadData(key, fallback) {
  try {
    const saved = localStorage.getItem(key);

    if (!saved) {
      return structuredClone
        ? structuredClone(fallback)
        : JSON.parse(JSON.stringify(fallback));
    }

    return JSON.parse(saved);
  } catch (error) {
    console.warn("No se pudo cargar:", key, error);
    return fallback;
  }
}


function saveData() {
  try {
    localStorage.setItem(
      "catracvoice_messages",
      JSON.stringify(messages)
    );

    localStorage.setItem(
      "catracvoice_channels",
      JSON.stringify(channels)
    );
  } catch (error) {
    console.warn("No se pudo guardar:", error);
  }
}


function showToast(text) {
  const toast = $("toast");

  if (!toast) {
    alert(text);
    return;
  }

  toast.textContent = text;
  toast.classList.add("show");

  clearTimeout(window.toastTimer);

  window.toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}


function getTime() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}


/* =========================================================
   LOGIN
   ========================================================= */

const authForm = $("authForm");

if (authForm) {
  authForm.addEventListener("submit", event => {
    event.preventDefault();

    const emailInput = $("email");

    if (!emailInput) return;

    const email = emailInput.value.trim();

    if (!email) {
      showToast("Escribe tu correo.");
      return;
    }

    currentUser =
      email
        .split("@")[0]
        .replace(/[._-]/g, " ")
        .trim() || "Tú";

    const authScreen = $("authScreen");
    const app = $("app");

    if (authScreen) {
      authScreen.classList.add("hidden");
    }

    if (app) {
      app.classList.remove("hidden");
    }

    const userName = $("userName");

    if (userName) {
      userName.textContent = currentUser;
    }

    renderChannels();
    renderMessages();
  });
}


/* =========================================================
   REGISTRO
   ========================================================= */

const registerBtn = $("registerBtn");

if (registerBtn) {
  registerBtn.addEventListener("click", () => {
    showToast(
      "El registro real necesitará una base de datos."
    );
  });
}


/* =========================================================
   LOGOUT
   ========================================================= */

const logoutBtn = $("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    stopScreen();

    const app = $("app");
    const authScreen = $("authScreen");

    if (app) {
      app.classList.add("hidden");
    }

    if (authScreen) {
      authScreen.classList.remove("hidden");
    }

    const email = $("email");
    const password = $("password");

    if (email) email.value = "";
    if (password) password.value = "";
  });
}


/* =========================================================
   RENDER DE CANALES
   ========================================================= */

function renderChannels() {
  const container =
    document.querySelector(".channels");

  if (!container) return;

  const category =
    container.querySelector(".category");

  /*
   * Eliminamos únicamente los canales de texto
   * creados anteriormente.
   */

  container
    .querySelectorAll("[data-channel]")
    .forEach(element => {
      element.remove();
    });


  /*
   * Creamos los botones según el array channels.
   */

  channels.forEach(channelName => {
    const button =
      document.createElement("button");

    button.className = "channel";

    if (channelName === currentChannel) {
      button.classList.add("active");
    }

    button.dataset.channel = channelName;

    button.innerHTML = `
      <span class="channel-icon">#</span>
      <span>${escapeHTML(channelName)}</span>
    `;

    button.addEventListener("click", () => {
      selectChannel(channelName);
    });


    /*
     * Insertamos antes de la sección de voz.
     */

    const voiceSection =
      container.querySelector(".voice");

    if (voiceSection) {
      container.insertBefore(
        button,
        voiceSection
      );
    } else if (category) {
      container.appendChild(button);
    } else {
      container.appendChild(button);
    }
  });
}


/* =========================================================
   CAMBIAR DE CANAL
   ========================================================= */

function selectChannel(channelName) {
  if (!channels.includes(channelName)) {
    return;
  }

  currentChannel = channelName;

  /*
   * Si el canal todavía no tiene mensajes,
   * creamos una lista vacía.
   */

  if (!messages[currentChannel]) {
    messages[currentChannel] = [];
  }

  document
    .querySelectorAll("[data-channel]")
    .forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.channel === currentChannel
      );
    });


  const title = $("channelTitle");

  if (title) {
    title.textContent = currentChannel;
  }


  const input = $("messageInput");

  if (input) {
    input.placeholder =
      `Escribe un mensaje en #${currentChannel}...`;
  }


  renderMessages();

  saveData();
}


/* =========================================================
   RENDER MENSAJES
   ========================================================= */

function renderMessages() {
  const container = $("messages");

  if (!container) return;

  const list =
    messages[currentChannel] || [];


  if (list.length === 0) {
    container.innerHTML = `
      <div class="welcome">
        <div class="welcome-icon">#</div>

        <h2>
          ¡Bienvenido a #${escapeHTML(currentChannel)}!
        </h2>

        <p>
          Este es el comienzo de este canal.
          ¡Escribe el primer mensaje!
        </p>
      </div>
    `;

    return;
  }


  container.innerHTML = `
    <div class="welcome">
      <div class="welcome-icon">#</div>

      <h2>
        ¡Bienvenido a #${escapeHTML(currentChannel)}!
      </h2>

      <p>
        Este es el comienzo de este canal.
      </p>
    </div>

    ${list.map(message => `
      <article class="message">

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

      </article>
    `).join("")}
  `;


  container.scrollTop =
    container.scrollHeight;
}


/* =========================================================
   ENVIAR MENSAJE
   ========================================================= */

const messageForm = $("messageForm");

if (messageForm) {
  messageForm.addEventListener(
    "submit",
    event => {
      event.preventDefault();

      const input =
        $("messageInput");

      if (!input) return;

      const text =
        input.value.trim();

      if (!text) return;


      if (!messages[currentChannel]) {
        messages[currentChannel] = [];
      }


      messages[currentChannel].push({
        name: currentUser,
        initial:
          currentUser
            .charAt(0)
            .toUpperCase() || "T",
        color: "",
        time: getTime(),
        text
      });


      input.value = "";

      saveData();

      renderMessages();
    }
  );
}


/* =========================================================
   EMOJI
   ========================================================= */

const emojiBtn = $("emojiBtn");

if (emojiBtn) {
  emojiBtn.addEventListener("click", () => {
    const input =
      $("messageInput");

    if (!input) return;

    input.value += " 😊";
    input.focus();
  });
}


/* =========================================================
   ARCHIVOS
   ========================================================= */

const attachBtn = $("attachBtn");

if (attachBtn) {
  attachBtn.addEventListener("click", () => {
    showToast(
      "La subida de archivos necesitará almacenamiento."
    );
  });
}


/* =========================================================
   CREAR CANAL
   ========================================================= */

const addChannel = $("addChannel");

if (addChannel) {
  addChannel.addEventListener("click", () => {
    createChannel();
  });
}


function createChannel() {

  /*
   * Usamos un diálogo sencillo para que funcione
   * directamente sin modificar index.html.
   */

  let name =
    prompt(
      "Nombre del nuevo canal:"
    );


  if (name === null) {
    return;
  }


  name =
    name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9áéíóúüñ_-]/gi, "")
      .replace(/-+/g, "-");


  if (!name) {
    showToast(
      "Escribe un nombre válido."
    );

    return;
  }


  if (name.length > 30) {
    showToast(
      "El nombre no puede superar 30 caracteres."
    );

    return;
  }


  if (channels.includes(name)) {
    showToast(
      `El canal #${name} ya existe.`
    );

    selectChannel(name);

    return;
  }


  /*
   * Creamos el canal.
   */

  channels.push(name);

  messages[name] = [];


  /*
   * Guardamos en el navegador.
   */

  saveData();


  /*
   * Lo mostramos inmediatamente.
   */

  currentChannel = name;

  renderChannels();

  selectChannel(name);


  showToast(
    `Canal #${name} creado correctamente.`
  );
}


/* =========================================================
   MENÚ DEL GRUPO
   ========================================================= */

const groupMenu = $("groupMenu");

if (groupMenu) {
  groupMenu.addEventListener("click", () => {
    showToast(
      "Configuración del grupo próximamente."
    );
  });
}


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
            "Crear un grupo llegará próximamente."
          );

          return;
        }


        document
          .querySelectorAll(".server")
          .forEach(item => {
            item.classList.remove("active");
          });


        button.classList.add("active");
      }
    );
  });


/* =========================================================
   MIEMBROS
   ========================================================= */

const membersBtn = $("membersBtn");

if (membersBtn) {
  membersBtn.addEventListener(
    "click",
    () => {

      const panel =
        $("membersPanel");

      if (!panel) {
        showToast(
          "Lista de miembros no disponible."
        );

        return;
      }


      if (
        window.innerWidth <= 1000
      ) {

        showToast(
          "La lista de miembros está en el panel lateral."
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


  modal.classList.remove("hidden");


  const title =
    $("callTitle");

  const status =
    $("callStatus");

  const videoArea =
    $("videoArea");


  if (type === "voice") {

    if (title) {
      title.textContent =
        "Llamada de voz";
    }

    if (status) {
      status.textContent =
        "Llamada de prueba local.";
    }

    if (videoArea) {
      videoArea.classList.add(
        "hidden"
      );
    }
  }


  if (type === "video") {

    if (title) {
      title.textContent =
        "Videollamada";
    }

    if (status) {
      status.textContent =
        "Videollamada de prueba local.";
    }

    if (videoArea) {
      videoArea.classList.remove(
        "hidden"
      );
    }
  }
}


const voiceCallBtn =
  $("voiceCallBtn");

if (voiceCallBtn) {
  voiceCallBtn.addEventListener(
    "click",
    () => openCall("voice")
  );
}


const videoCallBtn =
  $("videoCallBtn");

if (videoCallBtn) {
  videoCallBtn.addEventListener(
    "click",
    () => openCall("video")
  );
}


const closeCall =
  $("closeCall");

if (closeCall) {
  closeCall.addEventListener(
    "click",
    () => {

      stopScreen();

      const modal =
        $("callModal");

      if (modal) {
        modal.classList.add(
          "hidden"
        );
      }
    }
  );
}


const hangupBtn =
  $("hangupBtn");

if (hangupBtn) {
  hangupBtn.addEventListener(
    "click",
    () => {

      stopScreen();

      const modal =
        $("callModal");

      if (modal) {
        modal.classList.add(
          "hidden"
        );
      }
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

    stream =
      await navigator.mediaDevices
        .getDisplayMedia({
          video: true,
          audio: true
        });


    const modal =
      $("callModal");

    if (modal) {
      modal.classList.remove(
        "hidden"
      );
    }


    const title =
      $("callTitle");

    if (title) {
      title.textContent =
        "Compartiendo pantalla";
    }


    const status =
      $("callStatus");

    if (status) {
      status.textContent =
        "Vista previa de tu pantalla.";
    }


    const video =
      $("screenVideo");

    const videoArea =
      $("videoArea");


    if (video) {
      video.srcObject = stream;
      video.style.display =
        "block";
      video.play().catch(() => {});
    }


    if (videoArea) {
      videoArea.classList.remove(
        "hidden"
      );
    }


    showToast(
      "Pantalla compartida."
    );


    const videoTrack =
      stream.getVideoTracks()[0];


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

  } catch (error) {

    console.log(
      "Compartir pantalla:",
      error
    );

    showToast(
      "Has cancelado compartir la pantalla."
    );
  }
}


function stopScreen() {

  if (stream) {

    stream
      .getTracks()
      .forEach(track => {
        track.stop();
      });

    stream = null;
  }


  const video =
    $("screenVideo");

  if (video) {
    video.srcObject = null;
    video.style.display =
      "none";
  }
}


const screenShareBtn =
  $("screenShareBtn");

if (screenShareBtn) {
  screenShareBtn.addEventListener(
    "click",
    shareScreen
  );
}


const modalScreenBtn =
  $("modalScreenBtn");

if (modalScreenBtn) {
  modalScreenBtn.addEventListener(
    "click",
    shareScreen
  );
}


/* =========================================================
   SALA DE VOZ
   ========================================================= */

const voiceChannel =
  $("voiceChannel");

if (voiceChannel) {
  voiceChannel.addEventListener(
    "click",
    () => openCall("voice")
  );
}


/* =========================================================
   MENÚ MÓVIL
   ========================================================= */

const mobileMenu =
  $("mobileMenu");

if (mobileMenu) {

  mobileMenu.addEventListener(
    "click",
    () => {

      const sidebar =
        document.querySelector(
          ".sidebar"
        );

      if (sidebar) {
        sidebar.classList.toggle(
          "open"
        );
      } else {
        showToast(
          "Menú móvil abierto."
        );
      }
    }
  );
}


/* =========================================================
   INICIO
   ========================================================= */

renderChannels();

if (messages[currentChannel] === undefined) {
  messages[currentChannel] = [];
}

renderMessages();

console.log(
  "CatracVoice cargado correctamente."
);
