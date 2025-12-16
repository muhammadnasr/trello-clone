import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from '../../../src/routeTree.gen'
import { useCardsStore } from '../../../src/stores/cards'
import { useColumnsStore } from '../../../src/stores/columns'
import { useBoardsStore } from '../../../src/stores/boards'
import { initDatabase, cleanupDatabase } from '../../../src/lib/db/init'
import { createTestDatabase } from '../../lib/db/test-helpers'

// Mock auth store
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

describe('CardsList Integration - Create Card', () => {
  let boardId: string
  let columnId: string

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
    useCardsStore.setState({
      cards: [],
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
    const column = await createColumn(boardId, 'Test Column', 0, 'user1')
    columnId = column.id

    await new Promise((resolve) => setTimeout(resolve, 200))
  })

  afterEach(async () => {
    await cleanupDatabase()
  })

  it('creates card when form is submitted', async () => {
    const user = userEvent.setup()

    router.history.push(`/boards/${boardId}`)
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByText('Test Column')).toBeInTheDocument()
    }, { timeout: 2000 })

    const addCardButton = screen.getByText('+ Add a card')
    await user.click(addCardButton)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter a title for this card...')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('Enter a title for this card...')
    await user.type(input, 'New Card Title')

    const createButton = screen.getByText('Add card')
    await user.click(createButton)

    await waitFor(() => {
      expect(screen.getByText('New Card Title')).toBeInTheDocument()
    }, { timeout: 2000 })

    const cardsInStore = useCardsStore.getState().cards
    expect(cardsInStore).toHaveLength(1)
    expect(cardsInStore[0].title).toBe('New Card Title')
    expect(cardsInStore[0].columnId).toBe(columnId)
    expect(cardsInStore[0].ownerId).toBe('user1')
  })

  it('creates card without authentication', async () => {
    const user = userEvent.setup()

    // Set unauthenticated state BEFORE creating board/column
    mockAuthState = {
      user: null,
      isLoading: false,
      isAuthenticated: false,
    }
    authSubscribers.forEach((sub) => sub(mockAuthState))
    
    // Wait for sync to update
    await new Promise((resolve) => setTimeout(resolve, 100))
    
    // Create board/column with anonymous ownerId
    const { createBoard } = await import('../../../src/lib/services/boards')
    const { createColumn } = await import('../../../src/lib/services/columns')
    const anonymousBoard = await createBoard('Anonymous Board', 'anonymous')
    const anonymousBoardId = anonymousBoard.id
    const anonymousColumn = await createColumn(anonymousBoardId, 'Anonymous Column', 0, 'anonymous')
    const anonymousColumnId = anonymousColumn.id
    
    // Wait for store to sync
    await new Promise((resolve) => setTimeout(resolve, 200))

    router.history.push(`/boards/${anonymousBoardId}`)
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByText('Anonymous Column')).toBeInTheDocument()
    }, { timeout: 2000 })

    const addCardButton = screen.getByText('+ Add a card')
    await user.click(addCardButton)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter a title for this card...')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('Enter a title for this card...')
    await user.type(input, 'Anonymous Card')

    const createButton = screen.getByText('Add card')
    await user.click(createButton)

    await waitFor(() => {
      expect(screen.getByText('Anonymous Card')).toBeInTheDocument()
    }, { timeout: 2000 })

    const cardsInStore = useCardsStore.getState().cards
    expect(cardsInStore).toHaveLength(1)
    expect(cardsInStore[0].title).toBe('Anonymous Card')
    expect(cardsInStore[0].columnId).toBe(anonymousColumnId)
    expect(cardsInStore[0].ownerId).toBe('anonymous')
  })
})

