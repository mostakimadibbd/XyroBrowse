# XyroBrowse

**XyroBrowse** is an authentic web browser application modeled directly after **Google Chrome** (desktop) and **Chrome/Brave Android** (mobile), built with **React 19**, **TypeScript**, plain CSS with CSS variables, and an **Express proxy backend**.

---

## 🚀 Core Features

### 1. Authentic Chrome Design System
- **Pixel-Accurate Chrome Styling**: Chrome Dark Mode (`#202124`, `#2b2d31`, `#1e1f22`, `#8ab4f8`, `#e8eaed`) and Light Mode (`#ffffff`, `#dee1e6`, `#f1f3f4`, `#1a73e8`).
- **Classic Tab Strip**: 34px trapezoid/rounded tabs, tab pinning, tab closing (`×`), new tab (`+`), and incognito mode indicators.
- **Chrome Omnibox**: Clean URL formatting (`cleanDisplayUrl`), instant search engine switcher, bang shortcuts (`!g`, `!b`, `!ddg`, `!bing`, `!w`, `!gh`, `!yt`), inline arithmetic calculator (`12 * 84 = 1008`), and real-time history/bookmark autocomplete.
- **Bookmarks Bar**: Single-row horizontal bar with favicons, 1-click access, and full Bookmarks Manager (`chrome://bookmarks`).
- **Floating Find in Page Bar**: Quick in-page search (`Ctrl+F`) with previous/next matches.

### 2. SSRF-Hardened Streaming Proxy Engine
- **SSRF Defense**: Validates all outbound connections against DNS resolution; blocks loopback (`127.0.0.0/8`, `::1`), private networks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), link-local/cloud metadata (`169.254.169.254`), and CGNAT (`100.64.0.0/10`).
- **Manual Redirect Resolution**: Validates each hop up to a maximum of 10 redirects.
- **10MB Size Limit & 15s Timeout**: Prevents resource exhaustion and hanging requests.
- **Security Header Stripping**: Strips restrictive `X-Frame-Options` and `Content-Security-Policy` headers to permit safe iframe rendering.
- **Cheerio HTML Rewriting**: Rewrites links, stylesheets, images, scripts, and forms to route through `/api/page?url=...`.
- **Client Shim Script**: Injected into proxied documents to isolate `localStorage`/cookies, capture link clicks and form submissions, and provide bidirectional `postMessage` communication with the parent browser shell.

### 3. Native Search Aggregator (`chrome://search`)
- Searches DuckDuckGo HTML without blocking.
- Fetches Wikipedia Knowledge Panel cards with instant summaries, descriptions, and thumbnails.
- Filter tabs: **All**, **Web Links**, **Encyclopedia**, and **Code & Dev**.

### 4. Reader Mode (`/api/reader`)
- Extracts clean, clutter-free article text and content using **Mozilla Readability** and **JSDOM**.
- Fallback to `r.jina.ai` markdown extraction.
- Customizable font sizing (14px to 28px) and 3 themes: **Dark**, **Warm Sepia**, and **Light**.

### 5. Privacy Shields & Ad Blocking
- Server-side domain blocklist with over 300 advertising, tracker, and telemetry domains.
- Automatic tracking parameter stripping (`utm_*`, `fbclid`, `gclid`, `msclkid`, etc.).
- Real-time `X-Xyro-Blocked` metric header displayed in the Shields popup.

### 6. Bookmarks & History Management
- Full Netscape Bookmark HTML import and export.
- Chronological browsing history with daily grouping (**Today**, **Yesterday**, **Older**) and individual item deletion.
- **Clear Browsing Data Dialog**: Time ranges (Last hour, Last 24 hours, Last 7 days, All time) and category selection.

### 7. Real File Downloads
- Real streaming file download through `/api/download?url=...` using standard browser Blob saving.
- Downloads page (`chrome://downloads`) tracking received bytes, file names, status, and dates.

### 8. Mobile & APK Ergonomics
- Responsive layout shifting to a bottom thumb navigation bar on mobile viewports (<640px).
- Chrome Android-style tab counter square badge (`[3]`).
- 3D card grid tab switcher with swipe/close actions and Incognito tab separation.

---

## 🚫 Not Available in the Web Version (Platform Boundaries)

Because XyroBrowse is a client-server web application rather than an operating-system-level binary compiled with C++ and Chromium base, the following features cannot honestly be implemented and are intentionally omitted:

1. **OS Process RAM Compression & Hardware Hibernation**: Web browsers cannot manipulate OS kernel memory pages or hibernate OS threads.
2. **Native Extension Store (CRX binary extensions)**: Web extensions require native Chrome Extension APIs (`chrome.runtime`, `chrome.webRequest`) that cannot run inside standard web page iframes.
3. **Encrypted OS Keystore Credentials**: Master OS credential vaults requiring hardware TPM or OS biometrics are not accessible from web sandboxes.
4. **Low-Level Kernel Hardware Flags**: Browser engine flags like `#enable-vulkan` or `#ignore-gpu-blocklist` require direct compile-time access to the Blink/Chromium engine.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl` / `Cmd` + `T` | Open New Tab (`chrome://newtab`) |
| `Ctrl` / `Cmd` + `W` | Close Active Tab |
| `Ctrl` + `Shift` + `N` | Open Incognito Tab |
| `Ctrl` / `Cmd` + `R` | Reload Page |
| `Alt` + `Left` | Go Back |
| `Alt` + `Right` | Go Forward |
| `Ctrl` / `Cmd` + `F` | Find in Page |
| `Ctrl` / `Cmd` + `D` | Bookmark Current Page |
| `Ctrl` / `Cmd` + `P` | Print Page |
| `Ctrl` + `H` | Open History (`chrome://history`) |
| `Ctrl` + `J` | Open Downloads (`chrome://downloads`) |
| `Ctrl` + `Shift` + `O` | Open Bookmarks Manager (`chrome://bookmarks`) |
| `Ctrl` + `+` / `-` / `0` | Zoom In / Out / Reset (100%) |
| `F11` | Toggle Fullscreen |

---

## 🧪 Testing

Run automated tests covering SSRF protection, ad blocklist, HTML rewriting, URL decoding, bang routing, and Netscape bookmarks import/export:

```bash
npm test
```
