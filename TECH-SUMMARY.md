# Bahandi — Global UI Refresh: Technical Summary

Companion to `AGENTS.md`. Covers the user-facing global overhaul: 4-language i18n, theme switching, the Terms & Privacy consent toast, sidebar deep-i18n, dead-code removal, and image-alt accessibility.

---

## 1. File-by-File Change Log

### `js/i18n.js` — internationalization engine (now ~2235 lines)

- Public API on `window.PBH.i18n`: `get(key, fallback)`, `localized(key, fallback)`, `set(lang)`, `applyDOM()`, `categoryKey(top)`, `category(site, top)`, `site(site, top, onEmpty)`, plus `setSafeHTML()` for HTML strings.
- `ALLOWED_LANGS = ["en", "ms", "th", "tl"]`; persistence key `bahandi_lang` (default `en`). Unknown stored values are rejected and reset.
- Full dictionaries for EN, MS (Malay), TH (Thai), TL (Christian Filipino).
- `applyDOM()` walks `[data-i18n]`, `[data-i18n-html]`, `[data-i18n-placeholder]`, `[data-i18n-title]`, `[data-i18n-aria]`, `[data-i18n-alt]`. It only touches elements that have an existing matching key, so untranslated text is left untouched.
- `setSafeHTML()` sanitizes translated HTML through `DOMParser` — strips `script`/`iframe`/`object`/`embed`/`link`/`meta`/`base`, removes all `on*` attributes, blocks `javascript:` URLs. Translated strings are never injected with innerHTML unsanitized.
- Key expansion this session:
  - Consent: `consent.msg`, `consent.privacy`, `consent.decline`, `consent.accept`.
  - DigitalMap chrome: `mini.flyout.*` (6 panels), `tb.*` (toolbar), plus `fd.*`, `ff.*`, `hsc.*`, `hs.*`, `pg.*`, `qr.*` panel keys.
  - Handler fallbacks: `fd.title.suffix`, `fd.desc.fallback`, `hsc.badge.fallback`, `hsc.distDefault`, `hsc.cityDefault`, `hsc.tab.{statement,significance,citation}.{main,sub}`, `hs.summary.fallback`, `hs.classification.fallback`, `hs.markerYear.fallback`, `hs.ordinance.fallback`, `pg.title.{interactive,challenge}`, `pg.subDesc.fallback`, `pg.m1.*`, `pg.m2.*`, `pg.launch3d`, `pg.launchGame`, `pg.gameUnavailable`, `pg.alert.{loading3d,noGame,yet}`, `qr.accessSuffix`, `qr.titleSuffix`, `qr.status.fallback`, `qr.alert.{unavailable,copied}`, `ff.fallback.{1,2,3}.{head,body,dyk}`.
  - Classification tags: `cat.{architecture,masonry,heritage,culture,history}` (added alongside existing house/church/plaza/market/civic/marker tags).
  - Image alts: `img.*` (7 keys).
- Note: a pre-existing `ff.dyk`/`ff.fact`/`ff.defaultTitle`/`ff.defaultDesc` set overlaps the newer `ff.label`/`ff.dyk`. Later keys win; `ff.dyk` now carries a 💡 prefix. `ff.label` is what the HTML references.

### `js/theme.js` — light/dark theme engine

- `window.PBH.theme` exposes `get()`, `set()`, `toggle()`, `preferred()`.
- Valid values are `["light", "dark"]` (`ALLOWED_THEMES`); key `bahandi_theme`.
- Toggles `body.theme-light`/`body.theme-dark`, sets `html[data-theme]` and the `color-scheme`.
- A tiny FOUC-prevention snippet sits in each HTML `<head>` **before** the CSS `<link>`s, so the correct theme is applied before first paint (no white flash in dark mode).

### `js/consent.js` — Terms & Privacy consent toast (redesigned)

