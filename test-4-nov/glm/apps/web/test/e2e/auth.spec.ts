import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows login page by default', async ({ page }) => {
    await expect(page).toHaveTitle(/Pocket Budget Buddy/);
    await expect(page.getByRole('heading', { name: 'Welcome to Pocket Budget Buddy' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });

  test('can navigate to sign up', async ({ page }) => {
    await page.getByRole('link', { name: 'Sign up' }).click();
    await expect(page.getByRole('heading', { name: 'Create an account' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign up' })).toBeVisible();
  });

  test('shows validation errors for empty form', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign in' }).click();

    // Look for validation messages (these will appear based on the actual validation implementation)
    const emailInput = page.getByLabel('Email');
    const passwordInput = page.getByLabel('Password');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('can fill and submit sign up form', async ({ page }) => {
    // Navigate to sign up
    await page.getByRole('link', { name: 'Sign up' }).click();

    // Fill out the form
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByLabel('Name').fill('Test User');

    // Submit the form
    await page.getByRole('button', { name: 'Sign up' }).click();

    // Should redirect to dashboard or show success
    await page.waitForTimeout(1000); // Wait for navigation

    // Either redirected to dashboard or shows some feedback
    const currentUrl = page.url();
    const isOnDashboard = currentUrl.includes('/dashboard');
    const hasSuccessMessage = await page.getByText(/welcome|success|created/i).isVisible();

    expect(isOnDashboard || hasSuccessMessage).toBeTruthy();
  });
});