import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should signup, login, and access protected routes', async ({ page }) => {
    await page.goto('/signup');

    await expect(page.getByText('Sign Up')).toBeVisible();

    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign Up' }).click();

    await expect(page).toHaveURL('/');

    await page.goto('/budgets');
    await expect(page.getByText('Budgets')).toBeVisible();

    await page.goto('/transactions');
    await expect(page.getByText('Transactions')).toBeVisible();

    await page.goto('/goals');
    await expect(page.getByText('Savings Goals')).toBeVisible();
  });

  test('should toggle theme', async ({ page }) => {
    await page.goto('/');

    const themeToggle = page.getByRole('button', { name: 'Toggle theme' });
    await expect(themeToggle).toBeVisible();

    await themeToggle.click();

    await expect(page.locator('html')).toHaveClass(/dark/);

    await themeToggle.click();
    await expect(page.locator('html')).not.toHaveClass(/dark/);
  });
});
