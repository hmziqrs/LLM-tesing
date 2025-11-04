import { describe, it, expect } from 'vitest';

// Test form validation logic
describe('Validation Logic - Unit Tests', () => {
  describe('Email Validation', () => {
    it('should validate correct email formats', () => {
      const isValidEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) && !email.includes('..');
      };

      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com',
      ];

      validEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email formats', () => {
      const isValidEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) && !email.includes('..');
      };

      const invalidEmails = [
        'invalid',
        '@example.com',
        'test@',
        'test@domain',
        'test@domain..com',
        '',
      ];

      invalidEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(false);
      });
    });
  });

  describe('Password Validation', () => {
    it('should validate password strength', () => {
      const validatePassword = (password: string) => {
        const errors: string[] = [];

        if (password.length < 8) {
          errors.push('Password must be at least 8 characters');
        }

        if (!/[A-Z]/.test(password)) {
          errors.push('Password must contain at least one uppercase letter');
        }

        if (!/[a-z]/.test(password)) {
          errors.push('Password must contain at least one lowercase letter');
        }

        if (!/\d/.test(password)) {
          errors.push('Password must contain at least one number');
        }

        return {
          isValid: errors.length === 0,
          errors,
        };
      };

      const strongPassword = 'StrongPass123';
      const weakPassword = 'weak';

      expect(validatePassword(strongPassword).isValid).toBe(true);
      expect(validatePassword(weakPassword).isValid).toBe(false);
      expect(validatePassword(weakPassword).errors.length).toBeGreaterThan(0);
    });
  });

  describe('Amount Validation', () => {
    it('should validate monetary amounts', () => {
      const isValidAmount = (amount: string) => {
        const amountRegex = /^\d+(\.\d{1,2})?$/;
        return amountRegex.test(amount) && parseFloat(amount) >= 0;
      };

      const validAmounts = ['0', '10', '10.50', '1000.99', '999999.99'];
      const invalidAmounts = ['-10', '10.000', '10.555', 'abc', '', '.50'];

      validAmounts.forEach(amount => {
        expect(isValidAmount(amount)).toBe(true);
      });

      invalidAmounts.forEach(amount => {
        expect(isValidAmount(amount)).toBe(false);
      });
    });
  });

  describe('Name Validation', () => {
    it('should validate account names', () => {
      const validateAccountName = (name: string) => {
        const errors: string[] = [];

        if (!name || name.trim().length === 0) {
          errors.push('Name is required');
        }

        if (name.length < 1) {
          errors.push('Name must be at least 1 character');
        }

        if (name.length > 100) {
          errors.push('Name must be less than 100 characters');
        }

        return {
          isValid: errors.length === 0,
          errors,
        };
      };

      const validName = 'My Checking Account';
      const emptyName = '';
      const tooLongName = 'a'.repeat(101);

      expect(validateAccountName(validName).isValid).toBe(true);
      expect(validateAccountName(emptyName).isValid).toBe(false);
      expect(validateAccountName(tooLongName).isValid).toBe(false);
    });
  });

  describe('Date Validation', () => {
    it('should validate date formats', () => {
      const isValidDate = (dateString: string) => {
        const date = new Date(dateString);
        return !isNaN(date.getTime());
      };

      const validDates = [
        '2024-01-15',
        '2024-12-31',
        '2024-02-29', // Leap year
      ];

      const invalidDates = [
        'invalid-date',
        '',
      ];

      validDates.forEach(date => {
        expect(isValidDate(date)).toBe(true);
      });

      invalidDates.forEach(date => {
        expect(isValidDate(date)).toBe(false);
      });
    });

    it('should validate date ranges', () => {
      const isDateInRange = (dateString: string, minDate?: string, maxDate?: string) => {
        const date = new Date(dateString);
        const min = minDate ? new Date(minDate) : new Date('1900-01-01');
        const max = maxDate ? new Date(maxDate) : new Date('2100-12-31');

        return date >= min && date <= max;
      };

      const testDate = '2024-06-15';

      expect(isDateInRange(testDate, '2024-01-01', '2024-12-31')).toBe(true);
      expect(isDateInRange(testDate, '2024-07-01', '2024-12-31')).toBe(false);
      expect(isDateInRange(testDate, '2024-01-01', '2024-05-31')).toBe(false);
    });
  });

  describe('Required Field Validation', () => {
    it('should check required fields', () => {
      const validateRequired = (value: any) => {
        return value !== null &&
               value !== undefined &&
               value !== '' &&
               (typeof value !== 'string' || value.trim().length > 0);
      };

      expect(validateRequired('text')).toBe(true);
      expect(validateRequired(0)).toBe(true);
      expect(validateRequired(false)).toBe(true);
      expect(validateRequired('')).toBe(false);
      expect(validateRequired('   ')).toBe(false);
      expect(validateRequired(null)).toBe(false);
      expect(validateRequired(undefined)).toBe(false);
    });
  });

  describe('Phone Number Validation', () => {
    it('should validate phone number formats', () => {
      const isValidPhone = (phone: string) => {
        const phoneRegex = /^\+?[\d\s\-(())]+$/;
        const digitsOnly = phone.replace(/\D/g, '');
        return phoneRegex.test(phone) && digitsOnly.length >= 10 && digitsOnly.length <= 15;
      };

      const validPhones = [
        '+1 (555) 123-4567',
        '555-123-4567',
        '5551234567',
        '+44 20 7123 4567',
      ];

      const invalidPhones = [
        '123',
        'phone',
        '+1 555 123',
        '',
      ];

      validPhones.forEach(phone => {
        expect(isValidPhone(phone)).toBe(true);
      });

      invalidPhones.forEach(phone => {
        expect(isValidPhone(phone)).toBe(false);
      });
    });
  });

  describe('URL Validation', () => {
    it('should validate URLs', () => {
      const isValidUrl = (url: string) => {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      };

      const validUrls = [
        'https://example.com',
        'http://localhost:3000',
        'https://subdomain.example.com/path',
      ];

      const invalidUrls = [
        'not-a-url',
        'http://',
        '',
      ];

      validUrls.forEach(url => {
        expect(isValidUrl(url)).toBe(true);
      });

      invalidUrls.forEach(url => {
        expect(isValidUrl(url)).toBe(false);
      });
    });
  });
});