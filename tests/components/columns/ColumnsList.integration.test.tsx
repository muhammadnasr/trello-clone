import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from '../../../src/routeTree.gen'
import { useColumnsStore } from '../../../src/stores/columns'
import { useBoardsStore } from '../../../src/stores/boards'
import { initDatabase, cleanupDatabase } from '../../../src/lib/db/init'
import { createTestDatabase } from '../../lib/db/test-helpers'
import { mockUser } from '../../lib/auth-helpers'

// Mock auth store
// Use 'user1' to match test data ownerId
const testUser = {
  uid: 'user1',
  email: 'test@example.com',
} as any

let mockAuthState = {
  user: testUser,
  isLoading: false,
  isAuthenticated: true,
}

let authSubscribers: Array<(state: typeof mockAuthState) => void> = []

vi.mock('../../../src/stores/auth', () => {
  return {
    useAuthStore: Object.assign(
      (selector: any) => selector(mockAuthState),
      {
        getState: () => mockAuthState,
        subscribe: vi.fn((callback: any) => {
          authSubscribers.push(callback)
          callback(mockAuthState)
          return () => {
            authSubscribers = authSubscribers.filter((sub) => sub !== callback)
          }
        }),
      }
    ),
  }
})

// Mock Firebase to prevent initialization in tests
vi.mock('../../../src/lib/firebase/config', () => ({
  initFirebase: vi.fn(),
  getAuthInstance: vi.fn(),
  getFirestoreDatabase: vi.fn(),
}))

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

