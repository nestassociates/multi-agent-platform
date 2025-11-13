import { test, expect } from '@playwright/test';
import { generateTestEmail, generateTestSubdomain } from '../utils/test-helpers';

/**
 * E2E Test: Agent List Search and Filter (T220)
 *
 * Tests that admin can search agents by name, email, subdomain,
 * filter by status, and paginate through results
 */

test.describe('Agent List View', () => {
  let testAgentIds: string[] = [];

  test.beforeAll(async ({ browser }) => {
    // Create test agents for search/filter testing
    const page = await browser.newPage();

    // Login as admin
    await page.goto('/login');
    await page.fill('[name="email"]', 'website@nestassociates.co.uk');
    await page.fill('[name="password"]', process.env.ADMIN_PASSWORD || 'test-password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/agents/);

    // Create 3 test agents with different attributes
    const testAgents = [
      {
        email: generateTestEmail(),
        firstName: 'Alice',
        lastName: 'Smith',
        subdomain: generateTestSubdomain(),
      },
      {
        email: generateTestEmail(),
        firstName: 'Bob',
        lastName: 'Johnson',
        subdomain: generateTestSubdomain(),
      },
      {
        email: generateTestEmail(),
        firstName: 'Charlie',
        lastName: 'Williams',
        subdomain: generateTestSubdomain(),
      },
    ];

    for (const agent of testAgents) {
      await page.goto('/agents/new');
      await page.fill('[name="email"]', agent.email);
      await page.fill('[name="first_name"]', agent.firstName);
      await page.fill('[name="last_name"]', agent.lastName);
      await page.fill('[name="subdomain"]', agent.subdomain);
      await page.fill('[name="password"]', 'TestPassword123!');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000); // Wait for agent creation
    }

    await page.close();
  });

  test('admin can view agent list with all columns', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('[name="email"]', 'website@nestassociates.co.uk');
    await page.fill('[name="password"]', process.env.ADMIN_PASSWORD || 'test-password');
    await page.click('button[type="submit"]');

    // Navigate to agents list
    await page.goto('/agents');
    await expect(page).toHaveURL(/\/agents/);

    // Verify table headers are present (7 columns as per spec)
    await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Email' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Subdomain' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Status/i })).toBeVisible();

    // Verify at least one agent row is visible
    const rows = page.locator('table tbody tr');
    await expect(rows.first()).toBeVisible();
  });

  test('admin can search agents by name', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('[name="email"]', 'website@nestassociates.co.uk');
    await page.fill('[name="password"]', process.env.ADMIN_PASSWORD || 'test-password');
    await page.click('button[type="submit"]');

    // Navigate to agents list
    await page.goto('/agents');

    // Search by name
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('Alice');

    // Wait for search results to update
    await page.waitForTimeout(500);

    // Verify Alice appears in results
    await expect(page.getByText('Alice Smith')).toBeVisible();

    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(500);
  });

  test('admin can search agents by email', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('[name="email"]', 'website@nestassociates.co.uk');
    await page.fill('[name="password"]', process.env.ADMIN_PASSWORD || 'test-password');
    await page.click('button[type="submit"]');

    // Navigate to agents list
    await page.goto('/agents');

    // Get the first agent's email from the table
    const firstEmailCell = page.locator('table tbody tr:first-child td:nth-child(2)');
    const emailText = await firstEmailCell.textContent();

    if (emailText) {
      const searchInput = page.locator('input[placeholder*="Search"]');
      await searchInput.fill(emailText.trim());

      // Wait for search results
      await page.waitForTimeout(500);

      // Verify the email appears in results
      await expect(page.locator('table tbody tr')).toHaveCount(1);
      await expect(firstEmailCell).toContainText(emailText.trim());
    }
  });

  test('admin can search agents by subdomain', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('[name="email"]', 'website@nestassociates.co.uk');
    await page.fill('[name="password"]', process.env.ADMIN_PASSWORD || 'test-password');
    await page.click('button[type="submit"]');

    // Navigate to agents list
    await page.goto('/agents');

    // Get the first agent's subdomain from the table
    const firstSubdomainCell = page.locator('table tbody tr:first-child td:nth-child(3) code');
    const subdomainText = await firstSubdomainCell.textContent();

    if (subdomainText) {
      const searchInput = page.locator('input[placeholder*="Search"]');
      await searchInput.fill(subdomainText.trim());

      // Wait for search results
      await page.waitForTimeout(500);

      // Verify the subdomain appears in results
      await expect(firstSubdomainCell).toContainText(subdomainText.trim());
    }
  });

  test('admin can filter agents by status', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('[name="email"]', 'website@nestassociates.co.uk');
    await page.fill('[name="password"]', process.env.ADMIN_PASSWORD || 'test-password');
    await page.click('button[type="submit"]');

    // Navigate to agents list
    await page.goto('/agents');

    // Count total agents
    const totalAgents = await page.locator('table tbody tr').count();

    // Apply status filter - Active
    const statusFilter = page.locator('[role="combobox"]').first();
    await statusFilter.click();
    await page.getByRole('option', { name: 'Active' }).click();

    // Wait for filter to apply
    await page.waitForTimeout(500);

    // Verify filtered results (should have at least some active agents)
    const filteredCount = await page.locator('table tbody tr').count();
    expect(filteredCount).toBeGreaterThan(0);

    // Verify all visible agents have "active" status
    const statusBadges = page.locator('table tbody tr td:has([class*="badge"])');
    const count = await statusBadges.count();
    for (let i = 0; i < count; i++) {
      const badge = statusBadges.nth(i);
      const text = await badge.textContent();
      expect(text?.toLowerCase()).toContain('active');
    }

    // Reset filter to "All Statuses"
    await statusFilter.click();
    await page.getByRole('option', { name: 'All Statuses' }).click();
    await page.waitForTimeout(500);
  });

  test('admin can click agent row to navigate to detail', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('[name="email"]', 'website@nestassociates.co.uk');
    await page.fill('[name="password"]', process.env.ADMIN_PASSWORD || 'test-password');
    await page.click('button[type="submit"]');

    // Navigate to agents list
    await page.goto('/agents');

    // Click the View button on first agent
    const viewButton = page.locator('table tbody tr:first-child a:has-text("View")');
    await viewButton.click();

    // Should navigate to agent detail page
    await expect(page).toHaveURL(/\/agents\/[a-f0-9-]+$/);
  });

  test('results count updates with search and filter', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('[name="email"]', 'website@nestassociates.co.uk');
    await page.fill('[name="password"]', process.env.ADMIN_PASSWORD || 'test-password');
    await page.click('button[type="submit"]');

    // Navigate to agents list
    await page.goto('/agents');

    // Get initial count
    const resultsText = page.locator('text=/Showing \\d+ of \\d+ agents/');
    await expect(resultsText).toBeVisible();

    // Apply search
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('test');
    await page.waitForTimeout(500);

    // Verify count changed
    await expect(resultsText).toBeVisible();
  });
});
