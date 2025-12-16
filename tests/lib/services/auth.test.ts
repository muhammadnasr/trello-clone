import { describe, it, expect, beforeEach, vi } from 'vitest'
import { signIn, signUp, signOutUser, initAuthStateListener } from '../../../src/lib/services/auth'
import type { Auth, User } from 'firebase/auth'

// Mock Firebase Auth
const mockSignInWithEmailAndPassword = vi.fn()
const mockCreateUserWithEmailAndPassword = vi.fn()
const mockSignOut = vi.fn()
const mockOnAuthStateChanged = vi.fn()

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: (auth: Auth, email: string, password: string) =>
    mockSignInWithEmailAndPassword(auth, email, password),
  createUserWithEmailAndPassword: (auth: Auth, email: string, password: string) =>
    mockCreateUserWithEmailAndPassword(auth, email, password),
  signOut: (auth: Auth) => mockSignOut(auth),
  onAuthStateChanged: (
    auth: Auth,
    callback: (user: User | null) => void,
    errorCallback?: (error: Error) => void
  ) => mockOnAuthStateChanged(auth, callback, errorCallback),
}))

// Mock Firebase config
const mockAuth = { currentUser: null }
const mockGetAuthInstance = vi.fn(() => mockAuth)

vi.mock('../../../src/lib/firebase/config', () => ({
  getAuthInstance: () => mockGetAuthInstance(),
}))

// Mock auth store
const mockSetUser = vi.fn()
const mockSetLoading = vi.fn()

vi.mock('../../../src/stores/auth', () => ({
  useAuthStore: {
    getState: () => ({
      setUser: mockSetUser,
      setLoading: mockSetLoading,
    }),
  },
}))

describe('Auth Services', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('signIn', () => {
    it('calls Firebase signInWithEmailAndPassword with correct parameters', async () => {
      const mockUser = { uid: 'user1', email: 'test@example.com' }
      mockSignInWithEmailAndPassword.mockResolvedValue({ user: mockUser })
      
      const result = await signIn('test@example.com', 'password123')
      
      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
        mockAuth,
        'test@example.com',
        'password123'
      )
      expect(result).toEqual(mockUser)
    })

    it('throws error when sign in fails', async () => {
      const error = new Error('wrong-password')
      mockSignInWithEmailAndPassword.mockRejectedValue(error)
      
      await expect(signIn('test@example.com', 'wrongpassword')).rejects.toThrow('wrong-password')
    })
  })

  describe('signUp', () => {
    it('calls Firebase createUserWithEmailAndPassword with correct parameters', async () => {
      const mockUser = { uid: 'user1', email: 'newuser@example.com' }
      mockCreateUserWithEmailAndPassword.mockResolvedValue({ user: mockUser })
      
      const result = await signUp('newuser@example.com', 'password123')
      
      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
        mockAuth,
        'newuser@example.com',
        'password123'
      )
      expect(result).toEqual(mockUser)
    })

    it('throws error when sign up fails', async () => {
      const error = new Error('email-already-in-use')
      mockCreateUserWithEmailAndPassword.mockRejectedValue(error)
      
      await expect(signUp('existing@example.com', 'password123')).rejects.toThrow('email-already-in-use')
    })
  })

  describe('signOutUser', () => {
    it('calls Firebase signOut', async () => {
      mockSignOut.mockResolvedValue(undefined)
      
      await signOutUser()
      
      expect(mockSignOut).toHaveBeenCalledWith(mockAuth)
    })

    it('throws error when sign out fails', async () => {
      const error = new Error('sign-out-failed')
      mockSignOut.mockRejectedValue(error)
      
      await expect(signOutUser()).rejects.toThrow('sign-out-failed')
    })
  })

  describe('initAuthStateListener', () => {
    it('sets loading to true initially', () => {
      initAuthStateListener()
      
      expect(mockSetLoading).toHaveBeenCalledWith(true)
    })

    it('subscribes to auth state changes', () => {
      initAuthStateListener()
      
      expect(mockOnAuthStateChanged).toHaveBeenCalledWith(
        mockAuth,
        expect.any(Function),
        expect.any(Function)
      )
    })

    it('updates store when user signs in', () => {
      const mockUser = { uid: 'user1', email: 'test@example.com' }
      let authCallback: (user: any) => void
      
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        authCallback = callback
        return () => {} // unsubscribe function
      })
      
      initAuthStateListener()
      
      // Simulate user signing in
      authCallback!(mockUser)
      
      expect(mockSetUser).toHaveBeenCalledWith(mockUser)
      expect(mockSetLoading).toHaveBeenCalledWith(false)
    })

    it('updates store when user signs out', () => {
      let authCallback: (user: any) => void
      
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        authCallback = callback
        return () => {} // unsubscribe function
      })
      
      initAuthStateListener()
      
      // Simulate user signing out
      authCallback!(null)
      
      expect(mockSetUser).toHaveBeenCalledWith(null)
      expect(mockSetLoading).toHaveBeenCalledWith(false)
    })

    it('handles auth state errors', () => {
      const mockError = new Error('auth-error')
      let errorCallback: (error: Error) => void
      
      mockOnAuthStateChanged.mockImplementation((auth, callback, errorCallbackFn) => {
        errorCallback = errorCallbackFn
        return () => {} // unsubscribe function
      })
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      initAuthStateListener()
      
      // Simulate auth error
      errorCallback!(mockError)
      
      expect(consoleSpy).toHaveBeenCalledWith('Auth state listener error:', mockError)
      expect(mockSetUser).toHaveBeenCalledWith(null)
      expect(mockSetLoading).toHaveBeenCalledWith(false)
      
      consoleSpy.mockRestore()
    })

    it('returns unsubscribe function', () => {
      const mockUnsubscribe = vi.fn()
      mockOnAuthStateChanged.mockReturnValue(mockUnsubscribe)
      
      const unsubscribe = initAuthStateListener()
      
      expect(unsubscribe).toBe(mockUnsubscribe)
    })
  })
})