describe('CardsList Integration - Update Card', () => {
  let boardId: string
  let columnId: string
  let cardId: string

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
    useCardsStore.setState({
      cards: [],
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
    const { createCard } = await import('../../../src/lib/services/cards')
    const board = await createBoard('Test Board', 'user1')
    boardId = board.id
    const column = await createColumn(boardId, 'Test Column', 0, 'user1')
    columnId = column.id
    const card = await createCard(columnId, 'Initial Card Title', 0, 'user1')
    cardId = card.id

    // Wait for stores to sync (RxDB reactive queries update store asynchronously)
    await new Promise((resolve) => setTimeout(resolve, 300))
  })

  afterEach(async () => {
    await cleanupDatabase()
  })

  it('updates card title when edited inline', async () => {
    const user = userEvent.setup()

    router.history.push(`/boards/${boardId}`)
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByText('Initial Card Title')).toBeInTheDocument()
    }, { timeout: 2000 })

    const cardTitle = screen.getByText('Initial Card Title')
    await user.click(cardTitle)

    await waitFor(() => {
      const input = screen.getByDisplayValue('Initial Card Title')
      expect(input).toBeInTheDocument()
    })

    const input = screen.getByDisplayValue('Initial Card Title')
    await user.clear(input)
    await user.type(input, 'Updated Card Title')
    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(screen.getByText('Updated Card Title')).toBeInTheDocument()
      expect(screen.queryByText('Initial Card Title')).not.toBeInTheDocument()
    }, { timeout: 2000 })

    const cardsInStore = useCardsStore.getState().cards
    expect(cardsInStore).toHaveLength(1)
    expect(cardsInStore[0].title).toBe('Updated Card Title')
  })

  it('updates card title when edited without authentication', async () => {
    const user = userEvent.setup()

    // Set unauthenticated state BEFORE creating data
    mockAuthState = {
      user: null,
      isLoading: false,
      isAuthenticated: false,
    }
    authSubscribers.forEach((sub) => sub(mockAuthState))
    
    // Wait for sync to update
    await new Promise((resolve) => setTimeout(resolve, 100))
    
    // Create board/column/card with anonymous ownerId
    const { createBoard } = await import('../../../src/lib/services/boards')
    const { createColumn } = await import('../../../src/lib/services/columns')
    const { createCard } = await import('../../../src/lib/services/cards')
    const anonymousBoard = await createBoard('Anonymous Board', 'anonymous')
    const anonymousBoardId = anonymousBoard.id
    const anonymousColumn = await createColumn(anonymousBoardId, 'Anonymous Column', 0, 'anonymous')
    const anonymousColumnId = anonymousColumn.id
    await createCard(anonymousColumnId, 'Initial Card Title', 0, 'anonymous')
    
    // Wait for store to sync
    await new Promise((resolve) => setTimeout(resolve, 200))

    router.history.push(`/boards/${anonymousBoardId}`)
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByText('Initial Card Title')).toBeInTheDocument()
    }, { timeout: 2000 })

    const cardTitle = screen.getByText('Initial Card Title')
    await user.click(cardTitle)

    await waitFor(() => {
      const input = screen.getByDisplayValue('Initial Card Title')
      expect(input).toBeInTheDocument()
    })

    const input = screen.getByDisplayValue('Initial Card Title')
    await user.clear(input)
    await user.type(input, 'Anonymous Updated Card')
    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(screen.getByText('Anonymous Updated Card')).toBeInTheDocument()
      expect(screen.queryByText('Initial Card Title')).not.toBeInTheDocument()
    }, { timeout: 2000 })

    const cardsInStore = useCardsStore.getState().cards
    expect(cardsInStore).toHaveLength(1)
    expect(cardsInStore[0].title).toBe('Anonymous Updated Card')
    expect(cardsInStore[0].columnId).toBe(anonymousColumnId)
    expect(cardsInStore[0].ownerId).toBe('anonymous')
  })
})

