(function () {
    "use strict";

    var STORE_KEY = "bahandi_consent";
    var policyModal = null;
    var lastTrigger = null;

    function alreadyDecided() {
        try {
            var v = localStorage.getItem(STORE_KEY);
            return v === "accepted" || v === "declined";
        } catch (e) { /* private mode */ }
        return false;
    }

    function persist(value) {
        try { localStorage.setItem(STORE_KEY, value); } catch (e) { /* ignore */ }
    }

    function i18n(key, fallback) {
        if (window.PBH && window.PBH.i18n) return window.PBH.i18n.localized(key, fallback);
        return fallback;
    }

    function applyI18n() {
        if (window.PBH && window.PBH.i18n && window.PBH.i18n.applyDOM) {
            try { window.PBH.i18n.applyDOM(); } catch (e) { /* ignore */ }
        }
    }

    function buildBanner() {
        var el = document.createElement("div");
        el.className = "consent-banner";
        el.setAttribute("role", "region");
        el.setAttribute("aria-label", i18n("consent.privacy", "Privacy Policy"));
        el.id = "consent-banner";

        el.innerHTML =
            '<div class="consent-inner">' +
                '<svg class="consent-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                    '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>' +
                    '<path d="M9 12l2 2 4-4"/>' +
                '</svg>' +
                '<div class="consent-body">' +
                    '<p class="consent-msg">' +
                        i18n("consent.msg", "We use cookies and collect basic analytics to improve your experience.") +
                    '</p>' +
                    '<div class="consent-actions">' +
                        '<button type="button" class="consent-link" data-policy-open data-i18n="consent.privacy">' +
                            i18n("consent.privacy", "Privacy Policy") +
                        '</button>' +
                        '<button type="button" class="consent-link" data-policy-open data-i18n="consent.terms">' +
                            i18n("consent.terms", "Terms of Use") +
                        '</button>' +
                        '<button type="button" class="consent-btn consent-decline" data-consent="declined">' +
                            i18n("consent.decline", "Essential Only") +
                        '</button>' +
                        '<button type="button" class="consent-btn consent-accept" data-consent="accepted">' +
                            i18n("consent.accept", "Accept All") +
                        '</button>' +
                    '</div>' +
                '</div>' +
            '</div>';

        return el;
    }

    function buildPolicyModal() {
        var modal = document.createElement("div");
        modal.className = "policy-modal";
        modal.id = "consent-policy-modal";
        modal.setAttribute("role", "dialog");
        modal.setAttribute("aria-modal", "true");
        modal.setAttribute("aria-labelledby", "policy-title");

        modal.innerHTML =
            '<div class="policy-backdrop" data-policy-backdrop></div>' +
            '<div class="policy-dialog" role="document" tabindex="-1">' +
                '<div class="policy-header">' +
                    '<h3 class="policy-title" id="policy-title" data-i18n="policy.title">' +
                        i18n("policy.title", "Terms of Service & Privacy Policy") +
                    '</h3>' +
                    '<button type="button" class="policy-close" data-policy-close data-i18n-aria="policy.close" aria-label="Close">×</button>' +
                '</div>' +
                '<div class="policy-body">' +
                    '<p class="policy-intro" data-i18n="policy.intro">' +
                        i18n("policy.intro", "Project Bahandi is a non-commercial, educational cultural heritage GIS for Molo, Iloilo City. This document explains how the site and its data may be used.") +
                    '</p>' +
                    '<section class="policy-section" data-policy-section="terms">' +
                        '<h4 data-i18n="policy.terms.heading">' + i18n("policy.terms.heading", "Terms of Service") + '</h4>' +
                        '<p data-i18n="policy.terms.body">' +
                            i18n("policy.terms.body", "This website is provided for educational and non-commercial research purposes. By using it you agree not to misuse the information, republish the dataset at scale without attribution, or use the site for unlawful activity. Landmark details are provided for general reference.") +
                        '</p>' +
                    '</section>' +
                    '<section class="policy-section" data-policy-section="data">' +
                        '<h4 data-i18n="policy.data.heading">' + i18n("policy.data.heading", "Data Collection") + '</h4>' +
                        '<p data-i18n="policy.data.body">' +
                            i18n("policy.data.body", "The site only stores your preferences locally on your device. If you sign in, your email address is handled by Firebase Authentication. No browsing history, location, or personal identifiers are sent to project servers.") +
                        '</p>' +
                    '</section>' +
                    '<section class="policy-section" data-policy-section="local">' +
                        '<h4 data-i18n="policy.local.heading">' + i18n("policy.local.heading", "LocalStorage Usage") + '</h4>' +
                        '<p data-i18n="policy.local.body">' +
                            i18n("policy.local.body", "Three small preference values are kept in your browser\u2019s localStorage: your consent choice (bahandi_consent), your interface theme (bahandi_theme), and your selected language (bahandi_lang). They never leave your device. You can clear them anytime with your browser\u2019s \u201CClear site data\u201D option.") +
                        '</p>' +
                    '</section>' +
                    '<section class="policy-section" data-policy-section="educational">' +
                        '<h4 data-i18n="policy.educational.heading">' + i18n("policy.educational.heading", "Educational Scope") + '</h4>' +
                        '<p data-i18n="policy.educational.body">' +
                            i18n("policy.educational.body", "All site content is intended for classroom and community heritage education. Heritage status and historical details should be verified with official sources, including the National Historical Commission of the Philippines and the Iloilo City Government.") +
                        '</p>' +
                    '</section>' +
                    '<section class="policy-section" data-policy-section="liability">' +
                        '<h4 data-i18n="policy.liability.heading">' + i18n("policy.liability.heading", "Liability") + '</h4>' +
                        '<p data-i18n="policy.liability.body">' +
                            i18n("policy.liability.body", "The information is provided \u201Cas is\u201D without warranties of any kind. The project team is not liable for decisions made by third parties based on this content, or for temporary unavailability of the site, including outages of map tiles or the Firebase backend.") +
                        '</p>' +
                    '</section>' +
                    '<section class="policy-section" data-policy-section="rights">' +
                        '<h4 data-i18n="policy.rights.heading">' + i18n("policy.rights.heading", "User Rights") + '</h4>' +
                        '<p data-i18n="policy.rights.body">' +
                            i18n("policy.rights.body", "You may access, correct, or delete the preference data stored on your device at any time. To withdraw consent, choose \u201CEssential Only\u201D or clear site data. For questions or requests, use the Contact page.") +
                        '</p>' +
                    '</section>' +
                '</div>' +
                '<div class="policy-footer">' +
                    '<button type="button" class="policy-btn" data-policy-close data-i18n="policy.close">' +
                        i18n("policy.close", "Close") +
                    '</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(modal);
        policyModal = modal;
        applyI18n();

        modal.addEventListener("click", function (e) {
            var t = e.target;
            if (t === modal) { closePolicyModal(); return; }
            if (t.getAttribute && t.getAttribute("data-policy-backdrop") !== null) { closePolicyModal(); return; }
            if (t.closest && t.closest("[data-policy-close]")) { closePolicyModal(); }
        });

        return modal;
    }

    function ensurePolicyModal() {
        if (policyModal && policyModal.parentNode) return policyModal;
        policyModal = null;
        return buildPolicyModal();
    }

    function openPolicyModal() {
        var modal = ensurePolicyModal();
        modal.classList.add("open");
        document.body.classList.add("policy-lock");
        lastTrigger = document.activeElement;
        var dialog = modal.querySelector(".policy-dialog");
        if (dialog && dialog.focus) dialog.focus();
    }

    function closePolicyModal() {
        var modal = document.getElementById("consent-policy-modal");
        if (!modal) return;
        modal.classList.remove("open");
        document.body.classList.remove("policy-lock");
        try {
            if (lastTrigger && lastTrigger.focus) lastTrigger.focus();
        } catch (e) { /* ignore */ }
    }

    function applyLang() {
        var banner = document.getElementById("consent-banner");
        if (!banner) return;
        var msg = banner.querySelector(".consent-msg");
        var decline = banner.querySelector(".consent-decline");
        var accept = banner.querySelector(".consent-accept");
        if (msg) msg.textContent = i18n("consent.msg", msg.textContent);
        if (decline) decline.textContent = i18n("consent.decline", decline.textContent);
        if (accept) accept.textContent = i18n("consent.accept", accept.textContent);
    }

    function dismiss(banner) {
        banner.classList.remove("visible");
        banner.classList.add("leaving");
        setTimeout(function () {
            if (banner.parentNode) banner.parentNode.removeChild(banner);
        }, 400);
    }

    function show() {
        var banner = buildBanner();
        document.body.appendChild(banner);
        ensurePolicyModal();
        applyI18n();

        requestAnimationFrame(function () {
            banner.classList.add("visible");
        });

        banner.addEventListener("click", function (e) {
            var open = e.target.closest ? e.target.closest("[data-policy-open]") : null;
            if (open) { lastTrigger = open; openPolicyModal(); return; }
            var btn = e.target.closest ? e.target.closest("[data-consent]") : null;
            if (!btn) return;
            persist(btn.getAttribute("data-consent"));
            dismiss(banner);
        });
    }

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" || e.keyCode === 27) {
            var modal = document.getElementById("consent-policy-modal");
            if (modal && modal.classList.contains("open")) closePolicyModal();
        }
    });

    function init() {
        if (alreadyDecided()) return;
        if (!document.body) {
            document.addEventListener("DOMContentLoaded", function () {
                setTimeout(show, 1000);
            });
            return;
        }
        setTimeout(show, 1000);
    }

    window.PBH = window.PBH || {};
    window.PBH.i18nOnChange = (function (prev) {
        return function (lang) {
            if (typeof prev === "function") prev(lang);
            applyLang();
        };
    })(window.PBH.i18nOnChange);

    init();
})();