// ==================== 1. DOM SELECTORS & GLOBAL SCOPE ====================
const sidebar = document.getElementById('info-sidebar');
const previewCard = document.getElementById('map-preview-card');
const sidebarImage = document.getElementById('landmark-image');
const sidebarTitle = document.getElementById('landmark-title');
const sidebarDesc = document.getElementById('landmark-description');

const featureModal = document.getElementById('feature-modal');
const modalContent = document.getElementById('modal-content');
let ffPopover = document.getElementById('ff-popover-wrapper');

// State Memory & Window Exports
let siteStore = {};
let currentSelectedSite = null;
window.currentSelectedSite = null; 
window.currentMarker = null;
window.map = null;
window.siteStore = siteStore;
window.bahandiMarkers = {};
window.bahandiMarkerGroup = null;

// Ensure popover container exists
if (!ffPopover) {
    ffPopover = document.createElement('div');
    ffPopover.id = 'ff-popover-wrapper';
    ffPopover.className = 'ff-popover-wrapper';
    document.body.appendChild(ffPopover);
}

// ==================== 2. MOUSE TRAILING ====================
document.addEventListener('mousemove', function (e) {
    if (previewCard && !previewCard.classList.contains('hidden')) {
        previewCard.style.left = `${e.clientX + 15}px`;
        previewCard.style.top = `${e.clientY + 15}px`;
    }
});

// ==================== 3. LANDMARK SELECTION ====================
function hoverLandmark(siteId) {
    const site = siteStore[siteId];
    if (site) {
        const previewTag = document.getElementById('preview-tag-text');
        const previewTitle = document.getElementById('preview-title-text');

        if (previewTag) previewTag.textContent = site.category || "Cultural Site";
        if (previewTitle) previewTitle.textContent = site.site_name || "Landmark";

        if (previewCard) previewCard.classList.remove('hidden');
    }
}

function leaveLandmark() {
    if (previewCard) previewCard.classList.add('hidden');
}

function selectLandmark(siteId) {
    const site = siteStore[siteId];
    if (!site) return;

    currentSelectedSite = site;
    window.currentSelectedSite = site;

    if (typeof window.closeFFPopover === 'function') {
        window.closeFFPopover();
    }

    const blueprintPanel = document.getElementById('blueprint-panel');
    if (blueprintPanel) {
        blueprintPanel.classList.remove('active');
    }

    if (sidebarImage) {
        sidebarImage.src = site.image || "assets/MoloFront.jpg";
        sidebarImage.alt = site.site_name || "Landmark Image";
        sidebarImage.style.display = 'block';
    }

    if (sidebarTitle) {
        sidebarTitle.textContent = site.site_name || "Landmark Name";
    }

    if (sidebarDesc) {
        sidebarDesc.textContent = site.description || "No description available.";
    }

    if (sidebar) {
        sidebar.classList.remove('collapsed');
    }

    if (typeof window.setSidebarBackdrop === 'function') {
        window.setSidebarBackdrop(true);
    }

    syncBlueprintPanel();
    if (typeof window.applyOverlayToggles === 'function') {
        window.applyOverlayToggles();
    }
}

function syncBlueprintPanel() {
    if (!window.currentSelectedSite) return;
    const site = window.currentSelectedSite;

    const bpTitle = document.getElementById('bp-landmark-title');
    const bpRef = document.getElementById('bp-ref-code');
    const bpCoords = document.getElementById('bp-coords-text');
    const bpDesc = document.getElementById('bp-landmark-desc');
    const bpBuilt = document.getElementById('bp-data-built');
    const bpStyle = document.getElementById('bp-data-style');
    const bpStatus = document.getElementById('bp-data-status');

    if (bpTitle) bpTitle.innerHTML = site.site_name || "Landmark Overview";
    if (bpRef) bpRef.innerText = `REF · ${site.site_id || 'BHD-ML-0001'} · FULL DETAILS`;
    if (bpCoords && site.coordinates) bpCoords.innerText = `${site.coordinates[0]}° N · ${site.coordinates[1]}° E`;
    if (bpDesc) bpDesc.innerText = site.description || site.historical_significance || "No extended overview recorded.";
    if (bpBuilt) bpBuilt.innerText = site.built_year || site.built || "—";
    if (bpStyle) bpStyle.innerText = site.architectural_style || site.style || "—";
    if (bpStatus) bpStatus.innerText = site.heritage_status || site.status || "—";
}
window.syncBlueprintPanel = syncBlueprintPanel;

