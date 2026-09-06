/**
 * Project Bahandi - Play Game (PG) Controller
 */

let selectedGameMode = '3d-model'; // Default selected mode

const DEFAULT_3D_MODEL_URL = 'https://karlchestersapiomain-create.github.io/project_bahandi_3d_molo_map/';

const LANDMARK_GAME_ROUTES = [
    { test: /mansion|yusay|consing/i, url: 'heritage-coin-quest.html', title: 'Heritage Coin Quest', desc: 'Explore Molo Mansion through a heritage maze and coin challenge.' },
    { test: /church|st\.?\s*anne|parish/i, url: 'molo-memory-match.html', title: 'Molo Memory Match', desc: 'Match Baybayin sequences inspired by Molo Church heritage.' },
    { test: /plaza/i, url: 'Chrono-Defenders.html', title: 'Chrono Defenders', desc: 'Defend Molo Plaza history across three Philippine eras.' },
    { test: /cami[nñ]a|balay|blueprint|nga bato/i, url: 'Balay-Blueprint.html', title: 'Balay Blueprint', desc: 'Recover hidden relics inside Camiña Balay nga Bato.' }
];

function resolveLandmarkExperience(site) {
    const haystack = [site?.site_id, site?.site_name, site?.title, site?.category, site?.location]
        .filter(Boolean).join(' ');
    const match = LANDMARK_GAME_ROUTES.find(route => route.test.test(haystack));
    return {
        modelUrl: site?.model_3d_url || DEFAULT_3D_MODEL_URL,
        gameUrl: site?.game_url || site?.gameUrl || match?.url || '',
        gameTitle: match?.title || 'Site Challenge',
        gameDesc: site?.game_desc || match?.desc || ''
    };
}

/**
 * Opens and initializes the Play Game Modal
 */
function openPGModal() {
    const pgOverlay = document.getElementById('pg-overlay');
    if (!pgOverlay) return;

    const site = window.currentSelectedSite;
    const experience = resolveLandmarkExperience(site);

    // Update Header Details
    const titleEl = document.getElementById('pg-landmark-title');
    const subEl = document.getElementById('pg-sub-desc');

    if (titleEl) {
        const titleText = site?.site_name || site?.title || 'Molo Heritage Site';
        titleEl.innerHTML = `${titleText.replace(/\b(\w+)$/, '<em>$1</em>')} <em>Interactive</em>`;
    }

    if (subEl) {
        subEl.innerText = `Explore ${site?.site_name || 'this landmark'} through interactive 3D modeling or test your heritage knowledge with its site-specific game challenge.`;
    }

    // Set dynamic metadata for Mode 1 (3D Model)
    const m1Title = document.getElementById('pg-m1-title');
    const m1Desc = document.getElementById('pg-m1-desc');
    const m1Meta = document.getElementById('pg-m1-meta');
    const m1Bar = document.getElementById('pg-m1-bar');

    if (m1Title) m1Title.innerHTML = `3D Model <em>Viewer</em>`;
    if (m1Desc) m1Desc.innerText = `Inspect the real-time architectural 3D rendering of ${site?.site_name || 'the structure'}.`;
    if (m1Meta) m1Meta.innerText = site?.has_3d ? 'MODEL READY · 100%' : 'HIGH-RES MODEL · 100%';
    if (m1Bar) m1Bar.style.width = '100%';

    // Set dynamic metadata for Mode 2 (Personal Site Game)
    const m2Title = document.getElementById('pg-m2-title');
    const m2Desc = document.getElementById('pg-m2-desc');
    const m2Meta = document.getElementById('pg-m2-meta');
    const m2Bar = document.getElementById('pg-m2-bar');

    if (m2Title) m2Title.innerHTML = `${site?.site_name || 'Site'} <em>Challenge</em>`;
    if (m2Desc) m2Desc.innerText = experience.gameDesc || `Play the custom mini-game designed specifically around the history of ${site?.site_name || 'this landmark'}.`;
    if (m2Meta) m2Meta.innerText = experience.gameUrl ? `${experience.gameTitle.toUpperCase()} · READY` : 'NO SITE GAME · UNAVAILABLE';
    if (m2Bar) m2Bar.style.width = experience.gameUrl ? '100%' : '0%';

    // Default to initial mode selection
    selectPGMode('3d-model');

    pgOverlay.classList.add('active');
}

/**
 * Selects a Game Mode card ('3d-model' or 'personal-game')
 */
function selectPGMode(modeKey) {
    selectedGameMode = modeKey;

    const card1 = document.getElementById('pg-card-3d');
    const card2 = document.getElementById('pg-card-game');
    const launchBtn = document.getElementById('pg-launch-btn');

    if (card1) card1.classList.toggle('selected', modeKey === '3d-model');
    if (card2) card2.classList.toggle('selected', modeKey === 'personal-game');

    if (launchBtn) {
        const experience = resolveLandmarkExperience(window.currentSelectedSite);
        if (modeKey === '3d-model') {
            launchBtn.innerText = 'LAUNCH 3D MODEL →';
            launchBtn.setAttribute('href', experience.modelUrl || '#');
        } else {
            launchBtn.innerText = experience.gameUrl ? `PLAY ${experience.gameTitle.toUpperCase()} →` : 'GAME UNAVAILABLE';
            launchBtn.setAttribute('href', experience.gameUrl || '#');
        }
    }
}

/**
 * Triggers launch action for the selected mode
 */
function launchSelectedGame() {
    const site = window.currentSelectedSite;
    const experience = resolveLandmarkExperience(site);
    const siteName = site?.site_name || 'this site';

    if (selectedGameMode === '3d-model') {
        if (experience.modelUrl) {
            window.open(experience.modelUrl, '_blank');
        } else {
            alert(`Loading 3D Model Viewer for ${siteName}...`);
        }
    } else if (experience.gameUrl) {
        window.open(experience.gameUrl, '_blank');
    } else {
        alert(`No designated mini-game is linked for ${siteName} yet.`);
    }
}

/**
 * Closes the Play Game Modal
 */
function closePGModal() {
    const pgOverlay = document.getElementById('pg-overlay');
    if (pgOverlay) {
        pgOverlay.classList.remove('active');
    }
}

// Global Exports
window.openPGModal = openPGModal;
window.selectPGMode = selectPGMode;
window.launchSelectedGame = launchSelectedGame;
window.closePGModal = closePGModal;
window.resolveLandmarkExperience = resolveLandmarkExperience;
