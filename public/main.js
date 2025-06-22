const socket = io();

let mySymbol = "";
let currentTurn = "X";
let board = Array(9).fill("");
let room = "";
let isVsAI = false;

const cells = document.querySelectorAll(".cell");
const statusEl = document.getElementById("status");
const restartBtn = document.getElementById("restartBtn");
const joinBtn = document.getElementById("joinBtn");
const createBtn = document.getElementById("createBtn");
const roomInput = document.getElementById("roomInput");
const vsAiBtn = document.getElementById("vsAiBtn");

function updateBoard() {
  board.forEach((symbol, i) => {
    cells[i].innerText = symbol;
    cells[i].className = `cell ${symbol.toLowerCase()}`;
  });
}

function switchTurn() {
  currentTurn = currentTurn === "X" ? "O" : "X";
  if (isVsAI && currentTurn === "O") {
    setTimeout(aiMove, 500);
  }
}

function checkWinner() {
  const winPatterns = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];

  for (const [a, b, c] of winPatterns) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      cells[a].classList.add(`win-${board[a].toLowerCase()}`);
      cells[b].classList.add(`win-${board[a].toLowerCase()}`);
      cells[c].classList.add(`win-${board[a].toLowerCase()}`);
      statusEl.innerText = `${board[a]} gewinnt!`;
      return true;
    }
  }

  if (!board.includes("")) {
    statusEl.innerText = "Unentschieden!";
    return true;
  }

  return false;
}

function handleMove(index) {
  if (board[index] === "" && currentTurn === mySymbol) {
    board[index] = mySymbol;
    updateBoard();
    socket.emit("move", { room, index, symbol: mySymbol });
    if (!checkWinner()) switchTurn();
  }
}

cells.forEach((cell, i) => {
  cell.addEventListener("click", () => {
    if (isVsAI) {
      if (board[i] === "" && currentTurn === "X") {
        board[i] = "X";
        updateBoard();
        if (!checkWinner()) {
          currentTurn = "O";
          setTimeout(aiMove, 500);
        }
      }
    } else {
      handleMove(i);
    }
  });
});

restartBtn.addEventListener("click", () => {
  board = Array(9).fill("");
  updateBoard();
  currentTurn = "X";
  statusEl.innerText = `Du spielst: ${mySymbol}`;
  socket.emit("restart", room);
});

joinBtn.addEventListener("click", () => {
  const roomCode = roomInput.value.trim();
  if (roomCode) {
    isVsAI = false;
    room = roomCode;
    socket.emit("joinRoom", room);
  }
});

createBtn.addEventListener("click", () => {
  isVsAI = false;
  room = Math.random().toString(36).substring(2, 8).toUpperCase();
  roomInput.value = room;
  socket.emit("joinRoom", room);
});

vsAiBtn.addEventListener("click", () => {
  isVsAI = true;
  board = Array(9).fill("");
  currentTurn = "X";
  updateBoard();
  statusEl.innerText = "Du spielst gegen die KI als X";
});

socket.on("start", (symbol) => {
  mySymbol = symbol;
  statusEl.innerText = `Du spielst: ${mySymbol}`;
});

socket.on("move", ({ index, symbol }) => {
  board[index] = symbol;
  updateBoard();
  if (!checkWinner()) switchTurn();
});

socket.on("restart", () => {
  board = Array(9).fill("");
  updateBoard();
  currentTurn = "X";
  statusEl.innerText = `Du spielst: ${mySymbol}`;
});

function aiMove() {
  let emptyIndices = board.map((v, i) => v === "" ? i : null).filter(v => v !== null);
  if (emptyIndices.length === 0 || checkWinner()) return;

  const randomIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  board[randomIndex] = "O";
  updateBoard();

  if (!checkWinner()) {
    currentTurn = "X";
  }
}
