const socket = io();

let mySymbol = "";
let currentTurn = "X";
let board = Array(9).fill("");
let room = "";
let isAgainstAI = false;

const cells = document.querySelectorAll(".cell");
const statusEl = document.getElementById("status");
const restartBtn = document.getElementById("restartBtn");
const joinBtn = document.getElementById("joinBtn");
const createBtn = document.getElementById("createBtn");
const roomInput = document.getElementById("roomInput");
const aiBtn = document.getElementById("aiBtn");

function updateBoard() {
  board.forEach((symbol, i) => {
    cells[i].innerText = symbol;
    cells[i].className = "cell"; // Reset class
    if (symbol === "X") cells[i].classList.add("x");
    if (symbol === "O") cells[i].classList.add("o");
  });
}

function switchTurn() {
  currentTurn = currentTurn === "X" ? "O" : "X";
}

function checkWinner() {
  const winPatterns = [
    [0,1,2], [3,4,5], [6,7,8],
    [0,3,6], [1,4,7], [2,5,8],
    [0,4,8], [2,4,6]
  ];

  for (let pattern of winPatterns) {
    const [a, b, c] = pattern;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      cells[a].classList.add(`win-${board[a].toLowerCase()}`);
      cells[b].classList.add(`win-${board[b].toLowerCase()}`);
      cells[c].classList.add(`win-${board[c].toLowerCase()}`);
      statusEl.innerText = `${board[a]} gewinnt!`;
      return board[a];
    }
  }

  if (!board.includes("")) {
    statusEl.innerText = "Unentschieden!";
    return "draw";
  }

  return null;
}

function aiMove() {
  if (checkWinner()) return;

  let index = findBestMove();
  if (index !== -1) {
    board[index] = "O";
    updateBoard();
    checkWinner();
    switchTurn();
  }
}

function findBestMove() {
  // 1. Block player (X) from winning
  let blockingMove = findWinningMove("X");
  if (blockingMove !== -1) return blockingMove;

  // 2. Try to win (O)
  let winningMove = findWinningMove("O");
  if (winningMove !== -1) return winningMove;

  // 3. Take center if available
  if (board[4] === "") return 4;

  // 4. Take corners
  const corners = [0, 2, 6, 8];
  for (let i of corners) {
    if (board[i] === "") return i;
  }

  // 5. Take sides
  const sides = [1, 3, 5, 7];
  for (let i of sides) {
    if (board[i] === "") return i;
  }

  return -1;
}

function findWinningMove(symbol) {
  const winPatterns = [
    [0,1,2], [3,4,5], [6,7,8],
    [0,3,6], [1,4,7], [2,5,8],
    [0,4,8], [2,4,6]
  ];

  for (let pattern of winPatterns) {
    const [a, b, c] = pattern;
    const values = [board[a], board[b], board[c]];
    const count = values.filter(v => v === symbol).length;
    const emptyIndex = [a, b, c].find(i => board[i] === "");

    if (count === 2 && emptyIndex !== undefined) {
      return emptyIndex;
    }
  }

  return -1;
}

cells.forEach((cell, i) => {
  cell.addEventListener("click", () => {
    if (board[i] === "" && currentTurn === mySymbol && !checkWinner()) {
      board[i] = mySymbol;
      updateBoard();
      const winner = checkWinner();
      if (!winner) {
        switchTurn();
        if (isAgainstAI && currentTurn === "O") {
          setTimeout(aiMove, 300);
        }
      }
    }
  });
});

restartBtn.addEventListener("click", () => {
  board = Array(9).fill("");
  updateBoard();
  currentTurn = "X";
  statusEl.innerText = `Du spielst: ${mySymbol}`;
  socket.emit("restart", room);
  if (isAgainstAI && mySymbol === "O") {
    setTimeout(aiMove, 300);
  }
});

joinBtn.addEventListener("click", () => {
  const roomCode = roomInput.value.trim();
  if (roomCode) {
    isAgainstAI = false;
    room = roomCode;
    socket.emit("joinRoom", room);
  }
});

createBtn.addEventListener("click", () => {
  isAgainstAI = false;
  room = Math.random().toString(36).substring(2, 8).toUpperCase();
  roomInput.value = room;
  socket.emit("joinRoom", room);
});

aiBtn.addEventListener("click", () => {
  isAgainstAI = true;
  board = Array(9).fill("");
  updateBoard();
  currentTurn = "X";
  mySymbol = "X";
  statusEl.innerText = "Du spielst gegen die KI";
});

// SOCKET.IO Multiplayer Events
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
