const socket = io();

// Initialwerte
let mySymbol = "";
let currentTurn = "X";
let board = Array(9).fill("");
let room = "";
let isAgainstAI = false;

let xWins = 0;
let oWins = 0;
let currentRound = 1;
let totalRounds = 1;

const params = new URLSearchParams(window.location.search);
const mode = params.get("mode"); // "ai" oder "online"
totalRounds = parseInt(params.get("rounds")) || 1;

const cells = document.querySelectorAll(".cell");
const statusEl = document.getElementById("status");
const restartBtn = document.getElementById("restartBtn");
const xScoreEl = document.getElementById("x-score");
const oScoreEl = document.getElementById("o-score");
const roundCounterEl = document.getElementById("round-counter");

function updateBoard() {
  board.forEach((symbol, i) => {
    cells[i].innerText = symbol;
    cells[i].className = "cell"; // Reset classes
    if (symbol === "X") cells[i].classList.add("x");
    if (symbol === "O") cells[i].classList.add("o");
  });
}

function switchTurn() {
  currentTurn = currentTurn === "X" ? "O" : "X";
}

function updateScores() {
  xScoreEl.textContent = `X: ${xWins}`;
  oScoreEl.textContent = `O: ${oWins}`;
  roundCounterEl.textContent = `Runde ${currentRound} von ${totalRounds}`;
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

      if (board[a] === "X") xWins++;
      if (board[a] === "O") oWins++;

      updateScores();
      setTimeout(checkGameEnd, 1500);
      return board[a];
    }
  }

  if (!board.includes("")) {
statusEl.innerText = "Unentschieden! Diese Runde wird nicht gezählt.";
setTimeout(() => {
  board = Array(9).fill("");
  currentTurn = "X";
  updateBoard();
  statusEl.innerText = `Du spielst: ${mySymbol}`;
  if (isAgainstAI && mySymbol === "O") setTimeout(aiMove, 400);
}, 1500);
return "draw";

  }

  return null;
}

function checkGameEnd() {
  if (currentRound >= totalRounds) {
    setTimeout(() => {
      alert(`Spiel beendet!\nX: ${xWins} | O: ${oWins}`);
      window.location.href = "index.html";
    }, 100);
  } else {
    currentRound++;
    board = Array(9).fill("");
    currentTurn = "X";
    updateBoard();
    updateScores();
    if (isAgainstAI && mySymbol === "O") setTimeout(aiMove, 500);
    statusEl.innerText = `Du spielst: ${mySymbol}`;
  }
}

function aiMove() {
  if (checkWinner()) return;

  let index = findBestMove();
  if (index !== -1) {
    board[index] = "O";
    updateBoard();
    const winner = checkWinner();
    if (!winner) switchTurn();
  }
}

function findBestMove() {
  let win = findWinningMove("O");
  if (win !== -1) return win;

  let block = findWinningMove("X");
  if (block !== -1) return block;

  if (board[4] === "") return 4;

  const corners = [0, 2, 6, 8];
  for (let i of corners) if (board[i] === "") return i;

  const sides = [1, 3, 5, 7];
  for (let i of sides) if (board[i] === "") return i;

  return -1;
}

function findWinningMove(symbol) {
  const patterns = [
    [0,1,2], [3,4,5], [6,7,8],
    [0,3,6], [1,4,7], [2,5,8],
    [0,4,8], [2,4,6]
  ];

  for (let [a, b, c] of patterns) {
    const line = [board[a], board[b], board[c]];
    const count = line.filter(v => v === symbol).length;
    const emptyIndex = [a, b, c].find(i => board[i] === "");
    if (count === 2 && emptyIndex !== undefined) return emptyIndex;
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
        if (isAgainstAI && currentTurn === "O") setTimeout(aiMove, 400);
      }
    }
  });
});

restartBtn.addEventListener("click", () => {
  board = Array(9).fill("");
  currentTurn = "X";
  updateBoard();
  statusEl.innerText = `Du spielst: ${mySymbol}`;
  updateScores();
  if (!isAgainstAI) socket.emit("restart", room);
  else if (mySymbol === "O") setTimeout(aiMove, 500);
});

// Multiplayer
const joinBtn = document.getElementById("joinBtn");
const createBtn = document.getElementById("createBtn");
const roomInput = document.getElementById("roomInput");
const aiBtn = document.getElementById("aiBtn");

joinBtn?.addEventListener("click", () => {
  const roomCode = roomInput.value.trim();
  if (roomCode) {
    isAgainstAI = false;
    room = roomCode;
    socket.emit("joinRoom", room);
  }
});

createBtn?.addEventListener("click", () => {
  isAgainstAI = false;
  room = Math.random().toString(36).substr(2, 6).toUpperCase();
  roomInput.value = room;
  socket.emit("joinRoom", room);
});

aiBtn?.addEventListener("click", () => {
  isAgainstAI = true;
  board = Array(9).fill("");
  mySymbol = "X";
  updateBoard();
  updateScores();
  statusEl.innerText = "Du spielst gegen die KI";
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
