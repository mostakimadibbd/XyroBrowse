# 🌐 XyroBrowse — Flagship Chromium Browser Shell

**XyroBrowse** is an ultra-fast, Chromium-inspired cross-platform web browser shell built in **React 19**, **TypeScript**, and **Tailwind CSS**, designed for Desktop, Tablet, and Mobile APK (Capacitor ready) environments.

Inspired by the visual design and productivity features of **Arc Browser**, **Brave**, and **Opera GX**, XyroBrowse solves the classic browser-in-browser iframe restrictions (`X-Frame-Options: SAMEORIGIN`) using a **Smart 3-Mode Viewport Engine** and native search aggregation.

---

## ⚡ Core Architectural Pillars

### 1. Smart 3-Mode Viewport Engine
Standard web browsers prevent embedding major sites like Google, GitHub, or Reddit due to `X-Frame-Options: SAMEORIGIN` and `frame-ancestors` HTTP security headers. XyroBrowse introduces an intelligent, zero-friction 3-mode rendering pipeline:

- **Mode 1 — Native XyroSearch Aggregator (Default for Search Queries):**
  - Searches conducted from the Omnibox or New Tab page do not get trapped in blocked frames.
  - Queries route to `xyro://search?q=...&engine=...`, rendering a native glassmorphic search dashboard that aggregates live data simultaneously from:
    - **DuckDuckGo Instant Answer API**: Instant definition, abstract summary, and topic cards.
    - **Wikipedia REST & OpenSearch APIs**: High-resolution thumbnails, encyclopedic articles, and links.
    - **Hacker News Algolia Search API**: Real discussion threads, point metrics, and author links.
    - **GitHub Repositories API**: Top open-source code repositories with star counts and languages.
  - Includes an **Embedded Engine View** tab powered by Google's iframe-compatible test endpoint (`https://www.google.com/search?igu=1&q=...`) and Bing search so users can view live engines directly inside the tab.
  - Filter tabs: **All**, **Web & Docs**, **Code & Dev**, **News & Tech**, and **Media**.
- **Mode 2 — Smart Proxy / Bypass Mode:**
  - When viewing external websites that prohibit iframe embedding, users can toggle **Smart Proxy** in the viewport header bar.
  - Fetches and renders live page HTML through a CORS proxy bridge, ensuring **zero websites ever fail to load**.
- **Mode 3 — Clutter-Free Reader Mode:**
  - Strips third-party banners, popups, and cookie consent overlays.
  - Presents clean typography with customizable font sizing (`14px` to `26px`) and 3 eye-care themes: **Obsidian Dark**, **Warm Sepia**, and **Cyber Blue**.

---

### 2. Smart Omnibox & Multi-Engine Router
- **Instant Engine Switcher Popover:** Click the search engine badge in the Omnibox to switch between **Google**, **Brave Search**, **DuckDuckGo**, **Bing**, and **Perplexity AI**.
- **Bang Shortcuts:** Type `!g `, `!b `, `!ddg `, `!bing `, or `!ai ` followed by space to dynamically switch the active search engine. Additional bangs like `!yt`, `!gh`, `!w`, `!r`, and `!so` route directly to destination platforms.
- **Built-in Instant Calculator:** Evaluates arithmetic expressions (`450 * 1.15`, `12 * 84 + 50`, `sqrt(144)`, `25% of 800`) directly inside the autocomplete dropdown before pressing enter.
- **Unit Converter:** Real-time conversion for currencies (USD, EUR, GBP, JPY, CAD), distances (km to miles, ft to cm), and temperatures (°C to °F, K).
- **Interactive Bookmark Star (`★`):** 1-click toggle to add or remove any page from the persistent horizontal **Bookmarks Bar**.

---

### 3. "XyroBoost" RAM & Resource Manager
- **Live Memory Saturation Monitor:** Real-time estimation of RAM consumption per tab based on complexity (media tabs: ~340 MB, web apps: ~190 MB, internal pages: ~38 MB, sleeping tabs: 12 MB).
- **Auto-Hibernation (Sleeping Tabs):** Dormant background tabs automatically transition to sleep after a configurable idle timer (1m, 2m, 5m, 15m). Sleeping tabs unmount their DOM, cache their state, display a pulsing `🌙 Sleeping (12MB)` badge, and restore in milliseconds upon tab click.
- **1-Click Memory Purge:** Instant action in the XyroBoost panel to hibernate all inactive background tabs and flush simulated RAM cache.

