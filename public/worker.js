const HTML_PARSER = {
  parse(html, baseUrl) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return this.extractData(doc, baseUrl);
  },
  
  extractData(doc, baseUrl) {
    const data = {
      title: '',
      meta: {},
      links: [],
      images: [],
      scripts: [],
      styles: [],
      forms: [],
      headings: [],
      textContent: '',
    };
    
    data.title = doc.title || '';
    
    const metas = doc.querySelectorAll('meta');
    metas.forEach(meta => {
      const name = meta.getAttribute('name') || meta.getAttribute('property') || meta.getAttribute('http-equiv');
      const content = meta.getAttribute('content');
      if (name && content) {
        data.meta[name] = content;
      }
    });
    
    const links = doc.querySelectorAll('a[href]');
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('javascript:') && !href.startsWith('#')) {
        try {
          data.links.push({
            url: new URL(href, baseUrl).href,
            text: link.textContent.trim(),
            title: link.getAttribute('title') || '',
          });
        } catch {}
      }
    });
    
    const images = doc.querySelectorAll('img[src]');
    images.forEach(img => {
      const src = img.getAttribute('src');
      if (src) {
        try {
          data.images.push({
            url: new URL(src, baseUrl).href,
            alt: img.getAttribute('alt') || '',
            width: img.getAttribute('width') || '',
            height: img.getAttribute('height') || '',
          });
        } catch {}
      }
    });
    
    const scripts = doc.querySelectorAll('script[src]');
    scripts.forEach(script => {
      const src = script.getAttribute('src');
      if (src) {
        try {
          data.scripts.push(new URL(src, baseUrl).href);
        } catch {}
      }
    });
    
    const styles = doc.querySelectorAll('link[rel="stylesheet"]');
    styles.forEach(link => {
      const href = link.getAttribute('href');
      if (href) {
        try {
          data.styles.push(new URL(href, baseUrl).href);
        } catch {}
      }
    });
    
    const forms = doc.querySelectorAll('form');
    forms.forEach(form => {
      const action = form.getAttribute('action') || '';
      const method = form.getAttribute('method') || 'GET';
      const inputs = Array.from(form.querySelectorAll('input, select, textarea')).map(input => ({
        type: input.tagName === 'SELECT' ? 'select' : input.tagName === 'TEXTAREA' ? 'textarea' : input.getAttribute('type') || 'text',
        name: input.getAttribute('name') || '',
        required: input.hasAttribute('required'),
        placeholder: input.getAttribute('placeholder') || '',
      }));
      data.forms.push({ action, method, inputs });
    });
    
    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach(h => {
      data.headings.push({
        level: parseInt(h.tagName[1]),
        text: h.textContent.trim(),
      });
    });
    
    data.textContent = doc.body?.textContent?.trim() || '';
    
    return data;
  },
};

const AD_BLOCKER = {
  rules: [],
  compiledRules: null,
  
  async loadRules(rulesUrl) {
    try {
      const response = await fetch(rulesUrl);
      const text = await response.text();
      this.parseRules(text);
    } catch (error) {
      console.error('[Worker] Failed to load adblock rules:', error);
    }
  },
  
  parseRules(text) {
    this.rules = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('!') && !line.startsWith('['));
    
    this.compiledRules = this.compileRules(this.rules);
  },
  
  compileRules(rules) {
    return rules.map(rule => {
      if (rule.startsWith('||')) {
        const domain = rule.slice(2).split('/')[0].split('^')[0];
        return {
          type: 'domain',
          pattern: new RegExp(`^https?://([^/]*\\.)?${domain.replace(/\./g, '\\.')}(/.*)?$`),
        };
      }
      if (rule.startsWith('|')) {
        const pattern = rule.slice(1).replace(/\*/g, '.*').replace(/\./g, '\\.');
        return {
          type: 'exact',
          pattern: new RegExp(`^${pattern}$`),
        };
      }
      if (rule.includes('*')) {
        const pattern = rule.replace(/\*/g, '.*').replace(/\./g, '\\.');
        return {
          type: 'wildcard',
          pattern: new RegExp(pattern),
        };
      }
      return {
        type: 'substring',
        pattern: rule,
      };
    });
  },
  
  check(url) {
    if (!this.compiledRules) return false;
    return this.compiledRules.some(rule => {
      if (rule.type === 'substring') {
        return url.includes(rule.pattern);
      }
      return rule.pattern.test(url);
    });
  },
};

