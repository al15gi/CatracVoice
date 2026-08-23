
/* =========================================================
   CATRACVOICE
   FIREBASE
   USUARIOS
   AMIGOS
   ACTIVIDAD
   SERVIDORES
   CANALES
   MENSAJES
   STORAGE
   ========================================================= */


/* =========================
   FIREBASE
   ========================= */

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


/* =========================
   ESTADO
   ========================= */

let currentUser = null;

let currentUserData = null;

let currentServer = null;

let currentChannel = null;

let currentHomeView = "friends";

let unsubscribeServers = null;

let unsubscribeChannels = null;

let unsubscribeMessages = null;

let unsubscribeMembers = null;

let presenceInterval = null;

let screenStream = null;

let micEnabled = true;

let cameraEnabled = true;


/* =========================
   HELPERS
   ========================= */

const $ = id =>
  document.getElementById(id);


function escapeHTML(text) {

  const element =
    document.createElement("div");

  element.textContent =
    text ?? "";

  return element.innerHTML;

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
    setTimeout(
      () =>
        toast.classList.remove("show"),
      2500
    );

}


function formatTime(timestamp) {

  if (!timestamp)
    return "";

  const date =
    timestamp.toDate
      ? timestamp.toDate()
      : new Date(timestamp);

  return date.toLocaleTimeString(
    [],
    {
      hour: "2-digit",
      minute: "2-digit"
    }
  );

}


function avatarInitial(user) {

  const name =
    user?.username ||
    user?.email ||
    "U";

  return name
    .charAt(0)
    .toUpperCase();

}


function statusText(status) {

  switch (status) {

    case "idle":
      return "Ausente";

    case "dnd":
      return "No molestar";

    case "offline":
      return "Invisible";

    default:
      return "En línea";

  }

}


function statusClass(status) {

  return status || "online";

}


/* =========================
   LOGIN
   ========================= */

auth.onAuthStateChanged(
  async user => {

    if (!user) {

      currentUser = null;

      showLogin();

      return;

    }

    currentUser =
      user;

    await loadCurrentUser();

    showApp();

    startPresence();

    loadServers();

    showHome();

  }
);


function showLogin() {

  $("authScreen")
    ?.classList.remove("hidden");

  $("app")
    ?.classList.add("hidden");

}


function showApp() {

  $("authScreen")
    ?.classList.add("hidden");

  $("app")
    ?.classList.remove("hidden");

}


/* =========================
   LOGIN
   ========================= */

$("authForm")
  ?.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      const email =
        $("email").value.trim();

      const password =
        $("password").value;

      try {

        await auth
          .signInWithEmailAndPassword(
            email,
            password
          );

        showToast(
          "Bienvenido a CatracVoice."
        );

      } catch (error) {

        console.error(error);

        showToast(
          "Correo o contraseña incorrectos."
        );

      }

    }
  );


/* =========================
   REGISTRO
   ========================= */

$("registerBtn")
  ?.addEventListener(
    "click",
    async () => {

      const email =
        $("email").value.trim();

      const password =
        $("password").value;

      if (!email || !password) {

        showToast(
          "Introduce correo y contraseña."
        );

        return;

      }

      try {

        const result =
          await auth
            .createUserWithEmailAndPassword(
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

            uid:
              result.user.uid,

            email,

            username:
              username || "Usuario",

            status:
              "online",

            activity:
              "",

            friends:
              [],

            friendRequests:
              [],

            createdAt:
              firebase.firestore
                .FieldValue
                .serverTimestamp()

          });


        showToast(
          "Cuenta creada."
        );

      } catch (error) {

        console.error(error);

        showToast(
          "No se pudo crear la cuenta."
        );

      }

    }
  );


/* =========================
   USUARIO
   ========================= */

async function loadCurrentUser() {

  const ref =
    db
      .collection("users")
      .doc(currentUser.uid);


  const snap =
    await ref.get();


  if (!snap.exists) {

    currentUserData = {

      uid:
        currentUser.uid,

      email:
        currentUser.email,

      username:
        currentUser.email
          .split("@")[0],

      status:
        "online",

      activity:
        "",

      friends:
        [],

      friendRequests:
        []

    };


    await ref.set(
      currentUserData
    );

  } else {

    currentUserData =
      snap.data();

  }


  updateUserUI();

}


