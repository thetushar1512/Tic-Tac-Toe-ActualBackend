import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const rooms = {};

io.on("connection", (socket) => {
  console.log(`User is connected: ${socket.id}`);

  socket.on("joinroom", (roomId) => {
    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }

    if (rooms[roomId].length >= 2) {
      socket.emit("room-full");
      return;
    }

    rooms[roomId].push(socket.id);
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);

    if (rooms[roomId].length === 2) {
      io.to(roomId).emit("start-game");
    }
  });

  socket.on("make-move", ({ roomId, index, symbol }) => {
    socket.to(roomId).emit("receive-move", { index, symbol });
  });

  socket.on("disconnect", () => {
    console.log(`User is disconnected: ${socket.id}`);

    for (const roomId in rooms) {
      rooms[roomId] = rooms[roomId].filter(id => id !== socket.id);
      if (rooms[roomId].length === 0) {
        delete rooms[roomId];
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log("Server running is running on port "+ PORT);
});