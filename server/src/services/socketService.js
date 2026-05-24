const { Server } = require("socket.io");
const { verifyAccessToken } = require("../utils/tokens");
const env = require("../config/env");

let io;

function init(server) {
  if (io) return io;
  io = new Server(server, {
    cors: {
      origin: [
        env.clientUrl || "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers["authorization"]?.split(" ")[1];
      if (!token) return next();
      const decoded = verifyAccessToken(token);
      socket.user = decoded;
      return next();
    } catch (err) {
      // allow anonymous connections but do not assign user
      return next();
    }
  });

  io.on("connection", (socket) => {
    // join admin room if admin
    try {
      if (socket.user && socket.user.role === "admin") {
        socket.join("admin-dashboard");
      }
    } catch (e) {}

    socket.on("join", (room) => {
      if (typeof room === "string") socket.join(room);
    });

    socket.on("leave", (room) => {
      if (typeof room === "string") socket.leave(room);
    });
  });

  return io;
}

function getIo() {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}

module.exports = { init, getIo };
