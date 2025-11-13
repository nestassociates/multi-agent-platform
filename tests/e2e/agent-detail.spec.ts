import { test, expect } from '@playwright/test';
import { generateTestEmail, generateTestSubdomain } from '../utils/test-helpers';

/**
 * E2E Test: Agent Detail View Tabs (T221)
 *
 * Tests that admin can click an agent, see detail view,
 * and switch between all 5 tabs (Overview, Content, Properties, Analytics, Settings)
 */

test.describe('Agent Detail View', () => {
  let testAgentId: string;
  let testSubdomain: string;

  test.beforeAll(async ({ browser }) => {
    // Create a test agent
    const page = await browser.newPage();

    // Login as admin
    await page.goto('/login');
    await page.fill('[name="email"]', 'website@nestassociates.co.uk');
    await page.fill('[name="password"]', process.env.ADMIN_PASSWORD || 'test-password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/agents/);

    // Create test agent
    testSubdomain = generateTestSubdomain();
    await page.goto('/agents/new');
    await page.fill('[name="email"]', generateTestEmail());
    await page.fill('[name="first_name"]', 'Detail');
    await page.fill('[name="last_name"]', 'Test');
    await page.fill('[name="subdomain"]', testSubdomain);
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.fill('[name="bio"]', 'This is a test bio for the detail view test.');
    await page.click('button[type="submit"]');

    // Wait for creation and extract agent ID from URL
    await page.waitForTimeout(2000);
    await page.goto('/agents');
    const viewButton = page.locator(`table tbody tr:has-text("Detail Test") a:has-text("View")`).first();
    await viewButton.click();
    const url = page.url();
    testAgentId = url.split('/').pop() || '';

    await page.close();
  });

  test('admin can navigate to agent detail page from list', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('[name="email"]', 'website@nestassociates.co.uk');
    await page.fill('[name="password"]', process.env.ADMIN_PASSWORD || 'test-password');
    await page.click('button[type="submit"]');

    // Navigate to agents list
    await page.goto('/agents');

    // Click first agent's View button
    const viewButton = page.locator('table tbody tr:first-child a:has-text("View")');
    await viewButton.click();

    // Should be on detail page
    await expect(page).toHaveURL(/\/agents\/[a-f0-9-]+$/);

    // Verify page header elements
    await expect(page.getByText('Back to Agents')).toBeVisible();
    await expect(page.getByRole('button', { name: /View Live Site/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Edit Agent/i })).toBeVisible();
  });

  test('agent detail page displays all 5 tabs', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('[name="email"]', 'website@nestassociates.co.uk');
    await page.fill('[name="password"]', process.env.ADMIN_PASSWORD || 'test-password');
    await page.click('button[type="submit"]');

    // Navigate to first agent detail
    await page.goto('/agents');
    const viewButton = page.locator('table tbody tr:first-child a:has-text("View")');
    await viewButton.click();

    // Verify all 5 tabs are present
    await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Content/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Properties/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Analytics' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Settings' })).toBeVisible();
  });

  test('overview tab displays agent information', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('[name="email"]', 'website@nestassociates.co.uk');
    await page.fill('[name="password"]', process.env.ADMIN_PASSWORD || 'test-password');
    await page.click('button[type="submit"]');

    // Navigate to agent detail
    await page.goto('/agents');
    const viewButton = page.locator('table tbody tr:first-child a:has-text("View")');
    await viewButton.click();

    // Overview tab should be active by default
    await expect(page.getByRole('tab', { name: 'Overview', selected: true })).toBeVisible();

    // Verify profile information is displayed
    await expect(page.getByText('Profile Information')).toBeVisible();

    // Verify stats cards are present
    await expect(page.getByText('Content Items')).toBeVisible();
    await expect(page.getByText('Properties')).toBeVisible();
    await expect(page.getByText('Last Build')).toBeVisible();
  });

  test('admin can switch to content tab', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('[name="email"]', 'website@nestassociates.co.uk');
    await page.fill('[name="password"]', process.env.ADMIN_PASSWORD || 'test-password');
    await page.click('button[type="submit"]');

    // Navigate to agent detail
    await page.goto('/agents');
    const viewButton = page.locator('table tbody tr:first-child a:has-text("View")');
    await viewButton.click();

    // Click Content tab
    await page.getByRole('tab', { name: /Content/ }).click();

    // Verify content tab is active
    await expect(page.getByRole('tab', { name: /Content/, selected: true })).toBeVisible();

    // Should show content table or empty state
    // Either we have content items or "No content yet" message
    const hasContent = await page.locator('table').count() > 0;
    const hasEmptyState = await page.getByText('No content yet').isVisible().catch(() => false);

    expect(hasContent || hasEmptyState).toBeTruthy();
  });

  test('admin can switch to properties tab', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('[name="email"]', 'website@nestassociates.co.uk');
    await page.fill('[name="password"]', process.env.ADMIN_PASSWORD || 'test-password');
    await page.click('button[type="submit"]');

    // Navigate to agent detail
    await page.goto('/agents');
    const viewButton = page.locator('table tbody tr:first-child a:has-text("View")');
    await viewButton.click();

    // Click Properties tab
    await page.getByRole('tab', { name: /Properties/ }).click();

    // Verify properties tab is active
    await expect(page.getByRole('tab', { name: /Properties/, selected: true })).toBeVisible();

    // Should show properties table or empty state
    const hasProperties = await page.locator('table').count() > 0;
    const hasEmptyState = await page.getByText('No properties').isVisible().catch(() => false);

    expect(hasProperties || hasEmptyState).toBeTruthy();
  });

  test('admin can switch to analytics tab', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('[name="email"]', 'website@nestassociates.co.uk');
    await page.fill('[name="password"]', process.env.ADMIN_PASSWORD || 'test-password');
    await page.click('button[type="submit"]');

    // Navigate to agent detail
    await page.goto('/agents');
    const viewButton = page.locator('table tbody tr:first-child a:has-text("View")');
    await viewButton.click();

    // Click Analytics tab
    await page.getByRole('tab', { name: 'Analytics' }).click();

    // Verify analytics tab is active
    await expect(page.getByRole('tab', { name: 'Analytics', selected: true })).toBeVisible();

    // Should show "Analytics Coming Soon" placeholder (as per T232)
    await expect(page.getByText('Analytics Coming Soon')).toBeVisible();
    await expect(page.getByText(/analytics including traffic statistics/i)).toBeVisible();
  });

  test('admin can switch to settings tab', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('[name="email"]', 'website@nestassociates.co.uk');
    await page.fill('[name="password"]', process.env.ADMIN_PASSWORD || 'test-password');
    await page.click('button[type="submit"]');

    // Navigate to agent detail
    await page.goto('/agents');
    const viewButton = page.locator('table tbody tr:first-child a:has-text("View")');
    await viewButton.click();

    // Click Settings tab
    await page.getByRole('tab', { name: 'Settings' }).click();

    // Verify settings tab is active
    await expect(page.getByRole('tab', { name: 'Settings', selected: true })).toBeVisible();

    // Should show settings content
    await expect(page.getByText('Agent Status')).toBeVisible();
    await expect(page.getByText('Site Deployment')).toBeVisible();
    await expect(page.getByText('Danger Zone')).toBeVisible();
  });

  test('admin can navigate between multiple tabs', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('[name="email"]', 'website@nestassociates.co.uk');
    await page.fill('[name="password"]', process.env.ADMIN_PASSWORD || 'test-password');
    await page.click('button[type="submit"]');

    // Navigate to agent detail
    await page.goto('/agents');
    const viewButton = page.locator('table tbody tr:first-child a:has-text("View")');
    await viewButton.click();

    // Overview should be active by default
    await expect(page.getByRole('tab', { name: 'Overview', selected: true })).toBeVisible();

    // Switch to Content
    await page.getByRole('tab', { name: /Content/ }).click();
    await expect(page.getByRole('tab', { name: /Content/, selected: true })).toBeVisible();

    // Switch to Settings
    await page.getByRole('tab', { name: 'Settings' }).click();
    await expect(page.getByRole('tab', { name: 'Settings', selected: true })).toBeVisible();

    // Switch back to Overview
    await page.getByRole('tab', { name: 'Overview' }).click();
    await expect(page.getByRole('tab', { name: 'Overview', selected: true })).toBeVisible();
  });

  test('View Live Site button opens microsite in new tab', async ({ page, context }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('[name="email"]', 'website@nestassociates.co.uk');
    await page.fill('[name="password"]', process.env.ADMIN_PASSWORD || 'test-password');
    await page.click('button[type="submit"]');

    // Navigate to agent detail
    await page.goto('/agents');
    const viewButton = page.locator('table tbody tr:first-child a:has-text("View")');
    await viewButton.click();

    // Get the View Live Site button
    const liveButton = page.getByRole('link', { name: /View Live Site/i });
    await expect(liveButton).toBeVisible();

    // Verify it has the correct attributes for external link
    const href = await liveButton.getAttribute('href');
    expect(href).toMatch(/https:\/\/.*\.agents\.nestassociates\.com/);

    const target = await liveButton.getAttribute('target');
    expect(target).toBe('_blank');

    const rel = await liveButton.getAttribute('rel');
    expect(rel).toContain('noopener');
    expect(rel).toContain('noreferrer');
  });

  test('back button navigates to agents list', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('[name="email"]', 'website@nestassociates.co.uk');
    await page.fill('[name="password"]', process.env.ADMIN_PASSWORD || 'test-password');
    await page.click('button[type="submit"]');

    // Navigate to agent detail
    await page.goto('/agents');
    const viewButton = page.locator('table tbody tr:first-child a:has-text("View")');
    await viewButton.click();

    // Click back button
    await page.getByRole('link', { name: 'Back to Agents' }).click();

    // Should be back on agents list
    await expect(page).toHaveURL(/\/agents$/);
  });
});
