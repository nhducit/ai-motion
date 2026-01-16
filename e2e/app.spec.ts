import { test, expect } from '@playwright/test';

test.describe('AI Motion App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('displays the app header', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('AI Motion');
    await expect(page.locator('.header p')).toContainText('Hand Gesture Controlled 3D Animations');
  });

  test('shows start camera button initially', async ({ page }) => {
    // Wait for button (either loading or ready state)
    await expect(page.getByRole('button', { name: /start camera|loading ai/i })).toBeVisible({
      timeout: 60000,
    });
  });

  test('displays gesture guide in footer', async ({ page }) => {
    const footer = page.locator('.footer');
    await expect(footer).toBeVisible();

    const guide = page.locator('.gesture-guide');
    await expect(guide).toContainText('Open');
    await expect(guide).toContainText('Fist');
    await expect(guide).toContainText('Point');
    await expect(guide).toContainText('Peace');
    await expect(guide).toContainText('Thumbs Up');
  });

  test('shows video container', async ({ page }) => {
    const videoContainer = page.locator('.video-container');
    await expect(videoContainer).toBeVisible();
  });

  test('shows animation section', async ({ page }) => {
    const animationSection = page.locator('.animation-section');
    await expect(animationSection).toBeVisible();
  });

  test('displays gesture info section', async ({ page }) => {
    const gestureInfo = page.locator('.gesture-info');
    await expect(gestureInfo).toBeVisible();
    await expect(gestureInfo).toContainText('No gesture detected');
  });

  test('has responsive layout', async ({ page }) => {
    // Test desktop layout
    await page.setViewportSize({ width: 1200, height: 800 });
    const mainDesktop = page.locator('.main');
    await expect(mainDesktop).toBeVisible();

    // Test mobile layout
    await page.setViewportSize({ width: 400, height: 800 });
    await expect(mainDesktop).toBeVisible();
  });

  test('video element exists', async ({ page }) => {
    const video = page.locator('video');
    await expect(video).toBeVisible();
    // Check autoplay attribute exists
    await expect(video).toHaveAttribute('autoplay', '');
  });

  test('canvas overlay exists for hand landmarks', async ({ page }) => {
    const canvas = page.locator('.overlay');
    await expect(canvas).toBeVisible();
    await expect(canvas).toHaveAttribute('width', '640');
    await expect(canvas).toHaveAttribute('height', '480');
  });

  test('Three.js canvas is rendered', async ({ page }) => {
    // React Three Fiber renders a canvas inside the animation section
    const threeCanvas = page.locator('.animation-section canvas');
    await expect(threeCanvas).toBeVisible({ timeout: 10000 });
  });
});

test.describe('UI Interactions', () => {
  test('button exists and is visible', async ({ page }) => {
    await page.goto('/');

    // Wait for any button to appear
    const button = page.getByRole('button').first();
    await expect(button).toBeVisible({ timeout: 60000 });

    // Verify it has some text
    const text = await button.textContent();
    expect(text).toBeTruthy();
  });
});

test.describe('Accessibility', () => {
  test('page has proper heading structure', async ({ page }) => {
    await page.goto('/');

    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toContainText('AI Motion');
  });

  test('main sections are present', async ({ page }) => {
    await page.goto('/');

    // Header
    await expect(page.locator('.header')).toBeVisible();

    // Main content area
    await expect(page.locator('.main')).toBeVisible();

    // Footer
    await expect(page.locator('.footer')).toBeVisible();
  });

  test('controls section exists', async ({ page }) => {
    await page.goto('/');

    const controls = page.locator('.controls');
    await expect(controls).toBeVisible();
  });
});
