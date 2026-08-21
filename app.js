"use strict";

/* =========================================================
   CATRACVOICE — APP.JS
   ========================================================= */


/* =========================================================
   DATOS INICIALES
   ========================================================= */

const defaultChannels = [
  "general",
  "gaming",
  "planes"
];


const defaultMessages = {

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
    }
  ]

};


/* =========================================================
   ESTADO
   ========================================================= */

let currentChannel = "general";

let currentUser = "Tú";

let channels = load(
  "catracvoice_channels",
  defaultChannels
);

let messages = load(
  "catracvoice_messages",
  defaultMessages
);

let screenStream = null;

let microphoneEnabled = true;

let cameraEnabled = true;


/* =========================================================
   HELPERS
   ========================================================= */

function $(id) {
  return document.getElementById(id);
}


function escapeHTML(value) {

  const element =
    document.createElement("div");

  element.textContent =
    String(value);

  return element.innerHTML;
}


function load(key, fallback) {

  try {

    const saved =
      localStorage.getItem(key);

    if (!saved) {

      return JSON.parse(
        JSON.stringify(fallback)
      );

    }

    return JSON.parse(saved);

  } catch (error) {

    console.warn(
      "Error cargando datos:",
      error
    );

    return JSON.parse(
      JSON.stringify(fallback)
    );
  }
}


function save() {

  try {

    localStorage.setItem(
      "catracvoice_channels",
      JSON.stringify(channels)
    );

    localStorage.setItem(
      "catracvoice_messages",
      JSON.stringify(messages)
    );

  } catch (error) {

    console.warn(
      "No se pudieron guardar los datos:",
      error
    );
  }
}


function getTime() {

  return new Date()
    .toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    );
}


function toast(text) {

  const element =
    $("toast");

  if (!element) return;

  element.textContent =
    text;

  element.classList.add("show");

  clearTimeout(
    window.toastTimeout
  );

  window.toastTimeout =
    setTimeout(
      () => {
        element.classList.remove("show");
      },
      2300
    );
}


/* =========================================================
   LOGIN
   ========================================================= */

$("authForm").addEventListener(
  "submit",
  event => {

    event.preventDefault();

    const email =
      $("email").value.trim();

    const password =
      $("password").value;


    if (!email) {

      toast(
        "Introduce tu correo."
      );

      return;
    }


    if (password.length < 8) {

      toast(
        "La contraseña debe tener al menos 8 caracteres."
      );

      return;
    }


    currentUser =
      email
        .split("@")[0]
        .replace(/[._-]/g, " ")
        .trim();


    if (!currentUser) {
      currentUser = "Tú";
    }


    $("userName").textContent =
      currentUser;

    $("memberCurrentUser").textContent =
      currentUser;


    $("userInitial").textContent =
      currentUser
        .charAt(0)
        .toUpperCase();


    $("authScreen")
      .classList.add("hidden");


    $("app")
      .classList.remove("hidden");


    renderChannels();

    selectChannel(
      currentChannel
    );
  }
);


/* =========================================================
   REGISTRO
   ========================================================= */

$("registerBtn").addEventListener(
  "click",
  () => {

    toast(
      "El registro real se conectará al servidor más adelante."
    );
  }
);


/* =========================================================
   LOGOUT
   ========================================================= */

$("logoutBtn").addEventListener(
  "click",
  () => {

    stopScreen();

    $("app")
      .classList.add("hidden");

    $("authScreen")
      .classList.remove("hidden");

    $("email").value = "";

    $("password").value = "";
  }
);


/* =========================================================
   CANALES
   ========================================================= */

function renderChannels() {

  const container =
    $("textChannels");

  if (!container) return;

  container.innerHTML = "";


  channels.forEach(
    channelName => {

      const button =
        document.createElement("button");

      button.type =
        "button";

      button.className =
        "channel";


      if (
        channelName ===
        currentChannel
      ) {

        button.classList.add(
          "active"
        );
      }


      button.dataset.channel =
        channelName;


      button.innerHTML = `
        <span class="channel-icon">
          #
        </span>

        <span>
          ${escapeHTML(channelName)}
        </span>
      `;


      button.addEventListener(
        "click",
        () => {

          selectChannel(
            channelName
          );

        }
      );


      container.appendChild(
        button
      );
    }
  );
}


