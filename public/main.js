const socket = io();

let mySymbol = "";
let currentTurn = "X";
let board = Array(9).fill("");
let room = "";
let isVsBot = false;

const cells = document.querySelectorAll(".cell");
const statusEl = document.getElementById("status");
const restartBtn = document.getElementById("restartBtn");
const joinBtn = document.getElementById("joinBtn");
const createBtn = document.getElementById("createBtn");
const roomInput = document.getElementById("roomInput");
const botBtn = document.getElementById("botBtn");

// Spielfeld aktualisieren
function updateBoard() {
  board.forEach((symbol, i) => {
    cells[i].innerText = symbol;
    cells[i].classList.remove("x", "o", "win-x", "win-o");
    if (symbol === "X") cells[i].classList.add("x");
    if (symbol === "O") cells[i].classList.add("o");
  });
}

// Gewinner prüfen
function checkWinner() {
  const winCombos = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];

  for (let combo of winCombos) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      combo.forEach(i => {
        cells[i].classList.add(`win-${board[a].toLowerCase()}`);
      });
      statusEl.innerText = `${board[a]} hat gewonnen!`;
      return true;
    }
  }

  if (!board.includes("")) {
    statusEl.innerText = "Unentschieden!";
    return true;
  }

  return false;
}

// Spielerwechsel
function switchTurn() {
  currentTurn = currentTurn === "X" ? "O" : "X";
  statusEl.innerText = `Du spielst: ${mySymbol}`;
}

// Spieler klickt auf eine Zelle
cells.forEach((cell, i) => {
  cell.addEventListener("click", () => {
    if (board[i] === "" && currentTurn === mySymbol) {
      board[i] = mySymbol;
      updateBoard();
      if (checkWinner()) return;

      if (isVsBot) {
        switchTurn();
        setTimeout(() => botMove(), 500);
      } else {
        socket.emit("move", { room, index: i, symbol: mySymbol });
        switchTurn();
      }
    }
  });
});

// Neustart
restartBtn.addEventListener("click", () => {
  board = Array(9).fill("");
  updateBoard();
  currentTurn = "X";
  statusEl.innerText = `Du spielst: ${mySymbol}`;
  if (!isVsBot) socket.emit("restart", room);
});

// Bot-Spiel starten
botBtn.addEventListener("click", () => {
  isVsBot = true;
  mySymbol = "X";
  board = Array(9).fill("");
  updateBoard();
  currentTurn = "X";
  statusEl.innerText = "Du spielst: X (vs KI)";
});

// Bot macht zufälligen Zug
function botMove() {
  const empty = board.map((val, i) => val === "" ? i : null).filter(v => v !== null);
  if (empty.length === 0 || checkWinner()) return;
  const randIndex = empty[Math.floor(Math.random() * empty.length)];
  board[randIndex] = "O";
  updateBoard();
  checkWinner();
  switchTurn();
}

// Socket.IO Multiplayer
joinBtn.addEventListener("click", () => {
  const roomCode = roomInput.value.trim();
  if (roomCode) {
    isVsBot = false;
    room = roomCode;
    socket.emit("joinRoom", room);
  }
});

createBtn.addEventListener("click", () => {
  isVsBot = false;
  room = Math.random().toString(36).substring(2, 8).toUpperCase();
  roomInput.value = room;
  socket.emit("joinRoom", room);
});

// Multiplayer Events
socket.on("start", (symbol) => {
  mySymbol = symbol;
  statusEl.innerText = `Du spielst: ${mySymbol}`;
});

socket.on("move", ({ index, symbol }) => {
  board[index] = symbol;
  updateBoard();
  checkWinner();
  switchTurn();
});

socket.on("restart", () => {
  board = Array(9).fill("");
  updateBoard();
  currentTurn = "X";
  statusEl.innerText = `Du spielst: ${mySymbol}`;
});
