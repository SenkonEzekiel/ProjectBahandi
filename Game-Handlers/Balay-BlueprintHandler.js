/* ==========================================================================
   Balay Blueprint - Main Application Script
   ========================================================================== */

// --- State Management ---
const state = {
  sfxCache: {},
  bgmAudio: null,
  isAudioMuted: false
};

let currentBGMType = null;
let activeDuckingCount = 0;

// Audio Configuration
const BGM_VOLUME_FULL = 0.5;
const BGM_VOLUME_DUCKED = 0.15;

// Audio File Paths
const sfxPaths = {
  click: 'assets/Balay-Blueprint/05-Audio-Features/click-standard.mp3',
  relicSelect: 'assets/Balay-Blueprint/05-Audio-Features/relic-hover-glow.mp3',
  correct: 'assets/Balay-Blueprint/05-Audio-Features/relic-correct.mp3',
  wrong: 'assets/Balay-Blueprint/05-Audio-Features/relic-wrong.mp3',
  missClick: 'assets/Balay-Blueprint/05-Audio-Features/hover-soft.mp3',
  pageOpen: 'assets/Balay-Blueprint/05-Audio-Features/click-book-page.mp3',
  bgmMain: 'assets/Balay-Blueprint/05-Audio-Features/bgm-main-theme.wav',
  bgmArchive: 'assets/Balay-Blueprint/05-Audio-Features/bgm-archive-reader.wav'
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  preloadAudio();
  setupEventListeners();
});

// Preload SFX and BGM assets into cache
function preloadAudio() {
  for (const [key, path] of Object.entries(sfxPaths)) {
    const audio = new Audio(path);
    audio.preload = 'auto';
    state.sfxCache[key] = audio;
  }
}

// --- Audio Functions ---

/**
 * Play standard Sound Effects (SFX)
 * @param {string} key - SFX key defined in sfxPaths
 */
function playSFX(key) {
  if (state.isAudioMuted) return;
  const audio = state.sfxCache[key];
  if (audio) {
    const soundInstance = audio.cloneNode();
    soundInstance.volume = 0.7;
    soundInstance.play().catch(err => console.warn(`SFX playback issue (${key}):`, err));
  }
}

/**
 * Play and manage Background Music (BGM)
 * Handles smooth switching between main and archive themes without audio overlap.
 * @param {string} type - BGM type ('main' or 'archive')
 */
function playBGM(type) {
  if (state.isAudioMuted) return;
  if (currentBGMType === type && state.bgmAudio && !state.bgmAudio.paused) return;

  // 1. Forcefully pause and reset existing active BGM if playing
  if (state.bgmAudio) {
    state.bgmAudio.pause();
    state.bgmAudio.currentTime = 0;
  }

  // 2. Pause ALL potential BGM tracks in cache to prevent overlap
  if (state.sfxCache['bgmMain']) {
    state.sfxCache['bgmMain'].pause();
    state.sfxCache['bgmMain'].currentTime = 0;
  }
  if (state.sfxCache['bgmArchive']) {
    state.sfxCache['bgmArchive'].pause();
    state.sfxCache['bgmArchive'].currentTime = 0;
  }

  // 3. Play selected track
  const bgmKey = (type === 'archive') ? 'bgmArchive' : 'bgmMain';
  if (state.sfxCache[bgmKey]) {
    currentBGMType = type;
    state.bgmAudio = state.sfxCache[bgmKey];
    state.bgmAudio.loop = true;
    state.bgmAudio.volume = (activeDuckingCount > 0) ? BGM_VOLUME_DUCKED : BGM_VOLUME_FULL;
    state.bgmAudio.play().catch(err => console.warn(`BGM start issue (${type}):`, err));
  }
}

/**
 * Pause active BGM
 */
function stopBGM() {
  if (state.bgmAudio) {
    state.bgmAudio.pause();
  }
}

/**
 * Start initial ambient BGM (defaults to main theme)
 */
function startAmbientBGM() {
  playBGM('main');
}

/**
 * Duck BGM volume during SFX or voiceover playback
 */
function duckBGM() {
  activeDuckingCount++;
  if (state.bgmAudio) {
    state.bgmAudio.volume = BGM_VOLUME_DUCKED;
  }
}

/**
 * Restore BGM volume after ducking
 */
function unduckBGM() {
  activeDuckingCount = Math.max(0, activeDuckingCount - 1);
  if (activeDuckingCount === 0 && state.bgmAudio) {
    state.bgmAudio.volume = BGM_VOLUME_FULL;
  }
}

// --- Event Listeners Setup ---
function setupEventListeners() {
  // Start ambient audio on user's first interaction
  const startAudioOnInteraction = () => {
    startAmbientBGM();
    document.removeEventListener('click', startAudioOnInteraction);
    document.removeEventListener('keydown', startAudioOnInteraction);
  };

  document.addEventListener('click', startAudioOnInteraction);
  document.addEventListener('keydown', startAudioOnInteraction);
}