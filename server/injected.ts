/**
 * Client shim script injected into proxied web pages to provide isolation,
 * navigation capture, and parent-frame bidirectional messaging.
 */

export function getInjectedScript(targetUrl: string): string {
  return `
(function() {
  const TARGET_URL = ${JSON.stringify(targetUrl)};
  let targetOrigin = '';
  try {
    targetOrigin = new URL(TARGET_URL).origin;
  } catch(e) {}

  // 1. Scoped Storage Polyfills
  const storagePrefix = 'xyro_stor_' + encodeURIComponent(targetOrigin) + '_';
  const memoryStore = new Map();

  const createScopedStorage = () => ({
    getItem: (key) => memoryStore.get(key) || null,
    setItem: (key, val) => memoryStore.set(key, String(val)),
    removeItem: (key) => memoryStore.delete(key),
    clear: () => memoryStore.clear(),
    key: (i) => Array.from(memoryStore.keys())[i] || null,
    get length() { return memoryStore.size; }
  });

  try {
    Object.defineProperty(window, 'localStorage', { value: createScopedStorage(), configurable: true });
    Object.defineProperty(window, 'sessionStorage', { value: createScopedStorage(), configurable: true });
  } catch(e) {}

  // 2. Intercept window.open
  window.open = function(url) {
    if (url) {
      const fullUrl = new URL(url, TARGET_URL).toString();
      window.parent.postMessage({ type: 'xyro-navigate', url: fullUrl }, '*');
    }
    return null;
  };

  // 3. Intercept Link Clicks
  document.addEventListener('click', function(e) {
    const link = e.target.closest('a');
    if (link && link.href) {
      e.preventDefault();
      e.stopPropagation();
      try {
        const resolved = new URL(link.getAttribute('href') || link.href, TARGET_URL).toString();
        window.parent.postMessage({ type: 'xyro-navigate', url: resolved }, '*');
      } catch (err) {
        window.parent.postMessage({ type: 'xyro-navigate', url: link.href }, '*');
      }
    }
  }, true);

  // 4. Intercept Form Submissions
  document.addEventListener('submit', function(e) {
    const form = e.target;
    if (form && form.action) {
      e.preventDefault();
      const method = (form.method || 'GET').toUpperCase();
      const resolved = new URL(form.getAttribute('action') || form.action, TARGET_URL);
      if (method === 'GET') {
        const formData = new FormData(form);
        for (const [key, val] of formData.entries()) {
          resolved.searchParams.append(key, String(val));
        }
        window.parent.postMessage({ type: 'xyro-navigate', url: resolved.toString() }, '*');
      } else {
        // Fallback navigate to form action
        window.parent.postMessage({ type: 'xyro-navigate', url: resolved.toString() }, '*');
      }
    }
  }, true);

  // 5. Scroll and Context Menu Events to Parent
  window.addEventListener('scroll', function() {
    window.parent.postMessage({
      type: 'xyro-scroll',
      scrollX: window.scrollX,
      scrollY: window.scrollY
    }, '*');
  }, { passive: true });

  window.addEventListener('contextmenu', function(e) {
    const link = e.target.closest('a');
    const img = e.target.closest('img');
    const selectedText = window.getSelection() ? window.getSelection().toString() : '';

    window.parent.postMessage({
      type: 'xyro-contextmenu',
      x: e.clientX,
      y: e.clientY,
      linkUrl: link ? link.href : null,
      srcUrl: img ? img.src : null,
      selectionText: selectedText || null
    }, '*');
  });

  // 6. Forward Keyboard Shortcuts to Browser Shell
  window.addEventListener('keydown', function(e) {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const ctrlKey = isMac ? e.metaKey : e.ctrlKey;

    if (ctrlKey && (e.key === 't' || e.key === 'w' || e.key === 'r' || e.key === 'f' || e.key === 'p' || e.key === 'l')) {
      e.preventDefault();
      window.parent.postMessage({
        type: 'xyro-keydown',
        key: e.key,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        shiftKey: e.shiftKey,
        altKey: e.altKey
      }, '*');
    }
  });

  // 7. Listen for Parent Frame Commands
  window.addEventListener('message', function(e) {
    const data = e.data;
    if (!data || !data.type) return;

    if (data.type === 'xyro-find') {
      if (window.find) {
        window.find(data.text, data.caseSensitive || false, data.backwards || false, true, false, true, false);
      }
    } else if (data.type === 'xyro-zoom') {
      document.body.style.zoom = String(data.scale);
    } else if (data.type === 'xyro-print') {
      window.print();
    } else if (data.type === 'xyro-scroll-to') {
      window.scrollTo(data.x, data.y);
    }
  });

  // 8. Loaded Notification
  window.addEventListener('DOMContentLoaded', function() {
    window.parent.postMessage({
      type: 'xyro-loaded',
      url: TARGET_URL,
      title: document.title || TARGET_URL
    }, '*');
  });
})();
`;
}
