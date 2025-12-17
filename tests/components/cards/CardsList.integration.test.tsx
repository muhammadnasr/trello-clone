import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from '../../../src/routeTree.gen'
import type { DragEndEvent } from '@dnd-kit/core'
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
    const column = await createColumn(boardId, 'Test Column', 0)
    columnId = column.id

    await new Promise((resolve) => setTimeout(resolve, 200))
  })

  afterEach(async () => {
    await cleanupDatabase()
  })

  it('creates card when form is submitted', async () => {
    const user = userEvent.setup()

    // Add some existing cards to test with multiple cards present
    const { createCard } = await import('../../../src/lib/services/cards')
    await createCard(columnId, 'Existing Card 1', 0)
    await createCard(columnId, 'Existing Card 2', 1)
    await new Promise((resolve) => setTimeout(resolve, 200))

    router.history.push(`/boards/${boardId}`)
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByText('Test Column')).toBeInTheDocument()
      expect(screen.getByText('Existing Card 1')).toBeInTheDocument()
      expect(screen.getByText('Existing Card 2')).toBeInTheDocument()
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

    // Verify all cards are present (2 existing + 1 new)
    expect(screen.getByText('Existing Card 1')).toBeInTheDocument()
    expect(screen.getByText('Existing Card 2')).toBeInTheDocument()

    const cardsInStore = useCardsStore.getState().cards
    expect(cardsInStore).toHaveLength(3)
    expect(cardsInStore.some(c => c.title === 'New Card Title')).toBe(true)
    expect(cardsInStore.some(c => c.title === 'Existing Card 1')).toBe(true)
    expect(cardsInStore.some(c => c.title === 'Existing Card 2')).toBe(true)
    expect(cardsInStore.find(c => c.title === 'New Card Title')?.columnId).toBe(columnId)
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

    // Create board/column
    const { createBoard } = await import('../../../src/lib/services/boards')
    const { createColumn } = await import('../../../src/lib/services/columns')
    const { createCard } = await import('../../../src/lib/services/cards')
    const anonymousBoard = await createBoard('Anonymous Board', 'anonymous')
    const anonymousBoardId = anonymousBoard.id
    const anonymousColumn = await createColumn(anonymousBoardId, 'Anonymous Column', 0)
    const anonymousColumnId = anonymousColumn.id
    // Create multiple cards
    await createCard(anonymousColumnId, 'Anonymous Existing 1', 0)
    await createCard(anonymousColumnId, 'Anonymous Existing 2', 1)

    // Wait for store to sync
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Verify cards are synced to store
    await waitFor(() => {
      const cards = useCardsStore.getState().cards
      expect(cards.length).toBeGreaterThanOrEqual(2)
    }, { timeout: 2000 })

    router.history.push(`/boards/${anonymousBoardId}`)
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByText('Anonymous Column')).toBeInTheDocument()
      expect(screen.getByText('Anonymous Existing 1')).toBeInTheDocument()
      expect(screen.getByText('Anonymous Existing 2')).toBeInTheDocument()
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

    // Verify all cards are present (2 existing + 1 new)
    expect(screen.getByText('Anonymous Existing 1')).toBeInTheDocument()
    expect(screen.getByText('Anonymous Existing 2')).toBeInTheDocument()

    const cardsInStore = useCardsStore.getState().cards
    expect(cardsInStore).toHaveLength(3)
    expect(cardsInStore.some(c => c.title === 'Anonymous Card')).toBe(true)
    expect(cardsInStore.some(c => c.title === 'Anonymous Existing 1')).toBe(true)
    expect(cardsInStore.some(c => c.title === 'Anonymous Existing 2')).toBe(true)
    expect(cardsInStore.find(c => c.title === 'Anonymous Card')?.columnId).toBe(anonymousColumnId)
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
    const column = await createColumn(boardId, 'Test Column', 0)
    columnId = column.id
    // Create multiple cards to test with multiple cards present
    await createCard(columnId, 'Other Card 1', 0)
    const card = await createCard(columnId, 'Initial Card Title', 1)
    cardId = card.id
    await createCard(columnId, 'Other Card 2', 2)

    // Wait for stores to sync (RxDB reactive queries update store asynchronously)
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Verify cards are synced to store
    await waitFor(() => {
      const cards = useCardsStore.getState().cards
      expect(cards.length).toBeGreaterThanOrEqual(3)
    }, { timeout: 2000 })
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
      expect(screen.getByText('Other Card 1')).toBeInTheDocument()
      expect(screen.getByText('Other Card 2')).toBeInTheDocument()
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

    // Verify other cards are still present and unchanged
    expect(screen.getByText('Other Card 1')).toBeInTheDocument()
    expect(screen.getByText('Other Card 2')).toBeInTheDocument()

    const cardsInStore = useCardsStore.getState().cards
    expect(cardsInStore).toHaveLength(3)
    expect(cardsInStore.find(c => c.id === cardId)?.title).toBe('Updated Card Title')
    expect(cardsInStore.some(c => c.title === 'Other Card 1')).toBe(true)
    expect(cardsInStore.some(c => c.title === 'Other Card 2')).toBe(true)
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

    // Create board/column/card
    const { createBoard } = await import('../../../src/lib/services/boards')
    const { createColumn } = await import('../../../src/lib/services/columns')
    const { createCard } = await import('../../../src/lib/services/cards')
    const anonymousBoard = await createBoard('Anonymous Board', 'anonymous')
    const anonymousBoardId = anonymousBoard.id
    const anonymousColumn = await createColumn(anonymousBoardId, 'Anonymous Column', 0)
    const anonymousColumnId = anonymousColumn.id
    // Create multiple cards
    await createCard(anonymousColumnId, 'Anonymous Card 1', 0)
    await createCard(anonymousColumnId, 'Initial Card Title', 1)
    await createCard(anonymousColumnId, 'Anonymous Card 2', 2)

    // Wait for store to sync
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Verify cards are synced to store
    await waitFor(() => {
      const cards = useCardsStore.getState().cards
      expect(cards.length).toBeGreaterThanOrEqual(3)
    }, { timeout: 2000 })

    router.history.push(`/boards/${anonymousBoardId}`)
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByText('Initial Card Title')).toBeInTheDocument()
      expect(screen.getByText('Anonymous Card 1')).toBeInTheDocument()
      expect(screen.getByText('Anonymous Card 2')).toBeInTheDocument()
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

    // Verify other cards are still present
    expect(screen.getByText('Anonymous Card 1')).toBeInTheDocument()
    expect(screen.getByText('Anonymous Card 2')).toBeInTheDocument()

    const cardsInStore = useCardsStore.getState().cards
    const cardsInColumn = cardsInStore.filter(c => c.columnId === anonymousColumnId)
    expect(cardsInColumn).toHaveLength(3)
    expect(cardsInColumn.some(c => c.title === 'Anonymous Updated Card')).toBe(true)
    expect(cardsInColumn.some(c => c.title === 'Anonymous Card 1')).toBe(true)
    expect(cardsInColumn.some(c => c.title === 'Anonymous Card 2')).toBe(true)
    expect(cardsInStore.find(c => c.title === 'Anonymous Updated Card')?.columnId).toBe(anonymousColumnId)
  })
})

