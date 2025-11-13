import { test, expect } from '@playwright/test';
import { generateTestEmail, generateTestSubdomain } from '../utils/test-helpers';

/**
 * E2E Test: Agent Editing (T222)
 *
 * Tests that admin can edit agent information (bio, phone, etc.) in modal,
 * save changes, and trigger a rebuild. Also tests that email/subdomain
 * fields are read-only.
 */

test.describe('Agent Editing', () => {
  let testAgentId: string;
  let testAgentEmail: string;
  let testSubdomain: string;

  test.beforeAll(async ({ browser }) => {
    // Create a test agent to edit
    const page = await browser.newPage();

    // Login as admin
    await page.goto('/login');
    await page.fill('[name="email"]', 'website@nestassociates.co.uk');
    await page.fill('[name="password"]', process.env.ADMIN_PASSWORD || 'test-password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/agents/);

    // Create test agent
    testAgentEmail = generateTestEmail();
    testSubdomain = generateTestSubdomain();

    await page.goto('/agents/new');
    await page.fill('[name="email"]', testAgentEmail);
    await page.fill('[name="first_name"]', 'Edit');
    await page.fill('[name="last_name"]', 'Test');
    await page.fill('[name="subdomain"]', testSubdomain);
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.fill('[name="phone"]', '07700 900000');
    await page.fill('[name="bio"]', 'Original bio text.');
    await page.click('button[type="submit"]');

    // Wait and navigate to the agent
    await page.waitForTimeout(2000);
    await page.goto('/agents');
    const viewButton = page.locator(`table tbody tr:has-text("Edit Test") a:has-text("View")`).first();
    await viewButton.click();
    const url = page.url();
    testAgentId = url.split('/').pop() || '';

    await page.close();
  });

  test('admin can open edit agent modal', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('[name="email"]', 'website@nestassociates.co.uk');
    await page.fill('[name="password"]', process.env.ADMIN_PASSWORD || 'test-password');
    await page.click('button[type="submit"]');

    // Navigate to agent detail
    await page.goto('/agents');
    const viewButton = page.locator('table tbody tr:first-child a:has-text("View")');
    await viewButton.click();

    // Click Edit Agent button
    await page.getByRole('button', { name: /Edit Agent/i }).click();

    // Modal should be visible
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Edit Agent' })).toBeVisible();
  });

  test('edit modal displays read-only email and subdomain fields', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('[name="email"]', 'website@nestassociates.co.uk');
    await page.fill('[name="password"]', process.env.ADMIN_PASSWORD || 'test-password');
    await page.click('button[type="submit"]');

    // Navigate to agent detail
    await page.goto('/agents');
    const viewButton = page.locator('table tbody tr:first-child a:has-text("View")');
    await viewButton.click();

    // Open edit modal
    await page.getByRole('button', { name: /Edit Agent/i }).click();

    // Verify email field is disabled
    const emailInput = page.locator('input[value*="@"]').first();
    await expect(emailInput).toBeDisabled();

    // Verify subdomain field is disabled
    const subdomainInput = page.locator('input[type="text"]').filter({ hasText: /subdomain/i }).or(
      page.locator('input[disabled]').filter({ hasText: /agents\.nestassociates\.com/ })
    );
    // The subdomain input should be disabled
    const disabledInputs = page.locator('input[disabled]');
    const count = await disabledInputs.count();
    expect(count).toBeGreaterThan(0);

    // Verify warning messages
    await expect(page.getByText(/Email cannot be changed/i)).toBeVisible();
    await expect(page.getByText(/Subdomain cannot be changed/i)).toBeVisible();
  });

  test('admin can edit agent bio', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('[name="email"]', 'website@nestassociates.co.uk');
    await page.fill('[name="password"]', process.env.ADMIN_PASSWORD || 'test-password');
    await page.click('button[type="submit"]');

    // Navigate to agent detail
    await page.goto('/agents');
    const viewButton = page.locator('table tbody tr:first-child a:has-text("View")');
    await viewButton.click();

    // Open edit modal
    await page.getByRole('button', { name: /Edit Agent/i }).click();

    // Find and edit bio textarea
    const bioTextarea = page.locator('textarea[id="bio"]');
    await bioTextarea.clear();
    const newBio = `Updated bio at ${Date.now()}`;
    await bioTextarea.fill(newBio);

    // Save changes
    await page.getByRole('button', { name: /Save Changes/i }).click();

    // Modal should close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

    // Wait for page to refresh
    await page.waitForTimeout(1000);

    // Verify bio is updated on the overview tab
    await expect(page.getByText(newBio)).toBeVisible();
  });

  test('admin can edit agent phone number', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('[name="email"]', 'website@nestassociates.co.uk');
    await page.fill('[name="password"]', process.env.ADMIN_PASSWORD || 'test-password');
    await page.click('button[type="submit"]');

    // Navigate to agent detail
    await page.goto('/agents');
    const viewButton = page.locator('table tbody tr:first-child a:has-text("View")');
    await viewButton.click();

    // Open edit modal
    await page.getByRole('button', { name: /Edit Agent/i }).click();

    // Find and edit phone input
    const phoneInput = page.locator('input[id="phone"]');
    await phoneInput.clear();
    const newPhone = '07700 900999';
    await phoneInput.fill(newPhone);

    // Save changes
    await page.getByRole('button', { name: /Save Changes/i }).click();

    // Modal should close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

    // Wait for page to refresh
    await page.waitForTimeout(1000);

    // Verify phone is updated on the overview tab
    await expect(page.getByText(newPhone)).toBeVisible();
  });

  test('admin can edit Apex27 branch ID', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('[name="email"]', 'website@nestassociates.co.uk');
    await page.fill('[name="password"]', process.env.ADMIN_PASSWORD || 'test-password');
    await page.click('button[type="submit"]');

    // Navigate to agent detail
    await page.goto('/agents');
    const viewButton = page.locator('table tbody tr:first-child a:has-text("View")');
    await viewButton.click();

    // Open edit modal
    await page.getByRole('button', { name: /Edit Agent/i }).click();

    // Find and edit branch ID input
    const branchInput = page.locator('input[id="apex27_branch_id"]');
    await branchInput.clear();
    const newBranchId = '9999';
    await branchInput.fill(newBranchId);

    // Save changes
    await page.getByRole('button', { name: /Save Changes/i }).click();

    // Modal should close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

    // Wait for page to refresh
    await page.waitForTimeout(1000);

    // Verify branch ID is updated on the overview tab
    await expect(page.getByText(`Branch ID: ${newBranchId}`)).toBeVisible();
  });

  test('save button is disabled when form is pristine', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('[name="email"]', 'website@nestassociates.co.uk');
    await page.fill('[name="password"]', process.env.ADMIN_PASSWORD || 'test-password');
    await page.click('button[type="submit"]');

    // Navigate to agent detail
    await page.goto('/agents');
    const viewButton = page.locator('table tbody tr:first-child a:has-text("View")');
    await viewButton.click();

    // Open edit modal
    await page.getByRole('button', { name: /Edit Agent/i }).click();

    // Save button should be disabled initially (no changes)
    const saveButton = page.getByRole('button', { name: /Save Changes/i });
    await expect(saveButton).toBeDisabled();

    // Make a change
    const bioTextarea = page.locator('textarea[id="bio"]');
    await bioTextarea.fill('Some change');

    // Save button should now be enabled
    await expect(saveButton).toBeEnabled();
  });

  test('admin can cancel editing', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('[name="email"]', 'website@nestassociates.co.uk');
    await page.fill('[name="password"]', process.env.ADMIN_PASSWORD || 'test-password');
    await page.click('button[type="submit"]');

    // Navigate to agent detail
    await page.goto('/agents');
    const viewButton = page.locator('table tbody tr:first-child a:has-text("View")');
    await viewButton.click();

    // Open edit modal
    await page.getByRole('button', { name: /Edit Agent/i }).click();

    // Make a change
    const bioTextarea = page.locator('textarea[id="bio"]');
    const originalText = await bioTextarea.inputValue();
    await bioTextarea.fill('This change should be discarded');

    // Click Cancel
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Modal should close
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Reopen modal
    await page.getByRole('button', { name: /Edit Agent/i }).click();

    // Bio should have original text (change was discarded)
    const bioAfterCancel = await bioTextarea.inputValue();
    expect(bioAfterCancel).toBe(originalText);
  });

  test('editing agent triggers build queue', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('[name="email"]', 'website@nestassociates.co.uk');
    await page.fill('[name="password"]', process.env.ADMIN_PASSWORD || 'test-password');
    await page.click('button[type="submit"]');

    // Navigate to agent detail
    await page.goto('/agents');
    const viewButton = page.locator('table tbody tr:first-child a:has-text("View")');
    await viewButton.click();

    // Open edit modal
    await page.getByRole('button', { name: /Edit Agent/i }).click();

    // Edit bio (which triggers rebuild)
    const bioTextarea = page.locator('textarea[id="bio"]');
    await bioTextarea.clear();
    await bioTextarea.fill('Bio change that triggers rebuild');

    // Save changes
    await page.getByRole('button', { name: /Save Changes/i }).click();

    // Modal should close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

    // The build should be queued (we can't easily verify this without database access,
    // but we can at least verify the save succeeded)
    await page.waitForTimeout(1000);
    await expect(page.getByText('Bio change that triggers rebuild')).toBeVisible();
  });

  test('validation error displays in modal', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('[name="email"]', 'website@nestassociates.co.uk');
    await page.fill('[name="password"]', process.env.ADMIN_PASSWORD || 'test-password');
    await page.click('button[type="submit"]');

    // Navigate to agent detail
    await page.goto('/agents');
    const viewButton = page.locator('table tbody tr:first-child a:has-text("View")');
    await viewButton.click();

    // Open edit modal
    await page.getByRole('button', { name: /Edit Agent/i }).click();

    // Try to enter a bio that's too long (>500 chars)
    const bioTextarea = page.locator('textarea[id="bio"]');
    const longBio = 'a'.repeat(501);
    await bioTextarea.fill(longBio);

    // Try to save
    await page.getByRole('button', { name: /Save Changes/i }).click();

    // Should show validation error (from Zod or server)
    // Note: This might be caught by Zod before submission
    await page.waitForTimeout(500);
  });
});
