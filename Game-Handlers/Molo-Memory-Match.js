/**
 * Game Handler: Molo Memory Match (Preloader & Audio-Synced Edition)
 */

const BAYBAYIN_LETTERS = ['A', 'B', 'C', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'];

const ROUND_SETTINGS = {
  1: { name: 'Alaala', title: 'Round I · Alaala', speedSec: 15, seqLen: 2 },
  2: { name: 'Pagsikad', title: 'Round II · Pagsikad', speedSec: 12, seqLen: 3 },
  3: { name: 'Bagon', title: 'Round III · Bagon', speedSec: 9, seqLen: 4 },
  4: { name: 'Kasanagan', title: 'Round IV · Kasanagan', speedSec: 7, seqLen: 5 },
  5: { name: 'Wakas', title: 'Round V · Wakas', speedSec: 5, seqLen: 5 }
};

let currentRound = 1;
let streak = 0;
let currentSequence = [];
let playerIndex = 0;
let timerInterval = null;
let timeLeft = 0;
let isAcceptingInput = false;
let isMuted = false;

// DOM Cache
let gridEl, timerValEl, roundValEl, streakValEl, roundTitleEl, seqBoxEl, btnStart, btnAudioToggle;
let modalOverlay, modalHeadline, modalSubtext, modalBtn;
let tutorialOverlayEl, tutorialSpriteEl, dialogueTextEl, dialogueBoxEl;
let loadingModal, loadingBarFill, loadingStatus, startPreloaderBtn;

// Dialogue System Vars
let currentDialogueAudio = null;
let typewriterTimeout = null;
let currentStep = 0;

// Central Preloaded Audio Cache
const audioCache = {};

const TUTORIAL_DIALOGUE = [
  {
    text: "Mabuhay! Welcome to Molo Memory Match! I'll be guiding you through the game rules.",
    sprite: "assets/Molo-Memory-Match/Sprite/Sprite1_Talking.png",
    audioKey: "dialogue_1"
  },
  {
    text: "At the start of each round, a sequence of Baybayin cards will flash briefly. Pay close attention!",
    sprite: "assets/Molo-Memory-Match/Sprite/Sprite1_Talking.png",
    audioKey: "dialogue_2"
  },
  {
    text: "Once the cards flip back face down, click them in the EXACT order they were revealed.",
    sprite: "assets/Molo-Memory-Match/Sprite/Sprite1.png",
    audioKey: "dialogue_3"
  },
  {
    text: "Watch out for the timer on the left rail—the higher the round, the faster you need to be!",
    sprite: "assets/Molo-Memory-Match/Sprite/Sprite1_Talking.png",
    audioKey: "dialogue_4"
  },
  {
    text: "When you are ready, click one last time to start Round I. Good luck!",
    sprite: "assets/Molo-Memory-Match/Sprite/Sprite1.png",
    audioKey: "dialogue_5"
  }
];

document.addEventListener('DOMContentLoaded', () => {
  // Bind UI Elements
  gridEl = document.getElementById('card-grid');
  timerValEl = document.getElementById('timer-val');
  roundValEl = document.getElementById('round-val');
  streakValEl = document.getElementById('streak-val');
  roundTitleEl = document.getElementById('round-title');
  seqBoxEl = document.getElementById('seq-box');
  btnStart = document.getElementById('btn-start');
  btnAudioToggle = document.getElementById('btn-audio-toggle');
  
  modalOverlay = document.getElementById('modal-overlay');
  modalHeadline = document.getElementById('modal-headline');
  modalSubtext = document.getElementById('modal-subtext');
  modalBtn = document.getElementById('modal-btn');

  // Preloader Elements
  loadingModal = document.getElementById('loading-modal');
  loadingBarFill = document.getElementById('loading-bar-fill');
  loadingStatus = document.getElementById('loading-status');
  startPreloaderBtn = document.getElementById('start-preloader-btn');

  // Tutorial Elements
  tutorialOverlayEl = document.getElementById('tutorial-overlay');
  tutorialSpriteEl = document.getElementById('tutorial-sprite');
  dialogueTextEl = document.getElementById('dialogue-text');
  dialogueBoxEl = document.getElementById('dialogue-box');

  if (btnAudioToggle) btnAudioToggle.addEventListener('click', toggleAudio);

  if (btnStart) {
    btnStart.addEventListener('click', () => {
      btnStart.style.display = 'none';
      startBgm();
      startRound(1);
    });
  }

  setupBoard();
  preloadAllAssets();
});

// --- ASSET PRELOADER ENGINE ---
function preloadAllAssets() {
  const audioManifest = {
    bgm: 'assets/Molo-Memory-Match/Memory Card sounds/Music.mp3',
    select: 'assets/Molo-Memory-Match/Memory Card sounds/Select_Card.wav',
    correct: 'assets/Molo-Memory-Match/Memory Card sounds/Correct.wav',
    wrong: 'assets/Molo-Memory-Match/Memory Card sounds/Wrong.wav',
    shuffle: 'assets/Molo-Memory-Match/Memory Card sounds/shuffle.mp3',
    tick: 'assets/Molo-Memory-Match/Memory Card sounds/tick.mp3',
    win: 'assets/Molo-Memory-Match/Memory Card sounds/round_win.wav',
    fail: 'assets/Molo-Memory-Match/Memory Card sounds/wrong.wav',
    dialogue_1: 'assets/Molo-Memory-Match/Memory Card sounds/dialogue_1-denoised.mp3',
    dialogue_2: 'assets/Molo-Memory-Match/Memory Card sounds/dialogue_2-denoised.mp3',
    dialogue_3: 'assets/Molo-Memory-Match/Memory Card sounds/dialogue_3-denoised.mp3',
    dialogue_4: 'assets/Molo-Memory-Match/Memory Card sounds/dialogue_4-denoised.mp3',
    dialogue_5: 'assets/Molo-Memory-Match/Memory Card sounds/dialogue_5-denoised.mp3'
  };

  const totalAssets = Object.keys(audioManifest).length;
  let loadedCount = 0;
  const trackedKeys = new Set();

  const updateProgress = (key) => {
    if (trackedKeys.has(key)) return;
    trackedKeys.add(key);
    
    loadedCount++;
    const percent = Math.floor((loadedCount / totalAssets) * 100);
    if (loadingBarFill) loadingBarFill.style.width = `${percent}%`;

    if (loadedCount >= totalAssets) {
      completePreload();
    }
  };

  // Preload Audio Elements with fallbacks
  for (let key in audioManifest) {
    const audio = new Audio();
    audio.preload = 'auto';

    const handleLoaded = () => updateProgress(key);

    audio.addEventListener('canplaythrough', handleLoaded, { once: true });
    audio.addEventListener('loadeddata', handleLoaded, { once: true });
    audio.addEventListener('error', handleLoaded, { once: true });

    audio.src = audioManifest[key];
    audio.load();
    audioCache[key] = audio;
  }

  // Setup loop on background music
  if (audioCache.bgm) {
    audioCache.bgm.loop = true;
    audioCache.bgm.volume = 0.70;
  }

  // Fallback safety timeout (5 Seconds Max)
  setTimeout(() => {
    if (loadedCount < totalAssets) {
      completePreload();
    }
  }, 5000);
}

function completePreload() {
  if (loadingStatus) loadingStatus.innerText = "Ready!";
  if (startPreloaderBtn) {
    startPreloaderBtn.style.display = 'block';
    startPreloaderBtn.onclick = () => {
      if (loadingModal) loadingModal.style.display = 'none';
      startBgm();
      initTutorial();
    };
  }
}

function playSound(key) {
  if (isMuted || !audioCache[key]) return;
  audioCache[key].currentTime = 0;
  audioCache[key].play().catch(() => {});
}

function startBgm() {
  if (isMuted || !audioCache.bgm) return;
  audioCache.bgm.play().catch(() => {});
}

function toggleAudio() {
  isMuted = !isMuted;
  if (isMuted) {
    if (audioCache.bgm) audioCache.bgm.pause();
    if (currentDialogueAudio) currentDialogueAudio.pause();
    btnAudioToggle.innerText = '🔇 Music: OFF';
  } else {
    if (audioCache.bgm) audioCache.bgm.play().catch(() => {});
    if (currentDialogueAudio) currentDialogueAudio.play().catch(() => {});
    btnAudioToggle.innerText = '🔊 Music: ON';
  }
}

function setupBoard() {
  gridEl.innerHTML = '';
  BAYBAYIN_LETTERS.forEach((letter, index) => {
    const cardNode = document.createElement('div');
    cardNode.className = 'card';
    cardNode.dataset.letter = letter;
    cardNode.dataset.index = index;

    cardNode.innerHTML = `
      <div class="card-face card-back" style="background-image: url('assets/Molo-Memory-Match/Memory%20Cards/card-back.png');"></div>
      <div class="card-face card-front" style="background-image: url('assets/Molo-Memory-Match/Memory%20Cards/${letter}.png');"></div>
    `;

    cardNode.addEventListener('click', () => handleCardClick(cardNode));
    gridEl.appendChild(cardNode);
  });
}

function animateShuffle(callback) {
  playSound('shuffle'); 

  const cards = document.querySelectorAll('.card');
  cards.forEach((card) => {
    const sx = (Math.random() - 0.5) * 200 + 'px';
    const sy = (Math.random() - 0.5) * 200 + 'px';
    const sr = (Math.random() - 0.5) * 45 + 'deg';
    
    card.style.setProperty('--sx', sx);
    card.style.setProperty('--sy', sy);
    card.style.setProperty('--sr', sr);
    card.classList.add('shuffling');
  });

  setTimeout(() => {
    cards.forEach(c => c.classList.remove('shuffling'));
    if (callback) callback();
  }, 650);
}

function startRound(roundNum) {
  currentRound = roundNum;
  const config = ROUND_SETTINGS[currentRound];

  roundTitleEl.innerHTML = config.title;
  roundValEl.innerText = `${currentRound}`;
  streakValEl.innerText = `×${streak}`;
  timeLeft = config.speedSec;
  timerValEl.innerText = timeLeft < 10 ? `0${timeLeft}` : timeLeft;

  isAcceptingInput = false;
  playerIndex = 0;

  document.querySelectorAll('.card').forEach(c => c.classList.remove('flipped'));

  animateShuffle(() => {
    generateSequence(config.seqLen);
    previewSequence();
  });
}

function generateSequence(length) {
  currentSequence = [];
  const shuffledIndices = [...Array(BAYBAYIN_LETTERS.length).keys()].sort(() => Math.random() - 0.5);
  for (let i = 0; i < length; i++) {
    currentSequence.push(shuffledIndices[i]);
  }

  seqBoxEl.innerHTML = '';
  currentSequence.forEach(() => {
    const slot = document.createElement('span');
    slot.innerText = '?';
    seqBoxEl.appendChild(slot);
  });
}

function previewSequence() {
  let step = 0;
  const cards = document.querySelectorAll('.card');

  const flashInterval = setInterval(() => {
    if (step > 0) {
      const prevIdx = currentSequence[step - 1];
      cards[prevIdx].classList.remove('flipped');
    }

    if (step < currentSequence.length) {
      const targetIdx = currentSequence[step];
      cards[targetIdx].classList.add('flipped');
      playSound('select');
      step++;
    } else {
      clearInterval(flashInterval);
      setTimeout(() => {
        startTimerCountdown();
      }, 400);
    }
  }, 750);
}

function startTimerCountdown() {
  isAcceptingInput = true;
  clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    timeLeft--;
    timerValEl.innerText = timeLeft < 10 ? `0${timeLeft}` : timeLeft;

    if (timeLeft > 0) {
      playSound('tick');
    }

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      handleRoundFailure("Time's up!");
    }
  }, 1000);
}