describe('CardsList Integration - Delete Card', () => {
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
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    const { createBoard } = await import('../../../src/lib/services/boards')
    const { createColumn } = await import('../../../src/lib/services/columns')
    const { createCard } = await import('../../../src/lib/services/cards')
    const board = await createBoard('Test Board', 'user1')
    boardId = board.id
    const column = await createColumn(boardId, 'Test Column', 0)
    columnId = column.id
    // Create multiple cards to ensure CardsList renders them
    await createCard(columnId, 'Card 1', 0)
    await createCard(columnId, 'Card to Delete', 1)
    await createCard(columnId, 'Card 2', 2)

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

    // Create board/column/card
    const { createBoard } = await import('../../../src/lib/services/boards')
    const { createColumn } = await import('../../../src/lib/services/columns')
    const { createCard } = await import('../../../src/lib/services/cards')
    const anonymousBoard = await createBoard('Anonymous Board', 'anonymous')
    const anonymousBoardId = anonymousBoard.id
    const anonymousColumn = await createColumn(anonymousBoardId, 'Anonymous Column', 0)
    const anonymousColumnId = anonymousColumn.id
    await createCard(anonymousColumnId, 'Card to Delete', 0)

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

describe('CardsList Integration - Drag and Drop', () => {
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
    const { createCard } = await import('../../../src/lib/services/cards')
    const board = await createBoard('Test Board', 'user1')
    boardId = board.id
    const column = await createColumn(boardId, 'Test Column', 0)
    columnId = column.id

    // Create 4 cards with orders 0, 1, 2, 3
    await createCard(columnId, 'Card 0', 0)
    await createCard(columnId, 'Card 1', 1)
    await createCard(columnId, 'Card 2', 2)
    await createCard(columnId, 'Card 3', 3)

    await new Promise((resolve) => setTimeout(resolve, 300))
  })

  afterEach(async () => {
    await cleanupDatabase()
  })

  it('renders drag handles for all cards', async () => {
    router.history.push(`/boards/${boardId}`)
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByText('Card 0')).toBeInTheDocument()
      expect(screen.getByText('Card 1')).toBeInTheDocument()
      expect(screen.getByText('Card 2')).toBeInTheDocument()
      expect(screen.getByText('Card 3')).toBeInTheDocument()
    })

    // Check that drag handles are rendered for cards
    // Note: Columns also have drag handles, so we need to find them within card containers
    const card0 = screen.getByText('Card 0').closest('.group')
    const card1 = screen.getByText('Card 1').closest('.group')
    const card2 = screen.getByText('Card 2').closest('.group')
    const card3 = screen.getByText('Card 3').closest('.group')

    expect(card0).toBeInTheDocument()
    expect(card1).toBeInTheDocument()
    expect(card2).toBeInTheDocument()
    expect(card3).toBeInTheDocument()

    // Each card should have a drag handle
    const card0Handle = within(card0!).getByLabelText('Drag handle')
    const card1Handle = within(card1!).getByLabelText('Drag handle')
    const card2Handle = within(card2!).getByLabelText('Drag handle')
    const card3Handle = within(card3!).getByLabelText('Drag handle')

    expect(card0Handle).toBeInTheDocument()
    expect(card1Handle).toBeInTheDocument()
    expect(card2Handle).toBeInTheDocument()
    expect(card3Handle).toBeInTheDocument()
  })

  it('reorders cards when drag ends - move first card to third position', async () => {
    router.history.push(`/boards/${boardId}`)
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByText('Card 0')).toBeInTheDocument()
      expect(screen.getByText('Card 1')).toBeInTheDocument()
      expect(screen.getByText('Card 2')).toBeInTheDocument()
      expect(screen.getByText('Card 3')).toBeInTheDocument()
    })

    const cards = useCardsStore.getState().cards
    const columnCards = cards
      .filter((card) => card.columnId === columnId)
      .sort((a, b) => a.order - b.order)

    const card0Id = columnCards[0].id // Card 0
    const card2Id = columnCards[2].id // Card 2

    // Test the actual handleCardReorder function
    const { handleCardReorder } = await import('../../../src/lib/utils/card-reorder')
    const columns = useColumnsStore.getState().columns

    // Simulate drag end event: Card 0 dragged to after Card 2
    const mockDragEndEvent = {
      active: { id: card0Id },
      over: { id: card2Id },
    } as DragEndEvent

    // Call the actual reorder function
    await handleCardReorder(mockDragEndEvent, cards, columns)

    // Verify the UI updates to show the new order
    await waitFor(() => {
      const updatedCards = useCardsStore.getState().cards
        .filter((card) => card.columnId === columnId)
        .sort((a, b) => a.order - b.order)

      // After dragging Card 0 to after Card 2:
      // Original: [Card 0, Card 1, Card 2, Card 3]
      // Result: [Card 1, Card 2, Card 0, Card 3]
      expect(updatedCards[0].title).toBe('Card 1')
      expect(updatedCards[1].title).toBe('Card 2')
      expect(updatedCards[2].title).toBe('Card 0')
      expect(updatedCards[3].title).toBe('Card 3')
    }, { timeout: 2000 })
  })

  it('reorders cards when drag ends - move last card to first position', async () => {
    router.history.push(`/boards/${boardId}`)
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByText('Card 0')).toBeInTheDocument()
      expect(screen.getByText('Card 3')).toBeInTheDocument()
    })

    const cards = useCardsStore.getState().cards
    const columnCards = cards
      .filter((card) => card.columnId === columnId)
      .sort((a, b) => a.order - b.order)

    const card3Id = columnCards[3].id // Card 3
    const card0Id = columnCards[0].id // Card 0

    const { handleCardReorder } = await import('../../../src/lib/utils/card-reorder')
    const columns = useColumnsStore.getState().columns

    // Simulate drag end event: Card 3 dragged to before Card 0
    const mockDragEndEvent = {
      active: { id: card3Id },
      over: { id: card0Id },
    } as DragEndEvent

    await handleCardReorder(mockDragEndEvent, cards, columns)

    await waitFor(() => {
      const updatedCards = useCardsStore.getState().cards
        .filter((card) => card.columnId === columnId)
        .sort((a, b) => a.order - b.order)

      // After dragging Card 3 to before Card 0:
      // Original: [Card 0, Card 1, Card 2, Card 3]
      // Result: [Card 3, Card 0, Card 1, Card 2]
      expect(updatedCards[0].title).toBe('Card 3')
      expect(updatedCards[1].title).toBe('Card 0')
      expect(updatedCards[2].title).toBe('Card 1')
      expect(updatedCards[3].title).toBe('Card 2')
    }, { timeout: 2000 })
  })

  it('reorders cards when drag ends - move middle card up', async () => {
    router.history.push(`/boards/${boardId}`)
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByText('Card 1')).toBeInTheDocument()
      expect(screen.getByText('Card 0')).toBeInTheDocument()
    })

    const cards = useCardsStore.getState().cards
    const columnCards = cards
      .filter((card) => card.columnId === columnId)
      .sort((a, b) => a.order - b.order)

    const card2Id = columnCards[2].id // Card 2
    const card0Id = columnCards[0].id // Card 0

    const { handleCardReorder } = await import('../../../src/lib/utils/card-reorder')
    const columns = useColumnsStore.getState().columns

    // Simulate drag end event: Card 2 dragged to before Card 0
    const mockDragEndEvent = {
      active: { id: card2Id },
      over: { id: card0Id },
    } as DragEndEvent

    await handleCardReorder(mockDragEndEvent, cards, columns)

    await waitFor(() => {
      const updatedCards = useCardsStore.getState().cards
        .filter((card) => card.columnId === columnId)
        .sort((a, b) => a.order - b.order)

      // After dragging Card 2 to before Card 0:
      // Original: [Card 0, Card 1, Card 2, Card 3]
      // Result: [Card 2, Card 0, Card 1, Card 3]
      expect(updatedCards[0].title).toBe('Card 2')
      expect(updatedCards[1].title).toBe('Card 0')
      expect(updatedCards[2].title).toBe('Card 1')
      expect(updatedCards[3].title).toBe('Card 3')
    }, { timeout: 2000 })
  })

  it('does not reorder when drag ends on same card', async () => {
    router.history.push(`/boards/${boardId}`)
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByText('Card 0')).toBeInTheDocument()
    })

    const cards = useCardsStore.getState().cards
    const columnCards = cards
      .filter((card) => card.columnId === columnId)
      .sort((a, b) => a.order - b.order)

    const card1Id = columnCards[1].id // Card 1

    const { handleCardReorder } = await import('../../../src/lib/utils/card-reorder')
    const columns = useColumnsStore.getState().columns

    // Simulate drag end event: Card 1 dragged to itself
    const mockDragEndEvent = {
      active: { id: card1Id },
      over: { id: card1Id },
    } as DragEndEvent

    await handleCardReorder(mockDragEndEvent, cards, columns)

    // Wait a bit to ensure no updates happened
    await new Promise((resolve) => setTimeout(resolve, 200))

    const updatedCards = useCardsStore.getState().cards
      .filter((card) => card.columnId === columnId)
      .sort((a, b) => a.order - b.order)

    // Order should remain unchanged
    expect(updatedCards[0].title).toBe('Card 0')
    expect(updatedCards[1].title).toBe('Card 1')
    expect(updatedCards[2].title).toBe('Card 2')
    expect(updatedCards[3].title).toBe('Card 3')
  })

  it('does not reorder when drag ends without over target', async () => {
    router.history.push(`/boards/${boardId}`)
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByText('Card 0')).toBeInTheDocument()
    })

    const cards = useCardsStore.getState().cards

    const { handleCardReorder } = await import('../../../src/lib/utils/card-reorder')
    const columns = useColumnsStore.getState().columns

    // Simulate drag end event without over target
    const mockDragEndEvent = {
      active: { id: 'card-1' },
      over: null,
    } as DragEndEvent

    await handleCardReorder(mockDragEndEvent, cards, columns)

    // Wait a bit to ensure no updates happened
    await new Promise((resolve) => setTimeout(resolve, 200))

    const updatedCards = useCardsStore.getState().cards
      .filter((card) => card.columnId === columnId)
      .sort((a, b) => a.order - b.order)

    // Order should remain unchanged
    expect(updatedCards[0].title).toBe('Card 0')
    expect(updatedCards[1].title).toBe('Card 1')
    expect(updatedCards[2].title).toBe('Card 2')
    expect(updatedCards[3].title).toBe('Card 3')
  })
})

