import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createORPCClient } from '@orpc/client';
import { mockAccount, createMockSession } from '../../../../test/utils';

vi.mock('@orpc/server', () => ({
  ORPCRouter: vi.fn(),
}));

vi.mock('@orpc/zod', () => ({
  z: {
    string: { min: vi.fn(), max: vi.fn() },
    number: { min: vi.fn(), max: vi.fn() },
    object: vi.fn(),
    enum: vi.fn(),
  },
}));

vi.mock('../../context', () => ({
  authGuard: {
    onCall: vi.fn(),
  },
}));

vi.mock('../../repositories', () => ({
  accountRepository: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockAccountRepository = {
  findAll: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

vi.mocked(mockAccountRepository.findAll).mockImplementation(() => Promise.resolve([mockAccount]));
vi.mocked(mockAccountRepository.findById).mockImplementation(() => Promise.resolve(mockAccount));
vi.mocked(mockAccountRepository.create).mockImplementation(() => Promise.resolve(mockAccount));
vi.mocked(mockAccountRepository.update).mockImplementation(() => Promise.resolve(mockAccount));
vi.mocked(mockAccountRepository.delete).mockImplementation(() => Promise.resolve(true));

describe('accounts router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list procedure', () => {
    it('should return list of accounts', async () => {
      const accounts = await mockAccountRepository.findAll('user-1');

      expect(accounts).toEqual([mockAccount]);
      expect(accounts.length).toBe(1);
    });
  });

  describe('get procedure', () => {
    it('should return account by id', async () => {
      const account = await mockAccountRepository.findById('acc-1', 'user-1');

      expect(account).toEqual(mockAccount);
    });

    it('should return null for non-existent account', async () => {
      vi.mocked(mockAccountRepository.findById).mockResolvedValueOnce(null);

      const account = await mockAccountRepository.findById('non-existent', 'user-1');

      expect(account).toBeNull();
    });
  });

  describe('create procedure', () => {
    it('should create a new account', async () => {
      const account = await mockAccountRepository.create({
        userId: 'user-1',
        name: 'Test Account',
        type: 'checking',
        balance: '1000.00',
      });

      expect(account).toEqual(mockAccount);
      expect(mockAccountRepository.create).toHaveBeenCalledWith({
        userId: 'user-1',
        name: 'Test Account',
        type: 'checking',
        balance: '1000.00',
      });
    });
  });

  describe('update procedure', () => {
    it('should update an account', async () => {
      const account = await mockAccountRepository.update('acc-1', 'user-1', {
        name: 'Updated Account',
      });

      expect(account).toEqual(mockAccount);
      expect(mockAccountRepository.update).toHaveBeenCalledWith('acc-1', 'user-1', {
        name: 'Updated Account',
      });
    });
  });

  describe('delete procedure', () => {
    it('should delete an account', async () => {
      const result = await mockAccountRepository.delete('acc-1', 'user-1');

      expect(result).toBe(true);
      expect(mockAccountRepository.delete).toHaveBeenCalledWith('acc-1', 'user-1');
    });
  });
});
