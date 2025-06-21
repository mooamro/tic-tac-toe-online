const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const path = require("path");

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

const rooms = {}; // roomName → [socket1, socket2]

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("create", (room) => {
        rooms[room] = [socket.id];
        socket.join(room);
        socket.emit("start", "X"); // creator is X
    });

    socket.on("join", (room) => {
        if (!rooms[room]) {
            rooms[room] = [socket.id];
            socket.join(room);
            socket.emit("start", "X");
        } else if (rooms[room].length === 1) {
            rooms[room].push(socket.id);
            socket.join(room);
            socket.emit("start", "O"); // second player is O
            io.to(rooms[room][0]).emit("start", "X"); // ensure first player gets confirmation too
        } else {
            socket.emit("full");
        }
    });

    socket.on("move", ({ room, index, symbol }) => {
        socket.to(room).emit("move", { index, symbol });
    });

    socket.on("restart", (room) => {
        socket.to(room).emit("restart");
    });

    socket.on("disconnect", () => {
        for (let room in rooms) {
            rooms[room] = rooms[room].filter(id => id !== socket.id);
            if (rooms[room].length === 0) {
                delete rooms[room];
            }
        }
        console.log("User disconnected:", socket.id);
    });
});

http.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
