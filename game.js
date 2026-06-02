const navButtons = document.querySelectorAll(".nav-button");
const viewButtons = document.querySelectorAll("[data-view]");
const gameTabs = document.querySelectorAll(".subtab");
const difficultyButtons = document.querySelectorAll(".difficulty-button");
const gameDescription = document.getElementById("gameDescription");
const gameContainer = document.getElementById("gameContainer");
const gameStatus = document.getElementById("gameStatus");
const startButton = document.getElementById("gameStartButton");
const saveScoreButton = document.getElementById("saveScoreButton");
const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("highScore");
const timerEl = document.getElementById("timer");
const leaderboardBody = document.getElementById("leaderboardBody");
const leaderboardFooter = document.getElementById("leaderboardFooter");
const loadingScreen = document.getElementById("loadingScreen");
const loadingMessage = document.getElementById("loadingMessage");
const toastMessage = document.getElementById("toastMessage");

const views = document.querySelectorAll(".view");

const difficultyValues = {
  slow: 1.2,
  medium: 3.5,
  fast: 5.5,
  impossible: 7.9,
};

const circleSettings = {
  slow: { interval: 1200, size: 80, time: 35, points: 5 },
  medium: { interval: 850, size: 60, time: 28, points: 10 },
  fast: { interval: 550, size: 46, time: 22, points: 16 },
  impossible: { interval: 360, size: 30, time: 16, points: 24 },
};

const sampleScores = [
  { name: "Aya", score: 2940, game: "Tile Sprint", difficulty: "Fast" },
  { name: "Jun", score: 2780, game: "Circle Dash", difficulty: "Medium" },
  { name: "Maya", score: 2330, game: "Tile Sprint", difficulty: "Impossible" },
];

const descriptions = {
  tileSprint: "Find the target icon and avoid wrong tiles. Every round is randomized so the challenge stays fresh.",
  circleDash: "Tap moving circles before time runs out. Faster difficulty makes the circles smaller and quicker.",
};

const state = {
  view: "home",
  currentGame: "tileSprint",
  difficulty: "medium",
  score: 0,
  highScore: 0,
  timeLeft: 0,
  timer: null,
  isPlaying: false,
  activeRound: null,
  tappedCount: 0,
  circleSpawner: null,
  circleElement: null,
  leaderboard: [],
  firstToast: false,
};

function loadHighScore() {
  try {
    const stored = localStorage.getItem("game-ni-larry-highscore");
    state.highScore = stored ? parseInt(stored, 10) || 0 : 0;
  } catch (error) {
    state.highScore = 0;
  }
  highScoreEl.textContent = state.highScore;
}

function saveHighScore() {
  try {
    localStorage.setItem("game-ni-larry-highscore", state.highScore.toString());
  } catch (error) {
    // ignore
  }
}

function loadLeaderboard() {
  try {
    const stored = localStorage.getItem("game-ni-larry-leaderboard");
    state.leaderboard = stored ? JSON.parse(stored) : [];
  } catch (error) {
    state.leaderboard = [];
  }
}

function saveLeaderboard() {
  try {
    localStorage.setItem("game-ni-larry-leaderboard", JSON.stringify(state.leaderboard));
  } catch (error) {
    // ignore
  }
}

function showView(viewName) {
  state.view = viewName;
  views.forEach((view) => view.classList.toggle("active", view.id === `${viewName}View`));
  navButtons.forEach((button) => button.classList.toggle("active", button.dataset.view === viewName));

  if (viewName === "leaderboard") {
    renderLeaderboard();
  }

  if (viewName === "games") {
    renderGamePanel();
  }
}

function showLoading(text, duration = 1200) {
  loadingMessage.textContent = text;
  loadingScreen.classList.remove("hidden");
  setTimeout(() => {
    loadingScreen.classList.add("hidden");
  }, duration);
}

function showToast(text) {
  toastMessage.textContent = text;
  toastMessage.classList.add("visible");
  setTimeout(() => toastMessage.classList.remove("visible"), 1800);
}

function setGameDescription() {
  gameDescription.textContent = descriptions[state.currentGame];
}

function resetGameState() {
  clearInterval(state.timer);
  clearInterval(state.circleSpawner);
  if (state.circleElement && state.circleElement.parentNode) {
    state.circleElement.remove();
  }
  state.score = 0;
  state.timeLeft = 0;
  state.isPlaying = false;
  state.activeRound = null;
  state.tappedCount = 0;
  state.circleElement = null;
  state.circleSpawner = null;
  updateHud();
}

function updateHud() {
  scoreEl.textContent = state.score;
  highScoreEl.textContent = state.highScore;
  timerEl.textContent = String(state.timeLeft).padStart(2, "0");
}

