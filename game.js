const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("highScore");
const timerEl = document.getElementById("timer");
const targetSymbolEl = document.getElementById("targetSymbol");
const hintTextEl = document.getElementById("hintText");
const roundCountEl = document.getElementById("roundCount");
const gameGrid = document.getElementById("gameGrid");
const messageText = document.getElementById("messageText");
const restartButton = document.getElementById("restartButton");

const state = {
  score: 0,
  highScore: 0,
  round: 0,
  timer: null,
  timeLeft: 0,
  activeRound: null,
  tappedCount: 0,
  isPlaying: false,
};

function saveHighScore() {
  try {
    localStorage.setItem("rush-tiles-high-score", state.highScore.toString());
  } catch (error) {
    // ignore storage issues
  }
}

function loadHighScore() {
  try {
    const stored = localStorage.getItem("rush-tiles-high-score");
    if (stored) {
      state.highScore = parseInt(stored, 10) || 0;
      highScoreEl.textContent = state.highScore;
    }
  } catch (error) {
    state.highScore = 0;
  }
}

function formatTime(seconds) {
  return seconds.toString().padStart(2, "0");
}

function calculateDifficulty() {
  return 1 + Math.min(7, state.score / 45);
}

function setMessage(text, type = "normal") {
  messageText.textContent = text;
  messageText.style.color = type === "danger" ? "#ff7f7f" : type === "success" ? "#75e6a4" : "var(--text)";
}

function updateHud() {
  scoreEl.textContent = state.score;
  highScoreEl.textContent = state.highScore;
  roundCountEl.textContent = state.round;
  timerEl.textContent = formatTime(state.timeLeft);
}

function endGame(reason) {
  state.isPlaying = false;
  clearInterval(state.timer);
  setMessage(reason, "danger");
  restartButton.textContent = "Play Again";
}

function completeRound() {
  state.isPlaying = false;
  clearInterval(state.timer);
  setMessage("Round cleared! Generating a tougher challenge...", "success");
  setTimeout(() => {
    loadNextRound(true);
  }, 900);
}

function startTimer(seconds) {
  clearInterval(state.timer);
  state.timeLeft = seconds;
  updateHud();
  state.timer = setInterval(() => {
    state.timeLeft -= 1;
    updateHud();
    if (state.timeLeft <= 0) {
      clearInterval(state.timer);
      endGame("Time's up! Tap faster next time.");
    }
  }, 1000);
}

function renderRound(round) {
  gameGrid.innerHTML = "";
  targetSymbolEl.textContent = round.targetSymbol;
  hintTextEl.textContent = round.hint;
  state.tappedCount = 0;
  state.activeRound = round;

  round.tiles.forEach((tile) => {
    const button = document.createElement("button");
    button.className = "tile";
    button.dataset.target = tile.isTarget ? "true" : "false";
    button.textContent = tile.symbol;
    button.style.color = tile.color;

    button.addEventListener("click", () => {
      if (!state.isPlaying || button.classList.contains("revealed")) {
        return;
      }
      const isTarget = button.dataset.target === "true";
      if (isTarget) {
        button.classList.add("revealed");
        button.style.filter = "brightness(0.7)";
        state.tappedCount += 1;
        state.score += round.pointsPerHit;
        if (state.score > state.highScore) {
          state.highScore = state.score;
          saveHighScore();
        }
        updateHud();
        if (state.tappedCount >= round.targetCount) {
          completeRound();
        }
      } else {
        button.classList.add("revealed");
        button.style.background = "rgba(255, 127, 127, 0.35)";
        endGame("Wrong tile! Game over.");
      }
    });

    gameGrid.appendChild(button);
  });
}

async function fetchNewRound() {
  const difficulty = calculateDifficulty();
  const params = new URLSearchParams({ difficulty: difficulty.toFixed(2), score: state.score.toString() });
  const response = await fetch(`/api/new_round?${params}`);
  if (!response.ok) {
    throw new Error("Failed to load the next challenge.");
  }
  return response.json();
}

async function loadNextRound(isContinue = false) {
  try {
    const round = await fetchNewRound();
    state.round += 1;
    renderRound(round);
    startTimer(round.timeLimit);
    state.isPlaying = true;
    updateHud();
    setMessage(isContinue ? "Keep your streak alive!" : "Round started. Tap only the target tiles.");
    restartButton.textContent = "Restart";
  } catch (error) {
    setMessage("Unable to fetch a challenge. Try again in a moment.", "danger");
  }
}

function resetGame() {
  clearInterval(state.timer);
  state.score = 0;
  state.round = 0;
  state.isPlaying = false;
  state.tappedCount = 0;
  updateHud();
  setMessage("Ready for a fast, fresh round? Tap Start.");
  gameGrid.innerHTML = "";
  targetSymbolEl.textContent = "-";
  timerEl.textContent = "00";
}

restartButton.addEventListener("click", () => {
  resetGame();
  loadNextRound();
});

window.addEventListener("load", () => {
  loadHighScore();
  resetGame();
});
