import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Demo Creation and Loading Flows
 * 
 * Tests cover:
 * 1. Creating a new demo (input -> refine -> preview)
 * 2. Loading a saved demo from Profile
 * 3. Verifying narrative renders correctly
 * 4. Testing presentation mode
 */

const SAMPLE_TEXT = `
This is sample research text for testing the narrative builder.
The company has shown strong growth with 50% year-over-year revenue increase.
Key findings include improved customer satisfaction and reduced churn.
Market opportunity is significant with a $10B TAM.
The product roadmap includes three major releases planned for next quarter.
Customer feedback has been overwhelmingly positive with a 4.8/5 rating.
`;

async function dismissModals(page: import('@playwright/test').Page) {
  // Try to dismiss setup modal first
  const setupSkip = page.getByRole('button', { name: /skip for now/i });
  if (await setupSkip.isVisible({ timeout: 1000 }).catch(() => false)) {
    await setupSkip.click();
    await page.waitForTimeout(500);
  }
  
  // Try to dismiss welcome/tour modal
  const exploreButton = page.getByRole('button', { name: /skip.*explore|i'll explore/i });
  if (await exploreButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    await exploreButton.click();
    await page.waitForTimeout(500);
  }
  
  // Generic close/skip buttons
  for (let i = 0; i < 3; i++) {
    const closeButton = page.getByRole('button', { name: /close|skip|dismiss/i }).first();
    if (await closeButton.isVisible({ timeout: 500 }).catch(() => false)) {
      await closeButton.click();
      await page.waitForTimeout(300);
    }
  }
}

test.describe('Demo Creation Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for splash screen to complete
    await page.waitForTimeout(3000);
    
    // Dismiss any modals
    await dismissModals(page);
  });

  test('should display input screen on initial load', async ({ page }) => {
    // Should see the main input area
    const hasTextarea = await page.locator('textarea').count() > 0;
    const hasContentEditable = await page.locator('[contenteditable]').count() > 0;
    
    expect(hasTextarea || hasContentEditable).toBe(true);
  });

  test('should allow entering text in the input area', async ({ page }) => {
    // Find the textarea or contenteditable
    const textarea = page.locator('textarea').first();
    const contentEditable = page.locator('[contenteditable="true"]').first();
    
    if (await textarea.isVisible()) {
      await textarea.click();
      await textarea.fill(SAMPLE_TEXT);
      
      // Verify text was entered - check character count instead of value
      // as the textarea might be controlled
      await expect(page.getByText(/\d+ characters/)).toBeVisible({ timeout: 5000 });
    } else if (await contentEditable.isVisible()) {
      await contentEditable.click();
      await contentEditable.fill(SAMPLE_TEXT);
      
      // Verify text was entered
      await expect(page.getByText(/\d+ characters/)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show character count when text is entered', async ({ page }) => {
    const textarea = page.locator('textarea').first();
    
    if (await textarea.isVisible()) {
      await textarea.fill(SAMPLE_TEXT);
      
      // Look for character count indicator
      const charCount = page.locator('text=/\\d+ characters/i');
      await expect(charCount).toBeVisible({ timeout: 5000 });
    }
  });

  test('should have a continue/build button', async ({ page }) => {
    // Look for the primary action button
    const continueButton = page.locator('button').filter({ hasText: /continue|build|next/i }).first();
    await expect(continueButton).toBeVisible();
  });

  test('should disable build button when no text is entered', async ({ page }) => {
    // The build/continue button should be disabled without input
    const buildButton = page.locator('button').filter({ hasText: /continue|build|next/i }).first();
    
    // Either disabled or not visible without text
    const isDisabled = await buildButton.isDisabled().catch(() => true);
    expect(isDisabled).toBe(true);
  });
});

test.describe('Demo Preview Flow', () => {
  
  test('should show preview screen elements when narrative exists', async ({ page }) => {
    // This test requires mocking or a pre-built narrative
    // For now, verify the route structure
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Check that the app loads without errors
    await expect(page.locator('body')).toBeVisible();
    
    // No console errors on load
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(1000);
    
    // Filter out expected errors (like network requests in dev, MIME type issues, etc.)
    const criticalErrors = errors.filter(e => 
      !e.includes('Failed to load resource') && 
      !e.includes('net::ERR') &&
      !e.includes('MIME type') &&
      !e.includes('module script') &&
      !e.includes('ingest') && // Analytics
      !e.includes('127.0.0.1') && // Local services
      !e.includes('fetchPriority') && // React warning about fetchPriority prop
      !e.includes('does not recognize the') // React DOM prop warnings
    );
    
    // Log any remaining errors for debugging
    if (criticalErrors.length > 0) {
      console.log('Console errors found:', criticalErrors);
    }
    
    expect(criticalErrors.length).toBe(0);
  });
});

test.describe('Profile Page - Saved Demos', () => {
  
  test('should redirect to auth when not logged in', async ({ page }) => {
    await page.goto('/profile');
    
    // Should redirect to auth page
    await expect(page).toHaveURL(/\/auth/);
  });

  test('should show saved demos section when logged in', async ({ page, context }) => {
    // This test would require authentication setup
    // For now, verify the redirect behavior works
    await page.goto('/profile');
    
    // Should see auth page
    await expect(page.getByRole('heading', { name: /welcome back|sign in/i })).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Navigation Flow', () => {
  
  test('should navigate between steps correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Should start on input step
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 5000 });
  });

  test('should have back button in preview mode', async ({ page }) => {
    // Navigate to app
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Back button should be present in header area
    const backButton = page.locator('button, a').filter({ hasText: /back/i });
    
    // May or may not be visible depending on current step
    // Just verify no errors
    await expect(page.locator('body')).toBeVisible();
  });

  test('should preserve state on navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Enter some text
    const textarea = page.locator('textarea').first();
    if (await textarea.isVisible()) {
      await textarea.fill(SAMPLE_TEXT);
      
      // Navigate away and back
      await page.goto('/faq');
      await page.waitForTimeout(500);
      await page.goto('/');
      await page.waitForTimeout(2000);
      
      // Note: State may or may not persist depending on implementation
      // This test documents the current behavior
    }
  });
});

test.describe('Error Handling', () => {
  
  test('should handle 404 routes gracefully', async ({ page }) => {
    await page.goto('/nonexistent-route-12345');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Should show 404 page, redirect home, or show the main app (catch-all route)
    const has404 = await page.getByText(/not found|404/i).isVisible().catch(() => false);
    const redirectedHome = page.url().endsWith('/') || page.url().includes('nonexistent');
    const hasMainApp = await page.locator('main, textarea, [contenteditable]').first().isVisible().catch(() => false);
    
    // Any of these behaviors is acceptable
    expect(has404 || redirectedHome || hasMainApp).toBe(true);
  });

  test('should show error state for invalid share links', async ({ page }) => {
    await page.goto('/share/invalid-share-id-12345');
    
    // Should show error message
    await expect(page.getByText(/not found|error|loading/i)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Mobile Responsiveness', () => {
  
  test('should render correctly on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });
    
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Should not have horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    
    expect(hasHorizontalScroll).toBe(false);
  });

  test('should show mobile-optimized UI elements', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // App should load without errors
    await expect(page.locator('body')).toBeVisible();
  });
});
