import { test, expect } from '@playwright/test';

test.describe('Budget Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL('/');
  });

  test('should create accounts and budgets', async ({ page }) => {
    await page.goto('/accounts');

    await expect(page.getByText('Accounts')).toBeVisible();

    await page.getByRole('button', { name: 'Add Account' }).click();
    await page.getByLabel('Account Name').fill('Checking Account');
    await page.getByLabel('Account Type').selectOption('checking');
    await page.getByLabel('Initial Balance').fill('5000');
    await page.getByRole('button', { name: 'Create Account' }).click();

    await expect(page.getByText('Checking Account')).toBeVisible();
    await expect(page.getByText('$5000.00')).toBeVisible();

    await page.goto('/budgets');

    await expect(page.getByText('Budgets')).toBeVisible();

    await page.getByRole('button', { name: 'Add Category' }).click();
    await page.getByLabel('Category Name').fill('Groceries');
    await page.getByLabel('Color').fill('#3b82f6');
    await page.getByRole('button', { name: 'Create Category' }).click();

    await expect(page.getByText('Groceries')).toBeVisible();

    await page.getByRole('button', { name: 'Set Budget' }).click();
    await page.getByLabel('Amount').fill('500');
    await page.getByLabel('Month').fill('2024-01');
    await page.getByRole('button', { name: 'Set Budget' }).click();

    await expect(page.getByText('Allocated: $500.00')).toBeVisible();
  });

  test('should add transactions and track spending', async ({ page }) => {
    await page.goto('/transactions');

    await expect(page.getByText('Transactions')).toBeVisible();

    await page.getByRole('button', { name: 'Add Transaction' }).click();
    await page.getByLabel('Description').fill('Grocery Store');
    await page.getByLabel('Amount').fill('100.50');
    await page.getByLabel('Type').selectOption('expense');
    await page.getByLabel('Date').fill('2024-01-15');
    await page.getByRole('button', { name: 'Add Transaction' }).click();

    await expect(page.getByText('Grocery Store')).toBeVisible();
    await expect(page.getByText('-$100.50')).toBeVisible();

    await page.goto('/budgets');

    await expect(page.getByText('Spent: $100.50')).toBeVisible();
    await expect(page.getByText('Remaining: $399.50')).toBeVisible();
  });

  test('should view insights and reports', async ({ page }) => {
    await page.goto('/insights');

    await expect(page.getByText('Insights & Reports')).toBeVisible();

    await expect(page.getByText('Cashflow Trend')).toBeVisible();
    await expect(page.getByText('Spending by Category')).toBeVisible();
  });
});