function updateUserUI() {

  if (!currentUserData)
    return;


  const username =
    currentUserData.username ||
    "Usuario";


  $("userName").textContent =
    username;


  $("profileName").textContent =
    username;


  $("profileEmail").textContent =
    currentUserData.email ||
    currentUser.email;


  $("profileUsername").value =
    username;


  $("profileStatus").value =
    currentUserData.status ||
    "online";


  $("profileActivity").value =
    currentUserData.activity ||
    "";


  $("userInitial").textContent =
    avatarInitial(
      currentUserData
    );


  $("profileInitial").textContent =
    avatarInitial(
      currentUserData
    );


  $("userActivity").textContent =
    currentUserData.activity ||
    statusText(
      currentUserData.status
    );


  $("userStatusDot")
    .className =
      `status-indicator ${
        statusClass(
          currentUserData.status
        )
      }`;


  if (
    currentUserData.photoURL
  ) {

    $("userAvatar").src =
      currentUserData.photoURL;

    $("userAvatar")
      .classList.remove("hidden");

    $("userInitial")
      .classList.add("hidden");


    $("profileAvatarPreview").src =
      currentUserData.photoURL;

    $("profileAvatarPreview")
      .classList.remove("hidden");

    $("profileInitial")
      .classList.add("hidden");

  }

}


/* =========================
   PRESENCIA
   ========================= */

function startPresence() {

  updatePresence();

  clearInterval(
    presenceInterval
  );

  presenceInterval =
    setInterval(
      updatePresence,
      30000
    );

}


async function updatePresence() {

  if (!currentUser)
    return;

  try {

    await db
      .collection("users")
      .doc(currentUser.uid)
      .set({

        lastSeen:
          firebase.firestore
            .FieldValue
            .serverTimestamp(),

        status:
          currentUserData?.status ===
          "offline"
            ? "offline"
            : "online"

      }, {
        merge: true
      });

  } catch (error) {

    console.error(
      "Presence:",
      error
    );

  }

}


window.addEventListener(
  "beforeunload",
  () => {

    if (!currentUser)
      return;

    db
      .collection("users")
      .doc(currentUser.uid)
      .set({

        status:
          "offline",

        lastSeen:
          firebase.firestore
            .FieldValue
            .serverTimestamp()

      }, {
        merge: true
      });

  }
);


/* =========================
   SERVIDORES
   ========================= */

function loadServers() {

  if (unsubscribeServers)
    unsubscribeServers();


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

          const list =
            $("serverList");

          list.innerHTML = "";


          snapshot.forEach(
            doc => {

              const server =
                {
                  id: doc.id,
                  ...doc.data()
                };


              const button =
                document
                  .createElement(
                    "button"
                  );


              button.className =
                "server";


              button.dataset.serverId =
                server.id;


              button.title =
                server.name;


              button.textContent =
                getServerInitial(
                  server.name
                );


              button.onclick =
                () =>
                  selectServer(
                    server
                  );


              list.appendChild(
                button
              );

            }
          );

        },
        error => {

          console.error(error);

          showToast(
            "No se pudieron cargar los servidores."
          );

        }
      );

}


function getServerInitial(name) {

  if (!name)
    return "CV";


  const words =
    name
      .trim()
      .split(/\s+/);


  if (words.length >= 2) {

    return (
      words[0][0] +
      words[1][0]
    ).toUpperCase();

  }


  return name
    .substring(0, 2)
    .toUpperCase();

}


/* =========================
   CREAR SERVIDOR
   ========================= */