function closeSidebar() {
    if (typeof window.closeSidebar === 'function') {
        window.closeSidebar();
    }
}

// ==================== 4. MODAL CONTROLLER ====================
function openFeatureModal(htmlContent) {
    if (featureModal && modalContent) {
        modalContent.innerHTML = htmlContent;
        featureModal.classList.remove('hidden');
    }
}

function closeFeatureModal() {
    if (featureModal) {
        featureModal.classList.add('hidden');
    }
}

// ==================== 5. CUSTOM UI FRAME RENDERERS ====================
function handleFullDetails() {
    if (!currentSelectedSite) return;

    const refNo = currentSelectedSite.ref_no || currentSelectedSite.site_id || "BHD-ML-0001";
    const coords = currentSelectedSite.coordinates ? `${currentSelectedSite.coordinates[0]}° N · ${currentSelectedSite.coordinates[1]}° E` : "10.6960° N · 122.5490° E";

    const content = `
        <div class="frame-blueprint-card">
            <div class="bp-header-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </div>
            <div class="bp-ref-line">REF · ${refNo} · FULL DETAILS</div>
            <h2 class="bp-title">${currentSelectedSite.site_name}</h2>

            <div class="bp-tabs">
                <span class="bp-tab active">OVERVIEW</span>
                <span class="bp-tab">ARCHITECTURE</span>
                <span class="bp-tab">GALLERY</span>
            </div>

            <div class="bp-section">
                <div class="bp-section-label">— OVERVIEW</div>
                <p class="bp-description"><strong>${currentSelectedSite.site_name}</strong>, ${currentSelectedSite.description || 'A key heritage monument located in Iloilo.'}</p>
            </div>

            <div class="bp-section">
                <div class="bp-section-label">— DATA SHEET</div>
                <div class="bp-data-grid">
                    <div><span>BUILT</span> <strong>${currentSelectedSite.built_year || '[ Year ]'}</strong></div>
                    <div><span>STYLE</span> <strong>${currentSelectedSite.architectural_style || 'Neoclassical / Art Deco accents'}</strong></div>
                    <div><span>STOREYS</span> <strong>${currentSelectedSite.storeys || 'Two'}</strong></div>
                    <div><span>STATUS</span> <strong>${currentSelectedSite.heritage_status || 'Declared Heritage Site'}</strong></div>
                </div>
            </div>

            <div class="bp-footer">
                <span class="bp-coords">${coords}</span>
                <button class="bp-action-btn" onclick="alert('Navigating to full archive record...')">OPEN FULL PAGE →</button>
            </div>
        </div>
    `;

    openFeatureModal(content);
}

function handleQRCode() {
    if (!currentSelectedSite) return;
    const qrUrl = currentSelectedSite.qrCodeUrl || 
                  `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.href)}`;
    
    openFeatureModal(`
        <div class="frame-qr-container" style="text-align: center; color: #f8fafc; padding: 20px;">
            <div class="ff-counter" style="margin-bottom: 10px;">SCAN ACCESS · ${currentSelectedSite.site_id || 'BHD-ML'}</div>
            <h3 style="font-family: 'Montserrat', serif; margin-bottom: 10px;">${currentSelectedSite.site_name}</h3>
            <p style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 20px;">Scan using your smartphone camera to access mobile guided tour data.</p>
            <div style="background: rgba(13, 21, 39, 0.8); border: 1px solid rgba(56, 189, 248, 0.3); padding: 15px; border-radius: 12px; display: inline-block;">
                <img src="${qrUrl}" alt="QR Code" style="width: 180px; height: 180px; display: block;" />
            </div>
        </div>
    `);
}

