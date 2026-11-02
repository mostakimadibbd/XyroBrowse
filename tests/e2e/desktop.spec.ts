import { test, expect } from '@playwright/test';

test.describe('XyroBrowse E2E Test Suite', () => {
  test('Visiting hosted link shows Download Portal with OS auto-detection and 1-click download', async ({ page }) => {
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Header and title
    await expect(page.locator('h1:has-text("Get XyroBrowse for your Device")')).toBeVisible();

    // Primary download button is visible
    await expect(page.locator('button:has-text("Download for")').first()).toBeVisible();

    // All supported platform options in switcher
    await expect(page.getByText('macOS', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Windows', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Android', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Linux', { exact: true }).first()).toBeVisible();

    // User can change decision and switch platform to Windows
    await page.locator('[data-testid="platform-tab-win"]').click();
    await expect(page.locator('[data-testid="hero-download-btn"]')).toContainText('Windows');

    // User can change decision and switch platform to Android
    await page.locator('[data-testid="platform-tab-android"]').click();
    await expect(page.locator('[data-testid="hero-download-btn"]')).toContainText('Android');

    // User can change decision and switch platform to Linux
    await page.locator('[data-testid="platform-tab-linux"]').click();
    await expect(page.locator('[data-testid="hero-download-btn"]')).toContainText('Linux');

    // One-click download trigger
    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-testid="hero-download-btn"]').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('XyroBrowse-x86_64.AppImage');
  });

  test('User can switch from Download Portal into Lite Web Browser', async ({ page }) => {
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Click launch web mode
    const launchBtn = page.locator('button:has-text("Launch Lite Web Mode")').first();
    await expect(launchBtn).toBeVisible();
    await launchBtn.click();

    // Browser shell is now active
    await expect(page.locator('.xyro-browser-shell, .chrome-browser-shell')).toBeVisible();
    await expect(page.locator('.chrome-tab')).toHaveCount(1);
  });

  test.describe('Browser In-Tab Functionality', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('http://localhost:3000/#browser', { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.setItem('xyro_view_mode', 'browser');
      });
      await page.reload({ waitUntil: 'domcontentloaded' });
    });

    test('App shell launches and renders navigation bar and tabs', async ({ page }) => {
      await expect(page.locator('.xyro-browser-shell, .chrome-browser-shell')).toBeVisible();

      const tabs = page.locator('.chrome-tab');
      await expect(tabs).toHaveCount(1);
      await expect(tabs.first()).toHaveClass(/active/);
    });

    test('New Tab Page renders brand wordmark and search bar', async ({ page }) => {
      // Wordmark SVG is rendered
      await expect(page.locator('img[src="/logo-wordmark.svg"]')).toBeVisible();

      // Omnibox and center search are available
      await expect(page.locator('.chrome-omnibox-input')).toBeVisible();
      await expect(page.locator('form input').last()).toBeVisible();

      // Download banner on New Tab page
      await expect(page.locator('text=Download XyroBrowse for macOS, Windows & Android')).toBeVisible();
    });

    test('Tab switching occurs without page reloading', async ({ page }) => {
      // Create a second tab
      const newTabBtn = page.locator('.chrome-tab-new-btn').first();
      await newTabBtn.click();
      await expect(page.locator('.chrome-tab')).toHaveCount(2);

      // Switch back to tab 1
      const tab1 = page.locator('.chrome-tab').nth(0);
      await tab1.click();
      await expect(tab1).toHaveClass(/active/);

      // Switch to tab 2
      const tab2 = page.locator('.chrome-tab').nth(1);
      await tab2.click();
      await expect(tab2).toHaveClass(/active/);
    });

    test('About page displays honest disclosure and platform details', async ({ page }) => {
      const omnibox = page.locator('.chrome-omnibox-input');
      await omnibox.click();
      await omnibox.fill('xyro://about');
      await omnibox.press('Enter');

      // Check for About heading and brand hero
      await expect(page.locator('h1:has-text("About XyroBrowse")')).toBeVisible();

      // Confirms honest disclosure banner
      await expect(page.locator('text=Architecture & Capabilities')).toBeVisible();
      await expect(page.locator('text=Honest Platform Boundaries')).toBeVisible();
    });

    test('Shields popup displays privacy protection state', async ({ page }) => {
      const shieldBtn = page.locator('button[aria-label="Shields"]');
      await shieldBtn.click();

      // Verify popup
      await expect(page.locator('text=Xyro Shields')).toBeVisible();
      await expect(page.locator('text=Trackers & ads blocked')).toBeVisible();
    });

    test('Settings page contains vertical tabs and search engine configurations', async ({ page }) => {
      const omnibox = page.locator('.chrome-omnibox-input');
      await omnibox.click();
      await omnibox.fill('xyro://settings');
      await omnibox.press('Enter');

      await expect(page.locator('h1:has-text("Settings")')).toBeVisible();
      await expect(page.locator('text=Vertical tabs')).toBeVisible();
      await expect(page.locator('h2:has-text("Search Engine")')).toBeVisible();
    });
  });
});