function setStatus(text, type = "normal") {
  gameStatus.textContent = text;
  gameStatus.style.color = type === "danger" ? "#ff8c8c" : type === "success" ? "#7ee2a7" : "var(--text)";
}

function setActiveTab() {
  gameTabs.forEach((button) => button.classList.toggle("active", button.dataset.game === state.currentGame));
  difficultyButtons.forEach((button) => button.classList.toggle("active", button.dataset.difficulty === state.difficulty));
}

function renderGamePanel() {
  setGameDescription();
  setActiveTab();
  gameContainer.innerHTML = state.currentGame === "tileSprint" ? `<div class="game-grid" id="gameGrid"></div>` : `<div class="circle-arena" id="circleArena"></div>`;
  gameStatus.textContent = "Pick a game and press Start.";
  saveScoreButton.classList.add("hidden");
  updateHud();
}

async function fetchRound(difficulty) {
  const params = new URLSearchParams({ difficulty: difficulty.toFixed(2) });
  try {
    const response = await fetch(`/api/new_round?${params}`);
    if (response.ok) {
      return response.json();
    }
    throw new Error("Bad response");
  } catch (error) {
    return createLocalRound(difficulty);
  }
}

function createLocalRound(difficulty) {
  const symbols = ["★", "●", "■", "▲", "♥", "✦"];
  const colors = ["#ff4d4d", "#4d94ff", "#ffd24d", "#32c48d", "#cc5cff", "#ff7f3f"];
  const targetSymbol = symbols[Math.floor(Math.random() * symbols.length)];
  const targetColor = colors[Math.floor(Math.random() * colors.length)];
  const minTargets = 3;
  const extraTargets = Math.max(0, Math.floor(difficulty - 1));
  let targetCount = Math.min(6, minTargets + extraTargets + Math.floor(Math.random() * 3));
  targetCount = Math.min(targetCount, 12);
  const gridSize = 16;
  const allPositions = Array.from({ length: gridSize }, (_, index) => index);
  for (let i = allPositions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allPositions[i], allPositions[j]] = [allPositions[j], allPositions[i]];
  }
  const targetPositions = new Set(allPositions.slice(0, targetCount));
  const tiles = [];

  for (let index = 0; index < gridSize; index += 1) {
    if (targetPositions.has(index)) {
      tiles.push({ id: `tile-${index}`, symbol: targetSymbol, color: targetColor, isTarget: true });
    } else {
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      const color = colors[Math.floor(Math.random() * colors.length)];
      tiles.push({ id: `tile-${index}`, symbol, color, isTarget: symbol === targetSymbol && color === targetColor ? colors[(colors.indexOf(color) + 1) % colors.length] : color });
    }
  }

  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }

  return {
    roundId: Date.now(),
    targetSymbol,
    targetColor,
    targetCount,
    gridSize,
    tiles,
    timeLimit: Math.max(8, 18 - Math.round(difficulty * 1.5)),
    pointsPerHit: Math.max(10, 15 + Math.round(difficulty * 2)),
    hint: `Tap every ${targetSymbol} and fill the board fast!`,
    difficulty,
  };
}

function renderTileRound(round) {
  const tileGrid = document.getElementById("gameGrid");
  if (!tileGrid) return;
  tileGrid.innerHTML = "";
  state.activeRound = round;
  state.tappedCount = 0;

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
        setStatus("Great tap! Keep going.", "success");
        if (state.tappedCount >= round.targetCount) {
          finishGame("Well done! You cleared the round.");
        }
      } else {
        button.classList.add("revealed");
        button.style.background = "rgba(255, 127, 127, 0.35)";
        finishGame("That was a wrong tile. Game over.");
      }
    });

    tileGrid.appendChild(button);
  });
}

