import { beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { mockOrpcHandlers, mockAuthHandlers } from '../../../test/utils';

export const server = setupServer(...mockOrpcHandlers, ...mockAuthHandlers);

beforeAll(() => {
  server.listen();
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