$("addServer")
  ?.addEventListener(
    "click",
    async () => {

      const name =
        prompt(
          "Nombre del servidor:"
        );


      if (!name)
        return;


      try {

        const ref =
          await db
            .collection("servers")
            .add({

              name:
                name.trim(),

              ownerId:
                currentUser.uid,

              memberIds:
                [currentUser.uid],

              createdAt:
                firebase.firestore
                  .FieldValue
                  .serverTimestamp()

            });


        await db
          .collection("channels")
          .add({

            serverId:
              ref.id,

            name:
              "general",

            type:
              "text",

            createdAt:
              firebase.firestore
                .FieldValue
                .serverTimestamp()

          });


        showToast(
          "Servidor creado."
        );

      } catch (error) {

        console.error(error);

        showToast(
          "No se pudo crear el servidor."
        );

      }

    }
  );


/* =========================
   SELECCIONAR SERVIDOR
   ========================= */

async function selectServer(server) {

  currentServer =
    server;


  document
    .querySelectorAll(
      ".server"
    )
    .forEach(
      button => {

        button.classList.toggle(
          "active",
          button.dataset.serverId ===
          server.id
        );

      }
    );


  $("homeServer")
    .classList.remove(
      "active"
    );


  $("homeNavigation")
    .classList.add(
      "hidden"
    );


  $("serverNavigation")
    .classList.remove(
      "hidden"
    );


  $("workspaceName")
    .textContent =
    server.name;


  $("workspaceSubtitle")
    .textContent =
    "Servidor";


  $("homeView")
    .classList.add(
      "hidden"
    );


  $("chatView")
    .classList.remove(
      "hidden"
    );


  $("channelHash")
    .textContent =
    "#";


  loadChannels(
    server.id
  );


  loadMembers(
    server
  );

}


/* =========================
   CANALES
   ========================= */

function loadChannels(serverId) {

  if (unsubscribeChannels)
    unsubscribeChannels();


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

          const container =
            $("textChannels");


          container.innerHTML =
            "";


          const channels =
            [];


          snapshot.forEach(
            doc => {

              channels.push({

                id:
                  doc.id,

                ...doc.data()

              });

            }
          );


          channels.forEach(
            channel => {

              const button =
                document
                  .createElement(
                    "button"
                  );


              button.className =
                "channel";


              button.dataset.channelId =
                channel.id;


              button.innerHTML = `
                <span class="channel-icon">#</span>
                <span>
                  ${escapeHTML(
                    channel.name
                  )}
                </span>
              `;


              button.onclick =
                () =>
                  selectChannel(
                    channel
                  );


              container.appendChild(
                button
              );

            }
          );


          if (channels.length) {

            const general =
              channels.find(
                c =>
                  c.name ===
                  "general"
              );


            selectChannel(
              general ||
              channels[0]
            );

          }

        }
      );

}


/* =========================
   CREAR CANAL
   ========================= */

$("addChannel")
  ?.addEventListener(
    "click",
    async () => {

      if (!currentServer) {

        showToast(
          "Selecciona un servidor."
        );

        return;

      }


      const name =
        prompt(
          "Nombre del canal:"
        );


      if (!name)
        return;


      const channelName =
        name
          .trim()
          .toLowerCase()
          .replace(
            /\s+/g,
            "-"
          );


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
            firebase.firestore
              .FieldValue
              .serverTimestamp()

        });


      showToast(
        `#${channelName} creado.`
      );

    }
  );


/* =========================
   CANAL
   ========================= */

function selectChannel(channel) {

  currentChannel =
    channel;


  document
    .querySelectorAll(
      "#textChannels .channel"
    )
    .forEach(
      button => {

        button.classList.toggle(
          "active",
          button.dataset.channelId ===
          channel.id
        );

      }
    );


  $("channelTitle")
    .textContent =
    channel.name;


  $("channelDescription")
    .textContent =
    "Habla con tus amigos";


  loadMessages(
    channel.id
  );

}


/* =========================
   MENSAJES
   ========================= */

function loadMessages(channelId) {

  if (unsubscribeMessages)
    unsubscribeMessages();


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

          const messages =
            [];


          snapshot.forEach(
            doc => {

              messages.push({

                id:
                  doc.id,

                ...doc.data()

              });

            }
          );


          messages.sort(
            (a, b) => {

              const aTime =
                a.createdAt?.toMillis
                  ? a.createdAt.toMillis()
                  : 0;


              const bTime =
                b.createdAt?.toMillis
                  ? b.createdAt.toMillis()
                  : 0;


              return aTime - bTime;

            }
          );


          renderMessages(
            messages
          );

        }
      );

}


