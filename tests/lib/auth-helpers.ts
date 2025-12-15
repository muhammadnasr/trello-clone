import { vi } from 'vitest'

export const mockUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  emailVerified: true,
} as any

export function mockAuthStore(overrides?: { user?: any; isLoading?: boolean; isAuthenticated?: boolean }) {
  const defaultState = {
    user: mockUser,
    isLoading: false,
    isAuthenticated: true,
    ...overrides,
  }

  vi.mock('../../../src/stores/auth', () => ({
    useAuthStore: vi.fn((selector: any) => {
      return selector(defaultState)
    }),
  }))
}

