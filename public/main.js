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

function updateBoard() {
  board.forEach((symbol, i) => {
    cells[i].innerText = symbol;
    cells[i].className = "cell"; // Reset Klassen
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
      return { winner: board[a], line: pattern };
    }
  }

  if (board.every(cell => cell)) {
    return { winner: "draw" };
  }

  return null;
}

function handleEnd(result) {
  gameOver = true;

  if (result.winner === "draw") {
    statusEl.innerText = "Unentschieden!";
  } else {
    statusEl.innerText = `${result.winner} hat gewonnen!`;
    // Gewinnlinie einfärben
    result.line.forEach(index => {
      cells[index].classList.add(result.winner === "X" ? "win-x" : "win-o");
    });
  }
}

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

restartBtn.addEventListener("click", () => {
  board = Array(9).fill("");
  updateBoard();
  currentTurn = "X";
  gameOver = false;
  statusEl.innerText = `Du spielst: ${mySymbol}`;
  socket.emit("restart", room);
});

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

socket.on("start", (symbol) => {
  mySymbol = symbol;
  statusEl.innerText = `Du spielst: ${mySymbol}. Warte auf Gegner...`;
});

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

socket.on("restart", () => {
  board = Array(9).fill("");
  updateBoard();
  currentTurn = "X";
  gameOver = false;
  statusEl.innerText = `Du spielst: ${mySymbol}`;
});
