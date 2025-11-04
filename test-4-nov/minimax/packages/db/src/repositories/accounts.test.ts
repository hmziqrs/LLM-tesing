import { describe, it, expect, vi, beforeEach } from 'vitest';
import { accountRepository } from './accounts';
import { accounts } from '../schema/auth';

vi.mock('../db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
} as any;

vi.mocked(mockDb.select).mockReturnThis();
vi.mocked(mockDb.insert).mockReturnThis();
vi.mocked(mockDb.update).mockReturnThis();
vi.mocked(mockDb.delete).mockReturnThis();

describe('accountRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockAccount = {
    id: 'test-id',
    userId: 'user-1',
    name: 'Test Account',
    type: 'checking',
    balance: '1000.00',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('findAll', () => {
    it('should return all accounts for a user', async () => {
      const mockData = [mockAccount];
      vi.mocked(mockDb.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockData),
          }),
        }),
      });

      const result = await accountRepository.findAll('user-1');

      expect(result).toEqual(mockData);
    });
  });

  describe('findById', () => {
    it('should return account by id', async () => {
      vi.mocked(mockDb.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockAccount]),
          }),
        }),
      });

      const result = await accountRepository.findById('test-id', 'user-1');

      expect(result).toEqual(mockAccount);
    });

    it('should return null if account not found', async () => {
      vi.mocked(mockDb.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await accountRepository.findById('non-existent', 'user-1');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new account', async () => {
      vi.mocked(mockDb.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockAccount]),
        }),
      });

      const result = await accountRepository.create({
        userId: 'user-1',
        name: 'Test Account',
        type: 'checking',
        balance: '1000.00',
      });

      expect(result).toEqual(mockAccount);
      expect(mockDb.insert).toHaveBeenCalledWith(accounts, expect.any(Object));
    });
  });

  describe('update', () => {
    it('should update an account', async () => {
      vi.mocked(mockDb.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockAccount]),
          }),
        }),
      });

      const result = await accountRepository.update('test-id', 'user-1', {
        name: 'Updated Account',
      });

      expect(result).toEqual(mockAccount);
    });
  });

  describe('delete', () => {
    it('should delete an account', async () => {
      vi.mocked(mockDb.delete).mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      });

      const result = await accountRepository.delete('test-id', 'user-1');

      expect(result).toBe(true);
      expect(mockDb.delete).toHaveBeenCalledWith(accounts, expect.any(Object));
    });
  });

  describe('getTotalBalance', () => {
    it('should return total balance of all accounts', async () => {
      const mockBalances = [
        { balance: '1000.00' },
        { balance: '2000.00' },
        { balance: '500.00' },
      ];

      vi.mocked(mockDb.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockBalances),
        }),
      });

      const result = await accountRepository.getTotalBalance('user-1');

      expect(result).toBe(3500);
    });

    it('should return 0 if no accounts exist', async () => {
      vi.mocked(mockDb.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      const result = await accountRepository.getTotalBalance('user-1');

      expect(result).toBe(0);
    });
  });
});
