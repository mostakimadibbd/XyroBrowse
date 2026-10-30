import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateMath,
  evaluateUnitConversion,
  isUrlOrDomain,
  formatNavigableUrl,
  parseOmniboxQuery,
  calculateTabRam,
  evaluateAutoHibernate,
  SEARCH_ENGINES,
} from './browserLogic.ts';
import { Tab } from '../types/browser.ts';

test('evaluateMath correctly computes arithmetic and functions', () => {
  assert.equal(evaluateMath('12 * 84'), '1008');
  assert.equal(evaluateMath('100 / 4 + 2'), '27');
  assert.equal(evaluateMath('25% of 800'), '200');
  assert.equal(evaluateMath('sqrt(144)'), '12');
  assert.equal(evaluateMath('abs(-42)'), '42');
  assert.equal(evaluateMath('not math query'), null);
});

test('evaluateUnitConversion converts units accurately', () => {
  assert.equal(evaluateUnitConversion('100 c to f'), '212.00 °F');
  assert.equal(evaluateUnitConversion('0 c to k'), '273.15 K');
  assert.equal(evaluateUnitConversion('50 km to miles'), '31.0686 miles');
  assert.equal(evaluateUnitConversion('10 kg to lbs'), '22.0462 lbs');
  assert.ok(evaluateUnitConversion('100 usd to eur')?.includes('EUR'));
  assert.equal(evaluateUnitConversion('hello world'), null);
});

test('isUrlOrDomain detects urls and domains correctly', () => {
  assert.equal(isUrlOrDomain('https://google.com'), true);
  assert.equal(isUrlOrDomain('http://example.com/test'), true);
  assert.equal(isUrlOrDomain('xyro://newtab'), true);
  assert.equal(isUrlOrDomain('github.com'), true);
  assert.equal(isUrlOrDomain('news.ycombinator.com'), true);
  assert.equal(isUrlOrDomain('localhost:3000'), true);
  assert.equal(isUrlOrDomain('how to make pizza'), false);
});

test('formatNavigableUrl formats protocols', () => {
  assert.equal(formatNavigableUrl('github.com'), 'https://github.com');
  assert.equal(formatNavigableUrl('https://example.com'), 'https://example.com');
  assert.equal(formatNavigableUrl('xyro://settings'), 'xyro://settings');
  assert.equal(formatNavigableUrl('localhost:3000'), 'http://localhost:3000');
});

test('parseOmniboxQuery handles Bangs, internal pages, and search', () => {
  const defaultEngine = SEARCH_ENGINES[0]; // Google

  // Bang !b (Brave)
  const braveResult = parseOmniboxQuery('!b rust lang', defaultEngine);
  assert.ok(braveResult.navigableUrl.includes('search.brave.com'));

  // Bang !yt (YouTube)
  const ytResult = parseOmniboxQuery('!yt synthwave 4k', defaultEngine);
  assert.ok(ytResult.navigableUrl.includes('youtube.com'));

  // Internal page
  const internalResult = parseOmniboxQuery('xyro://bookmarks', defaultEngine);
  assert.equal(internalResult.navigableUrl, 'xyro://bookmarks');

  // Shortcut page name
  const shortcutResult = parseOmniboxQuery('settings', defaultEngine);
  assert.equal(shortcutResult.navigableUrl, 'xyro://settings');

  // Regular search
  const searchResult = parseOmniboxQuery('best coding font', defaultEngine);
  assert.ok(searchResult.navigableUrl.includes('google.com/search?q='));
});

test('calculateTabRam estimates memory accurately', () => {
  assert.equal(calculateTabRam('https://youtube.com/watch?v=123', false), 340);
  assert.equal(calculateTabRam('https://youtube.com/watch?v=123', true), 12); // Hibernated
  assert.equal(calculateTabRam('xyro://newtab', false), 38);
});

test('evaluateAutoHibernate selects inactive tabs for sleeping', () => {
  const now = 1000000;
  const tabs: Tab[] = [
    {
      id: 'tab-1',
      url: 'https://example.com',
      title: 'Active',
      isIncognito: false,
      isHibernated: false,
      lastActive: now,
      zoomLevel: 100,
      pinned: false,
      history: [],
      historyIndex: 0,
      readerMode: false,
      useProxy: false,
      estimatedRamMb: 120,
    },
    {
      id: 'tab-2',
      url: 'https://old.com',
      title: 'Idle Background',
      isIncognito: false,
      isHibernated: false,
      lastActive: now - 600000, // 10 minutes ago
      zoomLevel: 100,
      pinned: false,
      history: [],
      historyIndex: 0,
      readerMode: false,
      useProxy: false,
      estimatedRamMb: 120,
    },
    {
      id: 'tab-3',
      url: 'https://pinned.com',
      title: 'Pinned Tab',
      isIncognito: false,
      isHibernated: false,
      lastActive: now - 800000,
      zoomLevel: 100,
      pinned: true, // Should NOT hibernate
      history: [],
      historyIndex: 0,
      readerMode: false,
      useProxy: false,
      estimatedRamMb: 120,
    },
  ];

  const toHibernate = evaluateAutoHibernate(tabs, 'tab-1', null, 5, 300000, now);
  assert.deepEqual(toHibernate, ['tab-2']);
});