function handleCardClick(cardNode) {
  if (!isAcceptingInput) return;

  const cardIdx = parseInt(cardNode.dataset.index);
  const expectedIdx = currentSequence[playerIndex];

  playSound('select');
  cardNode.classList.add('flipped');

  if (cardIdx === expectedIdx) {
    const seqSlots = seqBoxEl.querySelectorAll('span');
    if (seqSlots[playerIndex]) {
      seqSlots[playerIndex].innerText = cardNode.dataset.letter;
    }

    playerIndex++;

    if (playerIndex >= currentSequence.length) {
      clearInterval(timerInterval);
      isAcceptingInput = false;
      streak++;
      streakValEl.innerText = `×${streak}`;
      
      playSound('correct');
      setTimeout(() => playSound('win'), 300);

      setTimeout(() => {
        showCompletionModal(true);
      }, 700);
    }
  } else {
    clearInterval(timerInterval);
    isAcceptingInput = false;
    playSound('wrong');
    setTimeout(() => playSound('fail'), 250);
    handleRoundFailure("Incorrect sequence!");
  }
}

function handleRoundFailure(reason) {
  streak = 0;
  streakValEl.innerText = `×${streak}`;
  setTimeout(() => {
    showCompletionModal(false, reason);
  }, 700);
}

function showCompletionModal(isSuccess, failureReason = '') {
  modalOverlay.classList.add('active');

  if (isSuccess) {
    if (currentRound >= 5) {
      modalHeadline.innerHTML = "Mabuhay! <em>Game Mastered!</em>";
      modalSubtext.innerText = "You have completed all 5 rounds of Baybayin Recall!";
      modalBtn.innerText = "Play Again";
      modalBtn.onclick = () => {
        modalOverlay.classList.remove('active');
        startRound(1);
      };
    } else {
      modalHeadline.innerHTML = "Kumusta na, <em>tara sunod!</em>";
      modalSubtext.innerText = `Round ${currentRound} Complete! Ready for Round ${currentRound + 1}?`;
      modalBtn.innerText = `Continue → Round ${currentRound + 1}`;
      modalBtn.onclick = () => {
        modalOverlay.classList.remove('active');
        startRound(currentRound + 1);
      };
    }
  } else {
    modalHeadline.innerHTML = "Sayang! <em>Try Again</em>";
    modalSubtext.innerText = `${failureReason} Sequence lost on Round ${currentRound}.`;
    modalBtn.innerText = "Retry Round";
    modalBtn.onclick = () => {
      modalOverlay.classList.remove('active');
      startRound(currentRound);
    };
  }
}

