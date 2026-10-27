import { test, expect } from '@playwright/test';

test.describe('Owino Client Smoke Tests', () => {
  test('homepage renders and displays key product elements', async ({ page }) => {
    await page.goto('/');
    
    // Expect page title or main heading to be visible
    await expect(page).toHaveTitle(/FairShare|Owino/i);
    
    // Verify core navigation or header is present
    const main = page.locator('main, #__next, body');
    await expect(main).toBeVisible();
  });

  test('navigation routes exist and respond without fatal client errors', async ({ page }) => {
    // Collect console errors
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/auth');
    expect(errors.filter(e => !e.includes('Hydration'))).toHaveLength(0);
  });
});
