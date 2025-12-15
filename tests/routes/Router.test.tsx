import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from '../../src/routeTree.gen'
import { mockUser } from '../lib/auth-helpers'

// Mock auth store for route protection
const mockAuthState = {
  user: mockUser,
  isLoading: false,
  isAuthenticated: true,
}

vi.mock('../../src/stores/auth', () => ({
  useAuthStore: Object.assign(
    vi.fn((selector: any) => selector(mockAuthState)),
    {
      getState: () => mockAuthState,
    }
  ),
}))

// Mock Firebase to prevent initialization in tests
vi.mock('../../src/lib/firebase/config', () => ({
  initFirebase: vi.fn(),
  getAuthInstance: vi.fn(),
  getFirestoreDatabase: vi.fn(),
}))

const router = createRouter({ 
  routeTree,
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

describe('TanStack Router', () => {
  it('renders the index route with BoardsList component', async () => {
    render(<RouterProvider router={router} />)
    
    await waitFor(() => {
      // The BoardsList component shows empty state when no boards
      expect(screen.getByText(/No boards yet/)).toBeTruthy()
      expect(screen.getByText('Create Board')).toBeTruthy()
    })
  })
})