- Key `bahandi_consent`; stored value is `"accepted"` or `"declined"`. `alreadyDecided()` short-circuits — the banner never reappears on the same origin.
- Toast markup (`#consent-banner`): shield SVG icon + message + `Privacy Policy` link (→ `about.html#privacy`) + `Essential Only` (outline) + `Accept All` (gold) buttons, each carrying `data-consent`.
- Show: appended to `<body>`, `requestAnimationFrame` adds `.visible`, which runs the `consentSlideUp` keyframe (slides up from `translateY(120%)`). Dismiss adds `.leaving` (runs `consentSlideDown`) and removes the node after 400 ms.
- `applyLang()` re-translates live text via the `PBH.i18nOnChange` hook when the user switches language.
- `localStorage` access is wrapped in `try/catch` so private/blocked storage never throws.

### `js/MapHandler.js` — dead code removal + image pipeline

- **Removed** (had zero external callers): `openFeatureModal`, `closeFeatureModal`, `handleFullDetails`, `handleQRCode`, `handleHeritageStatus`, `handleHistoricalSignificance`, `handleFunFacts`, `handlePlayGame`, `launchGame`, and the orphaned `featureModal`/`modalContent` consts. No `#feature-modal` exists in the HTML.
- **Image pipeline** (`PBH.image.resolveSiteImage(site)`): remote images must be `https://` (`isRemote` regex); otherwise falls back to `assets/Landmark_images/{key}.png` → `{key}.jpg` → `_fallback.svg`, with an `onError` chain.
- Site-name and detail strings routed through `PBH.i18n.site(...)`/`get(...)` so markers and modals translate.
- `renderSearchResults` rewritten to build DOM nodes instead of concatenating HTML; image error handling delegated to the shared container. Markers, modals, game hooks, and the static-Firestore merge (lines ~413–434) were left untouched.

### `js/login.js` — broken redirect fixed

- Both the email/password and Google OAuth success paths now send the user to `index.html`.
- Previously they redirected to `../User/user-home.html`, which does not exist in the repo.

### Game handlers — wired to i18n fallbacks

- `js/fd-handler.js`, `js/ff-handler.js`, `js/hsc-handler.js`, `js/hs-handler.js`, `js/pg-handler.js`, `js/qr-handler.js` now resolve hardcoded strings (badges, subtitles, status pills, mode cards, launch labels, alert dialogs, fact decks, tag pills) through `PBH.i18n.get(key, fallback)` so they translate correctly when the sidebar opens.

### `css/style.css`

- Consent block (~line 2118) redesigned into a floating glassmorphism toast: `position: fixed; bottom: 1.5rem; left: 50%; transform: translateX(-50%)`, `z-index: 9999`, `backdrop-filter: blur(12px)` over a navy/paper surface, gold `#C9A227` border/button accents, pill buttons, and the `consentSlideUp`/`consentSlideDown` keyframes. Slide animation runs on the element while the `translateX(-50%)` centering is folded into the keyframe transform so nothing collides.
- Earlier work: dark-mode nav rules, site-card thumbnails, mini-button grid, sidebar viewport-height (`dvh`) resets.

### `css/institution.css`

- **Same consent toast block appended.** This matters: `index.html`, `about.html`, `contact.html`, and `Login.html` load **only** `institution.css` (+ page styles), never `style.css` (which is DigitalMap-only). Without this the consent banner was unstyled on four of the five pages.
- Contains the responsive `@media (max-width: 600px)` stacked, full-width layout for the toast.

### HTML pages (`index.html`, `about.html`, `contact.html`, `Login.html`, `DigitalMap.html`)