function handleHeritageStatus() {
    if (!currentSelectedSite) return;

    const refNo = currentSelectedSite.entry_no || currentSelectedSite.site_id || "BHD-ML-0001";
    const status = currentSelectedSite.heritage_status || "Declared National Historical Landmark / Cultural Heritage Site";

    const content = `
        <div class="frame-seal-card">
            <div class="seal-header">
                <span>BAHANDI · HERITAGE REGISTRY</span>
                <span>ENTRY · ${refNo}</span>
            </div>

            <div class="seal-body">
                <div class="seal-badge-container">
                    <div class="seal-shield-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="M9 12l2 2 4-4"></path></svg>
                    </div>
                </div>

                <div class="seal-details">
                    <div class="seal-certified-tag">CERTIFIED · HERITAGE LANDMARK</div>
                    <h2 class="seal-title">${currentSelectedSite.site_name}</h2>
                    <p class="seal-summary">${status}</p>

                    <div class="seal-metrics-grid">
                        <div class="seal-metric-box">
                            <label>REGISTRY</label>
                            <div>${currentSelectedSite.registry_authority || 'NHCP · Official'}</div>
                        </div>
                        <div class="seal-metric-box">
                            <label>MARKER YR.</label>
                            <div>[ ${currentSelectedSite.marker_year || 'Year'} ]</div>
                        </div>
                        <div class="seal-metric-box">
                            <label>ORDINANCE</label>
                            <div>No. [ ${currentSelectedSite.ordinance_no || '--'} ]</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="seal-footer">
                <span class="seal-status-pill">● VERIFIED & ACTIVE</span>
                <a class="seal-link" href="#" onclick="alert('Opening official designation record...'); return false;">VIEW SOURCE →</a>
            </div>
        </div>
    `;

    openFeatureModal(content);
}

function handleHistoricalSignificance() {
    if (!currentSelectedSite) return;

    const significance = currentSelectedSite.historical_significance || 
                         currentSelectedSite.significance || 
                         currentSelectedSite.description ||
                         "Historical significance details are maintained under official cultural heritage record archives.";

    const content = `
        <div class="frame-editorial-card">
            <div class="editorial-left-panel" style="background-image: url('${currentSelectedSite.image || 'assets/MoloFront.jpg'}')">
                <div class="editorial-left-overlay">
                    <div class="editorial-home-badge">🏛️</div>
                    <div class="editorial-left-footer">
                        <div class="editorial-tag">CULTURAL RECORD · 04</div>
                        <h3>${currentSelectedSite.site_name}</h3>
                        <p>${currentSelectedSite.district || 'Molo, Iloilo City'} · Panay Island</p>
                    </div>
                </div>
            </div>

            <div class="editorial-right-panel">
                <div class="editorial-breadcrumbs">BAHANDI / MOLO / HISTORICAL & CULTURAL</div>
                <h2 class="editorial-headline">The Living <em>Archive</em> of a District</h2>

                <div class="editorial-pills">
                    <span class="ed-pill active">HISTORY</span>
                    <span class="ed-pill">ARCHITECTURE</span>
                    <span class="ed-pill">GALLERY</span>
                </div>

                <div class="editorial-body">
                    <span class="drop-cap">${significance.charAt(0)}</span>
                    <p>${significance.slice(1)}</p>
                </div>

                <div class="editorial-footer-bar">
                    <div class="editorial-meta-box">
                        <div>SOURCES · 04</div>
                        <div>MEDIA · 12</div>
                        <div>LAST VERIFIED · 2026-07</div>
                    </div>
                    <a href="#" class="editorial-cite-link" onclick="alert('Citation referenced.'); return false;">CITE ENTRY →</a>
                </div>
            </div>
        </div>
    `;

    openFeatureModal(content);
}

