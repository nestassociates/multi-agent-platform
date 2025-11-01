import { test, expect } from '@playwright/test';
import { generateTestEmail, generateTestSubdomain } from '../utils/test-helpers';

/**
 * E2E Test: Admin Creates Agent Account
 * 
 * Tests User Story 1: Admin creates a new agent account, agent receives credentials,
 * logs in for the first time, and updates their profile
 */

test.describe('Admin Agent Creation Flow', () => {
  test('admin can create new agent account', async ({ page }) => {
    const testEmail = generateTestEmail();
    const testSubdomain = generateTestSubdomain();

    // Step 1: Admin logs in
    await page.goto('/login');
    await page.fill('[name="email"]', 'website@nestassociates.co.uk');
    await page.fill('[name="password"]', process.env.ADMIN_PASSWORD || 'test-password');
    await page.click('button[type="submit"]');

    // Should redirect to agents page (admin dashboard)
    await expect(page).toHaveURL(/\/agents/);

    // Step 2: Navigate to create agent
    await page.click('text=Create Agent'); // Or find the create button
    await expect(page).toHaveURL(/\/agents\/new/);

    // Step 3: Fill out agent creation form
    await page.fill('[name="email"]', testEmail);
    await page.fill('[name="first_name"]', 'Test');
    await page.fill('[name="last_name"]', 'Agent');
    await page.fill('[name="phone"]', '07700 900000');
    await page.fill('[name="subdomain"]', testSubdomain);
    await page.fill('[name="apex27_branch_id"]', '1962'); // Test branch ID

    // Step 4: Submit form
    await page.click('button[type="submit"]');

    // Step 5: Verify success
    // Should redirect back to agents list or show success message
    await expect(page.getByText(/Agent created successfully/i)).toBeVisible({ timeout: 10000 });

    // Step 6: Verify agent appears in database
    // (This would require database query helper)

    // Step 7: Verify welcome email was sent
    // (This would require email service mock or check)

    // Cleanup: Delete test agent
    // (Add cleanup logic here)
  });

  test('admin cannot create agent with duplicate email', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('[name="email"]', 'website@nestassociates.co.uk');
    await page.fill('[name="password"]', process.env.ADMIN_PASSWORD || 'test-password');
    await page.click('button[type="submit"]');

    await page.goto('/agents/new');

    // Try to create agent with existing admin email
    await page.fill('[name="email"]', 'website@nestassociates.co.uk');
    await page.fill('[name="first_name"]', 'Duplicate');
    await page.fill('[name="last_name"]', 'Test');
    await page.fill('[name="subdomain"]', 'duplicate-test');

    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.getByText(/already exists|duplicate/i)).toBeVisible();
  });

  test('admin cannot create agent with invalid subdomain', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'website@nestassociates.co.uk');
    await page.fill('[name="password"]', process.env.ADMIN_PASSWORD || 'test-password');
    await page.click('button[type="submit"]');

    await page.goto('/agents/new');

    await page.fill('[name="email"]', generateTestEmail());
    await page.fill('[name="first_name"]', 'Test');
    await page.fill('[name="last_name"]', 'Agent');
    await page.fill('[name="subdomain"]', 'Invalid Subdomain!'); // Invalid characters

    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(page.getByText(/only lowercase letters, numbers|invalid subdomain/i)).toBeVisible();
  });
});