- All five now load `js/consent.js` (and the editorial pages load `js/theme.js`/`js/i18n.js`; DigitalMap loads its scripts at the bottom).
- FOUC theme snippet + boot rules added before CSS; theme/i18n/consent scripts after CSS.
- DigitalMap.html received **59 new `data-i18n*` attributes** across the six mini-button flyouts, the FD/FF/HSC/HS/PG/QR side panels, and the toolbar.
- `data-i18n-alt` added to 9 images: `#landmark-image`, `#hsc-hero-img`, index showcase/seal/Love-PH images, contact INHS logo, about Molo-Church/seal/mark images. The QR-code image is deliberately untagged because `qr-handler.js` sets its `alt` dynamically.
- DigitalMap.html still ends with `</script></html>` (no `</body>` tag) — a known quirk.

---

## 2. How `localStorage` Preserves User Choice Across Reloads & Restarts

Three keys, all in `localStorage` (origin-scoped: protocol + host + port):

| Key | Values | Written by | Read by |
|---|---|---|---|
| `bahandi_consent` | `"accepted"` / `"declined"` | `js/consent.js` | `js/consent.js` (`alreadyDecided`) |
| `bahandi_theme` | `"light"` / `"dark"` | `js/theme.js` | FOUC boot snippet → `js/theme.js` |
| `bahandi_lang` | `"en"` / `"ms"` / `"th"` / `"tl"` | `js/i18n.js` (`set`) | `js/i18n.js` on boot |

Why it survives reload/restart:

- `localStorage` is **synchronous, persistent storage on the user's own machine** — it is not cleared when the tab, browser, or machine restarts (only via the site's JS, the Clear Data/devtools action, or private mode).
- Theme and language are re-read at the **top of the boot chain**, before rendering, so the site restores to exactly the user's last selection — no flash, no re-ask.
- Consent is checked before the banner would ever be inserted: once `bahandi_consent` holds a real choice, the banner is skipped entirely and never flashes on subsequent visits.
- Every write is wrapped in `try/catch`: if storage is disabled (private mode, blocked third-party storage), the site silently falls back to defaults instead of crashing.

One important caveat when testing locally: `localStorage` is scoped to the *origin*. `python -m http.server 8000`, VS Code Live Server (`:5500`), and the file:// protocol are three different origins, so a choice made on one won't appear on the others. Deploying to a single domain makes the three keys behave as one seamless memory.

---

## 3. YouTube Learning Roadmap (beginner-friendly search terms)

5–7 searches that together cover the concepts used here, in dependency order:

1. **"JavaScript localStorage tutorial for beginners"** — persistence: `getItem`/`setItem`, JSON, when to use it vs cookies. Explains the `bahandi_*` keys above.
2. **"HTML data attributes tutorial ([data-content], data-*)"** — the `data-*i18n` / `data-consent` hooks and `element.closest()` used in `consent.js`/`applyDOM`.
3. **"CSS position fixed vs absolute explained"** — how `position: fixed` pins the toast to the viewport (the key change in the consent redesign).
4. **"CSS keyframes animation for beginners"** — `@keyframes`, `animation-fill-mode: forwards`, easing; explains `consentSlideUp`/`consentSlideDown`.
5. **"backdrop-filter glassmorphism CSS"** — `backdrop-filter: blur()` + translucent surfaces; the visual style of the new toast.
6. **"CMS-less website language switcher JavaScript (i18n dictionary)"** — a small dictionary object + `data-i18n` + a re-render pass; the exact pattern `js/i18n.js` uses.
7. **"Dark mode CSS variables and prefers-color-scheme"** — `:root` custom properties, `data-theme` selectors, `prefers-color-scheme`, and the no-flash boot idea (the `theme.js` / FOUC snippet pairing).

Bonus (safety): **"Cross-Site Scripting (XSS) and DOMParser sanitization"** — why translated strings are sanitized with `setSafeHTML()` before injection.

---

## 4. Verification Notes

- All modified JS files pass `node --check`: `i18n.js`, `theme.js`, `consent.js`, `MapHandler.js`, `login.js`, and the six game handlers.
- No test framework or linter exists in this project (see `AGENTS.md`); verification is manual browser testing across all five pages at desktop and <600 px widths, in both light and dark themes, with all four languages.