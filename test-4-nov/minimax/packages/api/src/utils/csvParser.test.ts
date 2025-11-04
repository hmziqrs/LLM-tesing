import { describe, it, expect } from 'vitest';
import { parseCsvTransactions, validateCsvFormat } from './csvParser';

describe('csvParser', () => {
  describe('parseCsvTransactions', () => {
    it('should parse valid CSV with all required fields', () => {
      const csv = `date,description,amount,type,category
2024-01-15,Groceries,100.50,expense,food
2024-01-16,Salary,5000.00,income,salary`;

      const transactions = parseCsvTransactions(csv);

      expect(transactions.length).toBe(2);
      expect(transactions[0].date).toBe('2024-01-15');
      expect(transactions[0].description).toBe('Groceries');
      expect(transactions[0].amount).toBe('100.50');
      expect(transactions[0].type).toBe('expense');
      expect(transactions[0].category).toBe('food');

      expect(transactions[1].date).toBe('2024-01-16');
      expect(transactions[1].description).toBe('Salary');
      expect(transactions[1].amount).toBe('5000.00');
      expect(transactions[1].type).toBe('income');
      expect(transactions[1].category).toBe('salary');
    });

    it('should parse CSV without optional category column', () => {
      const csv = `date,description,amount,type
2024-01-15,Groceries,100.50,expense
2024-01-16,Salary,5000.00,income`;

      const transactions = parseCsvTransactions(csv);

      expect(transactions.length).toBe(2);
      expect(transactions[0].category).toBeUndefined();
      expect(transactions[1].category).toBeUndefined();
    });

    it('should ignore empty rows', () => {
      const csv = `date,description,amount,type
2024-01-15,Groceries,100.50,expense

2024-01-16,Salary,5000.00,income

`;

      const transactions = parseCsvTransactions(csv);

      expect(transactions.length).toBe(2);
    });

    it('should handle different column case', () => {
      const csv = `Date,Description,Amount,Type
2024-01-15,Groceries,100.50,expense`;

      const transactions = parseCsvTransactions(csv);

      expect(transactions.length).toBe(1);
      expect(transactions[0].date).toBe('2024-01-15');
    });

    it('should skip rows missing required fields', () => {
      const csv = `date,description,amount,type
2024-01-15,Groceries,100.50,expense
missing amount,,expense
2024-01-17,Coffee,5.00,expense`;

      const transactions = parseCsvTransactions(csv);

      expect(transactions.length).toBe(2);
      expect(transactions[0].description).toBe('Groceries');
      expect(transactions[1].description).toBe('Coffee');
    });
  });

  describe('validateCsvFormat', () => {
    it('should return valid for proper CSV', () => {
      const csv = `date,description,amount,type
2024-01-15,Groceries,100.50,expense`;

      const result = validateCsvFormat(csv);

      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should detect missing required columns', () => {
      const csv = `description,amount,type
Groceries,100.50,expense`;

      const result = validateCsvFormat(csv);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required column: date');
    });

    it('should detect empty CSV', () => {
      const csv = '';

      const result = validateCsvFormat(csv);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('CSV must have a header row and at least one data row');
    });

    it('should detect CSV with only headers', () => {
      const csv = 'date,description,amount,type';

      const result = validateCsvFormat(csv);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('CSV must have a header row and at least one data row');
    });

    it('should detect multiple missing columns', () => {
      const csv = 'description,type';

      const result = validateCsvFormat(csv);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required column: date');
      expect(result.errors).toContain('Missing required column: amount');
    });
  });
});