---

### 4. "XyroShields" Native Privacy Guard
- **Brave-Style Security HUD:** Interactive shield button displaying persistent counters for:
  - Blocked Ads & Trackers
  - Bandwidth Saved (MB)
  - Time Saved (s)
- **Per-Site Security Controls:**
  - Block Ads & Cross-Site Trackers
  - Force HTTPS-Only Mode
  - Block Canvas & WebGL Device Fingerprinting
  - Block Third-Party Tracking Cookies
  - Block Invasive Third-Party Scripts

---

### 5. Multi-Tasking & Cross-Platform Ergonomics
- **Dual Split-Screen View:** Tile two active tabs side-by-side with independent navigation controls and a 50/50 split divider.
- **Arc-Style Collapsible Sidebar Rail:** Toggle between traditional top tabs and a sleek vertical tab rail with tab groups, pinned tabs, and quick utility launchers.
- **Persistent Bookmarks Bar:** Docked horizontal bar below the Omnibox for 1-click access to favorite portals.
- **Mobile APK View (<640px / APK Mode):**
  - Navigation toolbar and Omnibox automatically transition to the **bottom thumb zone** for comfortable one-handed mobile use.
  - Chrome/Brave-style **3D Card Grid Tab Switcher** with swipeable tab preview cards and Incognito isolation tabs.

---

### 6. Working Viewport Extensions (`xyro://extensions`)
1. **Dark Reader Force-Dark:** Smart CSS dark inversion for bright websites.
2. **Night Eye / Blue-Light Filter:** Warm amber eye-care overlay minimizing eye strain and blue light.
3. **Ad & Annoyance Zapper:** Automatically suppresses ad banners, cookie dialogs, and video sponsor popups.
4. **Clean Typography & Reading Font Override:** Enforces clean, high-legibility modern sans-serif typography across cluttered sites.
5. **Custom CSS & JS Injector:** Injects custom user stylesheets and userscripts dynamically into active viewports.

---

### 7. Internal `xyro://` Ecosystem
- `xyro://newtab` — Speed dial dashboard with hero clock, live telemetry strip, and customizable shortcuts.
- `xyro://search` — Native search aggregator with Wikipedia summaries, DuckDuckGo instant answers, HackerNews, and GitHub code hits.
- `xyro://settings` — Search engine configuration, shield aggressiveness, hibernation timer, and data clearance.
- `xyro://history` — Chronological browsing history with search and entry deletion.
- `xyro://bookmarks` — Bookmarks organizer with folder filters and JSON export.
- `xyro://downloads` — Queue with real-time download simulation, speed indicators, and file management.
- `xyro://extensions` — Extensions manager with live userscript code editors.
- `xyro://flags` — Experimental Chromium kernel flags (WebGPU acceleration, memory compression, worker sandboxing).
- `xyro://passwords` — Encrypted password vault with cryptographic key generator.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl` / `Cmd` + `T` | Open New Tab (`xyro://newtab`) |
| `Ctrl` / `Cmd` + `W` | Close Active Tab |
| `Ctrl` + `Shift` + `N` | Open Stealth Incognito Tab |
| `Ctrl` / `Cmd` + `R` | Reload Page (with visual progress bar) |
| `Alt` + `Left` | Go Back in Active Tab |
| `Alt` + `Right` | Go Forward in Active Tab |
| `Ctrl` / `Cmd` + `F` | Toggle Find in Page |
| `F11` | Toggle Fullscreen |

---

## 🛠️ Tech Stack & Dependencies
- **Framework:** React 19 + TypeScript
- **Styling:** Tailwind CSS v4 (Deep obsidian dark mode `#05070B`, glassmorphic panels `bg-[#0D111A]/80`, neon cyan `#00F0FF`)
- **Icons:** Lucide React
- **Animations:** Motion
- **Tooling:** Vite 8, tsx
- **Testing:** Node.js built-in test runner (`node:test`, `node:assert/strict`)
