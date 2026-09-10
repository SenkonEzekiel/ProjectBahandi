/**
 * Project Bahandi - Heritage Status (HS) Controller
 */

function hsSiteName(site, fb) {
    if (site && window.PBH && window.PBH.i18n) {
        const entry = window.PBH.i18n.site(site.site_id);
        if (entry && entry.name) return entry.name;
    }
    return site?.site_name || site?.title || fb;
}

/**
 * Opens and populates the Heritage Status (HS) Certificate Modal
 */
function openHSModal() {
    const hsOverlay = document.getElementById('hs-overlay');
    if (!hsOverlay) return;

    const site = window.currentSelectedSite;
    const i18n = (window.PBH && window.PBH.i18n) ? window.PBH.i18n : null;
    const loc = function(key, fb) { return i18n ? i18n.get(key, fb) : fb; };

    // Registry Header Fields
    const regCodeEl = document.getElementById('hs-reg-code');
    const authByEl = document.getElementById('hs-auth-by');
    
    if (regCodeEl) regCodeEl.innerText = site?.registry_id || site?.site_id || 'BHD-REG-2026';
    if (authByEl) authByEl.innerText = site?.authenticator || site?.governing_body || 'NHCP / ILOILO HERITAGE COUNCIL';

    // Main Details
    const titleEl = document.getElementById('hs-landmark-title');
    const summaryEl = document.getElementById('hs-summary-text');

    if (titleEl) {
        const titleText = hsSiteName(site, 'Molo Heritage Site');
        titleEl.innerHTML = titleText.replace(/\b(\w+)$/, '<em>$1</em>');
    }

    if (summaryEl) {
        summaryEl.innerText = site?.hs_summary 
            || site?.heritage_description 
            || loc('hs.summary.fallback', "Officially certified as an active cultural heritage structure under local and national preservation standards.");
    }

    // Grid Data Fields
    const fieldReg = document.getElementById('hs-val-registry');
    const fieldMarker = document.getElementById('hs-val-marker');
    const fieldOrdinance = document.getElementById('hs-val-ordinance');

    if (fieldReg) fieldReg.innerText = site?.legal_classification || site?.heritage_status || loc('hs.classification.fallback', 'NATIONAL HERITAGE LANDMARK');
    if (fieldMarker) fieldMarker.innerText = site?.marker_year || site?.built_year || loc('hs.markerYear.fallback', '19TH CENTURY');
    if (fieldOrdinance) fieldOrdinance.innerText = site?.ordinance_no || site?.declaration_no || loc('hs.ordinance.fallback', 'ORD NO. 2012-084');

    // Footer Source Link
    const sourceLink = document.getElementById('hs-source-link');
    if (sourceLink) {
        sourceLink.href = site?.legal_document_url || site?.archive_url || '#';
    }

    hsOverlay.classList.add('active');
}

/**
 * Closes the Heritage Status (HS) Certificate Modal
 */
function closeHSModal() {
    const hsOverlay = document.getElementById('hs-overlay');
    if (hsOverlay) {
        hsOverlay.classList.remove('active');
    }
}

// Global Exports
window.openHSModal = openHSModal;
window.closeHSModal = closeHSModal;