describe('ColumnsList Integration - Create Column', () => {
  let boardId: string

  beforeEach(async () => {
    await cleanupDatabase()
    const testDb = await createTestDatabase()
    await initDatabase(testDb)
    useBoardsStore.setState({
      boards: [],
      isLoading: false,
      error: null,
    })
    useColumnsStore.setState({
      columns: [],
      isLoading: false,
      error: null,
    })
    // Reset to authenticated state BEFORE creating data
    mockAuthState = {
      user: testUser,
      isLoading: false,
      isAuthenticated: true,
    }
    // Notify subscribers of auth state change
    authSubscribers.forEach((sub) => sub(mockAuthState))
    
    const { createBoard } = await import('../../../src/lib/services/boards')
    const board = await createBoard('Test Board', 'user1')
    boardId = board.id
    
    // Wait for store to sync (RxDB reactive queries update store asynchronously)
    await new Promise((resolve) => setTimeout(resolve, 200))
  })

  afterEach(async () => {
    await cleanupDatabase()
  })

  it('creates column when form is submitted', async () => {
    const user = userEvent.setup()

    router.history.push(`/boards/${boardId}`)
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      // Check for the board title in the page heading (not breadcrumb)
      expect(screen.getByRole('heading', { name: 'Test Board' })).toBeInTheDocument()
    }, { timeout: 2000 })

    await user.click(screen.getByText('Add Column'))

    await waitFor(() => {
      expect(screen.getByText('Create New Column')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('Column name')
    await user.type(input, 'New Column')

    await user.click(screen.getByRole('button', { name: 'Create' }))

    await waitFor(() => {
      expect(screen.getByText('New Column')).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('creates column without authentication', async () => {
    const user = userEvent.setup()

    // Set unauthenticated state
    mockAuthState = {
      user: null,
      isLoading: false,
      isAuthenticated: false,
    }

    router.history.push(`/boards/${boardId}`)
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      // Check for the board title in the page heading (not breadcrumb)
      expect(screen.getByRole('heading', { name: 'Test Board' })).toBeInTheDocument()
    }, { timeout: 2000 })

    await user.click(screen.getByText('Add Column'))

    await waitFor(() => {
      expect(screen.getByText('Create New Column')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('Column name')
    await user.type(input, 'Anonymous Column')

    await user.click(screen.getByRole('button', { name: 'Create' }))

    await waitFor(() => {
      expect(screen.getByText('Anonymous Column')).toBeInTheDocument()
    }, { timeout: 2000 })
  })
})

describe('ColumnsList Integration - Update Column', () => {
  let boardId: string

  beforeEach(async () => {
    await cleanupDatabase()
    // Reset to authenticated state BEFORE initDatabase
    mockAuthState = {
      user: testUser,
      isLoading: false,
      isAuthenticated: true,
    }
    // Notify subscribers of auth state change
    authSubscribers.forEach((sub) => sub(mockAuthState))
    
    const testDb = await createTestDatabase()
    await initDatabase(testDb)
    useBoardsStore.setState({
      boards: [],
      isLoading: false,
      error: null,
    })
    useColumnsStore.setState({
      columns: [],
      isLoading: false,
      error: null,
    })
    
    const { createBoard } = await import('../../../src/lib/services/boards')
    const { createColumn } = await import('../../../src/lib/services/columns')
    const board = await createBoard('Test Board', 'user1')
    boardId = board.id
    await createColumn(boardId, 'Original Column', 0)
    
    // Wait for stores to sync (RxDB reactive queries update store asynchronously)
    await new Promise((resolve) => setTimeout(resolve, 200))
  })

  afterEach(async () => {
    await cleanupDatabase()
  })

  it('updates column title when renamed', async () => {
    const user = userEvent.setup()

    router.history.push(`/boards/${boardId}`)
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByText('Original Column')).toBeInTheDocument()
    }, { timeout: 2000 })

    const renameButton = screen.getByTitle('Rename column')
    await user.click(renameButton)

    await waitFor(() => {
      expect(screen.getByText('Rename Column')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('Column name')
    await user.clear(input)
    await user.type(input, 'Updated Column')

    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(screen.getByText('Updated Column')).toBeInTheDocument()
      expect(screen.queryByText('Original Column')).not.toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('updates column title when renamed without authentication', async () => {
    const user = userEvent.setup()

    // Set unauthenticated state
    mockAuthState = {
      user: null,
      isLoading: false,
      isAuthenticated: false,
    }

    router.history.push(`/boards/${boardId}`)
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByText('Original Column')).toBeInTheDocument()
    }, { timeout: 2000 })

    const renameButton = screen.getByTitle('Rename column')
    await user.click(renameButton)

    await waitFor(() => {
      expect(screen.getByText('Rename Column')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('Column name')
    await user.clear(input)
    await user.type(input, 'Updated Column')

    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(screen.getByText('Updated Column')).toBeInTheDocument()
      expect(screen.queryByText('Original Column')).not.toBeInTheDocument()
    }, { timeout: 2000 })
  })
})

describe('ColumnsList Integration - Delete Column', () => {
  let boardId: string

  beforeEach(async () => {
    await cleanupDatabase()
    // Reset to authenticated state BEFORE initDatabase
    mockAuthState = {
      user: testUser,
      isLoading: false,
      isAuthenticated: true,
    }
    // Notify subscribers of auth state change
    authSubscribers.forEach((sub) => sub(mockAuthState))
    
    const testDb = await createTestDatabase()
    await initDatabase(testDb)
    useBoardsStore.setState({
      boards: [],
      isLoading: false,
      error: null,
    })
    useColumnsStore.setState({
      columns: [],
      isLoading: false,
      error: null,
    })
    window.confirm = vi.fn(() => true)
    
    const { createBoard } = await import('../../../src/lib/services/boards')
    const { createColumn } = await import('../../../src/lib/services/columns')
    const board = await createBoard('Test Board', 'user1')
    boardId = board.id
    await createColumn(boardId, 'Column to Delete', 0)
    
    // Wait for stores to sync (RxDB reactive queries update store asynchronously)
    await new Promise((resolve) => setTimeout(resolve, 200))
  })

  afterEach(async () => {
    await cleanupDatabase()
    window.confirm = window.confirm as typeof confirm
  })

  it('deletes column when delete button is clicked and confirmed', async () => {
    const user = userEvent.setup()

    router.history.push(`/boards/${boardId}`)
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByText('Column to Delete')).toBeInTheDocument()
    }, { timeout: 2000 })

    const deleteButton = screen.getByTitle('Delete column')
    await user.click(deleteButton)

    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining('Column to Delete')
    )

    await waitFor(() => {
      expect(screen.queryByText('Column to Delete')).not.toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('deletes column without authentication', async () => {
    const user = userEvent.setup()

    // Set unauthenticated state
    mockAuthState = {
      user: null,
      isLoading: false,
      isAuthenticated: false,
    }

    router.history.push(`/boards/${boardId}`)
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByText('Column to Delete')).toBeInTheDocument()
    }, { timeout: 2000 })

    const deleteButton = screen.getByTitle('Delete column')
    await user.click(deleteButton)

    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining('Column to Delete')
    )

    await waitFor(() => {
      expect(screen.queryByText('Column to Delete')).not.toBeInTheDocument()
    }, { timeout: 2000 })
  })
})

