const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const rooms = {}; // roomId: [socketId1, socketId2]

app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("create", (room) => {
        rooms[room] = [socket.id];
        socket.join(room);
        socket.emit("start", "X");
    });

    socket.on("join", (room) => {
        if (rooms[room] && rooms[room].length === 1) {
            rooms[room].push(socket.id);
            socket.join(room);

            // Inform both players of their symbols
            socket.emit("start", "O");
            io.to(rooms[room][0]).emit("start", "X");
        } else {
            socket.emit("error", "Raum nicht verfügbar oder voll.");
        }
    });

    socket.on("move", ({ room, index, symbol }) => {
        socket.to(room).emit("move", { index, symbol });
    });

    socket.on("restart", (room) => {
        io.to(room).emit("restart");
    });

    socket.on("disconnect", () => {
        for (const room in rooms) {
            rooms[room] = rooms[room].filter(id => id !== socket.id);
            if (rooms[room].length === 0) {
                delete rooms[room];
            }
        }
        console.log("Client disconnected:", socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`✅ Server läuft auf http://localhost:${PORT}`);
});