// --- TUTORIAL & AUDIO DIALOGUE ---
function initTutorial() {
  currentStep = 0;
  if (tutorialOverlayEl) tutorialOverlayEl.classList.add('active');
  
  if (dialogueBoxEl) {
    dialogueBoxEl.onclick = () => {
      startBgm();
      advanceDialogue();
    };
  }
  
  updateDialogue();
}

function updateDialogue() {
  const data = TUTORIAL_DIALOGUE[currentStep];
  if (!data) return;

  if (typewriterTimeout) clearTimeout(typewriterTimeout);
  if (currentDialogueAudio) {
    currentDialogueAudio.pause();
    currentDialogueAudio.currentTime = 0;
  }

  tutorialSpriteEl.src = data.sprite;
  dialogueTextEl.textContent = "";

  if (data.audioKey && !isMuted && audioCache[data.audioKey]) {
    currentDialogueAudio = audioCache[data.audioKey];
    currentDialogueAudio.currentTime = 0;
    currentDialogueAudio.play().catch(() => {});
  }

  let charIndex = 0;
  const speed = 30;

  function typeChar() {
    if (charIndex < data.text.length) {
      dialogueTextEl.textContent = data.text.slice(0, charIndex + 1);
      charIndex++;
      typewriterTimeout = setTimeout(typeChar, speed);
    } else {
      tutorialSpriteEl.src = "assets/Molo-Memory-Match/Sprite/Sprite1.png";
    }
  }

  typeChar();
}

function advanceDialogue() {
  playSound('select');

  if (currentDialogueAudio) {
    currentDialogueAudio.pause();
    currentDialogueAudio.currentTime = 0;
  }

  currentStep++;

  if (currentStep < TUTORIAL_DIALOGUE.length) {
    if (tutorialSpriteEl) {
      tutorialSpriteEl.classList.remove('sprite-pop');
      void tutorialSpriteEl.offsetWidth;
      tutorialSpriteEl.classList.add('sprite-pop');
    }
    updateDialogue();
  } else {
    if (tutorialOverlayEl) tutorialOverlayEl.classList.remove('active');
  }
}