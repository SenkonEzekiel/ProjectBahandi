// ==================== 1. DOM SELECTORS & GLOBAL SCOPE ====================
const sidebar = document.getElementById('info-sidebar');
const previewCard = document.getElementById('map-preview-card');
const sidebarImage = document.getElementById('landmark-image');
const sidebarTitle = document.getElementById('landmark-title');
const sidebarDesc = document.getElementById('landmark-description');
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

// ==================== IMAGE RESOLVER (Firebase passthrough → local → fallback) ====================
window.PBH = window.PBH || {};
window.PBH.image = (function () {
    var FALLBACK = "assets/Landmark_images/_fallback.svg";

    function keyFor(site) {
        if (!site) return "";
        var raw = site.landmark_key || site.image_key || site.site_name || site.name || site.title || "";
        return String(raw).replace(/[^A-Za-z0-9]/g, "");
    }

    function isRemote(url) {
        return /^https:\/\//i.test(String(url || "").trim());
    }

    function resolveSiteImage(site) {
        if (!site) return FALLBACK;
        var raw = site.image_url || site.localImage || site.image || "";
        if (raw && isRemote(raw)) return raw;
        var key = keyFor(site);
        var base = "assets/Landmark_images/";
        if (key) return base + key + ".png";
        return FALLBACK;
    }

    function onError(img, site) {
        if (!img) return;
        site = site || {};
        var base = "assets/Landmark_images/";
        var current = String(img.getAttribute("src") || "");
        var key = keyFor(site);
        if (isRemote(current)) {
            if (key) {
                img.src = base + key + ".png";
                return;
            }
            img.onerror = null;
            img.src = FALLBACK;
            return;
        }
        if (key && current.indexOf(".png") !== -1) {
            img.src = base + key + ".jpg";
            return;
        }
        img.onerror = null;
        img.src = FALLBACK;
    }

    return {
        keyFor: keyFor,
        isRemote: isRemote,
        resolveSiteImage: resolveSiteImage,
        onError: onError
    };
})();

// ==================== I18N HELPERS ====================
function i18nGet(key, fallback) {
    if (window.PBH && window.PBH.i18n) return window.PBH.i18n.localized(key, fallback);
    return fallback;
}

function i18nSiteName(site) {
    if (!site) return "";
    if (window.PBH && window.PBH.i18n) {
        var entry = window.PBH.i18n.site(site.site_id);
        if (entry && entry.name) return entry.name;
    }
    return site.site_name || site.title || "";
}

function i18nSiteCategory(site) {
    if (!site) return "";
    if (window.PBH && window.PBH.i18n) {
        var entry = window.PBH.i18n.site(site.site_id);
        if (entry && entry.category !== undefined) return entry.category;
        return window.PBH.i18n.category(site.category);
    }
    return site.category || i18nGet("site.catHeritage", "Heritage");
}

