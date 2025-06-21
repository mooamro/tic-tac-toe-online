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

// 🟩 Spielfeld aktualisieren
function updateBoard() {
  board.forEach((symbol, i) => {
    cells[i].innerText = symbol;
    cells[i].style.color = symbol === "X" ? "black" : "red";
  });
}

// 🔁 Spielerwechsel
function switchTurn() {
  currentTurn = currentTurn === "X" ? "O" : "X";
  statusEl.innerText = `Du spielst: ${mySymbol}. ${currentTurn === mySymbol ? "Dein Zug!" : "Warte auf Gegner..."}`;
}

// 🎯 Klick auf eine Zelle
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

// 🔁 Spiel neustarten
restartBtn.addEventListener("click", () => {
  board = Array(9).fill("");
  updateBoard();
  currentTurn = "X";
  socket.emit("restart", room);
  statusEl.innerText = `Du spielst: ${mySymbol}. ${currentTurn === mySymbol ? "Dein Zug!" : "Warte auf Gegner..."}`;
});

// 📥 Raum beitreten
joinBtn.addEventListener("click", () => {
  const roomCode = roomInput.value.trim().toUpperCase();
  if (roomCode) {
    room = roomCode;
    socket.emit("joinRoom", room);
  }
});

// 🆕 Neues Spiel erstellen
createBtn.addEventListener("click", () => {
  room = Math.random().toString(36).substring(2, 8).toUpperCase();
  roomInput.value = room;
  socket.emit("joinRoom", room);
});

// 🧠 Symbol und Spielstatus vom Server erhalten
socket.on("start", (symbol) => {
  mySymbol = symbol;
  board = Array(9).fill("");
  updateBoard();
  currentTurn = "X";
  statusEl.innerText = `Du spielst: ${mySymbol}. ${currentTurn === mySymbol ? "Dein Zug!" : "Warte auf Gegner..."}`;
});

// 📡 Gegnerzug erhalten
socket.on("move", ({ index, symbol }) => {
  board[index] = symbol;
  updateBoard();
  switchTurn();
});

// 🔄 Neustart vom Gegner
socket.on("restart", () => {
  board = Array(9).fill("");
  updateBoard();
  currentTurn = "X";
  statusEl.innerText = `Du spielst: ${mySymbol}. ${currentTurn === mySymbol ? "Dein Zug!" : "Warte auf Gegner..."}`;
});
