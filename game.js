// Educational game logic
// Placeholder content replaced with new game logic
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
const soundButton = document.getElementById("soundButton");

const views = document.querySelectorAll(".view");

const state = {
	view: "home",
	currentGame: "letters",
	difficulty: "slow",
	score: 0,
	highScore: 0,
	timeLeft: 0,
	timer: null,
	isPlaying: false,
	leaderboard: [],
	audioEnabled: false,
};

const gameDefinitions = {
	letters: {
		title: "Letters",
		description: "Hear the letter and tap the matching card.",
		prompt: "Tap the letter shown.",
		items: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").slice(0, 12),
	},
	numbers: {
		title: "Numbers",
		description: "Count and tap the correct number.",
		prompt: "Tap the number shown.",
		items: [1, 2, 3, 4, 5, 6, 7, 8, 9],
	},
	shapes: {
		title: "Shapes",
		description: "Tap the matching shape and color.",
		prompt: "Tap the shape shown.",
		items: [
			{ label: "Circle", color: "#ff6b6b" },
			{ label: "Square", color: "#4da6ff" },
			{ label: "Triangle", color: "#ffd24d" },
			{ label: "Star", color: "#7ee2a7" },
		],
	},
};

const difficultySettings = {
	slow: { count: 2, time: 24, style: "Slow" },
	medium: { count: 3, time: 20, style: "Medium" },
	fast: { count: 4, time: 16, style: "Fast" },
	impossible: { count: 5, time: 12, style: "Impossible" },
};

const sampleScores = [
	{ name: "Mia", score: 12, game: "Letters", speed: "Slow" },
	{ name: "Noah", score: 10, game: "Numbers", speed: "Medium" },
	{ name: "Ava", score: 11, game: "Shapes", speed: "Fast" },
];

function loadHighScore() {
	try {
		state.highScore = parseInt(localStorage.getItem("gnl-highscore"), 10) || 0;
	} catch {
		state.highScore = 0;
	}
	highScoreEl.textContent = state.highScore;
}

function saveHighScore() {
	localStorage.setItem("gnl-highscore", String(state.highScore));
}

function loadLeaderboard() {
	try {
		state.leaderboard = JSON.parse(localStorage.getItem("gnl-leaderboard")) || [];
	} catch {
		state.leaderboard = [];
	}
}

function saveLeaderboard() {
	localStorage.setItem("gnl-leaderboard", JSON.stringify(state.leaderboard));
}

function setView(viewName) {
	state.view = viewName;
	views.forEach((view) => view.classList.toggle("active", view.id === `${viewName}View`));
	navButtons.forEach((button) => button.classList.toggle("active", button.dataset.view === viewName));
	if (viewName === "leaderboard") renderLeaderboard();
	if (viewName === "games") renderGamePanel();
}

function setStatus(text, type = "normal") {
	gameStatus.textContent = text;
	gameStatus.style.color = type === "danger" ? "#ff8c8c" : type === "success" ? "#7ee2a7" : "var(--text)";
}

function resetGameState() {
	clearInterval(state.timer);
	state.score = 0;
	state.timeLeft = 0;
	state.isPlaying = false;
	updateHud();
}

function updateHud() {
	scoreEl.textContent = state.score;
	highScoreEl.textContent = state.highScore;
	timerEl.textContent = String(state.timeLeft).padStart(2, "0");
}

function speak(text) {
	if (!state.audioEnabled || !window.speechSynthesis) return;
	window.speechSynthesis.cancel();
	const utterance = new SpeechSynthesisUtterance(text);
	utterance.rate = 1.05;
	utterance.pitch = 1.1;
	window.speechSynthesis.speak(utterance);
}

function renderGamePanel() {
	const game = gameDefinitions[state.currentGame];
	gameDescription.textContent = game.description;
	gameTabs.forEach((button) => button.classList.toggle("active", button.dataset.game === state.currentGame));
	difficultyButtons.forEach((button) => button.classList.toggle("active", button.dataset.difficulty === state.difficulty));
	gameContainer.innerHTML = `<div class="game-welcome"><h2>${game.title}</h2><p>${game.prompt}</p></div>`;
	setStatus("Tap Start to begin the learning game.");
	saveScoreButton.classList.add("hidden");
	resetGameState();
}

function shuffle(array) {
	const copy = [...array];
	for (let i = copy.length - 1; i > 0; i -= 1) {
		const j = Math.floor(Math.random() * (i + 1));
		[copy[i], copy[j]] = [copy[j], copy[i]];
	}
	return copy;
}

function createRound() {
	const game = gameDefinitions[state.currentGame];
	const difficulty = difficultySettings[state.difficulty];
	const items = shuffle(game.items).slice(0, difficulty.count + 1);
	const target = items[Math.floor(Math.random() * items.length)];
	return { target, options: shuffle(items), time: difficulty.time };
}

