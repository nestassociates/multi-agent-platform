import { test, expect } from '@playwright/test';

/**
 * E2E Test: Agent First Login and Password Change
 * 
 * Tests User Story 1: Agent receives credentials, logs in with temporary password,
 * is forced to change password, then accesses their dashboard
 */

test.describe('Agent First Login Flow', () => {
  // Note: This test requires an agent to be created first
  // In a real scenario, you'd create an agent in a beforeAll hook
  
  test('agent must change password on first login', async ({ page }) => {
    // Prerequisite: Agent created with temporary password
    const agentEmail = process.env.TEST_AGENT_EMAIL || 'test-agent@example.com';
    const tempPassword = process.env.TEST_AGENT_TEMP_PASSWORD || 'TempPass123!';
    const newPassword = 'NewSecurePass123!';

    // Step 1: Agent navigates to login
    await page.goto('/login');

    // Step 2: Agent enters credentials
    await page.fill('[name="email"]', agentEmail);
    await page.fill('[name="password"]', tempPassword);
    await page.click('button[type="submit"]');

    // Step 3: Should be redirected to change password page
    await expect(page).toHaveURL(/\/change-password/, { timeout: 5000 });

    // Step 4: Fill in password change form
    await page.fill('[name="newPassword"]', newPassword);
    await page.fill('[name="confirmPassword"]', newPassword);
    await page.click('button[type="submit"]');

    // Step 5: Should redirect to agent dashboard after password change
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });

    // Step 6: Verify dashboard loads
    await expect(page.getByText(/dashboard|welcome/i)).toBeVisible();
  });

  test('password must meet complexity requirements', async ({ page }) => {
    const agentEmail = process.env.TEST_AGENT_EMAIL || 'test-agent@example.com';
    const tempPassword = process.env.TEST_AGENT_TEMP_PASSWORD || 'TempPass123!';

    await page.goto('/login');
    await page.fill('[name="email"]', agentEmail);
    await page.fill('[name="password"]', tempPassword);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/change-password/);

    // Try weak password
    await page.fill('[name="newPassword"]', 'weak');
    await page.fill('[name="confirmPassword"]', 'weak');
    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(page.getByText(/at least 12 characters|uppercase|lowercase|number|symbol/i)).toBeVisible();
  });

  test('passwords must match', async ({ page }) => {
    const agentEmail = process.env.TEST_AGENT_EMAIL || 'test-agent@example.com';
    const tempPassword = process.env.TEST_AGENT_TEMP_PASSWORD || 'TempPass123!';

    await page.goto('/login');
    await page.fill('[name="email"]', agentEmail);
    await page.fill('[name="password"]', tempPassword);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/change-password/);

    // Enter mismatched passwords
    await page.fill('[name="newPassword"]', 'NewSecurePass123!');
    await page.fill('[name="confirmPassword"]', 'DifferentPass123!');
    await page.click('button[type="submit"]');

    // Should show error
    await expect(page.getByText(/passwords.*not match/i)).toBeVisible();
  });
});