function handleFunFacts() {
    if (typeof openFrame === 'function') {
        openFrame('FF');
    }
}

function handlePlayGame() {
    if (!currentSelectedSite) return;

    const content = `
        <div class="frame-game-card">
            <div class="game-top-badge">
                <div class="game-controller-icon">🎮</div>
                <div class="game-module-tag">BAHANDI EXPERIENCE · MODULE 06</div>
            </div>

            <h2 class="game-title">Play the <em>Heritage</em></h2>
            <p class="game-subtitle">Three interactive modes let visitors test what they've learned about ${currentSelectedSite.site_name}. Progress persists across sessions.</p>

            <div class="game-modes-grid">
                <div class="game-mode-card">
                    <div class="gm-header">
                        <span class="gm-tag">MODE 01</span>
                        <div class="gm-icon">❓</div>
                    </div>
                    <h3>Heritage <em>Trivia</em></h3>
                    <p>Quick-fire questions on ${currentSelectedSite.site_name}.</p>
                    <div class="gm-progress-bar"><div style="width: 15%;"></div></div>
                    <div class="gm-meta"><span>PROGRESS</span> <span>3 / 20</span></div>
                </div>

                <div class="game-mode-card">
                    <div class="gm-header">
                        <span class="gm-tag">MODE 02</span>
                        <div class="gm-icon">📍</div>
                    </div>
                    <h3>Virtual <em>Tour</em></h3>
                    <p>Guided pathway through landmark highlights.</p>
                    <div class="gm-progress-bar"><div style="width: 0%;"></div></div>
                    <div class="gm-meta"><span>PROGRESS</span> <span>0 / 6</span></div>
                </div>

                <div class="game-mode-card locked">
                    <div class="gm-header">
                        <span class="gm-tag">MODE 03</span>
                        <span class="gm-lock">🔒 LOCKED</span>
                    </div>
                    <h3>Timeline <em>Puzzle</em></h3>
                    <p>Arrange historical events in correct order.</p>
                    <div class="gm-meta"><span>REQUIRES</span> <span>LEVEL 3</span></div>
                </div>
            </div>

            <div class="game-footer">
                <div class="game-player-stats">
                    <span>XP <strong>240</strong></span>
                    <span>RANK <strong>EXPLORER</strong></span>
                    <span>STREAK <strong>3D</strong></span>
                </div>
                <button class="game-start-btn" onclick="launchGame()">START EXPERIENCE ❯</button>
            </div>
        </div>
    `;

    openFeatureModal(content);
}

function launchGame() {
    if (currentSelectedSite && (currentSelectedSite.game_url || currentSelectedSite.gameUrl)) {
        window.open(currentSelectedSite.game_url || currentSelectedSite.gameUrl, "_blank");
    } else {
        alert("Launching Heritage Trivia Mini-Game Engine...");
    }
}

