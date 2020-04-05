const path = require("path");
const http = require("http");
const express = require("express");
const cors = require("cors");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const {
  joinUser,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utils/users");

const games = require("./games.json");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, "public")));

// Top selling games API
app.get("/api/TopSellingGames", cors(), (req, res, next) => {
  return res.json(games);
});

app.get("/api/TopSellingGames/:rank", cors(), (req, res, next) => {
  let rank = parseInt(req.params.rank);
  let game = games.find((g) => g.Rank === rank);
  if (game) {
    return res.json(game);
  }
  return res.status(404).json({ msg: "Not found!" });
});

const botName = "ChatCord Bot";

// When client connects
io.on("connection", (socket) => {
  // Join room
  socket.on("joinRoom", ({ username, room }) => {
    const user = joinUser(socket.id, username, room);

    socket.join(user.room);

    // Welcome new user
    socket.emit(
      "message",
      formatMessage(botName, `Hey ${username}, Welcome to ChatCord!`)
    );

    // Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${username} has joined the chat.`)
      );

    // Send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  // Listen for chat message
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });

  // When user types
  socket.on("typing", () => {
    const user = getCurrentUser(socket.id);
    socket.broadcast.to(user.room).emit("typing", user.username);
  });

  // When client disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left the chat.`)
      );

      // Send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
