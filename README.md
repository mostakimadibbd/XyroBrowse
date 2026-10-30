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
