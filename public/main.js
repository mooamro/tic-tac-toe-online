const socket = io();

let room = null;
let mySymbol = null;
let currentTurn = "X";
const board = Array(9).fill("");

const homeScreen = document.getElementById("home");
const gameScreen = document.getElementById("game");
const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const linkEl = document.getElementById("link-display");

document.getElementById("createGame").onclick = () => {
    room = Math.random().toString(36).substring(2, 7);
    socket.emit("create", room);
    startGameUI(room);
};

document.getElementById("joinGame").onclick = () => {
    const input = document.getElementById("roomInput").value.trim();
    if (input) {
        room = input;
        socket.emit("join", room);
        startGameUI(room);
    }
};

document.getElementById("restartBtn").onclick = () => {
    board.fill("");
    updateBoard();
    socket.emit("restart", room);
};

function startGameUI(roomCode) {
    homeScreen.classList.remove("active");
    gameScreen.classList.add("active");
    boardEl.innerHTML = "";
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.index = i;
        cell.addEventListener("click", () => handleClick(i));
        cell.addEventListener("touchstart", () => handleClick(i));
        boardEl.appendChild(cell);
    }
    linkEl.innerText = `Raumcode: ${roomCode}`;
}

function handleClick(index) {
    if (board[index] === "" && mySymbol === currentTurn) {
        board[index] = mySymbol;
        socket.emit("move", { room, index, symbol: mySymbol });
        updateBoard();
        switchTurn();
    }
}

function updateBoard() {
    const cells = document.querySelectorAll(".cell");
    cells.forEach((cell, i) => {
        cell.innerText = board[i];
        cell.style.color = board[i] === "O" ? "red" : "black";
    });
}

function switchTurn() {
    currentTurn = currentTurn === "X" ? "O" : "X";
    statusEl.innerText = currentTurn === mySymbol ? "Dein Zug ✅" : "Warten auf Gegner ⏳";
}

socket.on("start", (symbol) => {
    mySymbol = symbol;
    statusEl.innerText = `Spiel gestartet! Du bist: ${symbol}`;
});

socket.on("move", ({ index, symbol }) => {
    board[index] = symbol;
    updateBoard();
    switchTurn();
});

socket.on("restart", () => {
    board.fill("");
    updateBoard();
    currentTurn = "X";
    statusEl.innerText = `Spiel wurde neugestartet. Du bist: ${mySymbol}`;
});
