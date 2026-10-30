# XyroBrowse

**XyroBrowse** is an authentic web browser application designed with a dual-engine architecture:
- **Desktop Mode (Real Chromium)**: Runs genuine Chromium through Electron with isolated persistent session partitions, Ghostery EasyList network and cosmetic ad blocking, native file downloads, DevTools, and real web compatibility.
- **Lite Mode (Web Preview)**: Clearly labeled proxy mode running inside standard web environments using path-based proxying (`/api/p/<encOrigin>/<path>`), straggler root-relative fallback, streaming Range requests, anti-SSRF protections, and a client shim.

---

## 🚀 Running the Browser

### 1. Lite Mode (Web / Preview Environment)
Runs the full Express proxy server and Vite frontend:
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Desktop Mode (Real Chromium via Electron)
Launches the real Chromium browser window:
```bash
npm run dev:desktop
```
To package for production:
```bash
npm run build:desktop
```

### Deploying Lite Mode to Vercel

Vercel hosts the web/Lite version; it cannot run the Electron desktop browser. Import this repository into Vercel with the Vite framework preset and keep the repository's `vercel.json` settings. The deployment builds the frontend and exposes the `/api/search` endpoint and the catch-all API function for proxy, reader, download, and data-clearing requests.

Set `BRAVE_API_KEY` in the Vercel project environment variables to enable Brave Search API fallback results. Without it, search tries DuckDuckGo and Wikipedia, then offers a direct link to the selected search engine. This fallback is useful but does not replace a commercial search engine's full indexed results. Lite-mode proxy cookies are held in function memory, so login state is best-effort across serverless instances and is not durable; use Desktop Mode for sites requiring reliable authentication.

### Browser features
- Tabbed browsing with persisted regular tabs, per-tab history, pinning, and private/incognito tabs.
- Address-bar navigation and search, search-engine selection, keyword shortcuts, suggestions from history and bookmarks, and inline arithmetic.
- Bookmarks, browsing history, downloads, reader mode, page find, zoom, themes, and configurable home page.
- Lite-mode privacy shields, isolated private proxy cookie jars, and browser-data clearing.
- Desktop mode uses Electron's bundled Chromium for real web rendering; Lite mode is an iframe-based proxy preview.

Use Desktop Mode for websites that depend on modern browser APIs, third-party authentication, media, or complex application behavior. Lite Mode is deliberately limited by its proxy and sandbox architecture and is not a replacement for a full Chromium browser.

---

## 🚫 Not Supported (Platform Boundaries & Limitations)

1. **Chrome Web Store Extensions**: Native CRX binary extensions requiring proprietary `chrome.management` and Chrome Web Store signing are not supported.
2. **Chrome Sync**: Google account sync (passwords, tabs, and history synced to Google cloud accounts) requires closed-source Google API client keys and services.
3. **Widevine DRM Protected Media**: Netflix, Spotify, Disney+, and other Widevine-encrypted streaming services are not supported unless bundled with a proprietary Widevine CDM binary.
4. **Google Sign-In on Embedded Browsers**: Google blocks OAuth sign-ins from embedded user agents and WebView/Electron environments ("This browser or app may not be secure").
5. **Proxy-Mode Limits (Lite Mode)**:
   - Modern complex web apps with heavy WebSockets (e.g. Figma, Discord web, Google Docs) will not work in Lite mode due to iframe sandbox and proxy boundaries.
   - Cross-domain authentication flows involving multi-origin top-level redirects and strict cross-site cookies are limited in Lite mode.
   - For full web compatibility, always run the **Desktop Mode** (`npm run dev:desktop`).

---

## 🛡️ Privacy Shields & Ad Blocking
- **Desktop Mode**: Powered by `@ghostery/adblocker-electron` using full EasyList and EasyPrivacy rule sets cached to disk, cosmetic placeholder element collapsing, and top-level tracking parameter stripping.
- **Lite Mode**: Server-side request filtering via Ghostery `FiltersEngine` with an integrated fallback domain list and cosmetic CSS injection.
- *Notice*: YouTube and certain media sites actively fight ad blockers; blocking effectiveness depends on updated filter lists.

---

## 🧪 Testing

Run automated unit and integration tests covering SSRF protection, hex/decimal/octal IP normalization, path-based HTML/CSS rewriting, ToughCookie jar login flows, video Range requests, and Netscape bookmark export/import:
```bash
npm test
```
To check TypeScript types:
```bash
npm run lint
```
