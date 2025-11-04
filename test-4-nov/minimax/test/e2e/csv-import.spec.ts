import { test, expect } from '@playwright/test';
import fs from 'fs';

test.describe('CSV Import Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL('/');
  });

  test('should import transactions from CSV', async ({ page }) => {
    const csvContent = `date,description,amount,type
2024-01-15,Groceries,100.50,expense
2024-01-16,Salary,5000.00,income
2024-01-17,Coffee,5.00,expense`;

    const tempFile = '/tmp/test-transactions.csv';
    fs.writeFileSync(tempFile, csvContent);

    await page.goto('/transactions');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(tempFile);

    await expect(page.getByText('Column Mapping')).toBeVisible();

    await page.getByLabel('Date Column').selectOption('date');
    await page.getByLabel('Description Column').selectOption('description');
    await page.getByLabel('Amount Column').selectOption('amount');
    await page.getByLabel('Type Column').selectOption('type');

    await page.getByRole('button', { name: 'Preview' }).click();

    await expect(page.getByText('Groceries')).toBeVisible();
    await expect(page.getByText('100.50')).toBeVisible();

    await page.getByRole('button', { name: 'Import' }).click();

    await expect(page.getByText('3 transactions imported')).toBeVisible();

    await expect(page.getByText('Groceries')).toBeVisible();
    await expect(page.getByText('Salary')).toBeVisible();
    await expect(page.getByText('Coffee')).toBeVisible();

    fs.unlinkSync(tempFile);
  });

  test('should validate CSV format and show errors', async ({ page }) => {
    const csvContent = `invalid,csv,content
missing,required,columns`;

    const tempFile = '/tmp/invalid-transactions.csv';
    fs.writeFileSync(tempFile, csvContent);

    await page.goto('/transactions');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(tempFile);

    await expect(page.getByText('CSV format is invalid')).toBeVisible();
    await expect(page.getByText('Missing required column: date')).toBeVisible();
    await expect(page.getByText('Missing required column: amount')).toBeVisible();

    fs.unlinkSync(tempFile);
  });
});
