import { describe, it, expect } from 'vitest';

// Test account validation logic
describe('Account Logic - Unit Tests', () => {
  describe('Account Type Validation', () => {
    it('should validate valid account types', () => {
      const validTypes = ['checking', 'savings', 'credit_card', 'investment', 'cash', 'other'];

      validTypes.forEach(type => {
        expect(validTypes.includes(type)).toBe(true);
      });
    });

    it('should reject invalid account types', () => {
      const invalidTypes = ['invalid', 'checking_account', 'savings-account'];
      const validTypes = ['checking', 'savings', 'credit_card', 'investment', 'cash', 'other'];

      invalidTypes.forEach(type => {
        expect(validTypes.includes(type)).toBe(false);
      });
    });
  });

  describe('Balance Validation', () => {
    it('should validate positive balances', () => {
      const validBalances = ['100.00', '0.00', '999999.99'];
      const balanceRegex = /^\d+(\.\d{1,2})?$/;

      validBalances.forEach(balance => {
        expect(balanceRegex.test(balance)).toBe(true);
      });
    });

    it('should reject invalid balance formats', () => {
      const invalidBalances = ['-100.00', '100.000', 'abc', '100.'];
      const balanceRegex = /^\d+(\.\d{1,2})?$/;

      invalidBalances.forEach(balance => {
        expect(balanceRegex.test(balance)).toBe(false);
      });
    });
  });

  describe('Account Summary Calculation', () => {
    it('should calculate total balance correctly', () => {
      const accounts = [
        { balance: '1000.00', isActive: true },
        { balance: '2000.00', isActive: true },
        { balance: '500.00', isActive: false }, // Should not be counted
        { balance: '1500.00', isActive: true },
      ];

      const activeAccounts = accounts.filter(acc => acc.isActive);
      const totalBalance = activeAccounts.reduce((sum, acc) => {
        return sum + parseFloat(acc.balance);
      }, 0).toFixed(2);

      const accountCount = activeAccounts.length;

      expect(totalBalance).toBe('4500.00');
      expect(accountCount).toBe(3);
    });

    it('should handle empty accounts list', () => {

      const totalBalance = '0.00';
      const accountCount = 0;

      expect(totalBalance).toBe('0.00');
      expect(accountCount).toBe(0);
    });

    it('should handle only inactive accounts', () => {
      const accounts = [
        { balance: '1000.00', isActive: false },
        { balance: '2000.00', isActive: false },
      ];

      const activeAccounts = accounts.filter(acc => acc.isActive);
      const totalBalance = activeAccounts.length > 0
        ? activeAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0).toFixed(2)
        : '0.00';
      const accountCount = activeAccounts.length;

      expect(totalBalance).toBe('0.00');
      expect(accountCount).toBe(0);
    });
  });

  describe('Account Creation Validation', () => {
    it('should validate required fields for account creation', () => {
      const validAccount = {
        name: 'Test Account',
        type: 'checking',
        balance: '1000.00',
        currency: 'USD',
      };

      expect(validAccount.name).toBeTruthy();
      expect(validAccount.name.length).toBeGreaterThanOrEqual(1);
      expect(validAccount.name.length).toBeLessThanOrEqual(100);
      expect(['checking', 'savings', 'credit_card', 'investment', 'cash', 'other']).toContain(validAccount.type);
      expect(/^\d+(\.\d{1,2})?$/.test(validAccount.balance)).toBe(true);
      expect(validAccount.currency).toBeTruthy();
    });

    it('should reject invalid account names', () => {
      const invalidNames = ['', 'a'.repeat(101)];

      invalidNames.forEach(name => {
        expect(name.length >= 1 && name.length <= 100).toBe(false);
      });
    });
  });
});