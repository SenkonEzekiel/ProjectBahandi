/* ==========================================================================
   PBH.theme — shared Light/Dark theme controller for all Project Bahandi pages
   Loaded in <head> on every page. Companion boot snippet sets html[data-theme]
   before CSS paint to avoid theme flash.
   ========================================================================== */
(function () {
    "use strict";

    var STORE_KEY = "bahandi_theme";
    var ALLOWED_THEMES = ["light", "dark"];

    function stored() {
        try {
            var v = localStorage.getItem(STORE_KEY);
            return ALLOWED_THEMES.indexOf(v) !== -1 ? v : null;
        } catch (e) { /* private mode */ }
        return null;
    }

    function prefersDark() {
        return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
    }

    function preferred() {
        return stored() || (prefersDark() ? "dark" : "light");
    }

    function isLight() {
        return !document.body.classList.contains("theme-dark") &&
               (document.body.classList.contains("theme-light") || !document.body.classList.contains("theme-dark"));
    }

    function apply(theme) {
        if (ALLOWED_THEMES.indexOf(theme) === -1) theme = prefersDark() ? "dark" : "light";
        var light = theme === "light";
        document.body.classList.toggle("theme-light", light);
        document.body.classList.toggle("theme-dark", !light);
        document.documentElement.setAttribute("data-theme", light ? "light" : "dark");
        document.documentElement.style.colorScheme = light ? "light" : "dark";
        var i, toggles = document.querySelectorAll(".theme-toggle");
        for (i = 0; i < toggles.length; i++) {
            toggles[i].setAttribute("aria-pressed", light ? "false" : "true");
        }
    }

    function toggle() {
        var next = document.body.classList.contains("theme-light") ? "dark" : "light";
        try { localStorage.setItem(STORE_KEY, next); } catch (e) { /* ignore */ }
        apply(next);
        return next;
    }

    window.PBH = window.PBH || {};
    window.PBH.theme = {
        get: function () { return document.body.classList.contains("theme-light") ? "light" : "dark"; },
        set: apply,
        toggle: toggle,
        preferred: preferred
    };

    /* Global delegation: any .theme-toggle anywhere toggles the theme. */
    document.addEventListener("click", function (e) {
        var btn = e.target && e.target.closest ? e.target.closest(".theme-toggle") : null;
        if (btn) window.PBH.theme.toggle();
    });

    function init() {
        if (!document.body) {
            document.addEventListener("DOMContentLoaded", init);
            return;
        }
        apply(preferred());
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();