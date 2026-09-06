/**
 * Chrono-Defenders Game Logic
 * Handles game loop, dynamic tutorial postures, epoch warp transitions, 
 * quiz logic, audio management, voiceover sync, typewriter animations, and HUD rendering.
 */

// Timeline eras and corresponding boss metadata
const EPOCHS = [
  { name: "1800s · Spanish Era", bossKey: "bossSpanish", bgKey: "bg1800s", color: "#0d0722", bossTitle: "GOVERNOR-GENERAL ANOMALY" },
  { name: "1940s · WWII Era", bossKey: "bossWWII", bgKey: "bg1940s", color: "#120a17", bossTitle: "IMPERIAL TEMPORAL COMMANDER" },
  { name: "2020s · Present Era", bossKey: "bossPresent", bgKey: "bgPresent", color: "#030712", bossTitle: "CYBER-CORRUPTER 2026" }
];

// Tutorial sequence with dynamic pose keys and audio bindings
const TUTORIAL_DIALOGUE = [
  { 
    speaker: "Burgertron", 
    text: "Greetings, Agent! Welcome to the Chrono-Defense Command. Time itself is under attack!",
    spriteKey: "guideNormal",
    audioKey: "tut_voice_1"
  },
  { 
    speaker: "Burgertron", 
    text: "Temporal Anomalies are altering history across three critical Philippine eras.",
    spriteKey: "guideCrossed",
    audioKey: "tut_voice_2"
  },
  { 
    speaker: "Burgertron", 
    text: "Answer historical queries correctly to launch plasma charges and restore the timeline!",
    spriteKey: "guidePoint",
    audioKey: "tut_voice_3"
  },
  { 
    speaker: "Burgertron", 
    text: "Beware: incorrect answers will cause timeline backlash and damage your shield. Good luck!",
    spriteKey: "guideCrossed",
    audioKey: "tut_voice_4"
  }
];

// Quiz question bank mapped to boss dialogue triggers
const QUESTIONS = [
  {
    q: "Anong taon naitatag ang Katipunan sa pamumuno ni Andres Bonifacio?",
    opts: ["1892", "1896", "1898", "1901"],
    correctIdx: 0,
    bossDialogue: "Hindi mo kailanman mababago ang kasaysayan ng Katipunan! Mamatay ang iyong pag-asa!"
  },
  {
    q: "Sino ang tinaguriang 'Lakan ng Tondo' na lumaban sa mga Espanyol?",
    opts: ["Rajah Sulayman", "Rajah Matanda", "Rajah Lakandula", "Lapulapu"],
    correctIdx: 2,
    bossDialogue: "Ang lakas ng Maynila at ng Tondo ay nakatali sa aking kamay!"
  },
  {
    q: "Sino ang BGen na namuno sa pagtatanggol sa Bataan noong WWII?",
    opts: ["Gen. Douglas MacArthur", "Gen. Vicente Lim", "Gen. Jonathan Wainwright", "Gen. Edward King"],
    correctIdx: 3,
    bossDialogue: "Bagsak na ang Bataan! Walang sinumang makakaligtas sa paghabol ng panahon!"
  },
  {
    q: "Anong makasaysayang kaganapan ang nangyari noong Abril 9, 1942?",
    opts: ["Araw ng Kagitingan (Bataan Death March)", "Liberation of Manila", "Battle of Leyte Gulf", "Fall of Corregidor"],
    correctIdx: 0,
    bossDialogue: "Suffer the eternal march of time! Burado na ang inyong kagitingan!"
  },
  {
    q: "Anong batas sa modernong panahon ang nagpoprotekta sa pambansang pamana?",
    opts: ["RA 10066 (National Cultural Heritage Act)", "RA 9003", "RA 7610", "RA 10533"],
    correctIdx: 0,
    bossDialogue: "Ang kultura at kasaysayan niyo ay tuluyan nang mawawala sa hinaharap!"
  }
];

class ChronoDefenders {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    // Progression & Stats
    this.currentEpochIdx = 0;
    this.questionIdx = 0;
    this.playerShield = 100;
    this.bossAnima = 100;
    this.score = 0;

    // Animation & Hit VFX States
    this.animTime = 0;
    this.bossHitFlashTimer = 0;
    this.playerHitFlashTimer = 0;