function renderRound(round) {
	const game = gameDefinitions[state.currentGame];
	state.timeLeft = round.time;
	updateHud();
	state.isPlaying = true;
	gameContainer.innerHTML = `<div class="answer-grid"></div>`;
	const answerGrid = gameContainer.querySelector(".answer-grid");
	if (!answerGrid) return;

	round.options.forEach((item) => {
		const button = document.createElement("button");
		button.className = "answer-button";
		if (state.currentGame === "shapes") {
			button.innerHTML = `
				<div class="shape-card">
					<div class="shape-icon" style="background:${item.color}; border-radius:${item.label === 'Square' ? '18px' : item.label === 'Circle' ? '50%' : item.label === 'Star' ? '20%' : '8px'};">${item.label === 'Star' ? '★' : ''}</div>
					<div>${item.label}</div>
				</div>`;
			button.dataset.value = item.label;
		} else {
			button.textContent = item;
			button.dataset.value = item;
		}
		button.addEventListener("click", () => handleAnswer(item, round.target));
		answerGrid.appendChild(button);
	});

	const spokenTarget = state.currentGame === "shapes" ? `${round.target.label} ${round.target.color}` : round.target;
	speak(`Tap the ${spokenTarget}`);
	setStatus(`Tap the ${spokenTarget}`);
	startTimer(round.time);
}

function handleAnswer(selected, target) {
	if (!state.isPlaying) return;
	const correct = state.currentGame === "shapes"
		? selected.label === target.label && selected.color === target.color
		: selected === target;

	if (correct) {
		state.score += 1;
		setStatus("Correct! Great job.", "success");
		speak("Correct!");
		nextRound();
	} else {
		setStatus("Try again!", "danger");
		speak("Try again.");
	}
	updateHud();
}

function nextRound() {
	clearInterval(state.timer);
	const round = createRound();
	renderRound(round);
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
			endGame();
		}
	}, 1000);
}

function endGame() {
	state.isPlaying = false;
	clearInterval(state.timer);
	setStatus(`Time's up! You scored ${state.score}.`, "danger");
	saveScoreButton.classList.remove("hidden");
	if (state.score > state.highScore) {
		state.highScore = state.score;
		saveHighScore();
	}
	updateHud();
}

function startGame() {
	if (state.isPlaying) return;
	state.score = 0;
	saveScoreButton.classList.add("hidden");
	nextRound();
}

function renderLeaderboard() {
	loadLeaderboard();
	const rows = [...sampleScores, ...state.leaderboard]
		.sort((a, b) => b.score - a.score)
		.slice(0, 12)
		.map((item, index) => `
			<tr>
				<td>${index + 1}</td>
				<td>${item.name}</td>
				<td>${item.score}</td>
				<td>${item.game}</td>
				<td>${item.speed}</td>
			</tr>`)
		.join("");
	leaderboardBody.innerHTML = rows;
	leaderboardFooter.textContent = `Top ${Math.min(12, rows.length ? rows.length : 0)} scores from the learning app.`;
}

function saveScore() {
	const name = prompt("Enter a name to save this score", localStorage.getItem("gnl-player") || "Friend");
	if (!name) return;
	localStorage.setItem("gnl-player", name);
	state.leaderboard.push({
		name,
		score: state.score,
		game: gameDefinitions[state.currentGame].title,
		speed: difficultySettings[state.difficulty].style,
	});
	saveLeaderboard();
	renderLeaderboard();
	saveScoreButton.classList.add("hidden");
	setStatus("Score saved! Nice work.", "success");
}

function enableAudio() {
	state.audioEnabled = !state.audioEnabled;
	soundButton.textContent = state.audioEnabled ? "Sound off" : "Play sound";
	if (state.audioEnabled) {
		speak("Sound is now on.");
		setTimeout(() => {
			soundButton.textContent = "Sound off";
		}, 1200);
	}
}

gameTabs.forEach((button) => {
	button.addEventListener("click", () => {
		state.currentGame = button.dataset.game;
		renderGamePanel();
	});
});

viewButtons.forEach((button) => {
	button.addEventListener("click", () => setView(button.dataset.view));
});

difficultyButtons.forEach((button) => {
	button.addEventListener("click", () => {
		state.difficulty = button.dataset.difficulty;
		renderGamePanel();
	});
});

startButton.addEventListener("click", startGame);
saveScoreButton.addEventListener("click", saveScore);
soundButton.addEventListener("click", enableAudio);

window.addEventListener("load", () => {
	loadHighScore();
	loadLeaderboard();
	renderGamePanel();
	setView("home");
});