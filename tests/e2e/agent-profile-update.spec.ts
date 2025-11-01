import { test, expect } from '@playwright/test';

/**
 * E2E Test: Agent Profile Update
 * 
 * Tests User Story 1: Agent can update their profile with bio,
 * qualifications, and social links
 */

test.describe('Agent Profile Update Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as agent before each test
    await page.goto('/login');
    await page.fill('[name="email"]', process.env.TEST_AGENT_EMAIL || 'test-agent@example.com');
    await page.fill('[name="password"]', process.env.TEST_AGENT_PASSWORD || 'AgentPass123!');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('agent can update phone number', async ({ page }) => {
    // Navigate to profile editor
    await page.goto('/profile');

    // Update phone number
    await page.fill('[name="phone"]', '07700 900001');
    await page.click('button[type="submit"]');

    // Verify success message
    await expect(page.getByText(/profile updated|saved successfully/i)).toBeVisible();

    // Verify phone number persisted
    await page.reload();
    const phoneInput = page.locator('[name="phone"]');
    await expect(phoneInput).toHaveValue('07700 900001');
  });

  test('agent can add qualifications', async ({ page }) => {
    await page.goto('/profile');

    // Add qualification
    await page.click('text=Add Qualification'); // Or find the add button
    await page.fill('[data-testid="qualification-input"]', 'ARLA Qualified');
    await page.click('button[type="submit"]');

    // Verify qualification appears
    await expect(page.getByText('ARLA Qualified')).toBeVisible();
  });

  test('agent can update bio', async ({ page }) => {
    await page.goto('/profile');

    const bioText = 'I am an experienced real estate agent with 10 years in the industry...';

    // Update bio in rich text editor (might be in iframe or contenteditable)
    // Tiptap typically uses contenteditable
    await page.locator('[contenteditable="true"]').first().fill(bioText);
    
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page.getByText(/profile updated/i)).toBeVisible();
  });

  test('agent can add social media links', async ({ page }) => {
    await page.goto('/profile');

    // Fill social media fields
    await page.fill('[name="social_media_links.facebook"]', 'https://facebook.com/testagent');
    await page.fill('[name="social_media_links.twitter"]', 'https://twitter.com/testagent');
    await page.fill('[name="social_media_links.linkedin"]', 'https://linkedin.com/in/testagent');

    await page.click('button[type="submit"]');

    // Verify success
    await expect(page.getByText(/profile updated/i)).toBeVisible();

    // Verify links persisted
    await page.reload();
    await expect(page.locator('[name="social_media_links.facebook"]')).toHaveValue('https://facebook.com/testagent');
  });

  test('agent cannot change first name or last name', async ({ page }) => {
    await page.goto('/profile');

    // First name and last name fields should be readonly or disabled
    const firstNameInput = page.locator('[name="first_name"]');
    const lastNameInput = page.locator('[name="last_name"]');

    await expect(firstNameInput).toBeDisabled();
    await expect(lastNameInput).toBeDisabled();
  });

  test('agent profile update triggers site rebuild', async ({ page }) => {
    await page.goto('/profile');

    // Update bio
    await page.locator('[contenteditable="true"]').first().fill('Updated bio text');
    await page.click('button[type="submit"]');

    // Verify success message mentions rebuild
    await expect(page.getByText(/site will be rebuilt|rebuild queued/i)).toBeVisible();
  });
});
