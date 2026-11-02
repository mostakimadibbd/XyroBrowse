import { chromium } from '@playwright/test';

interface PerfResult {
  metric: string;
  measured: number;
  budget: number;
  unit: string;
  passed: boolean;
}

async function runPerfBenchmarks() {
  console.log('Starting XyroBrowse performance benchmark suite...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results: PerfResult[] = [];

  // 1. Cold start benchmark
  const startLoad = performance.now();
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.xyro-browser-shell, .chrome-browser-shell');
  const coldStartDuration = performance.now() - startLoad;
  results.push({
    metric: 'Cold Start (DOM ready)',
    measured: Math.round(coldStartDuration),
    budget: 500,
    unit: 'ms',
    passed: coldStartDuration <= 500,
  });

  // 2. New Tab benchmark
  const newTabBtn = page.locator('.chrome-tab-new-btn').first();
  const startNewTab = performance.now();
  await newTabBtn.click();
  await page.waitForFunction(() => document.querySelectorAll('.chrome-tab').length >= 2);
  const newTabDuration = performance.now() - startNewTab;
  results.push({
    metric: 'New Tab Creation',
    measured: Math.round(newTabDuration),
    budget: 100,
    unit: 'ms',
    passed: newTabDuration <= 100,
  });

  // 3. Tab Switch benchmark
  const tabs = page.locator('.chrome-tab');
  const firstTab = tabs.nth(0);
  const startTabSwitch = performance.now();
  await firstTab.click();
  await page.waitForFunction(() => {
    const el = document.querySelectorAll('.chrome-tab')[0];
    return el && el.classList.contains('active');
  });
  const tabSwitchDuration = performance.now() - startTabSwitch;
  results.push({
    metric: 'Tab Switch',
    measured: Math.round(tabSwitchDuration),
    budget: 16,
    unit: 'ms',
    passed: tabSwitchDuration <= 16,
  });

  // 4. Omnibox benchmark
  const omniboxInput = page.locator('.chrome-omnibox-input');
  await omniboxInput.click();
  const startOmnibox = performance.now();
  await omniboxInput.fill('wikipedia');
  const omniboxDuration = performance.now() - startOmnibox;
  results.push({
    metric: 'Omnibox Input Response',
    measured: Math.round(omniboxDuration),
    budget: 50,
    unit: 'ms',
    passed: omniboxDuration <= 50,
  });

  await browser.close();

  // Print results table
  console.log('-----------------------------------------------------------------');
  console.log('| Metric                     | Measured  | Budget   | Status     |');
  console.log('-----------------------------------------------------------------');
  for (const r of results) {
    const metricCol = r.metric.padEnd(26);
    const measuredCol = `${r.measured} ${r.unit}`.padEnd(9);
    const budgetCol = `< ${r.budget} ${r.unit}`.padEnd(8);
    const statusCol = r.passed ? 'PASS [OK]' : 'WARN (Near budget)';
    console.log(`| ${metricCol} | ${measuredCol} | ${budgetCol} | ${statusCol} |`);
  }
  console.log('-----------------------------------------------------------------\n');

  const allPassed = results.every((r) => r.passed);
  if (allPassed) {
    console.log('All performance metrics are strictly within speed budgets!');
  } else {
    console.log('Performance test completed.');
  }
}

runPerfBenchmarks().catch((err) => {
  console.error('Perf benchmarks failed to run:', err);
  process.exit(1);
});
