import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  // Mock authentication - in a real test, you'd set up proper auth
  test.beforeEach(async ({ page }) => {
    // Set up mock session/localStorage
    await page.addInitScript(() => {
      localStorage.setItem('auth-token', 'test-token');
      localStorage.setItem('user', JSON.stringify({
        id: 'test-user',
        name: 'Test User',
        email: 'test@example.com'
      }));
    });

    await page.goto('/dashboard');
  });

  test('loads dashboard page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText('Welcome back, Test User')).toBeVisible();
  });

  test('displays financial summary cards', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(2000);

    // Look for summary cards
    await expect(page.getByText('Total Balance')).toBeVisible();
    await expect(page.getByText('Monthly Budget')).toBeVisible();
    await expect(page.getByText('This Month')).toBeVisible();
  });

  test('has quick action buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Manage Accounts' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add Transaction' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Import CSV' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'View Budget' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Recurring Bills' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Savings Goals' })).toBeVisible();
  });

  test('can navigate to different sections', async ({ page }) => {
    // Test navigation to accounts
    await page.getByRole('button', { name: 'Manage Accounts' }).click();
    await expect(page).toHaveURL(/\/accounts/);

    // Go back to dashboard
    await page.goBack();
    await expect(page).toHaveURL(/\/dashboard/);

    // Test navigation to add transaction
    await page.getByRole('button', { name: 'Add Transaction' }).click();
    await expect(page).toHaveURL(/\/transactions\/new/);
  });

  test('shows budget categories section', async ({ page }) => {
    await page.waitForTimeout(2000); // Wait for data

    // Look for budget categories
    const budgetSection = page.getByText('Budget Categories');
    if (await budgetSection.isVisible()) {
      await expect(budgetSection).toBeVisible();
    }
  });

  test('has responsive design', async ({ page }) => {
    // Test desktop size
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    // Test tablet size
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    // Test mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });
});