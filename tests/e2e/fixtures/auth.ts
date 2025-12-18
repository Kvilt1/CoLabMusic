import { test as base, expect, Page } from '@playwright/test';

// Test user credentials - these should be environment variables in a real setup
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'testpassword123',
};

// Extended test fixture with authentication helpers
export const test = base.extend<{
  authenticatedPage: Page;
  loginPage: Page;
}>({
  // Page that's already logged in
  authenticatedPage: async ({ page }, use) => {
    await loginViaUI(page, TEST_USER.email, TEST_USER.password);
    await use(page);
  },
  
  // Page at login screen (not authenticated)
  loginPage: async ({ page }, use) => {
    await page.goto('/');
    await expect(page.getByText('Welcome Back')).toBeVisible();
    await use(page);
  },
});

// Login via the UI (for tests that need to verify login flow)
export async function loginViaUI(page: Page, email: string, password: string) {
  await page.goto('/');
  
  // Wait for login page to load
  await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
  
  // Fill in credentials - Supabase Auth UI uses specific input names
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  
  // Click sign in button
  await page.getByRole('button', { name: /sign in/i }).click();
  
  // Wait for navigation to main app (sidebar should be visible)
  await expect(page.getByText('Your Vaults')).toBeVisible({ timeout: 15000 });
  
  // Extra wait for UI to fully load
  await page.waitForTimeout(500);
}

// Logout helper
export async function logout(page: Page) {
  // Click on user menu (avatar with chevron)
  await page.locator('button').filter({ has: page.locator('svg.lucide-chevron-down') }).click();
  
  // Click logout option
  await page.getByRole('button', { name: /log out/i }).click();
  
  // Verify we're back at login screen
  await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
}

// Helper to check if page is authenticated
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    await expect(page.getByText('Your Vaults')).toBeVisible({ timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

// Re-export expect for convenience
export { expect };

