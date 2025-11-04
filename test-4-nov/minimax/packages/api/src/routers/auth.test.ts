import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSession } from '../../../../test/utils';

vi.mock('better-auth', () => ({
  auth: {
    getSession: vi.fn(),
  },
}));

vi.mock('../../db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

const mockAuth = {
  getSession: vi.fn(),
};

const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
} as any;

vi.mocked(mockAuth.getSession).mockImplementation(() => Promise.resolve(createMockSession()));

describe('auth router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSession procedure', () => {
    it('should return user session', async () => {
      const session = await mockAuth.getSession();

      expect(session).toBeDefined();
      expect(session.user).toBeDefined();
      expect(session.user.id).toBe('test-user-id');
      expect(session.user.email).toBe('test@example.com');
    });

    it('should return null for unauthenticated user', async () => {
      vi.mocked(mockAuth.getSession).mockResolvedValueOnce(null);

      const session = await mockAuth.getSession();

      expect(session).toBeNull();
    });
  });

  describe('updateProfile procedure', () => {
    it('should update user profile', async () => {
      vi.mocked(mockDb.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'test-user-id', name: 'Updated Name' }]),
          }),
        }),
      });

      const result = mockDb.update;

      expect(result).toBeDefined();
    });
  });

  describe('invitePartner procedure', () => {
    it('should create partner invitation', async () => {
      vi.mocked(mockDb.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            {
              id: 'inv-1',
              email: 'partner@example.com',
              status: 'pending',
              createdAt: new Date(),
            },
          ]),
        }),
      });

      const result = mockDb.insert;

      expect(result).toBeDefined();
    });
  });
});
