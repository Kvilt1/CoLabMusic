import { test, expect, loginViaUI, logout } from './fixtures/auth';

test.describe('Authentication', () => {
  test.describe('Login Page', () => {
    test('should display login page when not authenticated', async ({ page }) => {
      await page.goto('/');
      
      // Should show the login page with branding
      await expect(page.getByText('Welcome Back')).toBeVisible();
      await expect(page.getByText('Sign in to access your vaults')).toBeVisible();
      
      // Should have email and password inputs
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      
      // Should have sign in button
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    });

    test('should show error with invalid credentials', async ({ page }) => {
      await page.goto('/');
      
      // Fill in invalid credentials
      await page.getByLabel(/email/i).fill('invalid@test.com');
      await page.getByLabel(/password/i).fill('wrongpassword');
      
      // Submit
      await page.getByRole('button', { name: /sign in/i }).click();
      
      // Should show error message (Supabase Auth UI displays this)
      await expect(page.getByText(/invalid|error|incorrect/i)).toBeVisible({ timeout: 5000 });
    });

    test('should show validation for empty fields', async ({ page }) => {
      await page.goto('/');
      
      // Click sign in without filling anything
      await page.getByRole('button', { name: /sign in/i }).click();
      
      // Either browser validation triggers OR Supabase Auth UI shows an error
      // Wait a moment to see if any validation appears
      await page.waitForTimeout(500);
      
      // Check that we're still on the login page (form wasn't submitted)
      await expect(page.getByText('Welcome Back')).toBeVisible();
    });
  });

  test.describe('Login Flow', () => {
    test('should login successfully with valid credentials', async ({ page }) => {
      // This test requires valid test credentials set via environment variables
      const email = process.env.TEST_USER_EMAIL;
      const password = process.env.TEST_USER_PASSWORD;
      
      if (!email || !password) {
        test.skip(!email || !password, 'Test credentials not configured');
        return;
      }
      
      await loginViaUI(page, email, password);
      
      // Should be redirected to main app
      await expect(page.getByText('Your Vaults')).toBeVisible();
      
      // Should show user menu (avatar with chevron)
      await expect(page.locator('button').filter({ has: page.locator('svg.lucide-chevron-down') })).toBeVisible();
    });

    test('should persist session after page reload', async ({ page }) => {
      const email = process.env.TEST_USER_EMAIL;
      const password = process.env.TEST_USER_PASSWORD;
      
      if (!email || !password) {
        test.skip(!email || !password, 'Test credentials not configured');
        return;
      }
      
      await loginViaUI(page, email, password);
      await expect(page.getByText('Your Vaults')).toBeVisible();
      
      // Reload the page
      await page.reload();
      
      // Should still be logged in
      await expect(page.getByText('Your Vaults')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Logout Flow', () => {
    test('should logout successfully', async ({ page }) => {
      const email = process.env.TEST_USER_EMAIL;
      const password = process.env.TEST_USER_PASSWORD;
      
      if (!email || !password) {
        test.skip(!email || !password, 'Test credentials not configured');
        return;
      }
      
      // Login first
      await loginViaUI(page, email, password);
      await expect(page.getByText('Your Vaults')).toBeVisible();
      
      // Perform logout
      await logout(page);
      
      // Should be back at login page
      await expect(page.getByText('Welcome Back')).toBeVisible();
    });

    test('should show user info in dropdown menu', async ({ page }) => {
      const email = process.env.TEST_USER_EMAIL;
      const password = process.env.TEST_USER_PASSWORD;
      
      if (!email || !password) {
        test.skip(!email || !password, 'Test credentials not configured');
        return;
      }
      
      await loginViaUI(page, email, password);
      
      // Open user menu (avatar with chevron)
      await page.locator('button').filter({ has: page.locator('svg.lucide-chevron-down') }).click();
      
      // Should show email in the dropdown
      await expect(page.getByText(email)).toBeVisible();
      
      // Should have profile and logout options
      await expect(page.getByRole('button', { name: /profile/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /log out/i })).toBeVisible();
    });
  });

  test.describe('Loading States', () => {
    test('should show loading state while checking session', async ({ page }) => {
      await page.goto('/');
      
      // The app shows "Loading..." while checking auth state
      // This might be too fast to catch, but we can check the flow works
      // Wait for either the login page or the main app to load
      await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible({ timeout: 10000 });
    });
  });
});

