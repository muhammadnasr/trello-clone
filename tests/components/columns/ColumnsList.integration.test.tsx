import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from '../../../src/routeTree.gen'
import type { DropResult } from '@hello-pangea/dnd'
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
    await createColumn(boardId, 'Original Column', 0, 'user1')

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

    const { createBoard } = await import('../../../src/lib/services/boards')
    const { createColumn } = await import('../../../src/lib/services/columns')
    const board = await createBoard('Test Board', 'user1')
    boardId = board.id
    await createColumn(boardId, 'Column to Delete', 0, 'user1')

    // Wait for stores to sync (RxDB reactive queries update store asynchronously)
    await new Promise((resolve) => setTimeout(resolve, 200))
  })

  afterEach(async () => {
    await cleanupDatabase()
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

    // Wait for dialog to appear
    await waitFor(() => {
      expect(screen.getByText('Delete Column')).toBeInTheDocument()
      expect(screen.getByText(/Are you sure you want to delete "Column to Delete"/)).toBeInTheDocument()
    })

    // Click the Delete button in the dialog
    const confirmDeleteButton = screen.getByRole('button', { name: 'Delete' })
    await user.click(confirmDeleteButton)

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

    // Wait for dialog to appear
    await waitFor(() => {
      expect(screen.getByText('Delete Column')).toBeInTheDocument()
      expect(screen.getByText(/Are you sure you want to delete "Column to Delete"/)).toBeInTheDocument()
    })

    // Click the Delete button in the dialog
    const confirmDeleteButton = screen.getByRole('button', { name: 'Delete' })
    await user.click(confirmDeleteButton)

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
    await createColumn(boardId, 'Column 0', 0, 'user1')
    await createColumn(boardId, 'Column 1', 1, 'user1')
    await createColumn(boardId, 'Column 2', 2, 'user1')
    await createColumn(boardId, 'Column 3', 3, 'user1')

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

    // Wait for all columns to be loaded
    await waitFor(() => {
      const columns = useColumnsStore.getState().columns
      const boardColumns = columns
        .filter((col) => col.boardId === boardId)
        .sort((a, b) => a.order - b.order)
      expect(boardColumns.length).toBe(4)
    }, { timeout: 2000 })

    const columns = useColumnsStore.getState().columns
    const boardColumns = columns
      .filter((col) => col.boardId === boardId)
      .sort((a, b) => a.order - b.order)

    const column0Id = boardColumns[0].id // Column 0
    // const column2Id = boardColumns[2].id // Column 2 - unused but kept for reference

    // Now we can test the actual updateColumnsOrder function!
    const { updateColumnsOrder } = await import('../../../src/lib/services/columns')

    // Simulate drag end event: Column 0 dragged to position 2 (before Column 3)
    const column0Index = boardColumns.findIndex((c) => c.id === column0Id)

    const mockDropResult: DropResult = {
      draggableId: column0Id,
      source: { droppableId: 'columns', index: column0Index },
      destination: { droppableId: 'columns', index: 2 },
      type: 'COLUMN',
    }

    // Call the actual reorder function
    await updateColumnsOrder(columns, boardId, mockDropResult.source.index, mockDropResult.destination!.index)

    // Wait for database updates to sync back to the store
    // RxDB reactive queries update the store asynchronously
    await waitFor(() => {
      const updatedColumns = useColumnsStore.getState().columns
        .filter((col) => col.boardId === boardId)
        .sort((a, b) => a.order - b.order)

      // After dragging Column 0 to index 2:
      // Original: [Column 0 (0), Column 1 (1), Column 2 (2), Column 3 (3)]
      // Result: [Column 1 (0), Column 2 (1), Column 0 (2), Column 3 (3)]
      expect(updatedColumns.length).toBe(4)
      // Check that Column 0 is at order 2
      const column0 = updatedColumns.find((c) => c.title === 'Column 0')
      const column1 = updatedColumns.find((c) => c.title === 'Column 1')
      const column2 = updatedColumns.find((c) => c.title === 'Column 2')
      const column3 = updatedColumns.find((c) => c.title === 'Column 3')

      expect(column0).toBeDefined()
      expect(column1).toBeDefined()
      expect(column2).toBeDefined()
      expect(column3).toBeDefined()

      expect(column1!.order).toBe(0)
      expect(column2!.order).toBe(1)
      expect(column0!.order).toBe(2)
      expect(column3!.order).toBe(3)
    }, { timeout: 3000 })
  })
})

