/**
 * Project Bahandi - Heritage Structure Citation (HSC) Controller
 */

let currentHSCTab = 'statement';

function hscSiteName(site, fb) {
    if (site && window.PBH && window.PBH.i18n) {
        const entry = window.PBH.i18n.site(site.site_id);
        if (entry && entry.name) return entry.name;
    }
    return site?.site_name || site?.title || fb;
}

/**
 * Opens and populates the Heritage Structure Citation (HSC) side panel
 */
function openHSCModal() {
    const hscPanel = document.getElementById('hsc-panel');
    if (!hscPanel) return;

    const site = window.currentSelectedSite;

    // Populating Hero Banner
    const heroImg = document.getElementById('hsc-hero-img');
    const heroBadge = document.getElementById('hsc-hero-badge');
    const heroTitle = document.getElementById('hsc-hero-title');
    const heroSub = document.getElementById('hsc-hero-sub');

    if (heroImg) {
        if (typeof window.bindLandmarkImage === 'function') {
            window.bindLandmarkImage(heroImg, site, hscSiteName(site, 'Heritage Landmark'));
        } else {
            heroImg.onerror = function () {
                this.onerror = null;
                this.src = 'assets/Landmark_images/placeholder.jpeg';
            };
            heroImg.src = site?.localImage || site?.image || 'assets/Landmark_images/placeholder.jpeg';
        }
    }
    if (heroBadge) heroBadge.innerText = site?.heritage_status || site?.designation || ((window.PBH && window.PBH.i18n) ? window.PBH.i18n.get('hsc.badge.fallback', 'NATIONAL HERITAGE SITE') : 'NATIONAL HERITAGE SITE');
    if (heroTitle) heroTitle.innerText = hscSiteName(site, 'Molo Heritage Site');
    if (heroSub) heroSub.innerText = `${site?.district || ((window.PBH && window.PBH.i18n) ? window.PBH.i18n.get('hsc.distDefault', 'DISTRICT OF MOLO') : 'DISTRICT OF MOLO')} · ${site?.city || ((window.PBH && window.PBH.i18n) ? window.PBH.i18n.get('hsc.cityDefault', 'ILOILO CITY') : 'ILOILO CITY')}`;

    // Populating Footer Metadata Chips
    const chipDesignation = document.getElementById('hsc-chip-designation');
    const chipEra = document.getElementById('hsc-chip-era');
    const citeLink = document.getElementById('hsc-cite-link');

    if (chipDesignation) chipDesignation.innerText = site?.citation_type || site?.declaration || 'NHCP MARKER';
    if (chipEra) chipEra.innerText = site?.built_year || site?.period || '19TH CENTURY';
    if (citeLink) citeLink.href = site?.archive_url || site?.citationLink || '#';

    // Reset tab to default 'statement' on panel open
    currentHSCTab = 'statement';
    
    // Update active tab UI buttons
    const tabContainer = document.querySelector('.hsc-pill-tabs');
    if (tabContainer) {
        const buttons = tabContainer.querySelectorAll('.hsc-pill-btn');
        buttons.forEach(btn => {
            if (btn.getAttribute('onclick')?.includes('statement')) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    renderHSCContent();
    hscPanel.classList.add('active');
}

/**
 * Renders body content based on the selected tab
 */
function renderHSCContent() {
    const site = window.currentSelectedSite;
    const mainPara = document.getElementById('hsc-main-paragraph');
    const secPara = document.getElementById('hsc-sec-paragraph');
    const i18n = (window.PBH && window.PBH.i18n) ? window.PBH.i18n : null;
    const loc = function(key, fb) { return i18n ? i18n.get(key, fb) : fb; };

    if (!mainPara || !secPara) return;

    if (currentHSCTab === 'statement') {
        mainPara.innerText = site?.architectural_statement 
            || site?.statement 
            || site?.description 
            || loc('hsc.tab.statement.main', "This structure displays distinct colonial architecture, preserving regional heritage through key historical elements.");
            
        secPara.innerText = site?.architectural_details 
            || site?.statement_sub 
            || loc('hsc.tab.statement.sub', "Featured details include traditional masonry, reinforced mortar composition, and characteristic district motifs.");

    } else if (currentHSCTab === 'significance') {
        mainPara.innerText = site?.historical_significance 
            || site?.significance 
            || loc('hsc.tab.significance.main', "Serving as a major community anchor, this site played a vital role during historical developments in Iloilo.");
            
        secPara.innerText = site?.cultural_impact 
            || site?.significance_sub 
            || loc('hsc.tab.significance.sub', "The landmark remains a key symbol of local identity and ongoing preservation efforts.");

    } else if (currentHSCTab === 'citation') {
        mainPara.innerText = site?.official_citation 
            || site?.citation 
            || loc('hsc.tab.citation.main', "Official designation recognized under national heritage legislation.") + ` Reference Code: ${site?.site_id || 'BHD-ML-0001'}.`;
            
        secPara.innerText = site?.citation_source 
            || site?.declaration_ref 
            || loc('hsc.tab.citation.sub', "Archived under the National Historical Commission of the Philippines (NHCP) regional registry.");
    }
}

/**
 * Tab switcher handler
 */
function switchHSCTab(buttonElement, tabName) {
    if (!buttonElement || !tabName) return;

    currentHSCTab = tabName;

    // Update UI active state across tab buttons
    const parentContainer = buttonElement.parentElement;
    if (parentContainer) {
        const tabs = parentContainer.querySelectorAll('.hsc-pill-btn');
        tabs.forEach(tab => tab.classList.remove('active'));
    }
    buttonElement.classList.add('active');

    renderHSCContent();
}

/**
 * Closes the HSC side panel
 */
function closeHSCModal() {
    const hscPanel = document.getElementById('hsc-panel');
    if (hscPanel) {
        hscPanel.classList.remove('active');
    }
}

// Global Exports
window.openHSCModal = openHSCModal;
window.closeHSCModal = closeHSCModal;
window.switchHSCTab = switchHSCTab;