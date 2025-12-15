import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '../../../src/components/auth/LoginForm'

// Mock router
const mockNavigate = vi.fn()
vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock auth store with reactive state
let mockAuthState = {
  isAuthenticated: false,
}

const mockUseAuthStore = vi.fn((selector: any) => selector(mockAuthState))

vi.mock('../../../src/stores/auth', () => ({
  useAuthStore: (selector: any) => mockUseAuthStore(selector),
}))

// Mock auth services
const mockSignIn = vi.fn()
const mockSignUp = vi.fn()

vi.mock('../../../src/lib/services/auth', () => ({
  signIn: (email: string, password: string) => mockSignIn(email, password),
  signUp: (email: string, password: string) => mockSignUp(email, password),
}))

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.assign(mockAuthState, { isAuthenticated: false })
  })

  it('renders sign in form by default', () => {
    render(<LoginForm />)
    
    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument()
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument()
  })

  it('switches to sign up mode', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    
    const toggleButton = screen.getByText("Don't have an account? Sign up")
    await user.click(toggleButton)
    
    expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument()
    expect(screen.getByText('Create an account to get started')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^sign up$/i })).toBeInTheDocument()
  })

  it('calls signIn when submitting sign in form', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({ uid: 'user1', email: 'test@example.com' })
    
    render(<LoginForm />)
    
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /^sign in$/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
      expect(mockSignUp).not.toHaveBeenCalled()
    })
  })

  it('redirects to home after successful sign in', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({ uid: 'user1', email: 'test@example.com' })
    
    const { rerender } = render(<LoginForm />)
    
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /^sign in$/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalled()
    })
    
    // Simulate auth state change (Firebase auth listener updates store)
    mockAuthState = { isAuthenticated: true }
    mockUseAuthStore.mockImplementation((selector: any) => selector(mockAuthState))
    rerender(<LoginForm />)
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/' })
    })
  })

  it('calls signUp when submitting sign up form', async () => {
    const user = userEvent.setup()
    mockSignUp.mockResolvedValue({ uid: 'user1', email: 'test@example.com' })
    
    render(<LoginForm />)
    
    // Switch to sign up
    const toggleButton = screen.getByText("Don't have an account? Sign up")
    await user.click(toggleButton)
    
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /^sign up$/i })
    
    await user.type(emailInput, 'newuser@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('newuser@example.com', 'password123')
      expect(mockSignIn).not.toHaveBeenCalled()
    })
  })

  it('redirects to home after successful sign up', async () => {
    const user = userEvent.setup()
    mockSignUp.mockResolvedValue({ uid: 'user1', email: 'newuser@example.com' })
    
    const { rerender } = render(<LoginForm />)
    
    // Switch to sign up
    const toggleButton = screen.getByText("Don't have an account? Sign up")
    await user.click(toggleButton)
    
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /^sign up$/i })
    
    await user.type(emailInput, 'newuser@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalled()
    })
    
    // Simulate auth state change (Firebase auth listener updates store)
    mockAuthState = { isAuthenticated: true }
    mockUseAuthStore.mockImplementation((selector: any) => selector(mockAuthState))
    rerender(<LoginForm />)
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/' })
    })
  })

  it('displays error message on sign in failure', async () => {
    const user = userEvent.setup()
    mockSignIn.mockRejectedValue(new Error('wrong-password'))
    
    render(<LoginForm />)
    
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /^sign in$/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Incorrect password. Please try again.')).toBeInTheDocument()
    })
  })

  it('displays error message on sign up failure', async () => {
    const user = userEvent.setup()
    mockSignUp.mockRejectedValue(new Error('email-already-in-use'))
    
    render(<LoginForm />)
    
    // Switch to sign up
    const toggleButton = screen.getByText("Don't have an account? Sign up")
    await user.click(toggleButton)
    
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /^sign up$/i })
    
    await user.type(emailInput, 'existing@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('An account with this email already exists. Please sign in instead.')).toBeInTheDocument()
    })
  })

  it('displays generic error for unknown errors', async () => {
    const user = userEvent.setup()
    mockSignIn.mockRejectedValue(new Error('unknown-error'))
    
    render(<LoginForm />)
    
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /^sign in$/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('unknown-error')).toBeInTheDocument()
    })
  })

  it('disables submit button while loading', async () => {
    const user = userEvent.setup()
    let resolveSignIn: (value: any) => void
    const signInPromise = new Promise((resolve) => {
      resolveSignIn = resolve
    })
    mockSignIn.mockReturnValue(signInPromise)
    
    render(<LoginForm />)
    
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /^sign in$/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Loading...')).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
    })
    
    resolveSignIn!({ uid: 'user1', email: 'test@example.com' })
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled()
    })
  })

  it('clears error when switching between sign in and sign up', async () => {
    const user = userEvent.setup()
    mockSignIn.mockRejectedValue(new Error('wrong-password'))
    
    render(<LoginForm />)
    
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /^sign in$/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Incorrect password. Please try again.')).toBeInTheDocument()
    })
    
    // Switch to sign up
    const toggleButton = screen.getByText("Don't have an account? Sign up")
    await user.click(toggleButton)
    
    // Error should be cleared
    expect(screen.queryByText('Incorrect password. Please try again.')).not.toBeInTheDocument()
  })
})