function i18nSiteDesc(site) {
    if (!site) return "";
    if (window.PBH && window.PBH.i18n) {
        var entry = window.PBH.i18n.site(site.site_id);
        if (entry && entry.desc) return entry.desc;
    }
    return site.description || site.historical_significance || i18nGet("site.noDesc", "No extended overview recorded.");
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
        const previewImage = document.getElementById('preview-image');

        if (previewTag) previewTag.textContent = i18nSiteCategory(site);
        if (previewTitle) previewTitle.textContent = i18nSiteName(site) || i18nGet("site.label", "Landmark");
        if (typeof window.bindLandmarkImage === "function") {
            window.bindLandmarkImage(previewImage, site);
        } else if (previewImage) {
            previewImage.onerror = function () {
                this.onerror = null;
                this.src = "assets/Landmark_images/placeholder.jpeg";
            };
            previewImage.src = site.localImage || site.image || "assets/Landmark_images/placeholder.jpeg";
            previewImage.alt = i18nSiteName(site) || i18nGet("site.label", "Landmark");
        }

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
        if (typeof window.bindLandmarkImage === "function") {
            window.bindLandmarkImage(sidebarImage, site, i18nSiteName(site) || "Landmark Image");
        } else {
            sidebarImage.onerror = function () {
                this.onerror = null;
                this.src = "assets/Landmark_images/placeholder.jpeg";
            };
            sidebarImage.src = site.localImage || site.image || "assets/Landmark_images/placeholder.jpeg";
            sidebarImage.alt = i18nSiteName(site) || "Landmark Image";
        }
        sidebarImage.style.display = 'block';
    }

    if (sidebarTitle) {
        sidebarTitle.textContent = i18nSiteName(site) || i18nGet("site.fallbackTitle", "Landmark Overview");
    }

    if (sidebarDesc) {
        sidebarDesc.textContent = i18nSiteDesc(site);
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

    if (bpTitle) bpTitle.textContent = i18nSiteName(site) || i18nGet("site.fallbackTitle", "Landmark Overview");
    if (bpRef) bpRef.innerText = "REF · " + (site.site_id || "BHD-ML-0001") + " · " + i18nGet("bp.ref", "FULL DETAILS");
    if (bpCoords && site.coordinates) bpCoords.innerText = site.coordinates[0] + "° N · " + site.coordinates[1] + "° E";
    if (bpDesc) bpDesc.innerText = i18nSiteDesc(site);
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

// ==================== 6. MAP INIT & BUTTON BINDINGS ====================
document.addEventListener("DOMContentLoaded", async () => {
    // Initialize Leaflet Map
    const map = L.map("map", { minZoom: 15, maxZoom: 19 }).setView([10.697008, 122.544031], 18);
    window.map = map;

    const southWest = L.latLng(10.686000, 122.534000);
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

    function normalizeSiteName(value) {
        return String(value || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "");
    }

    function findLocalMatch(dbSite) {
        if (dbSite?.site_id && sitesById[dbSite.site_id]) return sitesById[dbSite.site_id];
        const dbName = normalizeSiteName(dbSite?.site_name || dbSite?.title);
        if (!dbName) return null;
        return Object.values(sitesById).find((local) => {
            const localName = normalizeSiteName(local.site_name);
            return localName && (localName.includes(dbName) || dbName.includes(localName));
        }) || null;
    }

    function stashSite(site, preferId) {
        if (!site) return;
        const prepared = typeof window.applyLandmarkImage === "function"
            ? window.applyLandmarkImage(Object.assign({}, site))
            : Object.assign({}, site);
        const id = preferId || prepared.site_id;
        if (!id) return;
        prepared.site_id = id;
        sitesById[id] = prepared;
    }

    if (Array.isArray(window.BAHANDI_SITES)) {
        window.BAHANDI_SITES.forEach((site) => {
            if (site && site.site_id) stashSite(site, site.site_id);
        });
    }

    if (typeof window.fetchSitesFromFirestore === "function") {
        try {
            const dbSites = await window.fetchSitesFromFirestore();
            if (Array.isArray(dbSites)) {
                dbSites.forEach((site) => {
                    if (!site) return;
                    const local = findLocalMatch(site);
                    if (local) {
                        stashSite(Object.assign({}, local, site, {
                            site_id: local.site_id,
                            landmark_key: local.landmark_key,
                            image: local.image,
                            image_url: local.image,
                            localImage: local.localImage || local.image,
                            description: site.description || local.description,
                            category: site.category || local.category,
                            location: site.location || local.location,
                            coordinates: (Array.isArray(site.coordinates) && site.coordinates[0])
                                ? site.coordinates
                                : local.coordinates
                        }), local.site_id);
                    } else {
                        stashSite(site, site.site_id);
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

    // Re-render dynamic content when the app language changes.
    window.PBH.i18nOnChange = function () {
        const sid = window.currentSelectedSite && window.currentSelectedSite.site_id;
        if (sid && typeof selectLandmark === 'function') {
            selectLandmark(sid);
        }
        window.dispatchEvent(new CustomEvent('bahandi-i18n-change'));
        if (window.map) window.map.invalidateSize();
    };

    window.dispatchEvent(new CustomEvent('bahandi-sites-ready'));
});