describe('CardsList Integration - Cross-Column Drag and Drop', () => {
  let boardId: string
  let column1Id: string
  let column2Id: string

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
    const column1 = await createColumn(boardId, 'Column 1', 0)
    column1Id = column1.id
    const column2 = await createColumn(boardId, 'Column 2', 1)
    column2Id = column2.id

    // Create cards in column 1
    await createCard(column1Id, 'Card 1-0', 0)
    await createCard(column1Id, 'Card 1-1', 1)
    await createCard(column1Id, 'Card 1-2', 2)

    // Create cards in column 2
    await createCard(column2Id, 'Card 2-0', 0)
    await createCard(column2Id, 'Card 2-1', 1)

    await new Promise((resolve) => setTimeout(resolve, 300))
  })

  afterEach(async () => {
    await cleanupDatabase()
  })

  it('moves card from one column to another when dropped on column', async () => {
    router.history.push(`/boards/${boardId}`)
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByText('Card 1-0')).toBeInTheDocument()
      expect(screen.getByText('Card 2-0')).toBeInTheDocument()
    })

    const cards = useCardsStore.getState().cards
    const columns = useColumnsStore.getState().columns

    const column1Cards = cards
      .filter((card) => card.columnId === column1Id)
      .sort((a, b) => a.order - b.order)
    const cardToMove = column1Cards[0] // Card 1-0

    const { handleCardReorder } = await import('../../../src/lib/utils/card-reorder')

    // Simulate drag end event: Card 1-0 dragged to Column 2
    const mockDragEndEvent = {
      active: { id: cardToMove.id },
      over: { id: column2Id },
    } as DragEndEvent

    await handleCardReorder(mockDragEndEvent, cards, columns)

    await waitFor(() => {
      const updatedCards = useCardsStore.getState().cards
      const column1CardsAfter = updatedCards
        .filter((card) => card.columnId === column1Id)
        .sort((a, b) => a.order - b.order)
      const column2CardsAfter = updatedCards
        .filter((card) => card.columnId === column2Id)
        .sort((a, b) => a.order - b.order)

      // Column 1 should have 2 cards: Card 1-1, Card 1-2
      expect(column1CardsAfter.length).toBe(2)
      expect(column1CardsAfter[0].title).toBe('Card 1-1')
      expect(column1CardsAfter[1].title).toBe('Card 1-2')

      // Column 2 should have 3 cards: Card 2-0, Card 2-1, Card 1-0
      expect(column2CardsAfter.length).toBe(3)
      expect(column2CardsAfter[0].title).toBe('Card 2-0')
      expect(column2CardsAfter[1].title).toBe('Card 2-1')
      expect(column2CardsAfter[2].title).toBe('Card 1-0')
    }, { timeout: 2000 })
  })

  it('moves card from one column to another when dropped on a card in target column', async () => {
    router.history.push(`/boards/${boardId}`)
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByText('Card 1-0')).toBeInTheDocument()
      expect(screen.getByText('Card 2-0')).toBeInTheDocument()
    })

    const cards = useCardsStore.getState().cards
    const columns = useColumnsStore.getState().columns

    const column1Cards = cards
      .filter((card) => card.columnId === column1Id)
      .sort((a, b) => a.order - b.order)
    const column2Cards = cards
      .filter((card) => card.columnId === column2Id)
      .sort((a, b) => a.order - b.order)

    const cardToMove = column1Cards[0] // Card 1-0
    const targetCard = column2Cards[0] // Card 2-0

    const { handleCardReorder } = await import('../../../src/lib/utils/card-reorder')

    // Simulate drag end event: Card 1-0 dragged to Card 2-0 (insert before it)
    const mockDragEndEvent = {
      active: { id: cardToMove.id },
      over: { id: targetCard.id },
    } as DragEndEvent

    await handleCardReorder(mockDragEndEvent, cards, columns)

    await waitFor(() => {
      const updatedCards = useCardsStore.getState().cards
      const column1CardsAfter = updatedCards
        .filter((card) => card.columnId === column1Id)
        .sort((a, b) => a.order - b.order)
      const column2CardsAfter = updatedCards
        .filter((card) => card.columnId === column2Id)
        .sort((a, b) => a.order - b.order)

      // Column 1 should have 2 cards: Card 1-1, Card 1-2
      expect(column1CardsAfter.length).toBe(2)
      expect(column1CardsAfter[0].title).toBe('Card 1-1')
      expect(column1CardsAfter[1].title).toBe('Card 1-2')

      // Column 2 should have 3 cards: Card 1-0, Card 2-0, Card 2-1
      expect(column2CardsAfter.length).toBe(3)
      expect(column2CardsAfter[0].title).toBe('Card 1-0')
      expect(column2CardsAfter[1].title).toBe('Card 2-0')
      expect(column2CardsAfter[2].title).toBe('Card 2-1')
    }, { timeout: 2000 })
  })

  it('maintains correct order in both columns after cross-column move', async () => {
    router.history.push(`/boards/${boardId}`)
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByText('Card 1-1')).toBeInTheDocument()
      expect(screen.getByText('Card 2-1')).toBeInTheDocument()
    })

    const cards = useCardsStore.getState().cards
    const columns = useColumnsStore.getState().columns

    const column1Cards = cards
      .filter((card) => card.columnId === column1Id)
      .sort((a, b) => a.order - b.order)
    const cardToMove = column1Cards[1] // Card 1-1 (middle card)

    const { handleCardReorder } = await import('../../../src/lib/utils/card-reorder')

    // Simulate drag end event: Card 1-1 dragged to Column 2
    const mockDragEndEvent = {
      active: { id: cardToMove.id },
      over: { id: column2Id },
    } as DragEndEvent

    await handleCardReorder(mockDragEndEvent, cards, columns)

    await waitFor(() => {
      const updatedCards = useCardsStore.getState().cards
      const column1CardsAfter = updatedCards
        .filter((card) => card.columnId === column1Id)
        .sort((a, b) => a.order - b.order)
      const column2CardsAfter = updatedCards
        .filter((card) => card.columnId === column2Id)
        .sort((a, b) => a.order - b.order)

      // Column 1 should have 2 cards with sequential orders
      expect(column1CardsAfter.length).toBe(2)
      expect(column1CardsAfter[0].order).toBe(0)
      expect(column1CardsAfter[1].order).toBe(1)

      // Column 2 should have 3 cards with sequential orders
      expect(column2CardsAfter.length).toBe(3)
      expect(column2CardsAfter[0].order).toBe(0)
      expect(column2CardsAfter[1].order).toBe(1)
      expect(column2CardsAfter[2].order).toBe(2)
    }, { timeout: 2000 })
  })
})

