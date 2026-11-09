import { test, expect } from '@playwright/test';

test('앱이 로드된다', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/.+/);
});