describe('CardsList Integration - Delete Card', () => {
  let boardId: string
  let columnId: string
  let cardId: string

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
    useCardsStore.setState({
      cards: [],
      isLoading: false,
      error: null,
    })
    mockAuthState = {
      user: testUser,
      isLoading: false,
      isAuthenticated: true,
    }
    authSubscribers.forEach((sub) => sub(mockAuthState))
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    const { createBoard } = await import('../../../src/lib/services/boards')
    const { createColumn } = await import('../../../src/lib/services/columns')
    const { createCard } = await import('../../../src/lib/services/cards')
    const board = await createBoard('Test Board', 'user1')
    boardId = board.id
    const column = await createColumn(boardId, 'Test Column', 0, 'user1')
    columnId = column.id
    // Create multiple cards to ensure CardsList renders them
    await createCard(columnId, 'Card 1', 0, 'user1')
    const card = await createCard(columnId, 'Card to Delete', 1, 'user1')
    cardId = card.id
    await createCard(columnId, 'Card 2', 2, 'user1')

    // Wait for stores to sync (RxDB reactive queries update store asynchronously)
    await new Promise((resolve) => setTimeout(resolve, 500))
    
    // Verify cards are in store before test runs
    const cardsInStore = useCardsStore.getState().cards
    console.log('Cards in store before test:', cardsInStore.length, cardsInStore.map(c => c.title))
  })

  afterEach(async () => {
    await cleanupDatabase()
    vi.restoreAllMocks()
  })

  it('deletes card when delete button is clicked and confirmed', async () => {
    const user = userEvent.setup()

    router.history.push(`/boards/${boardId}`)
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByText('Card to Delete')).toBeInTheDocument()
    }, { timeout: 2000 })

    // Find the delete button for "Card to Delete" card
    // Use within() to scope the query to the specific card element
    const cardToDeleteElement = screen.getByText('Card to Delete').closest('.group')
    expect(cardToDeleteElement).toBeInTheDocument()
    
    const cardContainer = within(cardToDeleteElement!)
    const deleteButton = cardContainer.getByTitle('Delete card')
    
    await user.click(deleteButton)

    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining('Card to Delete')
    )

    await waitFor(() => {
      expect(screen.queryByText('Card to Delete')).not.toBeInTheDocument()
    }, { timeout: 2000 })

    // Verify "Card to Delete" was deleted, but other cards remain
    const cardsAfterDelete = useCardsStore.getState().cards
    expect(cardsAfterDelete.length).toBe(2) // Card 1 and Card 2 remain
    expect(cardsAfterDelete.some(c => c.title === 'Card to Delete')).toBe(false)
  })

  it('does not delete card when confirmation is cancelled', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(false)

    router.history.push(`/boards/${boardId}`)
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByText('Card to Delete')).toBeInTheDocument()
    }, { timeout: 2000 })

    // Find the delete button for "Card to Delete" card
    // Use within() to scope the query to the specific card element
    const cardToDeleteElement = screen.getByText('Card to Delete').closest('.group')
    expect(cardToDeleteElement).toBeInTheDocument()
    
    const cardContainer = within(cardToDeleteElement!)
    const deleteButton = cardContainer.getByTitle('Delete card')
    
    await user.click(deleteButton)

    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining('Card to Delete')
    )

    await waitFor(() => {
      expect(screen.getByText('Card to Delete')).toBeInTheDocument()
    }, { timeout: 2000 })

    // Verify card was not deleted (all 3 cards remain)
    const cardsAfterCancel = useCardsStore.getState().cards
    expect(cardsAfterCancel.length).toBe(3) // All cards remain
    expect(cardsAfterCancel.some(c => c.title === 'Card to Delete')).toBe(true)
  })

  it('deletes card without authentication', async () => {
    const user = userEvent.setup()

    // Set unauthenticated state BEFORE creating data
    mockAuthState = {
      user: null,
      isLoading: false,
      isAuthenticated: false,
    }
    authSubscribers.forEach((sub) => sub(mockAuthState))
    
    // Wait for sync to update
    await new Promise((resolve) => setTimeout(resolve, 100))
    
    // Create board/column/card with anonymous ownerId
    const { createBoard } = await import('../../../src/lib/services/boards')
    const { createColumn } = await import('../../../src/lib/services/columns')
    const { createCard } = await import('../../../src/lib/services/cards')
    const anonymousBoard = await createBoard('Anonymous Board', 'anonymous')
    const anonymousBoardId = anonymousBoard.id
    const anonymousColumn = await createColumn(anonymousBoardId, 'Anonymous Column', 0, 'anonymous')
    const anonymousColumnId = anonymousColumn.id
    await createCard(anonymousColumnId, 'Card to Delete', 0, 'anonymous')
    
    // Wait for store to sync
    await new Promise((resolve) => setTimeout(resolve, 200))

    router.history.push(`/boards/${anonymousBoardId}`)
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByText('Card to Delete')).toBeInTheDocument()
    }, { timeout: 2000 })

    // Find the delete button for "Card to Delete" card
    // Use within() to scope the query to the specific card element
    const cardToDeleteElement = screen.getByText('Card to Delete').closest('.group')
    expect(cardToDeleteElement).toBeInTheDocument()
    
    const cardContainer = within(cardToDeleteElement!)
    const deleteButton = cardContainer.getByTitle('Delete card')
    
    await user.click(deleteButton)

    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining('Card to Delete')
    )

    await waitFor(() => {
      expect(screen.queryByText('Card to Delete')).not.toBeInTheDocument()
    }, { timeout: 2000 })
  })
})