function selectChannel(
  channelName
) {

  if (
    !channels.includes(
      channelName
    )
  ) {
    return;
  }


  currentChannel =
    channelName;


  if (
    !messages[currentChannel]
  ) {

    messages[currentChannel] =
      [];
  }


  document
    .querySelectorAll(
      "#textChannels .channel"
    )
    .forEach(
      button => {

        button.classList.toggle(
          "active",
          button.dataset.channel ===
          currentChannel
        );
      }
    );


  $("channelTitle")
    .textContent =
    currentChannel;


  $("messageInput")
    .placeholder =
    `Escribe un mensaje en #${currentChannel}...`;


  renderMessages();

  save();
}


/* =========================================================
   CREAR CANAL
   ========================================================= */

$("addChannel").addEventListener(
  "click",
  () => {

    let name =
      prompt(
        "Escribe el nombre del nuevo canal:"
      );


    if (name === null) {
      return;
    }


    name =
      name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(
          /[^a-z0-9áéíóúüñ_-]/gi,
          ""
        )
        .replace(
          /-+/g,
          "-"
        );


    if (!name) {

      toast(
        "Escribe un nombre válido."
      );

      return;
    }


    if (name.length > 30) {

      toast(
        "El canal no puede tener más de 30 caracteres."
      );

      return;
    }


    if (
      channels.includes(name)
    ) {

      toast(
        `#${name} ya existe.`
      );

      selectChannel(name);

      return;
    }


    channels.push(name);

    messages[name] = [];


    save();


    currentChannel =
      name;


    renderChannels();

    selectChannel(
      name
    );


    toast(
      `#${name} creado correctamente.`
    );
  }
);


/* =========================================================
   MENSAJES
   ========================================================= */

function renderMessages() {

  const container =
    $("messages");

  if (!container) return;


  const list =
    messages[currentChannel] ||
    [];


  container.innerHTML = `

    <div class="welcome">

      <div class="welcome-icon">
        #
      </div>

      <h2>
        ¡Bienvenido a #${escapeHTML(currentChannel)}!
      </h2>

      <p>
        Este es el comienzo de este canal.
      </p>

    </div>

    ${
      list.length === 0
        ? `
          <div class="empty-message">
            Todavía no hay mensajes.
          </div>
        `
        : ""
    }

    ${list.map(
      message => `

        <article class="message">

          <div class="avatar ${escapeHTML(
            message.color || ""
          )}">
            ${escapeHTML(
              message.initial
            )}
          </div>

          <div class="message-info">

            <div class="message-meta">

              <strong>
                ${escapeHTML(
                  message.name
                )}
              </strong>

              <time>
                ${escapeHTML(
                  message.time
                )}
              </time>

            </div>

            <p class="message-text">
              ${escapeHTML(
                message.text
              )}
            </p>

          </div>

        </article>
      `
    ).join("")}

  `;


  container.scrollTop =
    container.scrollHeight;
}


/* =========================================================
   ENVIAR MENSAJE
   ========================================================= */

$("messageForm").addEventListener(
  "submit",
  event => {

    event.preventDefault();

    const input =
      $("messageInput");

    const text =
      input.value.trim();


    if (!text) {
      return;
    }


    if (
      !messages[currentChannel]
    ) {

      messages[currentChannel] =
        [];
    }


    messages[currentChannel].push({

      name:
        currentUser,

      initial:
        currentUser
          .charAt(0)
          .toUpperCase() || "T",

      color:
        "",

      time:
        getTime(),

      text:
        text

    });


    input.value = "";

    save();

    renderMessages();
  }
);


/* =========================================================
   EMOJI
   ========================================================= */

$("emojiBtn").addEventListener(
  "click",
  () => {

    const input =
      $("messageInput");

    input.value += " 😊";

    input.focus();
  }
);


/* =========================================================
   ADJUNTOS
   ========================================================= */

$("attachBtn").addEventListener(
  "click",
  () => {

    toast(
      "La subida de archivos llegará con el almacenamiento."
    );
  }
);


/* =========================================================
   MENÚ
   ========================================================= */

$("groupMenu").addEventListener(
  "click",
  () => {

    toast(
      "Configuración de CatracVoice próximamente."
    );
  }
);


/* =========================================================
   SERVIDORES
   ========================================================= */

