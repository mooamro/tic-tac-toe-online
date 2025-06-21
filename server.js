const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const rooms = {}; // speichert Spieler pro Raum

// Static-Files (z. B. HTML, CSS, JS)
app.use(express.static(__dirname + "/public")); // Stelle sicher, dass index.html dort liegt

// WebSocket-Verbindung
io.on("connection", (socket) => {
  console.log("✅ Neuer Client verbunden:", socket.id);

  socket.on("joinRoom", (room) => {
    console.log(`📥 ${socket.id} möchte Raum ${room} beitreten`);

    // Raum initialisieren
    if (!rooms[room]) {
      rooms[room] = [];
    }

    // Wenn Raum voll → Abbruch
    if (rooms[room].length >= 2) {
      socket.emit("error", "Der Raum ist voll.");
      return;
    }

    // Socket zum Raum hinzufügen
    rooms[room].push(socket.id);
    socket.join(room);

    const playerIndex = rooms[room].indexOf(socket.id);
    const symbol = playerIndex === 0 ? "X" : "O";
    socket.emit("start", symbol);

    console.log(`🎮 ${socket.id} spielt als ${symbol} im Raum ${room}`);
  });

  socket.on("move", ({ room, index, symbol }) => {
    socket.to(room).emit("move", { index, symbol });
  });

  socket.on("restart", (room) => {
    io.to(room).emit("restart");
  });

  socket.on("disconnect", () => {
    for (const room in rooms) {
      rooms[room] = rooms[room].filter((id) => id !== socket.id);
      if (rooms[room].length === 0) {
        delete rooms[room];
      }
    }
    console.log("❌ Verbindung getrennt:", socket.id);
  });
});

// Server starten
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server läuft auf http://localhost:${PORT}`);
});
