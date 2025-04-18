const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const compileAndExecute = require("./compile");

const server = http.createServer(app);
const io = new Server(server);
const userSocketMap = {};

// Add health check endpoint
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

const getAllConnectedClients = (roomId) => {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socketId) => {
      return {
        socketId,
        username: userSocketMap[socketId],
      };
    }
  );
};

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("join", ({ roomId, username }) => {
    userSocketMap[socket.id] = username;
    socket.join(roomId);
    const clients = getAllConnectedClients(roomId);

    clients.forEach(({ socketId }) => {
      io.to(socketId).emit("joined", {
        clients,
        username,
        socketId: socket.id,
      });
    });
  });

  socket.on("code-change", ({ roomId, code }) => {
    socket.in(roomId).emit("code-change", { code });
  });

  socket.on("sync-code", ({ socketId, code }) => {
    io.to(socketId).emit("code-change", { code });
  });

  socket.on("add-comment", ({ roomId, comment }) => {
    console.log("New comment received:", comment);
    io.to(roomId).emit("add-comment", { comment });
  });

  socket.on("chat-message", ({ username, message }) => {
    console.log(`${username} sent a message: ${message}`);
    io.to([...socket.rooms][1]).emit("chat-message", { username, message });
  });

  // Handle language change
  socket.on("language-change", ({ roomId, newLanguage }) => {
    socket.to(roomId).emit("language-change", { newLanguage });
  });

  // Handle code execution
  socket.on("execute-code", async ({ roomId, code, language }) => {
    try {
      console.log(`Executing ${language} code for room ${roomId}`);
      const result = await compileAndExecute(code, language);

      // Emit result to all users in the room
      io.to(roomId).emit("code-execution-result", {
        result: result.output,
        success: result.success,
      });
    } catch (error) {
      console.error("Code execution error:", error);
      io.to(roomId).emit("code-execution-result", {
        result: `Error: ${error.message}`,
        success: false,
      });
    }
  });

  socket.on("disconnecting", () => {
    const rooms = [...socket.rooms];
    rooms.forEach((roomId) => {
      socket.in(roomId).emit("disconnected", {
        socketId: socket.id,
        username: userSocketMap[socket.id],
      });
    });
    delete userSocketMap[socket.id];
    socket.leave();
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () =>
  console.log("Server is running on port 5000")
);
