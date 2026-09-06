/**
 * Project Bahandi - Heritage Status (HS) Controller
 */

/**
 * Opens and populates the Heritage Status (HS) Certificate Modal
 */
function openHSModal() {
    const hsOverlay = document.getElementById('hs-overlay');
    if (!hsOverlay) return;

    const site = window.currentSelectedSite;

    // Registry Header Fields
    const regCodeEl = document.getElementById('hs-reg-code');
    const authByEl = document.getElementById('hs-auth-by');
    
    if (regCodeEl) regCodeEl.innerText = site?.registry_id || site?.site_id || 'BHD-REG-2026';
    if (authByEl) authByEl.innerText = site?.authenticator || site?.governing_body || 'NHCP / ILOILO HERITAGE COUNCIL';

    // Main Details
    const titleEl = document.getElementById('hs-landmark-title');
    const summaryEl = document.getElementById('hs-summary-text');

    if (titleEl) {
        const titleText = site?.site_name || site?.title || 'Molo Heritage Site';
        titleEl.innerHTML = titleText.replace(/\b(\w+)$/, '<em>$1</em>');
    }

    if (summaryEl) {
        summaryEl.innerText = site?.hs_summary 
            || site?.heritage_description 
            || "Officially certified as an active cultural heritage structure under local and national preservation standards.";
    }

    // Grid Data Fields
    const fieldReg = document.getElementById('hs-val-registry');
    const fieldMarker = document.getElementById('hs-val-marker');
    const fieldOrdinance = document.getElementById('hs-val-ordinance');

    if (fieldReg) fieldReg.innerText = site?.legal_classification || site?.heritage_status || 'NATIONAL HERITAGE LANDMARK';
    if (fieldMarker) fieldMarker.innerText = site?.marker_year || site?.built_year || '19TH CENTURY';
    if (fieldOrdinance) fieldOrdinance.innerText = site?.ordinance_no || site?.declaration_no || 'ORD NO. 2012-084';

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