document
  .querySelectorAll(".server")
  .forEach(
    server => {

      server.addEventListener(
        "click",
        () => {

          if (
            server.id ===
            "addServer"
          ) {

            toast(
              "La creación de servidores llegará próximamente."
            );

            return;
          }


          document
            .querySelectorAll(".server")
            .forEach(
              item => {

                item.classList.remove(
                  "active"
                );
              }
            );


          server.classList.add(
            "active"
          );
        }
      );
    }
  );


/* =========================================================
   MIEMBROS
   ========================================================= */

$("membersBtn").addEventListener(
  "click",
  () => {

    const panel =
      $("membersPanel");

    if (
      window.innerWidth <=
      1100
    ) {

      toast(
        "La lista de miembros está oculta en esta pantalla."
      );

      return;
    }


    if (
      panel.style.display ===
      "none"
    ) {

      panel.style.display =
        "";

    } else {

      panel.style.display =
        "none";
    }
  }
);


/* =========================================================
   LLAMADAS
   ========================================================= */

function openCall(type) {

  $("callModal")
    .classList.remove(
      "hidden"
    );


  if (
    type === "voice"
  ) {

    $("callTitle")
      .textContent =
      "Llamada de voz";

    $("callStatus")
      .textContent =
      "Modo de prueba local.";

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
      "Modo de prueba local.";

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


$("voiceChannel").addEventListener(
  "click",
  () => openCall("voice")
);


/* =========================================================
   CERRAR LLAMADA
   ========================================================= */

function closeCall() {

  stopScreen();

  $("callModal")
    .classList.add(
      "hidden"
    );
}


$("closeCall").addEventListener(
  "click",
  closeCall
);


$("hangupBtn").addEventListener(
  "click",
  closeCall
);


/* =========================================================
   MICRÓFONO
   ========================================================= */

$("muteBtn").addEventListener(
  "click",
  () => {

    microphoneEnabled =
      !microphoneEnabled;


    $("muteBtn").textContent =
      microphoneEnabled
        ? "🎤"
        : "🔇";


    toast(
      microphoneEnabled
        ? "Micrófono activado."
        : "Micrófono silenciado."
    );
  }
);


/* =========================================================
   CÁMARA
   ========================================================= */

$("cameraBtn").addEventListener(
  "click",
  () => {

    cameraEnabled =
      !cameraEnabled;


    $("cameraBtn").textContent =
      cameraEnabled
        ? "📹"
        : "🚫";


    toast(
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
    !navigator.mediaDevices.getDisplayMedia
  ) {

    toast(
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


    video.play().catch(
      () => {}
    );


    const track =
      screenStream
        .getVideoTracks()[0];


    if (track) {

      track.addEventListener(
        "ended",
        () => {

          stopScreen();

          toast(
            "Has dejado de compartir la pantalla."
          );
        }
      );
    }


    toast(
      "Pantalla compartida."
    );


  } catch (error) {

    console.log(
      error
    );

    toast(
      "Has cancelado compartir pantalla."
    );
  }
}


function stopScreen() {

  if (screenStream) {

    screenStream
      .getTracks()
      .forEach(
        track => track.stop()
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


  const placeholder =
    $("videoPlaceholder");

  if (placeholder) {

    placeholder.classList.remove(
      "hidden"
    );
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


/* =========================================================
   MÓVIL
   ========================================================= */

$("mobileMenu").addEventListener(
  "click",
  () => {

    const sidebar =
      document.querySelector(
        ".sidebar"
      );


    if (!sidebar) {
      return;
    }


    if (
      sidebar.style.display ===
      "flex"
    ) {

      sidebar.style.display =
        "";

    } else {

      sidebar.style.display =
        "flex";

      sidebar.style.position =
        "fixed";

      sidebar.style.left =
        "72px";

      sidebar.style.top =
        "0";

      sidebar.style.bottom =
        "0";

      sidebar.style.width =
        "240px";

      sidebar.style.zIndex =
        "200";
    }
  }
);


/* =========================================================
   AÑADIR SERVIDOR
   ========================================================= */

$("addServer").addEventListener(
  "click",
  () => {

    toast(
      "La creación de servidores se añadirá con el backend."
    );
  }
);


/* =========================================================
   INICIO
   ========================================================= */

if (
  !messages[currentChannel]
) {

  messages[currentChannel] =
    [];
}


renderChannels();

renderMessages();


console.log(
  "CatracVoice iniciado correctamente."
);
