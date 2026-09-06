/**
 * Project Bahandi - Heritage Structure Citation (HSC) Controller
 */

let currentHSCTab = 'statement';

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

    if (heroImg) heroImg.src = site?.image || site?.heroImage || 'assets/MoloFront.jpg';
    if (heroBadge) heroBadge.innerText = site?.heritage_status || site?.designation || 'NATIONAL HERITAGE SITE';
    if (heroTitle) heroTitle.innerText = site?.site_name || 'Molo Heritage Site';
    if (heroSub) heroSub.innerText = `${site?.district || 'DISTRICT OF MOLO'} · ${site?.city || 'ILOILO CITY'}`;

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

    if (!mainPara || !secPara) return;

    if (currentHSCTab === 'statement') {
        mainPara.innerText = site?.architectural_statement 
            || site?.statement 
            || site?.description 
            || "This structure displays distinct colonial architecture, preserving regional heritage through key historical elements.";
            
        secPara.innerText = site?.architectural_details 
            || site?.statement_sub 
            || "Featured details include traditional masonry, reinforced mortar composition, and characteristic district motifs.";

    } else if (currentHSCTab === 'significance') {
        mainPara.innerText = site?.historical_significance 
            || site?.significance 
            || "Serving as a major community anchor, this site played a vital role during historical developments in Iloilo.";
            
        secPara.innerText = site?.cultural_impact 
            || site?.significance_sub 
            || "The landmark remains a key symbol of local identity and ongoing preservation efforts.";

    } else if (currentHSCTab === 'citation') {
        mainPara.innerText = site?.official_citation 
            || site?.citation 
            || `Official designation recognized under national heritage legislation. Reference Code: ${site?.site_id || 'BHD-ML-0001'}.`;
            
        secPara.innerText = site?.citation_source 
            || site?.declaration_ref 
            || "Archived under the National Historical Commission of the Philippines (NHCP) regional registry.";
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