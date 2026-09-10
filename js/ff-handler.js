/**
 * Project Bahandi - Fun Facts (FF) Controller
 */

let currentFactIndex = 0;
let currentFactList = [];
let ffMapListenersAttached = false;

/**
 * Updates the popover position relative to the selected Leaflet marker
 */
function updateFFPopoverPosition() {
    const ffWrapper = document.getElementById('ff-popover-wrapper');
    if (!ffWrapper || !ffWrapper.classList.contains('active')) return;

    const mapElement = document.getElementById('map');
    if (mapElement && ffWrapper.parentElement !== mapElement) {
        mapElement.appendChild(ffWrapper);
    }

    if (window.map && window.currentMarker) {
        const markerLatLng = window.currentMarker.getLatLng();
        const containerPoint = window.map.latLngToContainerPoint(markerLatLng);

        ffWrapper.style.left = `${containerPoint.x}px`;
        ffWrapper.style.top = `${containerPoint.y}px`;
        ffWrapper.style.transform = 'translate(-100%, -100%) translateY(-15px)';
    } else {
        ffWrapper.style.left = '50%';
        ffWrapper.style.top = '50%';
        ffWrapper.style.transform = 'translate(-50%, -50%)';
    }
}

/**
 * Normalizes input data into a valid Array
 */
function normalizeFactList(data) {
    if (!data) return null;
    if (Array.isArray(data)) return data.length > 0 ? data : null;
    if (typeof data === 'object') return [data]; // Wrap single object into an array
    return null;
}

/**
 * Opens and renders the Fun Facts popover
 */
function positionAndShowFFPopover() {
    const ffWrapper = document.getElementById('ff-popover-wrapper');
    if (!ffWrapper) return;

    const site = window.currentSelectedSite;

    if (window.map && !ffMapListenersAttached) {
        window.map.on('move zoom viewreset drag', updateFFPopoverPosition);
        ffMapListenersAttached = true;
    }

    // Safely resolve fact list from site object or fallback defaults
    const extractedFacts = normalizeFactList(site?.fun_facts) 
        || normalizeFactList(site?.funFactDeck) 
        || normalizeFactList(site?.funFacts);

    if (extractedFacts) {
        currentFactList = extractedFacts;
    } else {
        const loc = function(key, fb) { return (window.PBH && window.PBH.i18n) ? window.PBH.i18n.get(key, fb) : fb; };
        currentFactList = [
            {
                headline: loc('ff.fallback.1.head', "Built with <em>Coral Stones & Egg Whites</em>"),
                body: loc('ff.fallback.1.body', "Local lore and historical accounts note that thousands of egg whites were mixed with lime as mortar to bind the massive stone walls."),
                tags: [loc('cat.architecture', 'Architecture'), loc('cat.masonry', 'Masonry')],
                dyk: loc('ff.fallback.1.dyk', "This traditional Spanish colonial formula allowed walls to absorb ground tremors during earthquakes!")
            },
            {
                headline: loc('ff.fallback.2.head', "The <em>Feminist Church Legend</em>"),
                body: loc('ff.fallback.2.body', "Molo Church is widely nicknamed 'The Feminist Church' because sixteen statues of female saints line the primary nave pillars."),
                tags: [loc('cat.heritage', 'Heritage'), loc('cat.culture', 'Culture')],
                dyk: loc('ff.fallback.2.dyk', "It stands as one of the few cathedrals in the Philippines featuring exclusively female patron saints.")
            },
            {
                headline: loc('ff.fallback.3.head', "Visited by <em>Dr. Jose Rizal</em>"),
                body: loc('ff.fallback.3.body', "National Hero Dr. Jose Rizal stopped by Molo Church in 1896 to admire its Neo-Gothic architecture while traveling to Manila."),
                tags: [loc('cat.history', 'History'), '1890s'],
                dyk: loc('ff.fallback.3.dyk', "Rizal explicitly recorded his admiration for the church in his personal travel diary entries!")
            }
        ];
    }

    currentFactIndex = 0;
    renderFFCard();

    ffWrapper.classList.add('active');
    updateFFPopoverPosition();
}

/**
 * Renders data into card components
 */
function renderFFCard() {
    // Ensure currentFactList is strictly an array before proceeding
    if (!Array.isArray(currentFactList) || currentFactList.length === 0) return;

    const fact = currentFactList[currentFactIndex] || {};
    const total = currentFactList.length;

    // Counter
    const currentIdxEl = document.getElementById('ff-current-idx');
    const totalCountEl = document.getElementById('ff-total-count');
    if (currentIdxEl) currentIdxEl.innerText = String(currentFactIndex + 1).padStart(2, '0');
    if (totalCountEl) totalCountEl.innerText = String(total).padStart(2, '0');

    // Content fields
    const headlineEl = document.getElementById('ff-headline');
    const bodyTextEl = document.getElementById('ff-body-text');
    const dykTextEl = document.getElementById('ff-dyk-text');

    let head = fact.headline || fact.title || '';
    let body = fact.body || fact.description || '';
    let dyk = fact.dyk || fact.didYouKnow || '';

    const sid = window.currentSelectedSite && window.currentSelectedSite.site_id;
    if (sid && window.PBH && window.PBH.i18n) {
        const i18n = window.PBH.i18n;
        const n = currentFactIndex + 1;
        const t = i18n.localized('site.' + sid + '.fact.' + n + '.title', '');
        const d = i18n.localized('site.' + sid + '.fact.' + n + '.desc', '');
        const y = i18n.localized('site.' + sid + '.fact.' + n + '.dyk', '');
        if (t) head = t;
        if (d) body = d;
        if (y) dyk = y;
    }
    if (!head) head = (window.PBH && window.PBH.i18n) ? window.PBH.i18n.get('ff.label', 'Landmark Trivia') : 'Landmark Trivia';

    if (headlineEl) headlineEl.innerHTML = head;
    if (bodyTextEl) bodyTextEl.innerText = body;
    if (dykTextEl) dykTextEl.innerText = dyk;

    // Tags (ensure tags is an array)
    const tagContainer = document.getElementById('ff-tag-container');
    if (tagContainer) {
        const tagsArray = Array.isArray(fact.tags) ? fact.tags : [];
        tagContainer.innerHTML = tagsArray.map(t => `<span class="ff-tag-pill">${t}</span>`).join('');
    }

    // Dot Pager (safely mapping over currentFactList)
    const dotsContainer = document.getElementById('ff-dots-pager');
    if (dotsContainer) {
        dotsContainer.innerHTML = currentFactList.map((_, idx) => 
            `<span class="ff-dot ${idx === currentFactIndex ? 'active' : ''}" onclick="jumpToFF(${idx})"></span>`
        ).join('');
    }
}

/**
 * Navigation Controls
 */
function navigateFF(direction) {
    if (!Array.isArray(currentFactList) || currentFactList.length === 0) return;
    currentFactIndex = (currentFactIndex + direction + currentFactList.length) % currentFactList.length;
    renderFFCard();
}

function jumpToFF(index) {
    currentFactIndex = index;
    renderFFCard();
}

function closeFFPopover() {
    const ffWrapper = document.getElementById('ff-popover-wrapper');
    if (ffWrapper) ffWrapper.classList.remove('active');
}

// Global Exports
window.positionAndShowFFPopover = positionAndShowFFPopover;
window.closeFFPopover = closeFFPopover;
window.navigateFF = navigateFF;
window.jumpToFF = jumpToFF;
window.updateFFPopoverPosition = updateFFPopoverPosition;