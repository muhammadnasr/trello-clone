import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from '../../src/routeTree.gen'

// Mock auth store
const mockAuthState = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  setUser: vi.fn(),
  setLoading: vi.fn(),
}

vi.mock('../../src/stores/auth', () => ({
  useAuthStore: Object.assign(
    vi.fn((selector: any) => selector(mockAuthState)),
    {
      getState: () => mockAuthState,
      subscribe: vi.fn((callback: any) => {
        callback(mockAuthState)
        return () => {}
      }),
    }
  ),
}))

// Mock auth services
const mockSignIn = vi.fn()
const mockSignUp = vi.fn()

vi.mock('../../src/lib/services/auth', () => ({
  signIn: (email: string, password: string) => mockSignIn(email, password),
  signUp: (email: string, password: string) => mockSignUp(email, password),
}))

// Mock Firebase
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

describe('Login Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.assign(mockAuthState, {
      user: null,
      isLoading: false,
      isAuthenticated: false,
    })
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('renders login form when not authenticated', async () => {
    render(<RouterProvider router={router} />)
    
    // Navigate to login - wrap in act() to handle router state updates
    await act(async () => {
      await router.navigate({ to: '/login' })
    })
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument()
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    }, { timeout: 5000 })
  })

  it('redirects to home when already authenticated', async () => {
    Object.assign(mockAuthState, {
      user: { uid: 'user1', email: 'test@example.com' },
      isLoading: false,
      isAuthenticated: true,
    })

    render(<RouterProvider router={router} />)
    
    // Try to navigate to login - wrap in act() to handle router state updates
    await act(async () => {
      await router.navigate({ to: '/login' })
    })
    
    await waitFor(() => {
      // Should redirect to home
      expect(router.state.location.pathname).toBe('/')
    })
  })

})

