const socket = io();

let mySymbol = "";
let currentTurn = "X";
let board = Array(9).fill("");
let room = "";
let vsAi = false;
let gameEnded = false;

const cells = document.querySelectorAll(".cell");
const statusEl = document.getElementById("status");
const restartBtn = document.getElementById("restartBtn");
const joinBtn = document.getElementById("joinBtn");
const createBtn = document.getElementById("createBtn");
const aiBtn = document.getElementById("vsAiBtn");
const roomInput = document.getElementById("roomInput");

// Aktualisiert das Board visuell
function updateBoard() {
  board.forEach((symbol, i) => {
    cells[i].innerText = symbol;
    cells[i].className = "cell"; // reset classes
    if (symbol === "X") cells[i].classList.add("x");
    if (symbol === "O") cells[i].classList.add("o");
  });
}

// Spieler wechselt
function switchTurn() {
  currentTurn = currentTurn === "X" ? "O" : "X";
}

// Klick-Event für Zellen
cells.forEach((cell, i) => {
  cell.addEventListener("click", () => {
    if (gameEnded || board[i] !== "") return;

    if (vsAi && currentTurn === "X") {
      board[i] = "X";
      updateBoard();
      if (checkWinner()) return;
      currentTurn = "O";
      setTimeout(aiMove, 500);
    }

    if (!vsAi && currentTurn === mySymbol) {
      board[i] = mySymbol;
      updateBoard();
      socket.emit("move", { room, index: i, symbol: mySymbol });
      if (checkWinner()) return;
      switchTurn();
    }
  });
});

// KI-Zug
function aiMove() {
  const empty = board
    .map((val, idx) => val === "" ? idx : null)
    .filter(i => i !== null);

  if (empty.length === 0) return;

  const index = empty[Math.floor(Math.random() * empty.length)];
  board[index] = "O";
  updateBoard();
  if (checkWinner()) return;
  currentTurn = "X";
}

// Restart-Klick
restartBtn.addEventListener("click", () => {
  board = Array(9).fill("");
  updateBoard();
  currentTurn = "X";
  gameEnded = false;
  if (!vsAi) socket.emit("restart", room);
  statusEl.innerText = vsAi ? "Du spielst gegen die KI. Du bist X." : `Du spielst: ${mySymbol}`;
});

// Multiplayer-Raum beitreten
joinBtn.addEventListener("click", () => {
  const roomCode = roomInput.value.trim();
  if (roomCode) {
    vsAi = false;
    room = roomCode;
    socket.emit("joinRoom", room);
  }
});

// Raum erstellen
createBtn.addEventListener("click", () => {
  vsAi = false;
  room = Math.random().toString(36).substring(2, 8).toUpperCase();
  roomInput.value = room;
  socket.emit("joinRoom", room);
});

// Gegen KI spielen
aiBtn.addEventListener("click", () => {
  vsAi = true;
  board = Array(9).fill("");
  updateBoard();
  currentTurn = "X";
  gameEnded = false;
  statusEl.innerText = "Du spielst gegen die KI. Du bist X.";
});

// Gewinner prüfen
function checkWinner() {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8], // rows
    [0,3,6],[1,4,7],[2,5,8], // cols
    [0,4,8],[2,4,6]          // diagonals
  ];

  for (let line of lines) {
    const [a,b,c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      cells[a].classList.add(board[a] === "X" ? "win-x" : "win-o");
      cells[b].classList.add(board[a] === "X" ? "win-x" : "win-o");
      cells[c].classList.add(board[a] === "X" ? "win-x" : "win-o");
      statusEl.innerText = `Spieler ${board[a]} gewinnt!`;
      gameEnded = true;
      return true;
    }
  }

  if (!board.includes("")) {
    statusEl.innerText = "Unentschieden!";
    gameEnded = true;
    return true;
  }

  return false;
}

// Multiplayer-Events
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
  gameEnded = false;
  statusEl.innerText = `Du spielst: ${mySymbol}`;
});
