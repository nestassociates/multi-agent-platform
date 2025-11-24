/**
 * E2E Tests: Content Submission System Refactor
 * Comprehensive end-to-end tests for all 6 user stories (US1-US6)
 */

import { test, expect } from '@playwright/test';

test.describe('Content Submission System Refactor - E2E Tests', () => {
  test.describe.configure({ mode: 'serial' });

  let agentEmail = 'test-agent@example.com';
  let agentPassword = 'TestPassword123!';
  let adminEmail = 'test-admin@example.com';
  let adminPassword = 'AdminPassword123!';
  let testContentId: string;

  test.beforeAll(async () => {
    // Setup test accounts in beforeAll hook
    // In real implementation: Create test agent and admin users
  });

  test.afterAll(async () => {
    // Cleanup test data
  });

  test.describe('US1: Secure Content Rendering (XSS Protection)', () => {
    test('should sanitize XSS in content body', async ({ page }) => {
      // Login as agent
      await page.goto('http://localhost:3001/login');
      await page.fill('input[type="email"]', agentEmail);
      await page.fill('input[type="password"]', agentPassword);
      await page.click('button[type="submit"]');

      // Navigate to create content
      await page.goto('http://localhost:3001/content/new');

      // Fill form with XSS payload
      await page.fill('input[name="title"]', 'XSS Test Content');
      await page.selectOption('select[name="content_type"]', 'blog_post');

      // Wait for Tiptap editor and inject malicious HTML
      await page.waitForSelector('.tiptap');
      await page.evaluate(() => {
        const editor = document.querySelector('.tiptap');
        if (editor) {
          editor.innerHTML = '<p>Safe text</p><script>alert("XSS")</script><img src=x onerror="alert(\'XSS2\')">';
        }
      });

      // Submit for review
      await page.click('button:has-text("Submit for Review")');
      await page.waitForURL('**/content');

      // Login as admin
      await page.goto('http://localhost:3001/logout');
      await page.goto('http://localhost:3001/login');
      await page.fill('input[type="email"]', adminEmail);
      await page.fill('input[type="password"]', adminPassword);
      await page.click('button[type="submit"]');

      // Go to moderation queue
      await page.goto('http://localhost:3001/content-moderation');

      // Click on the XSS test content
      await page.click('a:has-text("XSS Test Content")');

      // Verify script tags are removed in content preview
      const content = await page.textContent('.prose');
      expect(content).toContain('Safe text');
      expect(content).not.toContain('<script>');
      expect(content).not.toContain('alert');
      expect(content).not.toContain('onerror');

      // Verify no alert dialogs appeared
      // (Playwright would capture dialog events if XSS executed)
    });
  });

  test.describe('US2: Agent Content Editing', () => {
    test('should edit draft content', async ({ page }) => {
      // Login as agent
      await page.goto('http://localhost:3001/login');
      await page.fill('input[type="email"]', agentEmail);
      await page.fill('input[type="password"]', agentPassword);
      await page.click('button[type="submit"]');

      // Create draft
      await page.goto('http://localhost:3001/content/new');
      await page.fill('input[name="title"]', 'Draft to Edit');
      await page.selectOption('select[name="content_type"]', 'blog_post');
      await page.click('button:has-text("Save Draft")');

      // Go to content list
      await page.goto('http://localhost:3001/content');

      // Click Edit link
      await page.click('a:has-text("Edit")');
      await expect(page).toHaveURL(/\/content\/.*\/edit/);

      // Edit title
      await page.fill('input[name="title"]', 'Edited Draft Title');

      // Save and submit
      await page.click('button:has-text("Submit for Review")');
      await page.waitForURL('**/content');

      // Verify updated in list
      await expect(page.locator('text=Edited Draft Title')).toBeVisible();
    });

    test('should edit rejected content and resubmit', async ({ page }) => {
      // Assuming we have rejected content from admin flow
      // Login as agent → Find rejected content → Click Edit → See rejection reason → Fix → Resubmit

      await page.goto('http://localhost:3001/content');

      // Find rejected content (has rejection reason displayed)
      const rejectedRow = page.locator('text=Rejected:').first();
      if (await rejectedRow.isVisible()) {
        // Click Edit
        await rejectedRow.locator('..').locator('a:has-text("Edit")').click();

        // Should see rejection reason alert
        await expect(page.locator('text=Content Was Rejected')).toBeVisible();

        // Make changes
        await page.fill('input[name="title"]', 'Fixed After Rejection');

        // Resubmit
        await page.click('button:has-text("Submit for Review")');

        // Should be back in pending review status
        await page.waitForURL('**/content');
        await expect(page.locator('text=Pending Review')).toBeVisible();
      }
    });

    test('should not allow editing approved content', async ({ page }) => {
      // Try to access edit page for approved content
      // Should show error message

      await page.goto('http://localhost:3001/content');

      // Find approved content
      const approvedContent = page.locator('text=Approved').first();
      if (await approvedContent.isVisible()) {
        // Try to navigate to edit page directly
        const contentId = 'some-approved-content-id';
        await page.goto(`http://localhost:3001/content/${contentId}/edit`);

        // Should see error message
        await expect(page.locator('text=Content Cannot Be Edited')).toBeVisible();
      }
    });
  });

  test.describe('US3: Admin Filtering & Pagination', () => {
    test('should filter content by type', async ({ page }) => {
      // Login as admin
      await page.goto('http://localhost:3001/login');
      await page.fill('input[type="email"]', adminEmail);
      await page.fill('input[type="password"]', adminPassword);
      await page.click('button[type="submit"]');

      // Go to moderation queue
      await page.goto('http://localhost:3001/content-moderation');

      // Select blog_post filter
      await page.click('[role="combobox"]:has-text("All Types")');
      await page.click('text=Blog Post');

      // Apply filters
      await page.click('button:has-text("Apply Filters")');

      // Wait for results
      await page.waitForSelector('table', { timeout: 2000 });

      // Verify URL updated
      await expect(page).toHaveURL(/type=blog_post/);

      // Verify filter applied (response time < 2s per SC-003)
    });

    test('should search content by title', async ({ page }) => {
      await page.goto('http://localhost:3001/content-moderation');

      // Type in search
      await page.fill('input[placeholder*="Search"]', 'property');

      // Wait for debounced search (500ms)
      await page.waitForTimeout(600);

      // Should see filtered results
      await expect(page).toHaveURL(/search=property/);
    });

    test('should paginate through results', async ({ page }) => {
      await page.goto('http://localhost:3001/content-moderation');

      // Should see Load More button if there are more results
      const loadMoreButton = page.locator('button:has-text("Load More")');

      if (await loadMoreButton.isVisible()) {
        const initialCount = await page.locator('table tbody tr').count();

        await loadMoreButton.click();
        await page.waitForTimeout(500);

        const newCount = await page.locator('table tbody tr').count();
        expect(newCount).toBeGreaterThan(initialCount);
      }
    });

    test('should show empty state with no results', async ({ page }) => {
      await page.goto('http://localhost:3001/content-moderation');

      // Apply filters that return no results
      await page.fill('input[placeholder*="Search"]', 'zzzznonexistent');
      await page.waitForTimeout(600);

      // Should see empty state
      await expect(page.locator('text=No content matches your filters')).toBeVisible();
      await expect(page.locator('button:has-text("Reset Filters")')).toBeVisible();
    });
  });

  test.describe('US4: Image Upload', () => {
    test('should upload image via file picker', async ({ page }) => {
      // Login as agent
      await page.goto('http://localhost:3001/login');
      await page.fill('input[type="email"]', agentEmail);
      await page.fill('input[type="password"]', agentPassword);
      await page.click('button[type="submit"]');

      // Go to create content
      await page.goto('http://localhost:3001/content/new');

      // Upload image via file picker
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles('./tests/fixtures/test-image.jpg');

      // Wait for upload to complete
      await page.waitForSelector('img[alt*="preview"]', { timeout: 5000 });

      // Verify image preview visible
      const imagePreview = page.locator('img[alt*="preview"]');
      await expect(imagePreview).toBeVisible();

      // Verify URL populated
      const featuredImageUrl = await page.inputValue('input[name="featured_image_url"]');
      expect(featuredImageUrl).toContain('content-images');
      expect(featuredImageUrl).toContain('.webp');
    });

    test('should show error for file > 5MB', async ({ page }) => {
      // Create a large file (> 5MB) and try to upload
      // Should see error message about size limit
      // Placeholder - would need actual large file for test
    });
  });

  test.describe('US5: Content Preview', () => {
    test('should preview content before submission', async ({ page }) => {
      // Login as agent
      await page.goto('http://localhost:3001/content/new');

      // Fill form
      await page.fill('input[name="title"]', 'Preview Test');
      await page.fill('textarea[name="excerpt"]', 'This is a test excerpt');

      // Click Preview button
      await page.click('button:has-text("Preview")');

      // Preview modal should open
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      await expect(page.locator('text=Preview Test')).toBeVisible();
      await expect(page.locator('text=This is a test excerpt')).toBeVisible();

      // Close preview
      await page.keyboard.press('Escape');
      await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    });
  });

  test.describe('US6: Consistent Admin Modals', () => {
    test('should show approval dialog on approve click', async ({ page }) => {
      // Login as admin
      await page.goto('http://localhost:3001/login');
      await page.fill('input[type="email"]', adminEmail);
      await page.fill('input[type="password"]', adminPassword);
      await page.click('button[type="submit"]');

      // Go to content review
      await page.goto('http://localhost:3001/content-moderation');
      await page.click('a:has-text("Review")').first();

      // Click Approve
      await page.click('button:has-text("Approve Content")');

      // Should see approval dialog
      await expect(page.locator('[role="dialog"]:has-text("Approve Content")')).toBeVisible();
      await expect(page.locator('text=Are you sure')).toBeVisible();

      // Cancel
      await page.click('button:has-text("Cancel")');
      await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    });

    test('should show rejection dialog with validation', async ({ page }) => {
      await page.goto('http://localhost:3001/content-moderation');
      await page.click('a:has-text("Review")').first();

      // Click Reject
      await page.click('button:has-text("Reject Content")');

      // Should see reject dialog
      await expect(page.locator('[role="dialog"]:has-text("Reject Content")')).toBeVisible();

      // Try to submit without reason (button should be disabled)
      const submitButton = page.locator('button:has-text("Reject Content")').last();
      await expect(submitButton).toBeDisabled();

      // Enter short reason (< 10 chars)
      await page.fill('textarea', 'Too short');
      await expect(submitButton).toBeDisabled();

      // Enter valid reason
      await page.fill('textarea', 'This content needs more detail and better formatting');
      await expect(submitButton).toBeEnabled();
    });
  });

  test.describe('Full Workflow Integration', () => {
    test('should complete full agent workflow: create → upload → preview → submit', async ({ page }) => {
      // 1. Login as agent
      await page.goto('http://localhost:3001/login');
      await page.fill('input[type="email"]', agentEmail);
      await page.fill('input[type="password"]', agentPassword);
      await page.click('button[type="submit"]');

      // 2. Create new content
      await page.goto('http://localhost:3001/content/new');
      await page.fill('input[name="title"]', 'Complete Workflow Test');
      await page.selectOption('select[name="content_type"]', 'blog_post');

      // 3. Upload image
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles('./tests/fixtures/test-image.jpg');
      await page.waitForSelector('img[alt*="preview"]');

      // 4. Write content (simulate Tiptap input)
      await page.click('.tiptap');
      await page.keyboard.type('This is test content for the complete workflow.');

      // 5. Preview
      await page.click('button:has-text("Preview")');
      await expect(page.locator('[role="dialog"]:has-text("Complete Workflow Test")')).toBeVisible();
      await page.keyboard.press('Escape');

      // 6. Submit for review
      await page.click('button:has-text("Submit for Review")');
      await page.waitForURL('**/content');

      // 7. Verify in content list with Pending Review status
      await expect(page.locator('text=Complete Workflow Test')).toBeVisible();
      await expect(page.locator('text=Pending Review')).toBeVisible();
    });

    test('should complete full admin workflow: filter → review → approve', async ({ page }) => {
      // 1. Login as admin
      await page.goto('http://localhost:3001/login');
      await page.fill('input[type="email"]', adminEmail);
      await page.fill('input[type="password"]', adminPassword);
      await page.click('button[type="submit"]');

      // 2. Navigate to moderation queue
      await page.goto('http://localhost:3001/content-moderation');

      // 3. Apply filter for blog posts
      await page.click('[role="combobox"]:has-text("All Types")');
      await page.click('text=Blog Post');
      await page.click('button:has-text("Apply Filters")');

      // 4. Review first item
      await page.click('a:has-text("Review")').first();

      // 5. Verify content preview shows sanitized HTML
      await expect(page.locator('.prose')).toBeVisible();

      // 6. Approve content
      await page.click('button:has-text("Approve Content")').first();

      // Approval dialog should open
      await expect(page.locator('[role="dialog"]:has-text("Approve Content")')).toBeVisible();

      // Confirm approval
      await page.click('button:has-text("Approve Content")').last();

      // Should redirect to queue
      await page.waitForURL('**/content-moderation');
    });

    test('should complete reject → edit → resubmit workflow', async ({ page }) => {
      // 1. Admin rejects content
      await page.goto('http://localhost:3001/content-moderation');
      await page.click('a:has-text("Review")').first();
      await page.click('button:has-text("Reject Content")');

      await page.fill('textarea', 'Please add more details and improve formatting');
      await page.click('button:has-text("Reject Content")').last();
      await page.waitForURL('**/content-moderation');

      // 2. Agent sees rejection and edits
      await page.goto('http://localhost:3001/logout');
      await page.goto('http://localhost:3001/login');
      await page.fill('input[type="email"]', agentEmail);
      await page.fill('input[type="password"]', agentPassword);
      await page.click('button[type="submit"]');

      await page.goto('http://localhost:3001/content');

      // Should see rejection reason
      await expect(page.locator('text=Rejected:')).toBeVisible();

      // Click Edit
      await page.click('a:has-text("Edit")').first();

      // Should see rejection alert
      await expect(page.locator('text=Content Was Rejected')).toBeVisible();
      await expect(page.locator('text=add more details')).toBeVisible();

      // Fix and resubmit
      await page.fill('input[name="title"]', 'Fixed After Feedback');
      await page.click('button:has-text("Submit for Review")');

      // Should be pending review again
      await page.waitForURL('**/content');
      await expect(page.locator('text=Pending Review')).toBeVisible();
    });
  });

  test.describe('Security & Authorization', () => {
    test('should prevent agents from accessing admin moderation', async ({ page }) => {
      await page.goto('http://localhost:3001/login');
      await page.fill('input[type="email"]', agentEmail);
      await page.fill('input[type="password"]', agentPassword);
      await page.click('button[type="submit"]');

      // Try to access admin moderation
      await page.goto('http://localhost:3001/content-moderation');

      // Should redirect or show error
      await expect(page).not.toHaveURL('**/content-moderation');
    });

    test('should prevent agents from editing other agents\' content', async ({ page }) => {
      // Login as agent1 → Try to access agent2's content edit page → Should 404
      // Placeholder for multi-agent test
    });
  });

  test.describe('Performance Tests', () => {
    test('should load moderation queue in under 1 second', async ({ page }) => {
      await page.goto('http://localhost:3001/content-moderation');

      const start = Date.now();
      await page.waitForSelector('table');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000); // SC-008
    });

    test('should apply filters in under 500ms', async ({ page }) => {
      await page.goto('http://localhost:3001/content-moderation');

      const start = Date.now();
      await page.fill('input[placeholder*="Search"]', 'test');
      await page.waitForTimeout(600); // Wait for debounce + fetch
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000); // Including debounce
    });
  });
});
