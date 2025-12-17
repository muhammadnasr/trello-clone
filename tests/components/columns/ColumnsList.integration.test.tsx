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
      // Check that the page loaded by looking for the Add Column button
      expect(screen.getByText('Add Column')).toBeInTheDocument()
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

    // Set unauthenticated state BEFORE creating board
    mockAuthState = {
      user: null,
      isLoading: false,
      isAuthenticated: false,
    }
    // Notify subscribers of auth state change
    authSubscribers.forEach((sub) => sub(mockAuthState))

    // Wait for sync to update
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Create a board with anonymous ownerId for unauthenticated test
    const { createBoard } = await import('../../../src/lib/services/boards')
    const anonymousBoard = await createBoard('Anonymous Board', 'anonymous')
    const anonymousBoardId = anonymousBoard.id

    // Wait for store to sync
    await new Promise((resolve) => setTimeout(resolve, 200))

    router.history.push(`/boards/${anonymousBoardId}`)
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      // Check that the page loaded by looking for the Add Column button
      expect(screen.getByText('Add Column')).toBeInTheDocument()
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

describe('ColumnsList Integration - Drag and Drop', () => {
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
    mockAuthState = {
      user: testUser,
      isLoading: false,
      isAuthenticated: true,
    }
    authSubscribers.forEach((sub) => sub(mockAuthState))

    const { createBoard } = await import('../../../src/lib/services/boards')
    const { createColumn } = await import('../../../src/lib/services/columns')
    const board = await createBoard('Test Board', 'user1')
    boardId = board.id

    // Create 4 columns with orders 0, 1, 2, 3
    await createColumn(boardId, 'Column 0', 0)
    await createColumn(boardId, 'Column 1', 1)
    await createColumn(boardId, 'Column 2', 2)
    await createColumn(boardId, 'Column 3', 3)

    await new Promise((resolve) => setTimeout(resolve, 300))
  })

  afterEach(async () => {
    await cleanupDatabase()
  })

  it('renders drag handles for all columns', async () => {
    router.history.push(`/boards/${boardId}`)
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByText('Column 0')).toBeInTheDocument()
    })

    // Check that drag handles are rendered (aria-label="Drag handle")
    const dragHandles = screen.getAllByLabelText('Drag handle')
    expect(dragHandles.length).toBe(4)
  })

  it('reorders columns when drag ends', async () => {
    router.history.push(`/boards/${boardId}`)
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByText('Column 0')).toBeInTheDocument()
      expect(screen.getByText('Column 1')).toBeInTheDocument()
    })

    const columns = useColumnsStore.getState().columns
    const boardColumns = columns
      .filter((col) => col.boardId === boardId)
      .sort((a, b) => a.order - b.order)

    const column0Id = boardColumns[0].id // Column 0
    const column2Id = boardColumns[2].id // Column 2

    // Now we can test the actual handleColumnReorder function!
    const { handleColumnReorder } = await import('../../../src/lib/utils/column-reorder')

    // Simulate drag end event: Column 0 dragged to after Column 2
    const mockDragEndEvent = {
      active: { id: column0Id },
      over: { id: column2Id },
    } as DragEndEvent

    // Call the actual reorder function
    await handleColumnReorder(mockDragEndEvent, columns, boardId)

    // Verify the UI updates to show the new order
    await waitFor(() => {
      const updatedColumns = useColumnsStore.getState().columns
        .filter((col) => col.boardId === boardId)
        .sort((a, b) => a.order - b.order)

      // After dragging Column 0 to after Column 2:
      // Original: [Column 0, Column 1, Column 2, Column 3]
      // Result: [Column 1, Column 2, Column 0, Column 3]
      expect(updatedColumns[0].title).toBe('Column 1')
      expect(updatedColumns[1].title).toBe('Column 2')
      expect(updatedColumns[2].title).toBe('Column 0')
      expect(updatedColumns[3].title).toBe('Column 3')
    }, { timeout: 2000 })
  })
})

