/**
 * Heritage Coin Quest - Single Room Maze Engine
 * Features:
 * 1. Asset Preloader with visual progress tracking
 * 2. Background Music & Movement Sound Effects
 * 3. Question & Multiple Choice Shuffling
 */

const MAP_GRID = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,1,0,0,0,0,0,1,0,0,0,0,1],
  [1,0,1,0,1,0,1,1,1,0,1,0,1,1,0,1],
  [1,0,1,0,0,0,0,2,1,0,0,0,1,2,0,1],
  [1,0,1,1,1,1,0,1,1,1,1,0,1,0,0,1],
  [1,0,2,0,0,1,0,0,0,0,1,0,1,0,1,1],
  [1,1,1,1,0,1,1,1,1,0,1,0,0,0,2,1],
  [1,2,0,0,0,0,0,0,1,0,0,0,1,1,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

const TILE_SIZE = 40;

const RAW_QUESTIONS = [
  {
    q: "Anong taon itinayo ang Molo Mansion?",
    opts: ["1920", "1926", "1935", "1940"],
    correctIdx: 1
  },
  {
    q: "Sino ang orihinal na pamilyang may-ari ng Molo Mansion?",
    opts: ["Dormido", "Consing", "Yusay-Consing", "Locsin"],
    correctIdx: 2
  },
  {
    q: "Anong tawag sa tanyag na arkitektura ng lumang bahay na ito?",
    opts: ["Bahay na Bato", "Neoclassical", "Gothic Revival", "Baroque"],
    correctIdx: 0
  },
  {
    q: "Anong pampublikong pasyalan ang directly katapat ng Molo Mansion?",
    opts: ["Plaza Libertad", "Molo Plaza", "Mandurriao Plaza", "Iloilo Esplanade"],
    correctIdx: 1
  },
  {
    q: "Anong kilalang lokal na produkto ang itinatampok sa loob ng Mansion ngayon?",
    opts: ["Hablon & Crafts", "Sweet Mangoes", "Tablea Chocolates", "Wood Carvings"],
    correctIdx: 0
  }
];

class HeritageMazeGame {
  constructor() {
    this.canvas = document.getElementById('mazeCanvas');
    this.ctx = this.canvas.getContext('2d');

    this.player = { x: 1, y: 1, px: 1 * TILE_SIZE, py: 1 * TILE_SIZE, targetX: 1, targetY: 1 };
    
    this.score = 0;
    this.checkpointsCleared = 0;
    this.time = 0;
    this.activeQuestion = null;
    this.isPaused = true; // Paused during loading screen

    this.coinFrame = 0;
    this.animTimer = 0;

    this.images = {};
    this.sounds = {};

    this.shuffledQuestions = this.shuffleArray([...RAW_QUESTIONS]);

    this.props = [
      { name: 'chandelier', x: 8, y: 1 },
      { name: 'portrait', x: 3, y: 0 },
      { name: 'portrait', x: 12, y: 0 },
      { name: 'plant', x: 1, y: 7 },
      { name: 'plant', x: 14, y: 7 },
      { name: 'table', x: 8, y: 7 }
    ];

    this.checkpoints = [];
    for (let r = 0; r < MAP_GRID.length; r++) {
      for (let c = 0; c < MAP_GRID[r].length; c++) {
        if (MAP_GRID[r][c] === 2) {
          this.checkpoints.push({ x: c, y: r, active: true, id: this.checkpoints.length });
        }
      }
    }

    this.preloadAssets();
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

// --- PRELOADER & ASSET MANAGER ---
  preloadAssets() {
    const imagesToLoad = {
      ghost: 'assets/Heritage-Coin-Quest/npc-ghost.png',
      coin1: 'assets/Heritage-Coin-Quest/coin-spin-1.png',
      coin2: 'assets/Heritage-Coin-Quest/coin-spin-2.png',
      coin3: 'assets/Heritage-Coin-Quest/coin-spin-3.png',
      coin4: 'assets/Heritage-Coin-Quest/coin-spin-4.png',
      chandelier: 'assets/Heritage-Coin-Quest/prop-chandelier.png',
      portrait: 'assets/Heritage-Coin-Quest/prop-portrait.png',
      plant: 'assets/Heritage-Coin-Quest/prop-garden-plant.png',
      table: 'assets/Heritage-Coin-Quest/prop-table.png'
    };

    const audioToLoad = {
      coin: 'assets/Heritage-Coin-Quest/audio/coin-pickup.mp3',
      correct: 'assets/Heritage-Coin-Quest/audio/correct-answer.mp3',
      wrong: 'assets/Heritage-Coin-Quest/audio/wrong-answer.mp3',
      victory: 'assets/Heritage-Coin-Quest/audio/victory.mp3',
      step: 'assets/Heritage-Coin-Quest/audio/step.mp3',
      bgm: 'assets/Heritage-Coin-Quest/audio/bgm.mp3'
    };

    const totalAssets = Object.keys(imagesToLoad).length + Object.keys(audioToLoad).length;
    let loadedCount = 0;
    const trackedKeys = new Set();

    const updateProgress = (key) => {
      if (trackedKeys.has(key)) return; // Prevent double-counting the same asset
      trackedKeys.add(key);
      
      loadedCount++;
      const percent = Math.floor((loadedCount / totalAssets) * 100);
      document.getElementById('loading-bar-fill').style.width = `${percent}%`;

      if (loadedCount >= totalAssets) {
        this.completePreload();
      }
    };

    // Load Images
    for (let key in imagesToLoad) {
      this.images[key] = new Image();
      this.images[key].onload = () => updateProgress(key);
      this.images[key].onerror = () => updateProgress(key); // Proceed even on error
      this.images[key].src = imagesToLoad[key];
    }

    // Load Audio Clips with Multi-Event Fallbacks
    for (let key in audioToLoad) {
      const audio = new Audio();
      audio.preload = 'auto';

      const handleAudioLoaded = () => updateProgress(key);

      // Listen to multiple event triggers across different browsers
      audio.addEventListener('canplaythrough', handleAudioLoaded, { once: true });
      audio.addEventListener('loadeddata', handleAudioLoaded, { once: true });
      audio.addEventListener('error', handleAudioLoaded, { once: true });

      audio.src = audioToLoad[key];
      audio.load(); // Force load trigger
      this.sounds[key] = audio;
    }

    // Configure BGM Audio
    if (this.sounds.bgm) {
      this.sounds.bgm.loop = true;
      this.sounds.bgm.volume = 0.35;
    }

    // Fallback Safety Timeout (Forces game start after 5s if any audio hangs)
    setTimeout(() => {
      if (loadedCount < totalAssets) {
        console.warn('Some assets timed out loading. Unlocking start screen anyway.');
        this.completePreload();
      }
    }, 5000);
  }

  completePreload() {
    document.getElementById('loading-status').innerText = 'Ready!';
    const startBtn = document.getElementById('start-game-btn');
    startBtn.style.display = 'block';
    startBtn.onclick = () => this.startGame();
  }

  startGame() {
    document.getElementById('loading-modal').style.display = 'none';
    this.isPaused = false;
    this.playSound('bgm'); // Start BGM after user click
    this.bindEvents();
    this.startTimer();
    this.loop();
  }

  playSound(key) {
    if (this.sounds[key]) {
      if (key !== 'bgm') this.sounds[key].currentTime = 0;
      this.sounds[key].play().catch(() => {});
    }
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => {
      if (this.isPaused) return;

      let nextX = this.player.targetX;
      let nextY = this.player.targetY;

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') nextY--;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') nextY++;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') nextX--;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') nextX++;

      if (this.canMoveTo(nextX, nextY)) {
        if (this.player.targetX !== nextX || this.player.targetY !== nextY) {
          this.playSound('step'); // Play tile movement SFX
        }
        this.player.targetX = nextX;
        this.player.targetY = nextY;
      }
    });
  }

  canMoveTo(x, y) {
    if (y < 0 || y >= MAP_GRID.length || x < 0 || x >= MAP_GRID[0].length) return false;
    return MAP_GRID[y][x] !== 1;
  }

  startTimer() {
    setInterval(() => {
      if (!this.isPaused) {
        this.time++;
        document.getElementById('val-time').innerText = `${this.time}s`;
      }
    }, 1000);
  }

  update() {
    const speed = 0.25;
    const targetPx = this.player.targetX * TILE_SIZE;
    const targetPy = this.player.targetY * TILE_SIZE;

    this.player.px += (targetPx - this.player.px) * speed;
    this.player.py += (targetPy - this.player.py) * speed;

    this.player.x = Math.round(this.player.px / TILE_SIZE);
    this.player.y = Math.round(this.player.py / TILE_SIZE);

    this.animTimer++;
    if (this.animTimer % 8 === 0) {
      this.coinFrame = (this.coinFrame + 1) % 4;
    }

    this.checkpoints.forEach(cp => {
      if (cp.active && cp.x === this.player.x && cp.y === this.player.y) {
        cp.active = false;
        this.playSound('coin');
        this.triggerQuiz(cp.id);
      }
    });
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let r = 0; r < MAP_GRID.length; r++) {
      for (let c = 0; c < MAP_GRID[r].length; c++) {
        const x = c * TILE_SIZE;
        const y = r * TILE_SIZE;

        if (MAP_GRID[r][c] === 1) {
          this.ctx.fillStyle = '#1e293b';
          this.ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          this.ctx.strokeStyle = '#2a3754';
          this.ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
        } else {
          this.ctx.fillStyle = '#111827';
          this.ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          this.ctx.strokeStyle = '#1f293d';
          this.ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
        }
      }
    }

    this.props.forEach(prop => {
      const img = this.images[prop.name];
      if (img && img.complete) {
        this.ctx.drawImage(img, prop.x * TILE_SIZE, prop.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    });

    if (this.images.ghost && this.images.ghost.complete) {
      this.ctx.drawImage(this.images.ghost, 8 * TILE_SIZE + 4, 4 * TILE_SIZE + 4, 32, 32);
    }

    const coinKeys = ['coin1', 'coin2', 'coin3', 'coin4'];
    const activeCoinImg = this.images[coinKeys[this.coinFrame]];

    this.checkpoints.forEach(cp => {
      if (cp.active) {
        const x = cp.x * TILE_SIZE + 8;
        const y = cp.y * TILE_SIZE + 8;

        if (activeCoinImg && activeCoinImg.complete) {
          this.ctx.drawImage(activeCoinImg, x, y, 24, 24);
        }
      }
    });

    this.ctx.fillStyle = '#e8a5b5';
    this.ctx.beginPath();
    this.ctx.arc(
      this.player.px + TILE_SIZE / 2,
      this.player.py + TILE_SIZE / 2,
      11, 0, Math.PI * 2
    );
    this.ctx.fill();
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }

  triggerQuiz(id) {
    this.isPaused = true;

    const rawQ = this.shuffledQuestions[this.checkpointsCleared % this.shuffledQuestions.length];

    const rawChoices = rawQ.opts.map((text, idx) => ({
      text: text,
      isCorrect: idx === rawQ.correctIdx
    }));

    const shuffledChoices = this.shuffleArray(rawChoices);

    this.activeQuestion = {
      q: rawQ.q,
      choices: shuffledChoices
    };

    document.getElementById('q-header').innerText = `Ancestor Ghost · Question ${this.checkpointsCleared + 1} of 5`;
    document.getElementById('q-prompt').innerText = `"${this.activeQuestion.q}"`;

    const optsContainer = document.getElementById('q-opts');
    optsContainer.innerHTML = '';

    const labels = ['A', 'B', 'C', 'D'];
    this.activeQuestion.choices.forEach((choice, idx) => {
      const btn = document.createElement('button');
      btn.className = 'opt-btn';
      btn.innerText = `${labels[idx]} · ${choice.text}`;
      btn.onclick = () => this.handleAnswer(choice.isCorrect, btn);
      optsContainer.appendChild(btn);
    });

    document.getElementById('quiz-modal').classList.add('active');
  }

  handleAnswer(isCorrect, btnEl) {
    if (isCorrect) {
      btnEl.classList.add('correct');
      this.playSound('correct');
      this.score += 100;
      document.getElementById('val-score').innerText = this.score;
    } else {
      btnEl.classList.add('wrong');
      this.playSound('wrong');
    }

    this.checkpointsCleared++;
    document.getElementById('val-coins').innerText = `${this.checkpointsCleared}/5`;

    setTimeout(() => {
      document.getElementById('quiz-modal').classList.remove('active');
      this.isPaused = false;

      if (this.checkpointsCleared >= 5) {
        this.endGame();
      }
    }, 1000);
  }

  endGame() {
    this.isPaused = true;
    if (this.sounds.bgm) this.sounds.bgm.pause();
    this.playSound('victory');
    document.getElementById('end-stats').innerText = `Final Score: ${this.score} pts | Time: ${this.time}s`;
    document.getElementById('end-modal').classList.add('active');
  }

  loop() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.loop());
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new HeritageMazeGame();
});