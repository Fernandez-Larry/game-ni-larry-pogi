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
	// use a slower, clearer voice for young children
	window.speechSynthesis.cancel();
	const utterance = new SpeechSynthesisUtterance(text);
	utterance.rate = 0.85;
	utterance.pitch = 1.0;
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

	// Build a play floor with a visible target area; items will be scattered freely (not boxed)
	gameContainer.innerHTML = `<div class="play-floor" id="playFloor"><div class="target-area" id="targetArea"></div></div>`;
	const floor = gameContainer.querySelector('#playFloor');
	const targetEl = gameContainer.querySelector('#targetArea');
	if (!floor || !targetEl) return;

	// Render the target in the target area (large and clear)
	if (state.currentGame === 'shapes') {
		targetEl.innerHTML = `<div class="floating-shape" style="background:${round.target.color}; width:72px; height:72px; border-radius:${round.target.label === 'Square' ? '12px' : round.target.label === 'Circle' ? '50%' : round.target.label === 'Star' ? '20%' : '8px'}; display:grid; place-items:center; font-weight:900">${round.target.label === 'Star' ? '★' : ''}</div>`;
	} else {
		targetEl.textContent = String(round.target);
	}

	// Create floating items and scatter them randomly on the floor
	const placedRects = [];
	function doesOverlap(r) {
		return placedRects.some(pr => !(r.right < pr.left || r.left > pr.right || r.bottom < pr.top || r.top > pr.bottom));
	}

	round.options.forEach((item, idx) => {
		const el = document.createElement('div');
		el.className = 'floating-item';
		// color choices for variation
		const palette = ['#ffec99','#ffd6a5','#caffbf','#9bf6ff','#ffd6e0','#bdb2ff'];
		el.style.background = palette[idx % palette.length];
		if (state.currentGame === 'shapes') {
			el.innerHTML = `<div style="width:48px; height:48px; display:grid; place-items:center; border-radius:${item.label === 'Square' ? '8px' : item.label === 'Circle' ? '50%' : item.label === 'Star' ? '20%' : '6px'}; background:${item.color};">${item.label === 'Star' ? '★' : ''}</div>`;
			el.dataset.value = JSON.stringify(item);
		} else {
			el.textContent = String(item);
			el.dataset.value = JSON.stringify(item);
		}
		el.setAttribute('draggable','true');

		// click handler
		el.addEventListener('click', () => {
			const parsed = JSON.parse(el.dataset.value);
			handleAnswer(parsed, round.target);
		});

		// drag handlers
		el.addEventListener('dragstart', (e) => {
			e.dataTransfer.setData('text/plain', el.dataset.value);
		});

		floor.appendChild(el);

		// position item (try to avoid overlaps)
		const maxAttempts = 12;
		let placed = false;
		for (let attempt = 0; attempt < maxAttempts && !placed; attempt += 1) {
			const fw = floor.clientWidth || floor.offsetWidth;
			const fh = floor.clientHeight || floor.offsetHeight;
			const ew = el.offsetWidth || 80;
			const eh = el.offsetHeight || 80;
			const left = Math.floor(Math.random() * Math.max(1, fw - ew - 24)) + 12;
			const top = Math.floor(Math.random() * Math.max(1, fh - eh - 24)) + 12;
			const rect = { left, top, right: left + ew, bottom: top + eh };
			if (!doesOverlap(rect)) {
				el.style.left = left + 'px';
				el.style.top = top + 'px';
				placedRects.push(rect);
				placed = true;
			}
		}
		if (!placed) { el.style.left = '24px'; el.style.top = (20 + idx * 60) + 'px'; }
	});

	// enable drop on target area
	targetEl.addEventListener('dragover', (e) => { e.preventDefault(); });
	targetEl.addEventListener('drop', (e) => {
		e.preventDefault();
		const data = e.dataTransfer.getData('text/plain');
		let parsed = null;
		try { parsed = JSON.parse(data); } catch { parsed = data; }
		handleAnswer(parsed, round.target);
	});

	// Prompt the child in a friendly way
	let promptText = '';
	if (state.currentGame === 'letters') promptText = `Can you pick the letter ${round.target}, kid?`;
	else if (state.currentGame === 'numbers') promptText = `Can you pick the number ${round.target}, kid?`;
	else promptText = `Can you pick the ${round.target.label}, kid?`;

	speak(promptText);
	setStatus(promptText);
	startTimer(round.time);
}

function handleAnswer(selected, target) {
	if (!state.isPlaying) return;

	function isEqual(a, b) {
		if (typeof a === 'object' && typeof b === 'object') return JSON.stringify(a) === JSON.stringify(b);
		return String(a) === String(b);
	}

	const correct = isEqual(selected, target);

	if (correct) {
		state.score += 1;
		const praises = ['Yeyy!', 'Amazing!', 'Great job!', 'Well done!', 'You did it!'];
		const praise = praises[Math.floor(Math.random() * praises.length)];
		setStatus('Correct! ' + praise, 'success');
		speak(praise);
		// small delay so praise is heard before next prompt
		setTimeout(() => nextRound(), 700);
	} else {
		setStatus('Try again!', 'danger');
		speak('Try again.');
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