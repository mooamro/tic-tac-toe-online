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
    cells[i].classList.remove("x", "o", "win-x", "win-o");

    if (symbol === "X") cells[i].classList.add("x");
    if (symbol === "O") cells[i].classList.add("o");
  });
}

// Spielerwechsel
function switchTurn() {
  currentTurn = currentTurn === "X" ? "O" : "X";
}

// Gewinner überprüfen
function checkWinner() {
  const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],  // Reihen
    [0, 3, 6], [1, 4, 7], [2, 5, 8],  // Spalten
    [0, 4, 8], [2, 4, 6]              // Diagonalen
  ];

  for (const [a, b, c] of winPatterns) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], pattern: [a, b, c] };
    }
  }

  return null;
}

// Klick auf Zelle
cells.forEach((cell, i) => {
  cell.addEventListener("click", () => {
    if (board[i] === "" && currentTurn === mySymbol) {
      board[i] = mySymbol;
      updateBoard();
      socket.emit("move", { room, index: i, symbol: mySymbol });

      const result = checkWinner();
      if (result) {
        highlightWinner(result.winner, result.pattern);
        statusEl.innerText = `Spieler ${result.winner} hat gewonnen!`;
        return;
      }

      switchTurn();
    }
  });
});

// Gewinner farblich hervorheben
function highlightWinner(winner, pattern) {
  pattern.forEach(i => {
    cells[i].classList.add(winner === "X" ? "win-x" : "win-o");
  });
}

// Neustart
restartBtn.addEventListener("click", () => {
  board = Array(9).fill("");
  updateBoard();
  currentTurn = "X";
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

// Socket.IO: Startsignal
socket.on("start", (symbol) => {
  mySymbol = symbol;
  statusEl.innerText = `Du spielst: ${mySymbol}`;
});

// Gegnerzug empfangen
socket.on("move", ({ index, symbol }) => {
  board[index] = symbol;
  updateBoard();

  const result = checkWinner();
  if (result) {
    highlightWinner(result.winner, result.pattern);
    statusEl.innerText = `Spieler ${result.winner} hat gewonnen!`;
    return;
  }

  switchTurn();
});

// Spiel zurückgesetzt
socket.on("restart", () => {
  board = Array(9).fill("");
  updateBoard();
  currentTurn = "X";
  statusEl.innerText = `Du spielst: ${mySymbol}`;
});
