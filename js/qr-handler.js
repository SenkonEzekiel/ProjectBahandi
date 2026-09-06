/**
 * Project Bahandi - QR Code (QR) Controller
 * Manages the slide-in QR sidebar panel and site image dynamic binding
 */

/**
 * Opens and Populates the QR Code Panel
 */
function openQRPanel() {
    const qrPanel = document.getElementById('qr-panel');
    const mainSidebar = document.getElementById('info-sidebar');
    
    if (!qrPanel) return;

    // Collapse the main sidebar to prevent UI overlap
    if (mainSidebar) {
        mainSidebar.classList.add('collapsed');
    }

    const site = window.currentSelectedSite;

    // 1. Reference Code & Title
    const refCodeEl = document.getElementById('qr-ref-code');
    const titleEl = document.getElementById('qr-landmark-title');

    if (refCodeEl) {
        const siteId = site?.site_id || site?.id || 'BHD-ML-0001';
        refCodeEl.innerText = `REF · ${siteId} · QR ACCESS`;
    }

    if (titleEl) {
        const rawTitle = site?.site_name || site?.title || 'Molo Landmark';
        // Formats the last word in italics for typography styling
        const formattedTitle = rawTitle.replace(/\b(\w+)$/, '<em>$1</em>');
        titleEl.innerHTML = `${formattedTitle} <em>QR Code</em>`;
    }

    // 2. QR Image Source Setup
    const qrImgEl = document.getElementById('qr-code-img');
    if (qrImgEl) {
        if (site?.qr_code_url) {
            qrImgEl.src = site.qr_code_url;
        } else if (site?.site_id) {
            // Dynamic fallback path structure
            qrImgEl.src = `assets/qr-codes/${site.site_id}.png`;
        } else {
            // Default placeholder QR code
            qrImgEl.src = 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://projectbahandi.com';
        }
        qrImgEl.alt = `${site?.site_name || 'Landmark'} QR Code`;
    }

    // 3. Populate Specification Values
    const valId = document.getElementById('qr-val-id');
    const valDistrict = document.getElementById('qr-val-district');
    const valFormat = document.getElementById('qr-val-format');
    const valStatus = document.getElementById('qr-val-status');

    if (valId) valId.innerText = site?.site_id || 'BHD-ML-0001';
    if (valDistrict) valDistrict.innerText = site?.district || 'Molo, Iloilo City';
    if (valFormat) valFormat.innerText = site?.qr_format || 'PNG / 1024px';
    if (valStatus) valStatus.innerText = site?.qr_status || 'ACTIVE & VERIFIED';

    // 4. Slide-in the Panel
    qrPanel.classList.add('active');
}

/**
 * Closes the QR Code Panel and restores main sidebar state
 */
function closeQRPanel() {
    const qrPanel = document.getElementById('qr-panel');

    if (qrPanel) {
        qrPanel.classList.remove('active');
    }
}
/**
 * Downloads the current site's QR code image
 */
function downloadQRCode() {
    const site = window.currentSelectedSite;
    const qrImgEl = document.getElementById('qr-code-img');

    if (!qrImgEl || !qrImgEl.src) {
        alert('QR code image unavailable.');
        return;
    }

    const downloadLink = document.createElement('a');
    downloadLink.href = qrImgEl.src;
    downloadLink.download = `${site?.site_id || 'bahandi'}-qr-code.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

/**
 * Copies the deep-link URL to clipboard
 */
function shareQRLink() {
    const site = window.currentSelectedSite;
    const siteId = site?.site_id || 'BHD-ML-0001';
    const accessUrl = site?.access_url || `https://projectbahandi.com/map?site=${siteId}`;

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(accessUrl).then(() => {
            alert('Access link copied to clipboard!');
        }).catch(() => {
            prompt('Copy link:', accessUrl);
        });
    } else {
        prompt('Copy link:', accessUrl);
    }
}

// Global Exports
window.openQRPanel = openQRPanel;
window.closeQRPanel = closeQRPanel;
window.downloadQRCode = downloadQRCode;
window.shareQRLink = shareQRLink;