function startCircleGame() {
  resetGameState();
  state.isPlaying = true;
  const config = circleSettings[state.difficulty];
  state.timeLeft = config.time;
  updateHud();
  gameContainer.innerHTML = `<div class="circle-arena" id="circleArena"></div>`;
  const circleArena = document.getElementById("circleArena");
  if (!circleArena) return;

  function spawnCircle() {
    if (!state.isPlaying) return;
    if (state.circleElement && state.circleElement.parentNode) {
      state.circleElement.remove();
    }
    const circle = document.createElement("button");
    const diameter = config.size;
    const maxX = Math.max(0, circleArena.clientWidth - diameter);
    const maxY = Math.max(0, circleArena.clientHeight - diameter);
    const x = Math.floor(Math.random() * (maxX + 1));
    const y = Math.floor(Math.random() * (maxY + 1));

    circle.className = "circle-item";
    circle.style.width = `${diameter}px`;
    circle.style.height = `${diameter}px`;
    circle.style.left = `${x}px`;
    circle.style.top = `${y}px`;
    circle.style.background = `linear-gradient(135deg, ${state.difficulty === "impossible" ? "#ff5f7a" : "#5ec8ff"}, ${state.difficulty === "slow" ? "#ffd24d" : "#cc5cff"})`;
    circle.textContent = "+";

    circle.addEventListener("click", (event) => {
      event.stopPropagation();
      if (!state.isPlaying) return;
      state.score += config.points;
      if (state.score > state.highScore) {
        state.highScore = state.score;
        saveHighScore();
      }
      updateHud();
      setStatus("Nice hit! Keep the tempo.", "success");
      circle.remove();
      state.circleElement = null;
      spawnCircle();
    });

    circleArena.appendChild(circle);
    state.circleElement = circle;
  }

  spawnCircle();
  state.circleSpawner = setInterval(() => {
    if (!state.isPlaying) return;
    spawnCircle();
  }, config.interval);

  startTimer(config.time);
  setStatus("Tap the circles fast!", "success");
}

function finishGame(message) {
  state.isPlaying = false;
  clearInterval(state.timer);
  clearInterval(state.circleSpawner);
  setStatus(message, "danger");
  saveScoreButton.classList.remove("hidden");
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
      finishGame("Time's up! Great effort.");
    }
  }, 1000);
}

async function startTileSprint() {
  resetGameState();
  state.isPlaying = true;
  setStatus("Loading the next challenge...");
  const difficulty = difficultyValues[state.difficulty];
  const round = await fetchRound(difficulty);
  if (!round) {
    setStatus("Unable to load the challenge. Please try again.", "danger");
    return;
  }
  state.activeRound = round;
  state.timeLeft = round.timeLimit;
  renderTileRound(round);
  startTimer(round.timeLimit);
  setStatus("Tap only the target tiles!", "success");
  saveScoreButton.classList.add("hidden");
}

function startGame() {
  if (state.currentGame === "tileSprint") {
    startTileSprint();
  } else {
    startCircleGame();
    saveScoreButton.classList.add("hidden");
  }
}

function renderLeaderboard() {
  loadLeaderboard();
  const combined = [...sampleScores, ...state.leaderboard];
  combined.sort((a, b) => b.score - a.score);
  const rows = combined.slice(0, 12).map((entry, index) => {
    return `
      <tr>
        <td>${index + 1}</td>
        <td>${entry.name}</td>
        <td>${entry.score}</td>
        <td>${entry.game}</td>
        <td>${entry.difficulty}</td>
      </tr>`;
  });
  leaderboardBody.innerHTML = rows.join("");
  leaderboardFooter.textContent = `Showing the top ${Math.min(12, combined.length)} scores. Save your next round to add to the board.`;
}

function saveCurrentScore() {
  const playerName = prompt("Enter your name for the leaderboard", localStorage.getItem("game-ni-larry-player") || "Player").trim();
  if (!playerName) {
    setStatus("Name is required to save your score.", "danger");
    return;
  }

  localStorage.setItem("game-ni-larry-player", playerName);
  state.leaderboard.push({
    name: playerName,
    score: state.score,
    game: state.currentGame === "tileSprint" ? "Tile Sprint" : "Circle Dash",
    difficulty: state.difficulty.charAt(0).toUpperCase() + state.difficulty.slice(1),
    date: Date.now(),
  });
  saveLeaderboard();
  renderLeaderboard();
  saveScoreButton.classList.add("hidden");
  setStatus("Score saved! Check the leaderboard.", "success");
}

viewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const view = button.dataset.view;
    if (view) {
      showView(view);
      showToast("HAHAHAHAHAHHA SABEL");
    }
  });
});

gameTabs.forEach((button) => {
  button.addEventListener("click", () => {
    state.currentGame = button.dataset.game;
    renderGamePanel();
    showToast(`Game mode switched to ${button.textContent}`);
  });
});

difficultyButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.difficulty = button.dataset.difficulty;
    setActiveTab();
    setGameDescription();
    showToast(`Difficulty set to ${button.textContent}`);
  });
});

startButton.addEventListener("click", () => {
  startGame();
});

saveScoreButton.addEventListener("click", () => {
  saveCurrentScore();
});

document.body.addEventListener("click", () => {
  if (!state.firstToast) {
    showToast("HAHAHAHAHAHHA SABEL");
    state.firstToast = true;
  }
});

window.addEventListener("load", () => {
  loadHighScore();
  loadLeaderboard();
  renderGamePanel();
  showLoading("HAHAHAHAHAHHA SABEL", 1200);
});
