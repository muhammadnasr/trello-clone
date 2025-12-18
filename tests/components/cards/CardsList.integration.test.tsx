import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from '../../../src/routeTree.gen'
import type { DropResult } from '@hello-pangea/dnd'
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

    // Add some existing cards to test with multiple cards present
    const { createCard } = await import('../../../src/lib/services/cards')
    await createCard(columnId, 'Existing Card 1', 0, 'user1')
    await createCard(columnId, 'Existing Card 2', 1, 'user1')
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
    expect(cardsInStore.find(c => c.title === 'New Card Title')?.ownerId).toBe('user1')
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

    // Create board/column with anonymous ownerId
    const { createBoard } = await import('../../../src/lib/services/boards')
    const { createColumn } = await import('../../../src/lib/services/columns')
    const { createCard } = await import('../../../src/lib/services/cards')
    const anonymousBoard = await createBoard('Anonymous Board', 'anonymous')
    const anonymousBoardId = anonymousBoard.id
    const anonymousColumn = await createColumn(anonymousBoardId, 'Anonymous Column', 0, 'anonymous')
    const anonymousColumnId = anonymousColumn.id
    // Create multiple cards
    await createCard(anonymousColumnId, 'Anonymous Existing 1', 0, 'anonymous')
    await createCard(anonymousColumnId, 'Anonymous Existing 2', 1, 'anonymous')

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
    expect(cardsInStore.find(c => c.title === 'Anonymous Card')?.ownerId).toBe('anonymous')
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
    // Create multiple cards to test with multiple cards present
    await createCard(columnId, 'Other Card 1', 0, 'user1')
    const card = await createCard(columnId, 'Initial Card Title', 1, 'user1')
    cardId = card.id
    await createCard(columnId, 'Other Card 2', 2, 'user1')

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

    // Create board/column/card with anonymous ownerId
    const { createBoard } = await import('../../../src/lib/services/boards')
    const { createColumn } = await import('../../../src/lib/services/columns')
    const { createCard } = await import('../../../src/lib/services/cards')
    const anonymousBoard = await createBoard('Anonymous Board', 'anonymous')
    const anonymousBoardId = anonymousBoard.id
    const anonymousColumn = await createColumn(anonymousBoardId, 'Anonymous Column', 0, 'anonymous')
    const anonymousColumnId = anonymousColumn.id
    // Create multiple cards
    await createCard(anonymousColumnId, 'Anonymous Card 1', 0, 'anonymous')
    await createCard(anonymousColumnId, 'Initial Card Title', 1, 'anonymous')
    await createCard(anonymousColumnId, 'Anonymous Card 2', 2, 'anonymous')

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
    expect(cardsInStore).toHaveLength(3)
    expect(cardsInStore.some(c => c.title === 'Anonymous Updated Card')).toBe(true)
    expect(cardsInStore.some(c => c.title === 'Anonymous Card 1')).toBe(true)
    expect(cardsInStore.some(c => c.title === 'Anonymous Card 2')).toBe(true)
    expect(cardsInStore.find(c => c.title === 'Anonymous Updated Card')?.columnId).toBe(anonymousColumnId)
    expect(cardsInStore.find(c => c.title === 'Anonymous Updated Card')?.ownerId).toBe('anonymous')
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

    const { createBoard } = await import('../../../src/lib/services/boards')
    const { createColumn } = await import('../../../src/lib/services/columns')
    const { createCard } = await import('../../../src/lib/services/cards')
    const board = await createBoard('Test Board', 'user1')
    boardId = board.id
    const column = await createColumn(boardId, 'Test Column', 0, 'user1')
    columnId = column.id
    // Create multiple cards to ensure CardsList renders them
    await createCard(columnId, 'Card 1', 0, 'user1')
    await createCard(columnId, 'Card to Delete', 1, 'user1')
    await createCard(columnId, 'Card 2', 2, 'user1')

    // Wait for stores to sync (RxDB reactive queries update store asynchronously)
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Verify cards are in store before test runs
    const cardsInStore = useCardsStore.getState().cards
    console.log('Cards in store before test:', cardsInStore.length, cardsInStore.map(c => c.title))
  })

  afterEach(async () => {
    await cleanupDatabase()
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

    // Wait for dialog to appear
    await waitFor(() => {
      expect(screen.getByText('Delete Card')).toBeInTheDocument()
      expect(screen.getByText(/Are you sure you want to delete "Card to Delete"/)).toBeInTheDocument()
    })

    // Click the Delete button in the dialog
    const confirmDeleteButton = screen.getByRole('button', { name: 'Delete' })
    await user.click(confirmDeleteButton)

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

    // Wait for dialog to appear
    await waitFor(() => {
      expect(screen.getByText('Delete Card')).toBeInTheDocument()
      expect(screen.getByText(/Are you sure you want to delete "Card to Delete"/)).toBeInTheDocument()
    })

    // Click the Cancel button in the dialog
    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
    await user.click(cancelButton)

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

    // Wait for dialog to appear
    await waitFor(() => {
      expect(screen.getByText('Delete Card')).toBeInTheDocument()
      expect(screen.getByText(/Are you sure you want to delete "Card to Delete"/)).toBeInTheDocument()
    })

    // Click the Delete button in the dialog
    const confirmDeleteButton = screen.getByRole('button', { name: 'Delete' })
    await user.click(confirmDeleteButton)

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
    const column = await createColumn(boardId, 'Test Column', 0, 'user1')
    columnId = column.id

    // Create 4 cards with orders 0, 1, 2, 3
    await createCard(columnId, 'Card 0', 0, 'user1')
    await createCard(columnId, 'Card 1', 1, 'user1')
    await createCard(columnId, 'Card 2', 2, 'user1')
    await createCard(columnId, 'Card 3', 3, 'user1')

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
    // const card2Id = columnCards[2].id // Card 2 - unused but kept for reference

    // Test the actual handleCardReorder function
    const { handleCardReorder } = await import('../../../src/lib/utils/card-reorder')

    // Simulate drag end event: Card 0 dragged to third position (index 2)
    // Find indices
    const card0Index = columnCards.findIndex((c) => c.id === card0Id)

    const mockDropResult: DropResult = {
      draggableId: card0Id,
      source: { droppableId: columnId, index: card0Index },
      destination: { droppableId: columnId, index: 2 },
      type: 'CARD',
    }

    // Call the actual reorder function
    await handleCardReorder(mockDropResult)

    // Wait for database updates to sync back to the store
    await new Promise((resolve) => setTimeout(resolve, 300))

    // Verify the UI updates to show the new order
    await waitFor(() => {
      const updatedCards = useCardsStore.getState().cards
        .filter((card) => card.columnId === columnId)
        .sort((a, b) => a.order - b.order)

      // After dragging Card 0 to index 2 (third position):
      // Original: [Card 0 (0), Card 1 (1), Card 2 (2), Card 3 (3)]
      // Result: [Card 1 (0), Card 2 (1), Card 0 (2), Card 3 (3)]
      expect(updatedCards.length).toBe(4)
      expect(updatedCards[0].title).toBe('Card 1')
      expect(updatedCards[1].title).toBe('Card 2')
      expect(updatedCards[2].title).toBe('Card 0')
      expect(updatedCards[3].title).toBe('Card 3')
    }, { timeout: 3000 })
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

    // Simulate drag end event: Card 3 dragged to before Card 0
    const card3Index = columnCards.findIndex((c) => c.id === card3Id)
    const card0Index = columnCards.findIndex((c) => c.id === card0Id)

    const mockDropResult: DropResult = {
      draggableId: card3Id,
      source: { droppableId: columnId, index: card3Index },
      destination: { droppableId: columnId, index: card0Index },
      type: 'CARD',
    }

    await handleCardReorder(mockDropResult)

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

    // Simulate drag end event: Card 2 dragged to before Card 0
    const card2Index = columnCards.findIndex((c) => c.id === card2Id)
    const card0Index = columnCards.findIndex((c) => c.id === card0Id)

    const mockDropResult: DropResult = {
      draggableId: card2Id,
      source: { droppableId: columnId, index: card2Index },
      destination: { droppableId: columnId, index: card0Index },
      type: 'CARD',
    }

    await handleCardReorder(mockDropResult)

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

    // Simulate drag end event: Card 1 dragged to itself
    const card1Index = columnCards.findIndex((c) => c.id === card1Id)

    const mockDropResult: DropResult = {
      draggableId: card1Id,
      source: { droppableId: columnId, index: card1Index },
      destination: { droppableId: columnId, index: card1Index },
      type: 'CARD',
    }

    await handleCardReorder(mockDropResult)

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

    const { handleCardReorder } = await import('../../../src/lib/utils/card-reorder')

    // Simulate drag end event without destination
    const mockDropResult: DropResult = {
      draggableId: 'card-1',
      source: { droppableId: columnId, index: 0 },
      destination: null,
      type: 'CARD',
    }

    await handleCardReorder(mockDropResult)

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
    const column1 = await createColumn(boardId, 'Column 1', 0, 'user1')
    column1Id = column1.id
    const column2 = await createColumn(boardId, 'Column 2', 1, 'user1')
    column2Id = column2.id

    // Create cards in column 1
    await createCard(column1Id, 'Card 1-0', 0, 'user1')
    await createCard(column1Id, 'Card 1-1', 1, 'user1')
    await createCard(column1Id, 'Card 1-2', 2, 'user1')

    // Create cards in column 2
    await createCard(column2Id, 'Card 2-0', 0, 'user1')
    await createCard(column2Id, 'Card 2-1', 1, 'user1')

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

    const column1Cards = cards
      .filter((card) => card.columnId === column1Id)
      .sort((a, b) => a.order - b.order)
    const cardToMove = column1Cards[0] // Card 1-0

    const { handleCardReorder } = await import('../../../src/lib/utils/card-reorder')

    // Simulate drag end event: Card 1-0 dragged to Column 2
    const cardIndex = column1Cards.findIndex((c) => c.id === cardToMove.id)
    const column2Cards = cards
      .filter((card) => card.columnId === column2Id)
      .sort((a, b) => a.order - b.order)

    const mockDropResult: DropResult = {
      draggableId: cardToMove.id,
      source: { droppableId: column1Id, index: cardIndex },
      destination: { droppableId: column2Id, index: column2Cards.length },
      type: 'CARD',
    }

    await handleCardReorder(mockDropResult)

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
    const cardIndex = column1Cards.findIndex((c) => c.id === cardToMove.id)
    const targetIndex = column2Cards.findIndex((c) => c.id === targetCard.id)

    const mockDropResult: DropResult = {
      draggableId: cardToMove.id,
      source: { droppableId: column1Id, index: cardIndex },
      destination: { droppableId: column2Id, index: targetIndex },
      type: 'CARD',
    }

    await handleCardReorder(mockDropResult)

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

    const column1Cards = cards
      .filter((card) => card.columnId === column1Id)
      .sort((a, b) => a.order - b.order)
    const cardToMove = column1Cards[1] // Card 1-1 (middle card)

    const { handleCardReorder } = await import('../../../src/lib/utils/card-reorder')

    // Simulate drag end event: Card 1-1 dragged to Column 2
    const cardIndex = column1Cards.findIndex((c) => c.id === cardToMove.id)
    const column2Cards = cards
      .filter((card) => card.columnId === column2Id)
      .sort((a, b) => a.order - b.order)

    const mockDropResult: DropResult = {
      draggableId: cardToMove.id,
      source: { droppableId: column1Id, index: cardIndex },
      destination: { droppableId: column2Id, index: column2Cards.length },
      type: 'CARD',
    }

    await handleCardReorder(mockDropResult)

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

