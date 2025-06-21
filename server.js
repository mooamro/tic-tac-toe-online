const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const path = require("path");

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Räume und Spieler-Tracking
const rooms = {};

io.on("connection", (socket) => {
  console.log("Ein Spieler verbunden:", socket.id);

  socket.on("joinRoom", (room) => {
    if (!rooms[room]) {
      rooms[room] = [];
    }

    if (rooms[room].length >= 2) {
      socket.emit("roomFull");
      return;
    }

    rooms[room].push(socket);
    socket.join(room);

    const playerSymbol = rooms[room].length === 1 ? "X" : "O";
    socket.emit("start", playerSymbol);

    if (rooms[room].length === 2) {
      // Wenn beide Spieler verbunden sind, startet das Spiel
      io.to(room).emit("status", "Spiel gestartet");
    }

    // Weiterleiten von Spielzügen
    socket.on("move", ({ index, symbol }) => {
      socket.to(room).emit("move", { index, symbol });
    });

    // Restart weiterleiten
    socket.on("restart", () => {
      socket.to(room).emit("restart");
    });

    // Aufräumen bei Trennung
    socket.on("disconnect", () => {
      console.log("Spieler getrennt:", socket.id);
      if (rooms[room]) {
        rooms[room] = rooms[room].filter((s) => s !== socket);
        if (rooms[room].length === 0) {
          delete rooms[room];
        }
      }
    });
  });
});

http.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});
