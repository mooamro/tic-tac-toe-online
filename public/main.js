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

// --------- SPIELFUNKTIONEN ---------

function updateBoard() {
  board.forEach((symbol, i) => {
    cells[i].innerText = symbol;
  });
}

function switchTurn() {
  currentTurn = currentTurn === "X" ? "O" : "X";
  if (!gameOver) {
    statusEl.innerText = currentTurn === mySymbol ? "Dein Zug" : "Warten auf Gegner...";
  }
}

function checkWinner() {
  const winCombos = [
    [0,1,2], [3,4,5], [6,7,8], // Reihen
    [0,3,6], [1,4,7], [2,5,8], // Spalten
    [0,4,8], [2,4,6]           // Diagonalen
  ];

  for (let combo of winCombos) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a]; // X oder O
    }
  }

  if (board.every(cell => cell !== "")) {
    return "draw";
  }

  return null;
}

// --------- EVENTS ---------

cells.forEach((cell, i) => {
  cell.addEventListener("click", () => {
    if (board[i] === "" && currentTurn === mySymbol && !gameOver) {
      board[i] = mySymbol;
      updateBoard();
      socket.emit("move", { room, index: i, symbol: mySymbol });

      const result = checkWinner();
      if (result) {
        gameOver = true;
        if (result === "draw") {
          statusEl.innerText = "Unentschieden!";
        } else {
          statusEl.innerText = `${result} hat gewonnen!`;
        }
        socket.emit("gameOver", { room, result });
        return;
      }

      switchTurn();
    }
  });
});

restartBtn.addEventListener("click", () => {
  board = Array(9).fill("");
  updateBoard();
  currentTurn = "X";
  gameOver = false;
  statusEl.innerText = `Du spielst: ${mySymbol}`;
  socket.emit("restart", room);
});

// --------- RAUM ---------

joinBtn.addEventListener("click", () => {
  const roomCode = roomInput.value.trim();
  if (roomCode) {
    room = roomCode;
    socket.emit("joinRoom", room);
  }
});

createBtn.addEventListener("click", () => {
  room = Math.random().toString(36).substring(2, 8).toUpperCase();
  roomInput.value = room;
  socket.emit("joinRoom", room);
});

// --------- SOCKET.IO ---------

socket.on("start", (symbol) => {
  mySymbol = symbol;
  statusEl.innerText = `Du spielst: ${mySymbol}`;
});

socket.on("move", ({ index, symbol }) => {
  board[index] = symbol;
  updateBoard();

  const result = checkWinner();
  if (result) {
    gameOver = true;
    if (result === "draw") {
      statusEl.innerText = "Unentschieden!";
    } else {
      statusEl.innerText = `${result} hat gewonnen!`;
    }
    return;
  }

  switchTurn();
});

socket.on("restart", () => {
  board = Array(9).fill("");
  updateBoard();
  currentTurn = "X";
  gameOver = false;
  statusEl.innerText = `Du spielst: ${mySymbol}`;
});

socket.on("gameOver", ({ result }) => {
  gameOver = true;
  if (result === "draw") {
    statusEl.innerText = "Unentschieden!";
  } else {
    statusEl.innerText = `${result} hat gewonnen!`;
  }
});
