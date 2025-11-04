import { test, expect } from '@playwright/test';

test.describe('Partner Collaboration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL('/');
  });

  test('should invite partner to shared budget', async ({ page }) => {
    await page.goto('/settings');

    await expect(page.getByText('Settings')).toBeVisible();

    await page.getByRole('button', { name: 'Invite Partner' }).click();
    await page.getByLabel('Email').fill('partner@example.com');
    await page.getByRole('button', { name: 'Send Invitation' }).click();

    await expect(page.getByText('Invitation sent')).toBeVisible();
    await expect(page.getByText('partner@example.com')).toBeVisible();
  });

  test('should view shared budget dashboard', async ({ page }) => {
    await page.goto('/budgets');

    await expect(page.getByText('Budgets')).toBeVisible();
    await expect(page.getByText('Shared Budget')).toBeVisible();

    await page.getByText('You & Partner').click();

    await expect(page.getByText('Combined Spending')).toBeVisible();
    await expect(page.getByText('Total Income:')).toBeVisible();
    await expect(page.getByText('Total Expenses:')).toBeVisible();
  });

  test('should see audit log for shared actions', async ({ page }) => {
    await page.goto('/audit');

    await expect(page.getByText('Audit Log')).toBeVisible();

    await expect(page.getByText('Transaction added by Partner')).toBeVisible();
    await expect(page.getByText('Budget updated by You')).toBeVisible();

    await expect(page.getByText('January 15, 2024')).toBeVisible();
  });
});
