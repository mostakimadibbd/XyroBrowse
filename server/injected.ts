/**
 * Client shim script injected into proxied web pages to provide isolation,
 * API proxying, DOM attribute interception, and parent-frame bidirectional messaging.
 */

export function getInjectedScript(
  targetUrl: string,
  initialBlockedCount = 0,
  pageId = '',
  sessionId = '',
  shieldsEnabled = true
): string {
  return `
(function() {
  const TARGET_URL = ${JSON.stringify(targetUrl)};
  const INITIAL_BLOCKED = ${initialBlockedCount};
  const PAGE_ID = ${JSON.stringify(pageId)};
  const SESSION_ID = ${JSON.stringify(sessionId)};
  const SHIELDS_ENABLED = ${JSON.stringify(shieldsEnabled)};

  let targetOrigin = '';
  try {
    targetOrigin = new URL(TARGET_URL).origin;
  } catch(e) {}

  function resolveToTarget(url) {
    try {
      if (!url) return '';
      if (url.startsWith('data:') || url.startsWith('javascript:') || url.startsWith('blob:') || url.startsWith('#')) {
        return url;
      }
      const proxyUrl = new URL(url, window.location.href);
      if (proxyUrl.pathname.startsWith('/api/p/')) {
        const match = proxyUrl.pathname.match(/^\\/api\\/p\\/([^/]+)(.*)$/);
        if (match) {
          const destination = new URL(match[2] || '/', decodeURIComponent(match[1]));
          proxyUrl.searchParams.forEach(function(value, key) {
            if (key !== '__xyro_sid' && key !== '__xyro_shields') destination.searchParams.append(key, value);
          });
          destination.hash = proxyUrl.hash;
          destination.searchParams.delete('__xyro_sid');
          destination.searchParams.delete('__xyro_shields');
          return destination.toString();
        }
      }
      return new URL(url, TARGET_URL).toString();
    } catch(e) {
      return url;
    }
  }

  function toProxyPath(url) {
    try {
      if (!url || typeof url !== 'string') return url;
      if (url.startsWith('data:') || url.startsWith('javascript:') || url.startsWith('blob:') || url.startsWith('#')) {
        return url;
      }
      const resolved = resolveToTarget(url);
      const u = new URL(resolved);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return url;
      if (SESSION_ID) u.searchParams.set('__xyro_sid', SESSION_ID);
      if (SHIELDS_ENABLED) u.searchParams.delete('__xyro_shields');
      else u.searchParams.set('__xyro_shields', 'off');
      const encOrigin = encodeURIComponent(u.origin);
      const sub = u.pathname + u.search + u.hash;
      return '/api/p/' + encOrigin + (sub.startsWith('/') ? sub : '/' + sub);
    } catch(e) {
      return url;
    }
  }

  // 1. Scoped In-Memory Storage Polyfills (since sandbox lacks allow-same-origin)
  const memoryLocal = new Map();
  const memorySession = new Map();

  function createStoragePolyfill(store) {
    return {
      getItem(k) { return store.has(String(k)) ? store.get(String(k)) : null; },
      setItem(k, v) { store.set(String(k), String(v)); },
      removeItem(k) { store.delete(String(k)); },
      clear() { store.clear(); },
      key(i) { return Array.from(store.keys())[i] || null; },
      get length() { return store.size; }
    };
  }

  try {
    Object.defineProperty(window, 'localStorage', { value: createStoragePolyfill(memoryLocal), configurable: true });
    Object.defineProperty(window, 'sessionStorage', { value: createStoragePolyfill(memorySession), configurable: true });
  } catch(e) {}

  // 2. Cookie Jar Interceptor
  let cookieStore = '';
  try {
    Object.defineProperty(document, 'cookie', {
      get() { return cookieStore; },
      set(val) {
        if (typeof val === 'string') {
          const parts = val.split(';')[0];
          if (parts) {
            cookieStore = cookieStore ? cookieStore + '; ' + parts : parts;
          }
        }
      },
      configurable: true
    });
  } catch(e) {}

  // 3. ServiceWorker polyfill (clean rejection)
  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker) {
      navigator.serviceWorker.register = function() {
        return Promise.reject(new Error('Service workers not supported in Lite mode'));
      };
    }
  } catch(e) {}

  // 4. WebSocket Graceful Closure Polyfill
  const OriginalWebSocket = window.WebSocket;
  window.WebSocket = function(url, protocols) {
    const target = new EventTarget();
    target.url = url;
    target.readyState = 3; // CLOSED
    setTimeout(function() {
      const errEvt = new Event('error');
      target.dispatchEvent(errEvt);
      if (typeof target.onerror === 'function') target.onerror(errEvt);
      const closeEvt = new CloseEvent('close', { code: 1006, reason: 'WebSockets not supported in Lite mode', wasClean: false });
      target.dispatchEvent(closeEvt);
      if (typeof target.onclose === 'function') target.onclose(closeEvt);
    }, 10);
    target.send = function() {};
    target.close = function() {};
    return target;
  };

  // 5. Intercept fetch, Request, XMLHttpRequest, sendBeacon, EventSource, Worker
  const originalFetch = window.fetch;
  window.fetch = function(input, init) {
    let url = input;
    if (typeof input === 'string') {
      url = toProxyPath(input);
    } else if (input && typeof input.url === 'string') {
      input = new Request(toProxyPath(input.url), input);
    }
    return originalFetch.call(this, url, init);
  };

  const originalXhrOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
    const proxied = toProxyPath(url);
    return originalXhrOpen.call(this, method, proxied, async !== false, user, password);
  };

  if (navigator.sendBeacon) {
    const originalSendBeacon = navigator.sendBeacon;
    navigator.sendBeacon = function(url, data) {
      return originalSendBeacon.call(this, toProxyPath(url), data);
    };
  }

  if (window.EventSource) {
    const OriginalEventSource = window.EventSource;
    window.EventSource = function(url, conf) {
      return new OriginalEventSource(toProxyPath(url), conf);
    };
  }

  if (window.Worker) {
    const OriginalWorker = window.Worker;
    window.Worker = function(scriptURL, options) {
      return new OriginalWorker(toProxyPath(scriptURL), options);
    };
  }

  // 6. Element Prototype Setters and setAttribute
  const originalSetAttribute = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function(name, value) {
    const lower = name.toLowerCase();
    if ((lower === 'src' || lower === 'href' || lower === 'poster' || lower === 'action' || lower === 'data') && typeof value === 'string') {
      return originalSetAttribute.call(this, name, toProxyPath(value));
    }
    return originalSetAttribute.call(this, name, value);
  };

  // 7. History API Interception
  const originalPushState = history.pushState;
  history.pushState = function(state, unused, url) {
    if (url) {
      const resolved = resolveToTarget(String(url));
      window.parent.postMessage({ type: 'xyro-urlchange', url: resolved, replace: false }, '*');
    }
    return originalPushState.apply(this, arguments);
  };

  const originalReplaceState = history.replaceState;
  history.replaceState = function(state, unused, url) {
    if (url) {
      const resolved = resolveToTarget(String(url));
      window.parent.postMessage({ type: 'xyro-urlchange', url: resolved, replace: true }, '*');
    }
    return originalReplaceState.apply(this, arguments);
  };

  window.addEventListener('hashchange', function() {
    window.parent.postMessage({ type: 'xyro-urlchange', url: window.location.href, replace: false }, '*');
  });

  // 8. Intercept window.open
  window.open = function(url) {
    if (url) {
      const fullUrl = resolveToTarget(url);
      window.parent.postMessage({ type: 'xyro-open', url: fullUrl }, '*');
    }
    return null;
  };

  // 9. Intercept Link Clicks
  document.addEventListener('click', function(e) {
    const link = e.target.closest('a');
    if (link && link.href) {
      const rawHref = link.getAttribute('href') || link.href;
      if (rawHref.startsWith('javascript:') || rawHref.startsWith('#')) return;
      e.preventDefault();
      e.stopPropagation();
      const resolved = resolveToTarget(rawHref);
      window.parent.postMessage({ type: 'xyro-navigate', url: resolved }, '*');
    }
  }, true);

  // 10. Intercept Form Submissions (POST & GET)
  document.addEventListener('submit', function(e) {
    const form = e.target;
    if (form && form.action) {
      e.preventDefault();
      const method = (form.method || 'GET').toUpperCase();
      const rawAction = form.getAttribute('action') || form.action;
      const resolved = new URL(resolveToTarget(rawAction));

      if (method === 'GET') {
        const formData = new FormData(form);
        for (const [key, val] of formData.entries()) {
          resolved.searchParams.append(key, String(val));
        }
        window.parent.postMessage({ type: 'xyro-navigate', url: resolved.toString() }, '*');
      } else {
        // Forward POST submission through proxy form submission
        form.action = toProxyPath(rawAction);
        form.submit();
      }
    }
  }, true);

  // 11. Scroll, ContextMenu & Full Shortcut Forwarding
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
      linkUrl: link ? resolveToTarget(link.getAttribute('href') || link.href) : null,
      srcUrl: img ? resolveToTarget(img.getAttribute('src') || img.src) : null,
      selectionText: selectedText || null
    }, '*');
  });

  window.addEventListener('keydown', function(e) {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;
    const k = e.key.toLowerCase();

    // Shortcuts: Ctrl/Cmd + T, W, L, R, F, P, D, H, J, +, -, 0; Shift + T, N, B; Alt + Left/Right; F5, F11, Esc
    const isSpecialKey = e.key === 'F5' || e.key === 'F11' || e.key === 'Escape' ||
      (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) ||
      (ctrlOrCmd && ['t', 'w', 'l', 'r', 'f', 'p', 'd', 'h', 'j', '+', '-', '=', '0'].includes(k)) ||
      (ctrlOrCmd && e.shiftKey && ['t', 'n', 'b'].includes(k));

    if (isSpecialKey) {
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

  // 12. Listen for Parent Frame Commands
  window.addEventListener('message', function(e) {
    const data = e.data;
    if (!data || !data.type) return;

    if (data.type === 'xyro-find') {
      if (window.find) {
        window.find(data.text, data.caseSensitive || false, data.backwards || false, true, false, true, false);
      }
    } else if (data.type === 'xyro-stop-find') {
      window.getSelection()?.removeAllRanges();
    } else if (data.type === 'xyro-zoom') {
      document.body.style.zoom = String(data.scale);
    } else if (data.type === 'xyro-print') {
      window.print();
    } else if (data.type === 'xyro-scroll-to') {
      window.scrollTo(data.x, data.y);
    }
  });

  // 13. Notify Parent Frame on Load
  function notifyLoaded() {
    let faviconUrl = '';
    const iconLink = document.querySelector('link[rel*="icon"]');
    if (iconLink && iconLink.href) {
      faviconUrl = resolveToTarget(iconLink.getAttribute('href') || iconLink.href);
    }
    window.parent.postMessage({
      type: 'xyro-loaded',
      url: TARGET_URL,
      title: document.title || TARGET_URL,
      faviconUrl: faviconUrl,
      blocked: INITIAL_BLOCKED,
      pageId: PAGE_ID
    }, '*');
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    notifyLoaded();
  } else {
    window.addEventListener('DOMContentLoaded', notifyLoaded);
  }
})();
`;
}
