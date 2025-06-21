const socket = io();
let mySymbol = "";
let currentTurn = "X";
const board = Array(9).fill("");
const cells = document.querySelectorAll(".cell");
const statusEl = document.getElementById("status");

document.getElementById("restartBtn").addEventListener("click", () => {
  socket.emit("restart", room);
});

cells.forEach((cell, index) => {
  cell.addEventListener("click", () => {
    if (board[index] === "" && currentTurn === mySymbol) {
      board[index] = mySymbol;
      updateBoard();
      socket.emit("move", { room, index, symbol: mySymbol });
      switchTurn();
    }
  });
});

function updateBoard() {
  cells.forEach((cell, i) => {
    cell.textContent = board[i];
  });
}

function switchTurn() {
  currentTurn = currentTurn === "X" ? "O" : "X";
}

let room = "";

// UI Buttons
document.getElementById("createBtn").addEventListener("click", () => {
  room = Math.random().toString(36).substr(2, 5);
  socket.emit("create", room);
  statusEl.textContent = `Raum erstellt: ${room}`;
});

document.getElementById("joinBtn").addEventListener("click", () => {
  room = document.getElementById("roomInput").value.trim();
  if (room) {
    socket.emit("join", room);
  }
});

// Socket.IO Events
socket.on("start", (symbol) => {
  mySymbol = symbol;
  statusEl.textContent = `Du spielst: ${mySymbol}`;
});

socket.on("move", ({ index, symbol }) => {
  board[index] = symbol;
  updateBoard();
  switchTurn();
});

socket.on("restart", () => {
  board.fill("");
  updateBoard();
  currentTurn = "X";
  statusEl.textContent = `Du spielst: ${mySymbol}`;
});
