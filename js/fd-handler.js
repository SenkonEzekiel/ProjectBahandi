window.syncBlueprintPanel = function() {
    if (!window.currentSelectedSite) return;
    
    const site = window.currentSelectedSite;
    
    // Update Title & Meta
    const titleEl = document.getElementById('bp-landmark-title');
    if (titleEl) titleEl.innerHTML = `${site.site_name || 'Landmark'} <em>Details</em>`;
    
    const refCodeEl = document.getElementById('bp-ref-code');
    if (refCodeEl) refCodeEl.innerText = `REF · ${site.site_id || 'BHD-ML-0001'} · FULL DETAILS`;
    
    // Update Description
    const descEl = document.getElementById('bp-landmark-desc');
    if (descEl) descEl.innerText = site.description || site.full_history || 'No full description available.';
    
    // Update Data Sheet fields
    const builtEl = document.getElementById('bp-data-built');
    if (builtEl) builtEl.innerText = site.year_built || site.built || 'N/A';
    
    const styleEl = document.getElementById('bp-data-style');
    if (styleEl) styleEl.innerText = site.architectural_style || site.style || 'N/A';
    
    const statusEl = document.getElementById('bp-data-status');
    if (statusEl) statusEl.innerText = site.heritage_status || site.status || 'N/A';
    
    // Update Coordinates if available
    const coordsEl = document.getElementById('bp-coords-text');
    if (coordsEl && site.coordinates) {
        coordsEl.innerText = `${site.coordinates.lat || 0}° N · ${site.coordinates.lng || 0}° E`;
    }
};