import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isUrlOrDomain,
  resolveOmniboxInput,
  evaluateMath,
  cleanDisplayUrl,
  SEARCH_ENGINES,
} from '../src/lib/url.ts';
import { exportBookmarksHtml, importBookmarksHtml } from '../src/lib/bookmarks.ts';
import { BookmarkNode } from '../src/types.ts';

test('URL - isUrlOrDomain correctly identifies web addresses', () => {
  assert.equal(isUrlOrDomain('https://google.com'), true);
  assert.equal(isUrlOrDomain('http://example.com/test'), true);
  assert.equal(isUrlOrDomain('github.com'), true);
  assert.equal(isUrlOrDomain('localhost:3000'), true);
  assert.equal(isUrlOrDomain('192.168.1.1:8080'), true);
  assert.equal(isUrlOrDomain('chrome://newtab'), true);
  assert.equal(isUrlOrDomain('view-source:https://example.com'), true);

  // Search terms with spaces should not be treated as URLs
  assert.equal(isUrlOrDomain('how to make tea'), false);
  assert.equal(isUrlOrDomain('react 19 features'), false);
});

test('Omnibox - resolveOmniboxInput handles bangs, urls, and search queries', () => {
  const googleEngine = SEARCH_ENGINES[0];

  // Bang !b searches directly with Brave rather than showing another provider's results.
  const braveRes = resolveOmniboxInput('!b typescript generics', googleEngine);
  assert.equal(braveRes.isSearch, false);
  assert.equal(braveRes.url, 'https://search.brave.com/search?q=typescript%20generics');

  // Bang !yt routes to YouTube
  const ytRes = resolveOmniboxInput('!yt lo-fi beats', googleEngine);
  assert.equal(ytRes.isSearch, false);
  assert.equal(ytRes.url.includes('youtube.com'), true);

  // Direct domain navigation
  const domainRes = resolveOmniboxInput('wikipedia.org', googleEngine);
  assert.equal(domainRes.isSearch, false);
  assert.equal(domainRes.url, 'https://wikipedia.org');

  // Search query
  const searchRes = resolveOmniboxInput('google chrome tips', googleEngine);
  assert.equal(searchRes.isSearch, false);
  assert.equal(searchRes.url, 'https://www.google.com/search?q=google%20chrome%20tips');

  const bingSearch = resolveOmniboxInput(
    'browser features',
    SEARCH_ENGINES.find((engine) => engine.id === 'bing')!
  );
  assert.equal(bingSearch.url, 'https://www.bing.com/search?q=browser%20features');
});

test('Omnibox - evaluateMath computes arithmetic expressions inline', () => {
  assert.equal(evaluateMath('12 * 84'), '1008');
  assert.equal(evaluateMath('100 / 4 + 2'), '27');
  assert.equal(evaluateMath('450 * 1.15'), '517.5');
  assert.equal(evaluateMath('not a math query'), null);
});

test('URL - cleanDisplayUrl removes https:// and trailing slashes for clean omnibox', () => {
  assert.equal(cleanDisplayUrl('https://example.com/'), 'example.com');
  assert.equal(cleanDisplayUrl('https://www.google.com/search?q=test'), 'google.com/search?q=test');
  assert.equal(cleanDisplayUrl('chrome://bookmarks'), 'chrome://bookmarks');
});

test('Bookmarks - Netscape HTML export and import format roundtrip', () => {
  const originalBookmarks: BookmarkNode[] = [
    { id: '1', title: 'Google', url: 'https://www.google.com', dateAdded: 1700000000000 },
    { id: '2', title: 'GitHub', url: 'https://github.com', dateAdded: 1700000000000 },
  ];

  const html = exportBookmarksHtml(originalBookmarks);
  assert.equal(html.includes('NETSCAPE-Bookmark-file-1'), true);
  assert.equal(html.includes('https://www.google.com'), true);
  assert.equal(html.includes('GitHub'), true);

  const parsed = importBookmarksHtml(html);
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].title, 'Google');
  assert.equal(parsed[0].url, 'https://www.google.com');
  assert.equal(parsed[1].title, 'GitHub');
  assert.equal(parsed[1].url, 'https://github.com');
});
