const socket = io();

let mySymbol = "";
let currentTurn = "X";
let board = Array(9).fill("");
let room = "";

const cells = document.querySelectorAll(".cell");
const statusEl = document.getElementById("status");
const restartBtn = document.getElementById("restartBtn");
const joinBtn = document.getElementById("joinBtn");
const createBtn = document.getElementById("createBtn");
const roomInput = document.getElementById("roomInput");

// Spielfeld aktualisieren
function updateBoard() {
  board.forEach((symbol, i) => {
    cells[i].innerText = symbol;
  });
}

// Spielerwechsel
function switchTurn() {
  currentTurn = currentTurn === "X" ? "O" : "X";
}

// Klick auf Zelle
cells.forEach((cell, i) => {
  cell.addEventListener("click", () => {
    if (board[i] === "" && currentTurn === mySymbol) {
      board[i] = mySymbol;
      updateBoard();
      socket.emit("move", { room, index: i, symbol: mySymbol });
      switchTurn();
    }
  });
});

// Restart-Klick
restartBtn.addEventListener("click", () => {
  board = Array(9).fill("");
  updateBoard();
  currentTurn = "X";
  socket.emit("restart", room);
});

// Raum beitreten
joinBtn.addEventListener("click", () => {
  const roomCode = roomInput.value.trim();
  if (roomCode) {
    room = roomCode;
    socket.emit("joinRoom", room);
  }
});

// Neues Spiel erstellen
createBtn.addEventListener("click", () => {
  room = Math.random().toString(36).substring(2, 8).toUpperCase();
  roomInput.value = room;
  socket.emit("joinRoom", room);
});

// Socket.IO: Starte Spiel
socket.on("start", (symbol) => {
  mySymbol = symbol;
  statusEl.innerText = `Du spielst: ${mySymbol}`;
});

// Socket.IO: Gegnerzug erhalten
socket.on("move", ({ index, symbol }) => {
  board[index] = symbol;
  updateBoard();
  switchTurn();
});

// Socket.IO: Spiel zurückgesetzt
socket.on("restart", () => {
  board = Array(9).fill("");
  updateBoard();
  currentTurn = "X";
  statusEl.innerText = `Du spielst: ${mySymbol}`;
});
