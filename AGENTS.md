# AGENTS.md — Project Bahandi

## What This Is

Static frontend (HTML/CSS/JS) for a cultural heritage GIS mapping Molo, Iloilo City. No build system, no bundler, no package manager. Open any `.html` file in a browser or serve with any static file server.

## Architecture

### Data Flow (two sources, merged at runtime)

1. **Static fallback data** — `js/sites-data.js` exports `window.BAHANDI_SITES` (hardcoded array).
2. **Firestore live data** — `js/firestore.js` fetches from Firestore collection `cultural_sites` via `window.fetchSitesFromFirestore()`.
3. **Merge happens in** `js/MapHandler.js:413-434` — static sites are loaded first, then Firestore results overwrite/extend by `site_id`.

### Firebase

- Config: `js/firebase-config.js` — Firebase project `projectbahandi-7149a`, initialized as compat SDK via global `firebase` namespace.
- Auth: `js/login.js` uses Firebase Auth (email/password + Google OAuth) with ES module imports from `gstatic.com`. Post-login redirects to `../User/user-home.html` (does not exist in repo).
- Firestore data model is loose — `js/firestore.js:52-69` (`toSiteModel`) normalizes many possible field names (e.g. `Title`/`site_name`/`name`, `Coordinates`/`coordinates`/`Coord`).

### Firebase Data Connect (backend schema)

- `dataconnect/dataconnect.yaml` — service `project-bahandi`, Postgres instance `project-bahandi-fdc`, region `asia-southeast1`.
- `dataconnect/schema/schema.gql` — GraphQL operations for: `Category`, `Contributor`, `HeritageSite`, `Media`, `ContributionRequest`. Auth levels: `PUBLIC` reads, `USER` writes.

### Pages

| File | Purpose |
|---|---|
| `index.html` | Landing page with officer carousel and site preview grid |
| `DigitalMap.html` | Leaflet interactive map — **main app entry point** (~1235 lines, inline CSS/JS) |
| `about.html` | Project brief |
| `contact.html` | Contact form |
| `Login.html` | Firebase auth login/signup |
| `Balay-Blueprint.html` | Canvas-based mini-game (~1872 lines, fully self-contained) |
| `heritage-coin-quest.html` | Canvas maze game |
| `Chrono-Defenders.html` | Side-scrolling game |
| `molo-memory-match.html` | Card-matching game |

### Mini-Games

Each game lives in its own `.html` with inline CSS + a handler in `Game-Handlers/`:

- `Balay-BlueprintHandler.js` — audio engine + canvas rendering
- `Heritage-Coin-Quest.js`
- `Molo-Chrono-Defender.js`
- `Molo-Memory-Match.js`

Game assets are in `assets/<Game-Name>/`. Audio paths are hardcoded relative to root (e.g. `assets/Balay-Blueprint/05-Audio-Features/`).

### CSS Architecture

- `css/globals.css` — reset + font-face (loaded by institutional pages only)
- `css/institution.css` — layout system for index, about, contact, login
- `css/HomepageA.css` — homepage hero/grid styles
- `css/style.css` + component CSS (`FdStyle.css`, `FfStyle.css`, `HscStyle.css`, `HsStyle.css`, `PgStyle.css`, `QrStyle.css`) — DigitalMap sidebar panels
- Games use inline `<style>` blocks, not external CSS files

## Gotchas

- **No `.gitignore`** — `.vs/` directory is tracked. Be careful not to add IDE artifacts.
- **No build step** — changes to any file are immediately live. No compilation to verify.
- **No test framework** — there are zero tests. Manual browser testing only.
- **No linting or type checking** configured.
- **Mixed JS module systems** — most files use IIFEs with global `window.*` exports. `js/login.js` uses ES module `import` syntax (requires the HTML to load Firebase as a module or use `type="module"`).
- **`DigitalMap.html` is monolithic** — most map UI logic, sidebar panels, and frame rendering is inline (~1200 lines). Only `MapHandler.js` and the handler files are external.
- **Firebase config is committed** — `js/firebase-config.js` contains the full client-side config including API key. This is normal for Firebase web apps (security rules control access, not key secrecy), but do not move server-side secrets here.
- **Coordinate parsing is defensive** — `js/firestore.js:5-43` handles GeoPoint objects, arrays, strings, cardinal-direction strings, and separate lat/lng fields. New site data must pass `hasValidCoordinates()` to appear on the map.
- **Login redirects to missing path** — `js/login.js:62` redirects to `../User/user-home.html` which doesn't exist in the repo.
- **Script load order matters on DigitalMap** — `MapHandler.js` expects `window.BAHANDI_SITES` and `window.fetchSitesFromFirestore` to already exist. Both are loaded via `<script>` tags in the HTML before `MapHandler.js`.
