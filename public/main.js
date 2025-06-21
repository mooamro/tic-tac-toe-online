const socket = io();

let mySymbol = "";
let currentTurn = "X";
let board = Array(9).fill("");
let room = "";
let gameOver = false;

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
    cells[i].classList.remove("x", "o");
    if (symbol === "X") cells[i].classList.add("x");
    if (symbol === "O") cells[i].classList.add("o");
  });
}

// Spielerwechsel
function switchTurn() {
  currentTurn = currentTurn === "X" ? "O" : "X";
}

// Gewinner prüfen
function checkWinner() {
  const winPatterns = [
    [0,1,2], [3,4,5], [6,7,8], // Reihen
    [0,3,6], [1,4,7], [2,5,8], // Spalten
    [0,4,8], [2,4,6]           // Diagonalen
  ];

  for (let pattern of winPatterns) {
    const [a, b, c] = pattern;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a]; // "X" oder "O"
    }
  }

  if (board.every(cell => cell)) {
    return "draw";
  }

  return null;
}

// Spiel beenden
function handleEnd(result) {
  gameOver = true;
  if (result === "draw") {
    statusEl.innerText = "Unentschieden!";
  } else {
    statusEl.innerText = `${result} hat gewonnen!`;
  }
}

// Klick auf Zelle
cells.forEach((cell, i) => {
  cell.addEventListener("click", () => {
    if (gameOver) return;
    if (board[i] === "" && currentTurn === mySymbol) {
      board[i] = mySymbol;
      updateBoard();
      socket.emit("move", { room, index: i, symbol: mySymbol });

      const result = checkWinner();
      if (result) {
        handleEnd(result);
      } else {
        switchTurn();
      }
    }
  });
});

// Restart-Klick
restartBtn.addEventListener("click", () => {
  board = Array(9).fill("");
  updateBoard();
  currentTurn = "X";
  gameOver = false;
  statusEl.innerText = `Du spielst: ${mySymbol}`;
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

// Spielstart vom Server
socket.on("start", (symbol) => {
  mySymbol = symbol;
  statusEl.innerText = `Du spielst: ${mySymbol}. Warte auf Gegner...`;
});

// Gegnerzug
socket.on("move", ({ index, symbol }) => {
  board[index] = symbol;
  updateBoard();

  const result = checkWinner();
  if (result) {
    handleEnd(result);
  } else {
    switchTurn();
  }
});

// Spiel zurückgesetzt
socket.on("restart", () => {
  board = Array(9).fill("");
  updateBoard();
  currentTurn = "X";
  gameOver = false;
  statusEl.innerText = `Du spielst: ${mySymbol}`;
});