const SEARCH_PROCESSOR = {
  deduplicate(results) {
    const seen = new Set();
    return results.filter(result => {
      const key = result.url.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },
  
  rank(results, query) {
    const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);
    
    return results.map(result => {
      let score = 0;
      const title = result.title.toLowerCase();
      const snippet = result.snippet.toLowerCase();
      const url = result.url.toLowerCase();
      
      queryTerms.forEach(term => {
        if (title.includes(term)) score += 10;
        if (snippet.includes(term)) score += 5;
        if (url.includes(term)) score += 3;
        if (title.startsWith(term)) score += 15;
      });
      
      return { ...result, score };
    }).sort((a, b) => b.score - a.score);
  },
  
  categorize(results) {
    const categories = {
      web: [],
      news: [],
      images: [],
      videos: [],
      academic: [],
      shopping: [],
    };
    
    results.forEach(result => {
      const url = result.url.toLowerCase();
      if (url.includes('news') || url.includes('reuters') || url.includes('apnews')) {
        categories.news.push(result);
      } else if (url.includes('youtube') || url.includes('vimeo') || url.includes('dailymotion')) {
        categories.videos.push(result);
      } else if (url.includes('scholar') || url.includes('arxiv') || url.includes('pubmed')) {
        categories.academic.push(result);
      } else if (url.includes('amazon') || url.includes('ebay') || url.includes('shop')) {
        categories.shopping.push(result);
      } else {
        categories.web.push(result);
      }
    });
    
    return categories;
  },
};

const READER_EXTRACTOR = {
  extract(html, url) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const candidates = doc.querySelectorAll('article, [role="main"], .content, .post, .entry, main, #content, #main');
    let bestCandidate = null;
    let bestScore = 0;
    
    candidates.forEach(candidate => {
      const score = this.scoreNode(candidate);
      if (score > bestScore) {
        bestScore = score;
        bestCandidate = candidate;
      }
    });
    
    if (!bestCandidate) {
      bestCandidate = doc.body;
    }
    
    return this.cleanAndExtract(bestCandidate, url);
  },
  
  scoreNode(node) {
    let score = 0;
    const className = node.className || '';
    const id = node.id || '';
    
    if (className.includes('content') || className.includes('post') || className.includes('entry') || className.includes('article')) score += 25;
    if (id.includes('content') || id.includes('post') || id.includes('entry') || id.includes('article')) score += 25;
    if (node.tagName === 'ARTICLE') score += 30;
    if (node.tagName === 'MAIN') score += 20;
    if (node.getAttribute('role') === 'main') score += 20;
    
    const textLength = node.textContent?.length || 0;
    const linkLength = Array.from(node.querySelectorAll('a')).reduce((sum, a) => sum + (a.textContent?.length || 0), 0);
    const linkDensity = linkLength / (textLength || 1);
    
    if (linkDensity < 0.3) score += 20;
    if (textLength > 500) score += 15;
    if (textLength > 2000) score += 10;
    
    return score;
  },
  
  cleanAndExtract(node, url) {
    const clone = node.cloneNode(true);
    
    clone.querySelectorAll('script, style, nav, header, footer, aside, .ad, .advertisement, .sidebar, .comments, .social, .share, [class*="ad-"], [id*="ad-"]').forEach(el => el.remove());
    
    clone.querySelectorAll('a').forEach(a => {
      const href = a.getAttribute('href');
      if (href) {
        try {
          a.setAttribute('href', new URL(href, url).href);
        } catch {}
      }
    });
    
    clone.querySelectorAll('img').forEach(img => {
      const src = img.getAttribute('src');
      if (src) {
        try {
          img.setAttribute('src', new URL(src, url).href);
        } catch {}
      }
    });
    
    return {
      title: document.title || '',
      content: clone.innerHTML,
      textContent: clone.textContent?.trim() || '',
      length: clone.textContent?.length || 0,
    };
  },
};

const CRYPTO_UTILS = {
  async generateKey(password, salt) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode(salt),
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  },
  
  async encrypt(data, key) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(JSON.stringify(data))
    );
    return { iv: Array.from(iv), data: Array.from(new Uint8Array(encrypted)) };
  },
  
  async decrypt(encrypted, key) {
    const decoder = new TextDecoder();
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(encrypted.iv) },
      key,
      new Uint8Array(encrypted.data)
    );
    return JSON.parse(decoder.decode(decrypted));
  },
};

const TASK_HANDLERS = {
  'parse-html': (data) => HTML_PARSER.parse(data.html, data.baseUrl),
  'check-adblock': (data) => ({ blocked: AD_BLOCKER.check(data.url) }),
  'load-adblock-rules': (data) => AD_BLOCKER.loadRules(data.url),
  'process-search': (data) => {
    const deduped = SEARCH_PROCESSOR.deduplicate(data.results);
    const ranked = SEARCH_PROCESSOR.rank(deduped, data.query);
    return SEARCH_PROCESSOR.categorize(ranked);
  },
  'extract-reader': (data) => READER_EXTRACTOR.extract(data.html, data.url),
  'encrypt': async (data) => {
    const key = await CRYPTO_UTILS.generateKey(data.password, data.salt);
    return CRYPTO_UTILS.encrypt(data.payload, key);
  },
  'decrypt': async (data) => {
    const key = await CRYPTO_UTILS.generateKey(data.password, data.salt);
    return CRYPTO_UTILS.decrypt(data.payload, key);
  },
};

self.addEventListener('message', async (event) => {
  const { id, type, payload } = event.data;
  
  if (!TASK_HANDLERS[type]) {
    self.postMessage({ id, error: `Unknown task type: ${type}` });
    return;
  }
  
  try {
    const result = await TASK_HANDLERS[type](payload);
    self.postMessage({ id, result });
  } catch (error) {
    self.postMessage({ id, error: error.message });
  }
});

self.postMessage({ type: 'ready' });