function renderMessages(messages) {

  const container =
    $("messages");


  container.innerHTML =
    "";


  messages.forEach(
    message => {

      const article =
        document
          .createElement(
            "article"
          );


      article.className =
        "message";


      article.innerHTML = `

        <div class="avatar">

          ${
            message.photoURL
              ? `
                <img
                  class="avatar-image"
                  src="${escapeHTML(
                    message.photoURL
                  )}"
                  alt=""
                >
              `
              : escapeHTML(
                  message.username
                    ?.charAt(0)
                    .toUpperCase() ||
                  "U"
                )
          }

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
              message.text
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


/* =========================
   ENVIAR MENSAJE
   ========================= */

$("messageForm")
  ?.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      if (
        !currentServer ||
        !currentChannel
      ) {

        showToast(
          "Selecciona un canal."
        );

        return;

      }


      const input =
        $("messageInput");


      const text =
        input.value.trim();


      if (!text)
        return;


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
            currentUserData.username,

          photoURL:
            currentUserData.photoURL ||
            "",

          text,

          createdAt:
            firebase.firestore
              .FieldValue
              .serverTimestamp()

        });


      input.value =
        "";

    }
  );


/* =========================
   MIEMBROS
   ========================= */

function loadMembers(server) {

  if (unsubscribeMembers)
    unsubscribeMembers();


  const memberIds =
    server.memberIds ||
    [];


  if (!memberIds.length) {

    $("membersList").innerHTML =
      `
        <div class="empty-state">
          No hay miembros.
        </div>
      `;

    return;

  }


  /*
     Firestore permite máximo
     10 elementos en un where-in,
     por eso hacemos consultas
     individuales.
  */


  unsubscribeMembers =
    subscribeMembers(
      memberIds
    );

}


function subscribeMembers(ids) {

  let active = true;

  const unsubs = [];

  const users = new Map();


  const render = () => {

    if (!active)
      return;


    const list =
      $("membersList");


    list.innerHTML =
      "";


    [...users.values()]
      .sort(
        (a, b) => {

          if (
            a.status ===
            "online" &&
            b.status !==
            "online"
          )
            return -1;

          return 0;

        }
      )
      .forEach(
        user => {

          const member =
            document
              .createElement(
                "div"
              );


          member.className =
            "member";


          const status =
            user.status ||
            "offline";


          member.innerHTML = `

            <div class="avatar">

              ${
                user.photoURL
                  ? `
                    <img
                      class="avatar-image"
                      src="${escapeHTML(
                        user.photoURL
                      )}"
                      alt=""
                    >
                  `
                  : escapeHTML(
                      avatarInitial(
                        user
                      )
                    )
              }

              <span
                class="status-indicator ${escapeHTML(
                  status
                )}"
              ></span>

            </div>

            <div class="member-info">

              <strong>
                ${escapeHTML(
                  user.username ||
                  "Usuario"
                )}
              </strong>

              <span>
                ${
                  escapeHTML(
                    user.activity ||
                    statusText(
                      status
                    )
                  )
                }
              </span>

            </div>

          `;


          list.appendChild(
            member
          );

        }
      );

  };


  ids.forEach(
    id => {

      const unsubscribe =
        db
          .collection("users")
          .doc(id)
          .onSnapshot(
            snap => {

              if (
                snap.exists
              ) {

                users.set(
                  id,
                  {
                    uid: id,
                    ...snap.data()
                  }
                );

              }

              render();

            }
          );


      unsubs.push(
        unsubscribe
      );

    }
  );


  return () => {

    active = false;

    unsubs.forEach(
      unsubscribe =>
        unsubscribe()
    );

  };

}


/* =========================
   HOME
   ========================= */

$("homeServer")
  ?.addEventListener(
    "click",
    () => {

      showHome();

    }
  );


function showHome() {

  currentServer =
    null;

  $("homeServer")
    .classList.add(
      "active"
    );


  document
    .querySelectorAll(
      ".server[data-server-id]"
    )
    .forEach(
      button =>
        button.classList.remove(
          "active"
        )
    );


  $("homeNavigation")
    .classList.remove(
      "hidden"
    );


  $("serverNavigation")
    .classList.add(
      "hidden"
    );


  $("workspaceName")
    .textContent =
    "Amigos";


  $("workspaceSubtitle")
    .textContent =
    "CatracVoice";


  $("chatView")
    .classList.add(
      "hidden"
    );


  $("homeView")
    .classList.remove(
      "hidden"
    );


  $("channelHash")
    .textContent =
    "";


  $("channelTitle")
    .textContent =
    "Amigos";


  $("channelDescription")
    .textContent =
    "Conecta con tus amigos";


  loadHomeView(
    currentHomeView
  );

}


/* =========================
   HOME NAVIGATION
   ========================= */

document
  .querySelectorAll(
    "[data-home-view]"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          currentHomeView =
            button.dataset.homeView;


          document
            .querySelectorAll(
              "[data-home-view]"
            )
            .forEach(
              item =>
                item.classList.toggle(
                  "active",
                  item === button
                )
            );


          loadHomeView(
            currentHomeView
          );

        }
      );

    }
  );


async function loadHomeView(view) {

  const content =
    $("homeContent");


  if (view === "friends") {

    $("homeTitle")
      .textContent =
      "Amigos";


    await renderFriends(
      content
    );

  }


  if (view === "online") {

    $("homeTitle")
      .textContent =
      "En línea";


    await renderOnline(
      content
    );

  }


  if (view === "requests") {

    $("homeTitle")
      .textContent =
      "Solicitudes";


    await renderRequests(
      content
    );

  }


  if (view === "activity") {

    $("homeTitle")
      .textContent =
      "Actividad";


    await renderActivity(
      content
    );

  }

}


/* =========================
   OBTENER USUARIOS
   ========================= */

async function getUsersByIds(ids) {

  const users = [];


  for (
    const id of ids || []
  ) {

    try {

      const snap =
        await db
          .collection("users")
          .doc(id)
          .get();


      if (snap.exists) {

        users.push({

          uid: id,

          ...snap.data()

        });

      }

    } catch (error) {

      console.error(error);

    }

  }


  return users;

}


/* =========================
   AMIGOS
   ========================= */

async function renderFriends(container) {

  container.innerHTML =
    "";


  const friendIds =
    currentUserData
      ?.friends || [];


  if (!friendIds.length) {

    container.innerHTML = `

      <div class="empty-state">

        Todavía no tienes amigos.

        <br><br>

        Pulsa
        <strong>
          Añadir amigo
        </strong>
        para buscar usuarios.

      </div>

    `;

    return;

  }


  const friends =
    await getUsersByIds(
      friendIds
    );


  const title =
    document
      .createElement(
        "div"
      );


  title.className =
    "friend-section-title";


  title.textContent =
    `TODOS — ${friends.length}`;


  container.appendChild(
    title
  );


  friends.forEach(
    friend => {

      container.appendChild(
        createUserCard(
          friend
        )
      );

    }
  );

}


/* =========================
   ONLINE
   ========================= */

async function renderOnline(container) {

  container.innerHTML =
    `
      <div class="empty-state">
        Cargando usuarios...
      </div>
    `;


  const snap =
    await db
      .collection("users")
      .where(
        "status",
        "==",
        "online"
      )
      .get();


  container.innerHTML =
    "";


  let count = 0;


  snap.forEach(
    doc => {

      if (
        doc.id ===
        currentUser.uid
      )
        return;


      count++;


      container.appendChild(
        createUserCard({
          uid: doc.id,
          ...doc.data()
        })
      );

    }
  );


  if (!count) {

    container.innerHTML =
      `
        <div class="empty-state">
          No hay otros usuarios en línea.
        </div>
      `;

  }

}


/* =========================
   SOLICITUDES
   ========================= */

async function renderRequests(container) {

  container.innerHTML =
    "";


  const requestIds =
    currentUserData
      ?.friendRequests || [];


  if (!requestIds.length) {

    container.innerHTML =
      `
        <div class="empty-state">
          No tienes solicitudes de amistad.
        </div>
      `;

    return;

  }


  const users =
    await getUsersByIds(
      requestIds
    );


  users.forEach(
    user => {

      const card =
        createUserCard(
          user,
          true
        );


      container.appendChild(
        card
      );

    }
  );

}


/* =========================
   ACTIVIDAD
   ========================= */

async function renderActivity(container) {

  container.innerHTML =
    "";


  const snap =
    await db
      .collection("users")
      .get();


  let found = false;


  snap.forEach(
    doc => {

      const user =
        {
          uid: doc.id,
          ...doc.data()
        };


      if (
        !user.activity
      )
        return;


      found = true;


      container.appendChild(
        createUserCard(
          user
        )
      );

    }
  );


  if (!found) {

    container.innerHTML =
      `
        <div class="empty-state">

          Nadie está jugando ahora mismo.

          <br><br>

          Puedes añadir tu actividad
          desde tu perfil.

        </div>
      `;

  }

}


/* =========================
   TARJETA USUARIO
   ========================= */

function createUserCard(
  user,
  request = false
) {

  const card =
    document
      .createElement(
        "div"
      );


  card.className =
    "friend-card";


  const status =
    user.status ||
    "offline";


  card.innerHTML = `

    <div class="avatar">

      ${
        user.photoURL
          ? `
            <img
              class="avatar-image"
              src="${escapeHTML(
                user.photoURL
              )}"
              alt=""
            >
          `
          : escapeHTML(
              avatarInitial(
                user
              )
            )
      }

      <span
        class="status-indicator ${escapeHTML(
          status
        )}"
      ></span>

    </div>

    <div class="friend-info">

      <strong>
        ${escapeHTML(
          user.username ||
          "Usuario"
        )}
      </strong>

      <span>
        ${
          escapeHTML(
            user.activity ||
            statusText(
              status
            )
          )
        }
      </span>

    </div>

    <div class="friend-actions">

      ${
        request
          ? `
            <button
              data-accept="${escapeHTML(
                user.uid
              )}"
              title="Aceptar"
            >
              ✓
            </button>

            <button
              data-reject="${escapeHTML(
                user.uid
              )}"
              title="Rechazar"
            >
              ×
            </button>
          `
          : `
            <button
              data-message="${escapeHTML(
                user.uid
              )}"
              title="Mensaje"
            >
              💬
            </button>
          `
      }

    </div>

  `;


  const accept =
    card.querySelector(
      "[data-accept]"
    );


  const reject =
    card.querySelector(
      "[data-reject]"
    );


  const message =
    card.querySelector(
      "[data-message]"
    );


  accept?.addEventListener(
    "click",
    () =>
      acceptFriend(
        user.uid
      )
  );


  reject?.addEventListener(
    "click",
    () =>
      rejectFriend(
        user.uid
      )
  );


  message?.addEventListener(
    "click",
    () =>
      showToast(
        "Los mensajes privados se conectarán en el siguiente paso."
      )
  );


  return card;

}


/* =========================
   AÑADIR AMIGO
   ========================= */

$("addFriendBtn")
  ?.addEventListener(
    "click",
    async () => {

      const username =
        prompt(
          "Escribe el nombre de usuario:"
        );


      if (!username)
        return;


      const snap =
        await db
          .collection("users")
          .where(
            "username",
            "==",
            username.trim()
          )
          .limit(1)
          .get();


      if (snap.empty) {

        showToast(
          "No se encontró ese usuario."
        );

        return;

      }


      const doc =
        snap.docs[0];


      if (
        doc.id ===
        currentUser.uid
      ) {

        showToast(
          "No puedes agregarte a ti mismo."
        );

        return;

      }


      const target =
        doc.data();


      const friends =
        target.friends || [];


      if (
        friends.includes(
          currentUser.uid
        )
      ) {

        showToast(
          "Ya sois amigos."
        );

        return;

      }


      const requests =
        target.friendRequests ||
        [];


      if (
        requests.includes(
          currentUser.uid
        )
      ) {

        showToast(
          "La solicitud ya está enviada."
        );

        return;

      }


      await db
        .collection("users")
        .doc(doc.id)
        .update({

          friendRequests:
            firebase.firestore
              .FieldValue
              .arrayUnion(
                currentUser.uid
              )

        });


      showToast(
        "Solicitud enviada."
      );

    }
  );


/* =========================
   ACEPTAR AMIGO
   ========================= */

async function acceptFriend(uid) {

  await db
    .collection("users")
    .doc(currentUser.uid)
    .update({

      friends:
        firebase.firestore
          .FieldValue
          .arrayUnion(
            uid
          ),

      friendRequests:
        firebase.firestore
          .FieldValue
          .arrayRemove(
            uid
          )

    });


  await db
    .collection("users")
    .doc(uid)
    .update({

      friends:
        firebase.firestore
          .FieldValue
          .arrayUnion(
            currentUser.uid
          )

    });


  currentUserData.friends =
    [
      ...(currentUserData.friends || []),
      uid
    ];


  showToast(
    "Ahora sois amigos."
  );


  loadHomeView(
    "requests"
  );

}


/* =========================
   RECHAZAR
   ========================= */

async function rejectFriend(uid) {

  await db
    .collection("users")
    .doc(currentUser.uid)
    .update({

      friendRequests:
        firebase.firestore
          .FieldValue
          .arrayRemove(
            uid
          )

    });


  currentUserData.friendRequests =
    (
      currentUserData.friendRequests ||
      []
    ).filter(
      id =>
        id !== uid
    );


  showToast(
    "Solicitud rechazada."
  );


  loadHomeView(
    "requests"
  );

}


/* =========================
   PERFIL
   ========================= */

$("profileButton")
  ?.addEventListener(
    "click",
    () => {

      updateUserUI();

      $("profileModal")
        .classList.remove(
          "hidden"
        );

    }
  );


$("closeProfile")
  ?.addEventListener(
    "click",
    () => {

      $("profileModal")
        .classList.add(
          "hidden"
        );

    }
  );


/* =========================
   GUARDAR PERFIL
   ========================= */

$("saveProfile")
  ?.addEventListener(
    "click",
    async () => {

      const username =
        $("profileUsername")
          .value
          .trim();


      const status =
        $("profileStatus")
          .value;


      const activity =
        $("profileActivity")
          .value
          .trim();


      if (!username) {

        showToast(
          "Escribe un nombre."
        );

        return;

      }


      try {

        let photoURL =
          currentUserData
            .photoURL ||
          "";


        const file =
          $("avatarFile")
            .files[0];


        if (file) {

          const path =
            `avatars/${currentUser.uid}/${Date.now()}-${file.name}`;


          const ref =
            storage
              .ref()
              .child(
                path
              );


          await ref.put(
            file
          );


          photoURL =
            await ref.getDownloadURL();

        }


        await db
          .collection("users")
          .doc(currentUser.uid)
          .update({

            username,

            status,

            activity,

            photoURL

          });


        currentUserData =
          {
            ...currentUserData,

            username,

            status,

            activity,

            photoURL

          };


        updateUserUI();


        $("profileModal")
          .classList.add(
            "hidden"
          );


        showToast(
          "Perfil actualizado."
        );


      } catch (error) {

        console.error(error);

        showToast(
          "No se pudo actualizar el perfil."
        );

      }

    }
  );


/* =========================
   EMOJI
   ========================= */

$("emojiBtn")
  ?.addEventListener(
    "click",
    () => {

      $("messageInput")
        .value +=
        " 😊";

      $("messageInput")
        .focus();

    }
  );


/* =========================
   ARCHIVOS
   ========================= */

$("attachBtn")
  ?.addEventListener(
    "click",
    () => {

      const input =
        document
          .createElement(
            "input"
          );


      input.type =
        "file";


      input.onchange =
        async () => {

          const file =
            input.files[0];


          if (!file)
            return;


          if (
            !currentChannel
          ) {

            showToast(
              "Selecciona un canal."
            );

            return;

          }


          try {

            showToast(
              "Subiendo archivo..."
            );


            const path =
              `files/${currentUser.uid}/${Date.now()}-${file.name}`;


            const ref =
              storage
                .ref()
                .child(
                  path
                );


            await ref.put(
              file
            );


            const url =
              await ref.getDownloadURL();


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
                  currentUserData.username,

                text:
                  `📎 ${file.name}\n${url}`,

                createdAt:
                  firebase.firestore
                    .FieldValue
                    .serverTimestamp()

              });


            showToast(
              "Archivo enviado."
            );


          } catch (error) {

            console.error(error);

            showToast(
              "No se pudo subir el archivo."
            );

          }

        };


      input.click();

    }
  );


/* =========================
   MIEMBROS
   ========================= */

$("membersBtn")
  ?.addEventListener(
    "click",
    () => {

      const panel =
        $("membersPanel");


      if (
        window.innerWidth <=
        1000
      ) {

        showToast(
          "La lista de miembros está disponible en escritorio."
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


/* =========================
   MENÚ
   ========================= */

$("groupMenu")
  ?.addEventListener(
    "click",
    () => {

      if (!currentServer) {

        showToast(
          "Estás en Inicio."
        );

        return;

      }


      showToast(
        `Servidor: ${currentServer.name}`
      );

    }
  );


/* =========================
   LLAMADAS
   ========================= */

function openCall(type) {

  $("callModal")
    .classList.remove(
      "hidden"
    );


  if (type === "voice") {

    $("callTitle")
      .textContent =
      "Llamada de voz";


    $("callStatus")
      .textContent =
      "La conexión de voz se añadirá con WebRTC.";


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
      "La conexión de vídeo se añadirá con WebRTC.";


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
    closeCall
  );


$("hangupBtn")
  ?.addEventListener(
    "click",
    closeCall
  );


function closeCall() {

  $("callModal")
    .classList.add(
      "hidden"
    );

  stopScreen();

}


/* =========================
   MIC
   ========================= */

$("muteBtn")
  ?.addEventListener(
    "click",
    event => {

      micEnabled =
        !micEnabled;


      event.currentTarget
        .textContent =
        micEnabled
          ? "🎤"
          : "🔇";

    }
  );


/* =========================
   CAMERA
   ========================= */

$("cameraBtn")
  ?.addEventListener(
    "click",
    event => {

      cameraEnabled =
        !cameraEnabled;


      event.currentTarget
        .textContent =
        cameraEnabled
          ? "📹"
          : "🚫";

    }
  );


/* =========================
   SCREEN SHARE
   ========================= */

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

          video: true,

          audio: true

        });


    $("callModal")
      .classList.remove(
        "hidden"
      );


    $("videoArea")
      .classList.remove(
        "hidden"
      );


    $("videoPlaceholder")
      .classList.add(
        "hidden"
      );


    $("screenVideo")
      .srcObject =
      screenStream;


    $("screenVideo")
      .style.display =
      "block";


    $("callTitle")
      .textContent =
      "Compartiendo pantalla";


    $("callStatus")
      .textContent =
      "Tu pantalla está compartida en este dispositivo.";


    const track =
      screenStream
        .getVideoTracks()[0];


    track?.addEventListener(
      "ended",
      () => {

        stopScreen();

        showToast(
          "Has dejado de compartir."
        );

      }
    );


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
      .forEach(
        track =>
          track.stop()
      );

    screenStream =
      null;

  }


  if ($("screenVideo")) {

    $("screenVideo")
      .srcObject =
      null;

    $("screenVideo")
      .style.display =
      "none";

  }


  $("videoPlaceholder")
    ?.classList.remove(
      "hidden"
    );

}


/* =========================
   INICIO
   ========================= */

console.log(
  "CatracVoice iniciado correctamente."
);
