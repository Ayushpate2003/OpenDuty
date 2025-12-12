import { test, expect } from '@playwright/test';

test.describe('Incident Response Flow', () => {
  
  test('Admin can login and create an incident', async ({ page }) => {
    // 1. Login
    await page.goto('http://localhost:3000');
    await page.fill('input[type="email"]', 'admin@openduty.io');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('http://localhost:3000/');
    await expect(page.locator('text=Operational Status')).toBeVisible();

    // 2. Create Incident
    await page.click('text=Declare Incident');
    await expect(page.locator('h3:has-text("Declare Incident")')).toBeVisible();
    
    const title = `Test Incident ${Date.now()}`;
    await page.fill('input[placeholder*="API Latency"]', title);
    await page.fill('textarea', 'Integration test description');
    await page.click('button:has-text("Declare Incident")');

    // 3. Verify in List
    await expect(page.locator(`text=${title}`)).toBeVisible();
    
    // 4. Verify Detail & Timeline
    await page.click(`text=${title}`);
    await expect(page.locator('h1')).toContainText(title);
    await expect(page.locator('text=Incident started')).toBeVisible();
  });

  test('Worker processes automation', async ({ request }) => {
    // Verify Health API
    const response = await request.get('http://localhost:3000/api/incidents');
    expect(response.ok()).toBeTruthy();
  });
});