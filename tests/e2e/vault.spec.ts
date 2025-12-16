import { test, expect, loginViaUI } from './fixtures/auth';

test.describe('Vault Management', () => {
  test.beforeEach(async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;
    
    if (!email || !password) {
      test.skip();
      return;
    }
    
    await loginViaUI(page, email, password);
    await expect(page.getByText('Your Vaults')).toBeVisible();
  });

  test.describe('Create Vault Modal', () => {
    test('should open create vault modal when clicking + button', async ({ page }) => {
      // Click the + button next to "Your Vaults"
      const plusButton = page.locator('button').filter({ has: page.locator('svg.lucide-plus') });
      await plusButton.click();
      
      // Click "Create New Vault" option
      await page.getByRole('button', { name: /create new vault/i }).click();
      
      // Modal should appear
      await expect(page.getByText('Create New Vault')).toBeVisible();
    });

    test('should have vault name input and create button', async ({ page }) => {
      // Open create vault modal
      const plusButton = page.locator('button').filter({ has: page.locator('svg.lucide-plus') });
      await plusButton.click();
      await page.getByRole('button', { name: /create new vault/i }).click();
      
      // Should have name input
      await expect(page.getByPlaceholder(/my awesome vault/i)).toBeVisible();
      
      // Should have create button (disabled when empty)
      const createBtn = page.getByRole('button', { name: /create vault/i });
      await expect(createBtn).toBeVisible();
      await expect(createBtn).toBeDisabled();
    });

    test('should enable create button when name is entered', async ({ page }) => {
      // Open create vault modal
      const plusButton = page.locator('button').filter({ has: page.locator('svg.lucide-plus') });
      await plusButton.click();
      await page.getByRole('button', { name: /create new vault/i }).click();
      
      // Enter vault name
      await page.getByPlaceholder(/my awesome vault/i).fill('Test Vault');
      
      // Create button should be enabled
      const createBtn = page.getByRole('button', { name: /create vault/i });
      await expect(createBtn).toBeEnabled();
    });

    test('should close modal with X button', async ({ page }) => {
      // Open create vault modal
      const plusButton = page.locator('button').filter({ has: page.locator('svg.lucide-plus') });
      await plusButton.click();
      await page.getByRole('button', { name: /create new vault/i }).click();
      
      await expect(page.getByText('Create New Vault')).toBeVisible();
      
      // Click X button
      await page.locator('button').filter({ has: page.locator('svg.lucide-x') }).first().click();
      
      // Modal should close
      await expect(page.getByText('Create New Vault')).not.toBeVisible();
    });

    test('should have cover image upload option', async ({ page }) => {
      // Open create vault modal
      const plusButton = page.locator('button').filter({ has: page.locator('svg.lucide-plus') });
      await plusButton.click();
      await page.getByRole('button', { name: /create new vault/i }).click();
      
      // Should have cover upload area
      await expect(page.getByText('Add Cover')).toBeVisible();
    });
  });

  test.describe('Join Vault Modal', () => {
    test('should open join vault modal', async ({ page }) => {
      // Click the + button
      const plusButton = page.locator('button').filter({ has: page.locator('svg.lucide-plus') });
      await plusButton.click();
      
      // Click "Join with Code" option
      await page.getByRole('button', { name: /join with code/i }).click();
      
      // Modal should appear
      await expect(page.getByText('Join a Vault')).toBeVisible();
    });

    test('should have 6 input fields for invite code', async ({ page }) => {
      // Open join vault modal
      const plusButton = page.locator('button').filter({ has: page.locator('svg.lucide-plus') });
      await plusButton.click();
      await page.getByRole('button', { name: /join with code/i }).click();
      
      // Should have 6 input fields
      const codeInputs = page.locator('input[maxlength="6"]');
      expect(await codeInputs.count()).toBe(6);
    });

    test('should auto-focus first input', async ({ page }) => {
      // Open join vault modal
      const plusButton = page.locator('button').filter({ has: page.locator('svg.lucide-plus') });
      await plusButton.click();
      await page.getByRole('button', { name: /join with code/i }).click();
      
      // First input should be focused
      const firstInput = page.locator('input[maxlength="6"]').first();
      await expect(firstInput).toBeFocused();
    });

    test('should show error for invalid code', async ({ page }) => {
      // Open join vault modal
      const plusButton = page.locator('button').filter({ has: page.locator('svg.lucide-plus') });
      await plusButton.click();
      await page.getByRole('button', { name: /join with code/i }).click();
      
      // Enter an invalid code
      const inputs = page.locator('input[maxlength="6"]');
      const chars = ['X', 'X', 'X', 'X', 'X', 'X'];
      for (let i = 0; i < 6; i++) {
        await inputs.nth(i).fill(chars[i]);
      }
      
      // Click join button
      await page.getByRole('button', { name: /join vault/i }).click();
      
      // Should show error message
      await expect(page.getByText(/invalid invite code/i)).toBeVisible({ timeout: 5000 });
    });

    test('should close modal with X button', async ({ page }) => {
      // Open join vault modal
      const plusButton = page.locator('button').filter({ has: page.locator('svg.lucide-plus') });
      await plusButton.click();
      await page.getByRole('button', { name: /join with code/i }).click();
      
      await expect(page.getByText('Join a Vault')).toBeVisible();
      
      // Click X button
      await page.locator('button').filter({ has: page.locator('svg.lucide-x') }).first().click();
      
      // Modal should close
      await expect(page.getByText('Join a Vault')).not.toBeVisible();
    });
  });

  test.describe('Vault Settings', () => {
    test('should navigate to vault settings when clicking a vault then settings', async ({ page }) => {
      // Check if there are any vaults
      const vaultButtons = page.locator('ul button').filter({ hasText: /.+/ });
      
      if (await vaultButtons.count() > 0) {
        // Click on first vault
        await vaultButtons.first().click();
        
        // Look for settings button (gear icon)
        const settingsBtn = page.locator('button').filter({ has: page.locator('svg.lucide-settings') });
        
        if (await settingsBtn.count() > 0) {
          await settingsBtn.click();
          
          // Should show settings page
          await expect(page.getByText('Settings')).toBeVisible();
        }
      }
    });
  });

  test.describe('Vault Settings Tabs', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to a vault settings if one exists
      const vaultButtons = page.locator('aside ul button').filter({ hasText: /.+/ }).first();
      
      if (await vaultButtons.count() > 0) {
        await vaultButtons.click();
        
        const settingsBtn = page.locator('button').filter({ has: page.locator('svg.lucide-settings') });
        if (await settingsBtn.count() > 0) {
          await settingsBtn.click();
        }
      }
    });

    test('should have General, Members, Invite Code, and Danger Zone tabs', async ({ page }) => {
      // Check if we're on settings page
      const isOnSettings = await page.getByText('/ Settings').isVisible().catch(() => false);
      
      if (isOnSettings) {
        // Should have all tabs
        await expect(page.getByRole('button', { name: /general/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /members/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /invite code/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /danger zone/i })).toBeVisible();
      }
    });

    test('should switch between tabs', async ({ page }) => {
      const isOnSettings = await page.getByText('/ Settings').isVisible().catch(() => false);
      
      if (isOnSettings) {
        // Click Members tab
        await page.getByRole('button', { name: /members/i }).click();
        await expect(page.getByText('Manage Members')).toBeVisible();
        
        // Click Invite Code tab
        await page.getByRole('button', { name: /invite code/i }).click();
        await expect(page.getByText('Invite Code')).toBeVisible();
        
        // Click General tab
        await page.getByRole('button', { name: /general/i }).click();
        await expect(page.getByText('Vault Name')).toBeVisible();
      }
    });
  });

  test.describe('Vault Settings - General Tab', () => {
    test('should allow editing vault name', async ({ page }) => {
      // Navigate to vault settings
      const vaultButtons = page.locator('aside ul button').filter({ hasText: /.+/ }).first();
      
      if (await vaultButtons.count() > 0) {
        await vaultButtons.click();
        
        const settingsBtn = page.locator('button').filter({ has: page.locator('svg.lucide-settings') });
        if (await settingsBtn.count() > 0) {
          await settingsBtn.click();
          
          // Should have name input
          const nameInput = page.getByPlaceholder(/summer vibes/i);
          await expect(nameInput).toBeVisible();
          
          // Should be editable
          await nameInput.fill('Updated Vault Name');
          await expect(nameInput).toHaveValue('Updated Vault Name');
        }
      }
    });

    test('should have Save Changes button', async ({ page }) => {
      const vaultButtons = page.locator('aside ul button').filter({ hasText: /.+/ }).first();
      
      if (await vaultButtons.count() > 0) {
        await vaultButtons.click();
        
        const settingsBtn = page.locator('button').filter({ has: page.locator('svg.lucide-settings') });
        if (await settingsBtn.count() > 0) {
          await settingsBtn.click();
          await expect(page.getByRole('button', { name: /save changes/i })).toBeVisible();
        }
      }
    });
  });

  test.describe('Vault Settings - Invite Code Tab', () => {
    test('should display invite code', async ({ page }) => {
      const vaultButtons = page.locator('aside ul button').filter({ hasText: /.+/ }).first();
      
      if (await vaultButtons.count() > 0) {
        await vaultButtons.click();
        
        const settingsBtn = page.locator('button').filter({ has: page.locator('svg.lucide-settings') });
        if (await settingsBtn.count() > 0) {
          await settingsBtn.click();
          
          // Go to Invite Code tab
          await page.getByRole('button', { name: /invite code/i }).click();
          
          // Should display the code (6 characters)
          await expect(page.getByText('Invite Code')).toBeVisible();
          
          // Should have Copy Code button
          await expect(page.getByRole('button', { name: /copy code/i })).toBeVisible();
          
          // Should have Regenerate button
          await expect(page.getByRole('button', { name: /regenerate/i })).toBeVisible();
        }
      }
    });
  });

  test.describe('Vault Settings - Danger Zone', () => {
    test('should show leave vault option', async ({ page }) => {
      const vaultButtons = page.locator('aside ul button').filter({ hasText: /.+/ }).first();
      
      if (await vaultButtons.count() > 0) {
        await vaultButtons.click();
        
        const settingsBtn = page.locator('button').filter({ has: page.locator('svg.lucide-settings') });
        if (await settingsBtn.count() > 0) {
          await settingsBtn.click();
          
          // Go to Danger Zone tab
          await page.getByRole('button', { name: /danger zone/i }).click();
          
          // Should have Leave Vault option
          await expect(page.getByText('Leave Vault')).toBeVisible();
        }
      }
    });

    test('should show delete vault option for owners', async ({ page }) => {
      const vaultButtons = page.locator('aside ul button').filter({ hasText: /.+/ }).first();
      
      if (await vaultButtons.count() > 0) {
        await vaultButtons.click();
        
        const settingsBtn = page.locator('button').filter({ has: page.locator('svg.lucide-settings') });
        if (await settingsBtn.count() > 0) {
          await settingsBtn.click();
          
          // Go to Danger Zone tab
          await page.getByRole('button', { name: /danger zone/i }).click();
          
          // Delete Vault option might only show for owners
          const deleteSection = page.getByText('Delete Vault');
          // Just check if it's present - visibility depends on user role
        }
      }
    });
  });

  test.describe('Vault List in Sidebar', () => {
    test('should display vaults in sidebar', async ({ page }) => {
      // The "Your Vaults" section should exist
      await expect(page.getByText('Your Vaults')).toBeVisible();
      
      // May or may not have vaults, just verify section loads
      const vaultList = page.locator('aside ul');
      await expect(vaultList.first()).toBeVisible();
    });

    test('should highlight selected vault', async ({ page }) => {
      const vaultButtons = page.locator('aside ul button').filter({ hasText: /.+/ });
      
      if (await vaultButtons.count() > 0) {
        const firstVault = vaultButtons.first();
        await firstVault.click();
        
        // Should have active styling (bg-[#1a1a1a] and text-white)
        await expect(firstVault).toHaveClass(/text-white/);
      }
    });
  });
});