// ==================== 6. MAP INIT & BUTTON BINDINGS ====================
document.addEventListener("DOMContentLoaded", async () => {
    // Initialize Leaflet Map
    const map = L.map("map", { minZoom: 15, maxZoom: 19 }).setView([10.697008, 122.544031], 18);
    window.map = map;

    const southWest = L.latLng(10.690000, 122.535000);
    const northEast = L.latLng(10.705000, 122.555000);
    map.setMaxBounds(L.latLngBounds(southWest, northEast));

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    // Force map to recompute container bounds after mounting
    setTimeout(() => {
        map.invalidateSize();
    }, 200);

    const pinIcon = L.divIcon({
        className: "Location_Pin",
        html: '<span class="Location_Pin-inner"><img src="assets/Location_Pin.png" alt=""></span>',
        iconSize: [30, 30],
        iconAnchor: [15, 30]
    });

    const markerGroup = L.layerGroup().addTo(map);
    window.bahandiMarkerGroup = markerGroup;
    window.bahandiMarkers = {};

    const sitesById = {};

    if (Array.isArray(window.BAHANDI_SITES)) {
        window.BAHANDI_SITES.forEach((site) => {
            if (site && site.site_id) {
                sitesById[site.site_id] = site;
            }
        });
    }

    if (typeof window.fetchSitesFromFirestore === "function") {
        try {
            const dbSites = await window.fetchSitesFromFirestore();
            if (Array.isArray(dbSites)) {
                dbSites.forEach((site) => {
                    if (site && site.site_id) {
                        sitesById[site.site_id] = site;
                    }
                });
            }
        } catch (err) {
            console.error("Firestore fetch error:", err);
        }
    }

    const siteList = Object.values(sitesById);

    siteList.forEach((site) => {
        try {
            if (!site || !Array.isArray(site.coordinates) || site.coordinates.length < 2) {
                console.warn("Skipping site with invalid coordinates:", site && site.site_id);
                return;
            }

            const lat = Number(site.coordinates[0]);
            const lng = Number(site.coordinates[1]);

            if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) {
                console.warn("Skipping site with invalid coordinates:", site.site_id, site.coordinates);
                return;
            }

            siteStore[site.site_id] = site;
            window.siteStore = siteStore;

            const marker = L.marker([lat, lng], { icon: pinIcon }).addTo(markerGroup);
            window.bahandiMarkers[site.site_id] = marker;
            marker.on("click", () => {
                window.currentMarker = marker;
                selectLandmark(site.site_id);
            });

            marker.on("mouseover", () => hoverLandmark(site.site_id));
            marker.on("mouseout", () => leaveLandmark());
        } catch (err) {
            console.warn("Skipping site that failed to load:", site && site.site_id, err);
        }
    });

    // Wire up sidebar mini-buttons to specific frame actions
    const miniBtns = document.querySelectorAll(".mini-btn");
    const frameKeys = ['FD', 'FF', 'HSC', 'HS', 'PG', 'QR'];
    miniBtns.forEach((btn, index) => {
        if (frameKeys[index]) {
            btn.onclick = () => openFrame(frameKeys[index]);
        }
    });

    // ==================== SIDEBAR MOBILE BACKDROP ====================
    // Show/hide the full-screen overlay behind the bottom-sheet sidebar (mobile only).
    function setSidebarBackdrop(show) {
        if (window.innerWidth > 1024) return;
        const bd = document.getElementById('sidebar-backdrop');
        if (bd) bd.classList.toggle('visible', !!show);
    }
    window.setSidebarBackdrop = setSidebarBackdrop;

    // Tap backdrop to dismiss sidebar and all open panels.
    const backdropEl = document.getElementById('sidebar-backdrop');
    if (backdropEl) {
        backdropEl.addEventListener('click', () => {
            if (typeof window.closeSidebar === 'function') window.closeSidebar();
            setSidebarBackdrop(false);
        });
    }

    // Optional: swipe-down gesture on the mobile sheet to collapse it.
    const sheetEl = document.getElementById('info-sidebar');
    if (sheetEl) {
        let startY = null;
        let swipeDown = false;
        sheetEl.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
            swipeDown = false;
        }, { passive: true });
        sheetEl.addEventListener('touchmove', (e) => {
            if (startY === null) return;
            const dy = e.touches[0].clientY - startY;
            if (dy > 0 && sheetEl.scrollTop <= 0) {
                swipeDown = true;
                e.preventDefault();
            } else if (dy < 0) {
                swipeDown = false;
            }
        }, { passive: false });
        sheetEl.addEventListener('touchend', () => {
            if (swipeDown && startY !== null) {
                if (typeof window.closeSidebar === 'function') window.closeSidebar();
                setSidebarBackdrop(false);
            }
            startY = null;
            swipeDown = false;
        });
    }

    // Re-measure map once the sheet/backdrop animations settle.
    setTimeout(() => {
        if (window.map && typeof window.map.invalidateSize === 'function') {
            window.map.invalidateSize();
        }
    }, 400);

    window.dispatchEvent(new CustomEvent('bahandi-sites-ready'));
});