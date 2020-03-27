const chatForm = document.getElementById("chat-form");
const chatMessagesDiv = document.querySelector(".chat-messages");
const roomNameEls = document.querySelectorAll(".room-name");
const roomUsersEl = document.querySelector("#users");
const userCountEls = document.querySelectorAll(".user-count");
const chatSidebar = document.querySelector(".chat-sidebar");

document.getElementById("side-bar-opener").addEventListener("click", () => {
  if (!chatSidebar.classList.contains("show")) {
    chatSidebar.classList.add("show");
  } else {
    chatSidebar.classList.remove("show");
  }
});

// Get username and room from URL
const userDetails = Qs.parse(location.search, {
  ignoreQueryPrefix: true
});

const socket = io();

// Join chatroom
socket.emit("joinRoom", userDetails);

// Get room and users
socket.on("roomUsers", ({ room, users }) => {
  outputRoomName(room);
  outputRoomUsers(users);
});

socket.on("message", message => {
  outputMessage(message);

  // Scroll to bottom
  chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
});

let timer;

socket.on("typing", username => {
  if (document.getElementById("typing")) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      chatMessagesDiv.removeChild(document.getElementById("typing"));
    }, 500);
    return;
  }

  const typingEl = document.createElement("div");
  typingEl.classList.add("message");
  typingEl.innerHTML = `${username} is typing...`;
  typingEl.id = "typing";
  typingEl.style.opacity = 0.8;

  chatMessagesDiv.appendChild(typingEl);
  chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;

  timer = setTimeout(() => {
    typingEl.remove();
  }, 500);
});

// Message submit
chatForm.addEventListener("submit", e => {
  e.preventDefault();

  const msgInput = e.target.elements.msg;

  // Emit message to server
  socket.emit("chatMessage", msgInput.value);

  // Clear and focus input
  msgInput.value = "";
  msgInput.focus();
});

document.getElementById("msg").addEventListener("input", () => {
  socket.emit("typing");
});

function outputMessage({ username, text, time }) {
  const newMessageDiv = document.createElement("div");
  newMessageDiv.classList.add("message");
  if (username === "ChatCord Bot") {
    newMessageDiv.classList.add("bot-msg");
    username = "";
  } else if (username === userDetails.username) {
    newMessageDiv.classList.add("my-msg");
    username = "";
  } else {
    newMessageDiv.innerHTML = `<p class="meta">${username} </p>`;
  }
  newMessageDiv.innerHTML += `<p class="text">${text}<span>${time}</span></p>
  <div style="clear: both;"></div>
  `;

  chatMessagesDiv.appendChild(newMessageDiv);
}

function outputRoomName(room) {
  roomNameEls.forEach(el => {
    el.textContent = room;
  });

  document.title = room + " Room";
}

function outputRoomUsers(users) {
  userCountEls.forEach(el => {
    el.textContent = users.length;
  });
  roomUsersEl.innerHTML = `
    ${users
      .map(
        user => `<li class="${
          user.username === userDetails.username ? "me" : ""
        }">
      ${user.username}
    </li>`
      )
      .join("")}
  `;
}