    // Active screen entities
    this.projectiles = [];
    this.stars = [];

    // Dialogue overlay control flags
    this.isDialogueActive = false;
    this.isTutorialActive = false;
    this.tutorialIdx = 0;
    this.currentDialogueText = "";

    // Synchronized voiceover and typewriter animation states
    this.currentTutorialAudio = null;
    this.typewriterTimeout = null;
    this.typedText = "";

    // Hyperspace warp effect state machine
    this.warpPhase = 'none'; // 'portal', 'hyperflight', 'whiteflash', 'none'
    this.portalSize = 0;
    this.portalRotation = 0;
    this.warpProgress = 0;
    this.whiteFlashAlpha = 0;
    this.warpCallback = null;

    // Boss defeat animation counters
    this.isDefeatedAnimation = false;
    this.defeatFrameIndex = 0;
    this.defeatTimer = 0;

    // Resource containers
    this.images = {};
    this.sounds = {};
    this.duckingTimeout = null;
    this.shuffledQuestions = [...QUESTIONS];

    this.init();
  }

  init() {
    // Wire up start button
    const btn = document.getElementById('start-game-btn');
    if (btn) btn.onclick = () => this.startGame();

    // Advance dialogues via screen click or key presses
    this.canvas.addEventListener('click', () => {
      if (this.isTutorialActive) {
        this.advanceTutorial();
      } else if (this.isDialogueActive) {
        this.advanceDialogue();
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        if (this.isTutorialActive) {
          this.advanceTutorial();
        } else if (this.isDialogueActive) {
          this.advanceDialogue();
        }
      }
    });

    window.addEventListener('resize', () => this.resizeCanvas());
    this.resizeCanvas();

    // Pre-initialize background systems and load assets
    this.initStarfield();
    this.preloadAudio();
    this.preloadAssets();
  }

  // Ensures canvas maintains its 16:9 base internal resolution
  resizeCanvas() {
    if (!this.canvas) return;
    this.canvas.width = 1280;
    this.canvas.height = 720;
  }

  // Generate 3D pseudo-starfield background particles
  initStarfield() {
    this.stars = [];
    for (let i = 0; i < 150; i++) {
      this.stars.push({
        x: (Math.random() - 0.5) * this.canvas.width,
        y: (Math.random() - 0.5) * this.canvas.height,
        z: Math.random() * this.canvas.width
      });
    }
  }

  preloadAudio() {
    const soundList = {
      bgm: 'assets/Molo-Chrolo-Defenders/audio/chrono.mp3',
      correct: 'assets/Molo-Chrolo-Defenders/audio/correct.wav',
      wrong: 'assets/Molo-Chrolo-Defenders/audio/wrong.wav',
      playerDead: 'assets/Molo-Chrolo-Defenders/audio/playerdead.wav',
      bossDead: 'assets/Molo-Chrolo-Defenders/audio/BossDead.wav',
      laser: 'assets/Molo-Chrolo-Defenders/audio/laser.mp3',
      warp: 'assets/Molo-Chrolo-Defenders/audio/warp.mp3',
      hyperspace: 'assets/Molo-Chrolo-Defenders/audio/hyperspace.mp3',
      dialogueBeep: 'assets/Molo-Chrolo-Defenders/audio/dialogue.wav',
      
      // yung voiceover ni reylen guice cite1-4
      tut_voice_1: 'assets/Molo-Chrolo-Defenders/audio/tut_1.mp3',
      tut_voice_2: 'assets/Molo-Chrolo-Defenders/audio/tut_2.mp3',
      tut_voice_3: 'assets/Molo-Chrolo-Defenders/audio/tut_3.mp3',
      tut_voice_4: 'assets/Molo-Chrolo-Defenders/audio/tut_4.mp3'
    };

    for (let key in soundList) {
      this.sounds[key] = new Audio(soundList[key]);
      if (key === 'bgm') {
        this.sounds[key].loop = true;
        this.sounds[key].volume = 0.45;
      }
    }
  }

  // Temporarily lowers music volume so sound effects or dialogue cues pop through better
  duckBGM(durationMs = 2500) {
    if (this.sounds.bgm) {
      this.sounds.bgm.volume = 0.15;
      if (this.duckingTimeout) clearTimeout(this.duckingTimeout);
      this.duckingTimeout = setTimeout(() => {
        if (this.sounds.bgm) this.sounds.bgm.volume = 0.45;
      }, durationMs);
    }
  }

  playSound(key, duck = false) {
    if (this.sounds[key]) {
      if (duck) this.duckBGM();
      this.sounds[key].currentTime = 0;
      this.sounds[key].play().catch(() => {});
    }
  }

  playBGM() {
    if (this.sounds.bgm) {
      this.sounds.bgm.play().catch(() => {});
    }
  }

  stopBGM() {
    if (this.sounds.bgm) {
      this.sounds.bgm.pause();
    }
  }

  // Asynchronously preloads all sprite/background image assets before launching
  preloadAssets() {
    const assets = {
      player: 'assets/Molo-Chrolo-Defenders/sprites/player-pilot.png',
      
      // All 3 guide poses loaded separately
      guideNormal: 'assets/Molo-Chrolo-Defenders/sprites/sprite2.png',
      guidePoint: 'assets/Molo-Chrolo-Defenders/sprites/Sprite2point.png',
      guideCrossed: 'assets/Molo-Chrolo-Defenders/sprites/Sprite2crossed.png',

      bossSpanish: 'assets/Molo-Chrolo-Defenders/sprites/boss-spanish.png',
      bossWWII: 'assets/Molo-Chrolo-Defenders/sprites/boss-wwii.png',
      bossPresent: 'assets/Molo-Chrolo-Defenders/sprites/boss-present.png',
      defeat1: 'assets/Molo-Chrolo-Defenders/sprites/boss-defeat-1.png',
      defeat2: 'assets/Molo-Chrolo-Defenders/sprites/boss-defeat-2.png',
      defeat3: 'assets/Molo-Chrolo-Defenders/sprites/boss-defeat-3.png',
      bgSpace: 'assets/Molo-Chrolo-Defenders/backgrounds/bg-space.png',
      bg1800s: 'assets/Molo-Chrolo-Defenders/backgrounds/bg-1800s.png',
      bg1940s: 'assets/Molo-Chrolo-Defenders/backgrounds/bg-1940s.png',
      bgPresent: 'assets/Molo-Chrolo-Defenders/backgrounds/bg-present.png',
      warpPortal: 'assets/Molo-Chrolo-Defenders/sprites/warp-portal.png'
    };

    let loaded = 0;
    const total = Object.keys(assets).length;

    for (let key in assets) {
      this.images[key] = new Image();
      this.images[key].onload = () => {
        loaded++;
        if (loaded >= total) this.ready();
      };
      this.images[key].onerror = () => {
        loaded++;
        if (loaded >= total) this.ready();
      };
      this.images[key].src = assets[key];
    }
  }

  ready() {
    const statusEl = document.getElementById('loading-status');
    if (statusEl) statusEl.innerText = "Temporal Matrix Ready!";
  }

  startGame() {
    const modal = document.getElementById('loading-modal');
    if (modal) modal.classList.remove('active');

    this.playBGM();
    this.updateHUD();
    this.loop();
    this.startTutorial();
  }

  startTutorial() {
    this.isTutorialActive = true;
    this.tutorialIdx = 0;
    this.duckBGM(4000);
    this.playTutorialStep();
  }

  playTutorialStep() {
    const currentStep = TUTORIAL_DIALOGUE[this.tutorialIdx];
    if (!currentStep) return;

    // Stop any active tutorial voice line and clear active typewriter timeouts
    if (this.currentTutorialAudio) {
      this.currentTutorialAudio.pause();
      this.currentTutorialAudio.currentTime = 0;
    }
    if (this.typewriterTimeout) {
      clearTimeout(this.typewriterTimeout);
    }

    // Play synced tutorial voice track
    if (currentStep.audioKey && this.sounds[currentStep.audioKey]) {
      this.currentTutorialAudio = this.sounds[currentStep.audioKey];
      this.currentTutorialAudio.currentTime = 0;
      this.currentTutorialAudio.play().catch(() => {});
    }

    // Typewriter text animation
    this.typedText = "";
    let charIndex = 0;
    const speed = 30; // Milliseconds per character

    const typeChar = () => {
      if (charIndex < currentStep.text.length) {
        this.typedText = currentStep.text.slice(0, charIndex + 1);
        charIndex++;
        this.typewriterTimeout = setTimeout(typeChar, speed);
      }
    };

    typeChar();
  }

  advanceTutorial() {
    this.playSound('dialogueBeep');

    // Stop current voiceover audio line on advance
    if (this.currentTutorialAudio) {
      this.currentTutorialAudio.pause();
      this.currentTutorialAudio.currentTime = 0;
    }

    this.tutorialIdx++;
    if (this.tutorialIdx >= TUTORIAL_DIALOGUE.length) {
      if (this.typewriterTimeout) clearTimeout(this.typewriterTimeout);
      this.isTutorialActive = false;
      this.startRoundIntro();
    } else {
      this.duckBGM(3000);
      this.playTutorialStep();
    }
  }

  // Updates HTML HUD elements (Shield bar, Boss Anima bar, Score, Era title)
  updateHUD() {
    const currentEpoch = EPOCHS[this.currentEpochIdx];
    const epochEl = document.getElementById('val-epoch');
    if (epochEl) epochEl.innerText = currentEpoch.name;

    const bossTitleTag = document.getElementById('boss-title-tag');
    if (bossTitleTag) bossTitleTag.innerText = currentEpoch.bossTitle;

    const shieldBar = document.getElementById('shield-bar');
    if (shieldBar) shieldBar.style.width = `${Math.max(0, this.playerShield)}%`;

    const bossBar = document.getElementById('boss-bar');
    if (bossBar) bossBar.style.width = `${Math.max(0, this.bossAnima)}%`;

    const scoreEl = document.getElementById('val-score');
    if (scoreEl) scoreEl.innerText = this.score;
  }

  startRoundIntro() {
    if (this.playerShield <= 0) {
      this.endGame(false);
      return;
    }

    if (this.bossAnima <= 0) {
      this.startDefeatSequence();
      return;
    }

    if (this.questionIdx >= this.shuffledQuestions.length) {
      this.questionIdx = 0;
    }

    const qData = this.shuffledQuestions[this.questionIdx];
    this.currentDialogueText = qData.bossDialogue;
    this.isDialogueActive = true;

    this.duckBGM(3500);

    const quizModal = document.getElementById('quiz-modal');
    if (quizModal) quizModal.classList.remove('active');
  }

  advanceDialogue() {
    this.playSound('dialogueBeep');
    this.isDialogueActive = false;
    this.triggerNextQuestion();
  }

  // Displays the quiz UI modal with options
  triggerNextQuestion() {
    const qData = this.shuffledQuestions[this.questionIdx];

    const qHeader = document.getElementById('q-header');
    if (qHeader) qHeader.innerText = `Epoch ${this.currentEpochIdx + 1} · Query ${this.questionIdx + 1}`;

    const qPrompt = document.getElementById('q-prompt');
    if (qPrompt) qPrompt.innerText = `"${qData.q}"`;

    const optsContainer = document.getElementById('q-opts');
    if (optsContainer) {
      optsContainer.innerHTML = '';
      const labels = ['A', 'B', 'C', 'D'];

      qData.opts.forEach((optText, idx) => {
        const btn = document.createElement('button');
        btn.className = 'opt-btn';
        btn.dataset.idx = idx;
        btn.innerText = `[${labels[idx]}] ${optText}`;
        btn.onclick = () => this.handleAnswer(idx === qData.correctIdx, btn, qData.correctIdx);
        optsContainer.appendChild(btn);
      });
    }

    const quizModal = document.getElementById('quiz-modal');
    if (quizModal) quizModal.classList.add('active');
  }

  // Processes answer selections, score/shield changes, and epoch transitions
  handleAnswer(isCorrect, btnEl, correctIdx) {
    const allBtns = document.querySelectorAll('.opt-btn');
    allBtns.forEach(b => b.style.pointerEvents = 'none');

    allBtns.forEach(b => {
      if (parseInt(b.dataset.idx) === correctIdx) {
        b.classList.add('correct');
      }
    });

    if (isCorrect) {
      this.playSound('correct', true);
      this.bossAnima = Math.max(0, this.bossAnima - 20);
      this.score += 250;
      this.spawnAttack(true);
    } else {
      this.playSound('wrong', true);
      btnEl.classList.add('wrong');
      this.playerShield = Math.max(0, this.playerShield - 20);
      this.spawnAttack(false);
    }

    this.updateHUD();

    setTimeout(() => {
      const quizModal = document.getElementById('quiz-modal');
      if (quizModal) quizModal.classList.remove('active');

      const prevEpoch = this.currentEpochIdx;

      this.questionIdx++;
      if (this.questionIdx === 2) this.currentEpochIdx = 1;
      if (this.questionIdx === 4) this.currentEpochIdx = 2;

      const epochChanged = prevEpoch !== this.currentEpochIdx;

      if (epochChanged) {
        this.executeWarpSequence(() => {
          if (this.bossAnima <= 0) {
            this.startDefeatSequence();
          } else {
            this.startRoundIntro();
          }
        });
      } else {
        if (this.bossAnima <= 0) {
          this.startDefeatSequence();
        } else {
          this.startRoundIntro();
        }
      }
    }, 1200);
  }

  // Spawns plasma beams towards target
  spawnAttack(fromPlayer) {
    this.playSound('laser');
    if (fromPlayer) {
      this.projectiles.push({
        x: this.canvas.width / 2,
        y: this.canvas.height - 240,
        targetY: 100,
        speed: 22,
        color: "#38bdf8",
        isPlayer: true
      });
    } else {
      this.projectiles.push({
        x: this.canvas.width / 2,
        y: 120,
        targetY: this.canvas.height - 240,
        speed: 20,
        color: "#ef4444",
        isPlayer: false
      });
    }
  }

  executeWarpSequence(onComplete) {
    this.playSound('warp', true);
    this.warpPhase = 'portal';
    this.portalSize = 0;
    this.portalRotation = 0;
    this.whiteFlashAlpha = 0;
    this.warpCallback = onComplete;
  }

  startDefeatSequence() {
    this.playSound('bossDead', true);
    this.isDefeatedAnimation = true;
    this.defeatFrameIndex = 0;
    this.defeatTimer = 0;
  }

  // Update loop for all object movements and state machines
  update() {
    this.animTime += 0.05;

    if (this.bossHitFlashTimer > 0) this.bossHitFlashTimer--;
    if (this.playerHitFlashTimer > 0) this.playerHitFlashTimer--;

    // Projectile movement and hit detection
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      if (p.isPlayer) {
        p.y -= p.speed;
        if (p.y <= p.targetY) {
          this.bossHitFlashTimer = 12;
          this.projectiles.splice(i, 1);
        }
      } else {
        p.y += p.speed;
        if (p.y >= p.targetY) {
          this.playerHitFlashTimer = 12;
          this.projectiles.splice(i, 1);
        }
      }
    }

    // Handles the multi-stage hyperlight warp logic
    if (this.warpPhase === 'portal') {
      this.portalSize += 14;
      this.portalRotation += 0.05;
      if (this.portalSize >= 500) {
        this.playSound('hyperspace', true);
        this.warpPhase = 'hyperflight';
        this.warpProgress = 0;
      }
    } else if (this.warpPhase === 'hyperflight') {
      this.warpProgress += 0.02;
      this.portalRotation += 0.1;

      if (this.warpProgress >= 0.7 && this.whiteFlashAlpha < 1.0) {
        this.whiteFlashAlpha += 0.08;
      }

      if (this.warpProgress >= 1.0) {
        this.warpPhase = 'whiteflash';
      }
    } else if (this.warpPhase === 'whiteflash') {
      this.whiteFlashAlpha -= 0.05;
      if (this.whiteFlashAlpha <= 0) {
        this.whiteFlashAlpha = 0;
        this.warpPhase = 'none';
        if (this.warpCallback) {
          const cb = this.warpCallback;
          this.warpCallback = null;
          cb();
        }
      }
    }

    // Starfield speed accelerates during hyperflight
    const speed = (this.warpPhase === 'hyperflight' || this.warpPhase === 'whiteflash') ? 50 : 2;
    for (let s of this.stars) {
      s.z -= speed;
      if (s.z <= 0) {
        s.z = this.canvas.width;
        s.x = (Math.random() - 0.5) * this.canvas.width;
        s.y = (Math.random() - 0.5) * this.canvas.height;
      }
    }

    // Handles boss destruction frame updates
    if (this.isDefeatedAnimation) {
      this.defeatTimer++;
      if (this.defeatTimer % 18 === 0) {
        this.defeatFrameIndex++;
        if (this.defeatFrameIndex >= 3) {
          this.isDefeatedAnimation = false;
          this.endGame(true);
        }
      }
    }
  }

  // Canvas render pass
  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;

    const currentEpoch = EPOCHS[this.currentEpochIdx];

    // Background Layer
    const spaceImg = this.images.bgSpace;
    if (spaceImg && spaceImg.complete && spaceImg.naturalWidth > 0) {
      this.ctx.drawImage(spaceImg, 0, 0, this.canvas.width, this.canvas.height);
    } else {
      this.ctx.fillStyle = "#030712";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Era Backdrop Layer
    const bgImg = this.images[currentEpoch.bgKey];
    if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
      this.ctx.globalAlpha = 0.55;
      this.ctx.drawImage(bgImg, 0, 0, this.canvas.width, this.canvas.height);
      this.ctx.globalAlpha = 1.0;
    }

    this.drawStarfield(cx, cy);

    const floatY = Math.sin(this.animTime) * 10;

    // Warp portal rendering
    if (this.warpPhase === 'portal' || this.warpPhase === 'hyperflight') {
      const pImg = this.images.warpPortal;
      if (pImg && pImg.complete && pImg.naturalWidth > 0) {
        this.ctx.save();
        this.ctx.translate(cx, cy);
        this.ctx.rotate(this.portalRotation || 0);

        let currentSize = this.portalSize;
        if (this.warpPhase === 'hyperflight') {
          this.ctx.globalAlpha = Math.max(0, 1.0 - (this.warpProgress * 1.2));
          currentSize = 500 + (this.warpProgress * 700);
        }

        this.ctx.drawImage(pImg, -currentSize / 2, -currentSize / 2, currentSize, currentSize);
        this.ctx.restore();
      }
    }

    // Boss Rendering
    let bossScale = 1.0;
    let bossYOffset = 0;

    if (this.warpPhase === 'hyperflight') {
      bossScale = Math.max(0, 1.0 - this.warpProgress);
      bossYOffset = (cy - 50) * this.warpProgress;
    }

    const bossW = 220 * bossScale;
    const bossH = 230 * bossScale;
    const bossX = cx - bossW / 2;
    const bossY = (40 + floatY) + bossYOffset;

    if (bossScale > 0.05 && this.warpPhase !== 'whiteflash') {
      if (this.isDefeatedAnimation) {
        const defeatKeys = ['defeat1', 'defeat2', 'defeat3'];
        const activeKey = defeatKeys[Math.min(this.defeatFrameIndex, 2)];
        const img = this.images[activeKey];
        if (img && img.complete) this.ctx.drawImage(img, bossX, bossY, bossW, bossH);
      } else {
        const bossImg = this.images[currentEpoch.bossKey];
        if (bossImg && bossImg.complete && bossImg.naturalWidth > 0) {
          this.ctx.drawImage(bossImg, bossX, bossY, bossW, bossH);
        }

        if (this.bossHitFlashTimer > 0) {
          this.ctx.fillStyle = "rgba(239, 68, 68, 0.75)";
          this.ctx.fillRect(bossX, bossY, bossW, bossH);
        }
      }
    }

    // Laser Projectiles
    for (let p of this.projectiles) {
      this.ctx.fillStyle = p.color;
      this.ctx.shadowBlur = 14;
      this.ctx.shadowColor = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    }

    // Player Ship Rendering
    let playerScale = 1.0;
    let playerYOffset = 0;

    if (this.warpPhase === 'hyperflight') {
      playerScale = Math.max(0, 1.0 - this.warpProgress);
      playerYOffset = -((this.canvas.height - 300) - cy) * this.warpProgress;
    }

    const playerW = 220 * playerScale;
    const playerH = 180 * playerScale;
    const playerX = cx - playerW / 2;
    const playerY = (this.canvas.height - 420 - floatY) + playerYOffset;  

    if (playerScale > 0.05 && this.warpPhase !== 'whiteflash') {
      const playerImg = this.images.player;
      if (playerImg && playerImg.complete && playerImg.naturalWidth > 0) {
        this.ctx.drawImage(playerImg, playerX, playerY, playerW, playerH);
      }

      if (this.playerHitFlashTimer > 0) {
        this.ctx.fillStyle = "rgba(239, 68, 68, 0.75)";
        this.ctx.fillRect(playerX, playerY, playerW, playerH);
      }
    }

    // Full screen white flash during warp end
    if (this.whiteFlashAlpha > 0) {
      this.ctx.save();
      this.ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1.0, this.whiteFlashAlpha)})`;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.restore();
    }

    // Dialogue Overlay Render Pipeline
    if (this.isTutorialActive) {
      this.drawTutorialDialogueOverlay();
    } else if (this.isDialogueActive) {
      this.drawPersonaDialogueOverlay();
    }
  }

  // Renders tutorial box using the active dialogue step's custom sprite posture and animated typewriter text
  drawTutorialDialogueOverlay() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const currentStep = TUTORIAL_DIALOGUE[this.tutorialIdx];

    this.ctx.save();

    // Outer Accent Line
    this.ctx.fillStyle = "#38bdf8";
    this.ctx.beginPath();
    this.ctx.moveTo(40, h - 250);
    this.ctx.lineTo(w - 30, h - 270);
    this.ctx.lineTo(w - 60, h - 60);
    this.ctx.lineTo(20, h - 45);
    this.ctx.closePath();
    this.ctx.fill();

    // Main Box
    this.ctx.fillStyle = "#090d16";
    this.ctx.beginPath();
    this.ctx.moveTo(48, h - 242);
    this.ctx.lineTo(w - 38, h - 262);
    this.ctx.lineTo(w - 68, h - 68);
    this.ctx.lineTo(28, h - 53);
    this.ctx.closePath();
    this.ctx.fill();

    // Dynamically fetches the image corresponding to the line's spriteKey ('guideNormal', 'guideCrossed', 'guidePoint')
    const activeSpriteKey = currentStep.spriteKey || 'guideNormal';
    const guideImg = this.images[activeSpriteKey];

    if (guideImg && guideImg.complete && guideImg.naturalWidth > 0) {
      const spriteW = 180;
      const spriteH = 190;
      this.ctx.drawImage(guideImg, 70, h - spriteH - 70, spriteW, spriteH);
    }

    // Speaker Name
    this.ctx.fillStyle = "#38bdf8";
    this.ctx.font = '800 18px "Space Grotesk", sans-serif';
    this.ctx.textAlign = "left";
    this.ctx.fillText(`★ ${currentStep.speaker}`, 270, h - 200);

    // Dialogue Text with typewriter animation state
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = '700 18px "Space Grotesk", sans-serif';
    this.wrapText(this.typedText, 270, h - 160, w - 380, 28);

    // Action Prompt
    this.ctx.fillStyle = "#f0c862";
    this.ctx.font = '700 13px "JetBrains Mono", monospace';
    this.ctx.fillText("PRESS SPACE OR CLICK TO CONTINUE ▶", 270, h - 80);

    this.ctx.restore();
  }

  // Renders boss cutscene/dialogue boxes
  drawPersonaDialogueOverlay() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const currentEpoch = EPOCHS[this.currentEpochIdx];

    this.ctx.save();

    // Top Cinema Bar
    this.ctx.fillStyle = "#000000";
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(w, 0);
    this.ctx.lineTo(w, 70);
    this.ctx.lineTo(w * 0.7, 95);
    this.ctx.lineTo(w * 0.35, 45);
    this.ctx.lineTo(0, 85);
    this.ctx.closePath();
    this.ctx.fill();

    // Bottom Cinema Bar
    this.ctx.beginPath();
    this.ctx.moveTo(0, h);
    this.ctx.lineTo(w, h);
    this.ctx.lineTo(w, h - 80);
    this.ctx.lineTo(w * 0.65, h - 45);
    this.ctx.lineTo(w * 0.25, h - 110);
    this.ctx.lineTo(0, h - 60);
    this.ctx.closePath();
    this.ctx.fill();

    // Outer Accent Polygon
    this.ctx.fillStyle = "#ffffff";
    this.ctx.beginPath();
    this.ctx.moveTo(40, h - 250);
    this.ctx.lineTo(w - 30, h - 270);
    this.ctx.lineTo(w - 60, h - 60);
    this.ctx.lineTo(20, h - 45);
    this.ctx.closePath();
    this.ctx.fill();

    // Inner Box Background
    this.ctx.fillStyle = "#0a0d14";
    this.ctx.beginPath();
    this.ctx.moveTo(48, h - 242);
    this.ctx.lineTo(w - 38, h - 262);
    this.ctx.lineTo(w - 68, h - 68);
    this.ctx.lineTo(28, h - 53);
    this.ctx.closePath();
    this.ctx.fill();

    // Red Accent Slash
    this.ctx.fillStyle = "#e11d48";
    this.ctx.beginPath();
    this.ctx.moveTo(w - 260, h - 258);
    this.ctx.lineTo(w - 210, h - 256);
    this.ctx.lineTo(w - 230, h - 73);
    this.ctx.lineTo(w - 280, h - 75);
    this.ctx.closePath();
    this.ctx.fill();

    // Boss Portrait
    const bossImg = this.images[currentEpoch.bossKey];
    if (bossImg && bossImg.complete && bossImg.naturalWidth > 0) {
      const portraitW = 170;
      const portraitH = 180;
      this.ctx.drawImage(bossImg, w - portraitW - 80, h - portraitH - 70, portraitW, portraitH);
    }

    // Boss Title
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = '800 18px "Space Grotesk", sans-serif';
    this.ctx.textAlign = "right";
    this.ctx.fillText(`★ ${currentEpoch.bossTitle}`, w - 100, h - 80);

    // Boss Line
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = '700 20px "Space Grotesk", sans-serif';
    this.ctx.textAlign = "left";
    this.wrapText(this.currentDialogueText, 80, h - 180, w - 380, 32);

    // Prompt Indicator
    this.ctx.fillStyle = "#f0c862";
    this.ctx.font = '700 13px "JetBrains Mono", monospace';
    this.ctx.fillText("PRESS SPACE OR CLICK TO CONTINUE ▶", 80, h - 80);

    this.ctx.restore();
  }

  // Helper method to auto-wrap long dialogue lines into multiple rows inside canvas boxes
  wrapText(text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = this.ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        this.ctx.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    this.ctx.fillText(line, x, y);
  }

  // Draws starfield and stretches stars into motion blur lines during hyperflight
  drawStarfield(cx, cy) {
    for (let s of this.stars) {
      const k = 256 / s.z;
      const px = s.x * k + cx;
      const py = s.y * k + cy;

      if (px >= 0 && px <= this.canvas.width && py >= 0 && py <= this.canvas.height) {
        const size = Math.max(1, (1 - s.z / this.canvas.width) * 5);
        if (this.warpPhase === 'hyperflight' || this.warpPhase === 'whiteflash') {
          this.ctx.strokeStyle = "#c084fc";
          this.ctx.lineWidth = size * 1.5;
          this.ctx.beginPath();
          this.ctx.moveTo(px, py);
          this.ctx.lineTo(px + (px - cx) * 0.45, py + (py - cy) * 0.45);
          this.ctx.stroke();
        } else {
          this.ctx.fillStyle = "#ffffff";
          this.ctx.fillRect(px, py, size, size);
        }
      }
    }
  }

  endGame(isVictory) {
    this.stopBGM();
    if (isVictory) {
      this.playSound('bossDead');
    } else {
      this.playSound('playerDead');
    }

    const endStats = document.getElementById('end-stats');
    if (endStats) {
      endStats.innerText = isVictory 
        ? `Timeline secured! Final Score: ${this.score}` 
        : "Temporal Shield collapsed! History was altered.";
    }
    const endModal = document.getElementById('end-modal');
    if (endModal) endModal.classList.add('active');
  }

  loop() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.loop());
  }
}

// Bootstrap after DOM is fully parsed
window.addEventListener('DOMContentLoaded', () => {
  new ChronoDefenders();
});