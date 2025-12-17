import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { TrelloDatabase } from '../../../src/lib/db/database'
import { syncBoardsToStore, syncColumnsToStore } from '../../../src/lib/db/sync'
import { useBoardsStore } from '../../../src/stores/boards'
import { useColumnsStore } from '../../../src/stores/columns'
import { createTestDatabase } from './test-helpers'

// Mock auth store
const mockUser = {
  uid: 'user1',
  email: 'test@example.com',
} as any

let mockAuthState = {
  user: mockUser,
  isLoading: false,
  isAuthenticated: true,
}

vi.mock('../../../src/stores/auth', () => ({
  useAuthStore: Object.assign(
    (selector: any) => selector(mockAuthState),
    {
      getState: () => mockAuthState,
      subscribe: vi.fn((callback: any) => {
        callback(mockAuthState)
        return () => {}
      }),
    }
  ),
}))

describe('RxDB-Zustand Sync', () => {
  let db: TrelloDatabase
  let unsubscribe: (() => void) | null = null

  beforeEach(async () => {
    db = await createTestDatabase()
    useBoardsStore.setState({
      boards: [],
      isLoading: false,
      error: null,
    })
    // Reset auth state
    mockAuthState = {
      user: mockUser,
      isLoading: false,
      isAuthenticated: true,
    }
  })

  afterEach(async () => {
    if (unsubscribe) {
      unsubscribe()
    }
    if (db && typeof db.remove === 'function') {
      await db.remove()
    }
  })

  it('syncs boards from RxDB to Zustand store', async () => {
    unsubscribe = syncBoardsToStore(db)

    const now = new Date().toISOString()
    await db.boards.insert({
      id: 'board1',
      title: 'Test Board',
      createdAt: now,
      updatedAt: now,
      ownerId: 'user1',
      accessibleUserIds: ['user1'],
    })

    await new Promise((resolve) => setTimeout(resolve, 100))

    const boards = useBoardsStore.getState().boards
    expect(boards).toHaveLength(1)
    expect(boards[0].id).toBe('board1')
    expect(boards[0].title).toBe('Test Board')
  })

  it('updates store when board is updated in RxDB', async () => {
    unsubscribe = syncBoardsToStore(db)

    const now = new Date().toISOString()
    const board = await db.boards.insert({
      id: 'board1',
      title: 'Original Title',
      createdAt: now,
      updatedAt: now,
      ownerId: 'user1',
      accessibleUserIds: ['user1'],
    })

    await new Promise((resolve) => setTimeout(resolve, 100))

    await board.patch({
      title: 'Updated Title',
      updatedAt: new Date().toISOString(),
    })

    await new Promise((resolve) => setTimeout(resolve, 100))

    const boards = useBoardsStore.getState().boards
    expect(boards[0].title).toBe('Updated Title')
  })

  it('updates store when board is removed from RxDB', async () => {
    unsubscribe = syncBoardsToStore(db)

    const now = new Date().toISOString()
    const board = await db.boards.insert({
      id: 'board1',
      title: 'Test Board',
      createdAt: now,
      updatedAt: now,
      ownerId: 'user1',
      accessibleUserIds: ['user1'],
    })

    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(useBoardsStore.getState().boards).toHaveLength(1)

    await board.remove()

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(useBoardsStore.getState().boards).toHaveLength(0)
  })

  it('can unsubscribe from sync', async () => {
    unsubscribe = syncBoardsToStore(db)

    const now = new Date().toISOString()
    await db.boards.insert({
      id: 'board1',
      title: 'Test Board',
      createdAt: now,
      updatedAt: now,
      ownerId: 'user1',
      accessibleUserIds: ['user1'],
    })

    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(useBoardsStore.getState().boards).toHaveLength(1)

    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }

    await db.boards.insert({
      id: 'board2',
      title: 'Board 2',
      createdAt: now,
      updatedAt: now,
      ownerId: 'user1',
      accessibleUserIds: ['user1'],
    })

    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(useBoardsStore.getState().boards).toHaveLength(1)
  })
})

describe('RxDB-Zustand Columns Sync', () => {
  let db: TrelloDatabase
  let unsubscribe: (() => void) | null = null

  beforeEach(async () => {
    db = await createTestDatabase()
    useColumnsStore.setState({
      columns: [],
      isLoading: false,
      error: null,
    })
    // Reset auth state
    mockAuthState = {
      user: mockUser,
      isLoading: false,
      isAuthenticated: true,
    }
    // Create a board owned by the user for columns to belong to
    const now = new Date().toISOString()
    await db.boards.insert({
      id: 'board1',
      title: 'Test Board',
      createdAt: now,
      updatedAt: now,
      ownerId: 'user1',
      accessibleUserIds: ['user1'],
    })
  })

  afterEach(async () => {
    if (unsubscribe) {
      unsubscribe()
    }
    if (db && typeof db.remove === 'function') {
      await db.remove()
    }
  })

  it('syncs columns from RxDB to Zustand store', async () => {
    unsubscribe = syncColumnsToStore(db)

    const now = new Date().toISOString()
    await db.columns.insert({
      id: 'column1',
      boardId: 'board1',
      title: 'Test Column',
      order: 0,
      ownerId: 'user1',
      accessibleUserIds: ['user1'],
      createdAt: now,
      updatedAt: now,
    })

    await new Promise((resolve) => setTimeout(resolve, 100))

    const columns = useColumnsStore.getState().columns
    expect(columns).toHaveLength(1)
    expect(columns[0].id).toBe('column1')
    expect(columns[0].title).toBe('Test Column')
  })

  it('updates store when column is updated in RxDB', async () => {
    unsubscribe = syncColumnsToStore(db)

    const now = new Date().toISOString()
    const column = await db.columns.insert({
      id: 'column1',
      boardId: 'board1',
      title: 'Original Title',
      order: 0,
      ownerId: 'user1',
      accessibleUserIds: ['user1'],
      createdAt: now,
      updatedAt: now,
    })

    await new Promise((resolve) => setTimeout(resolve, 100))

    await column.patch({
      title: 'Updated Title',
      updatedAt: new Date().toISOString(),
    })

    await new Promise((resolve) => setTimeout(resolve, 100))

    const columns = useColumnsStore.getState().columns
    expect(columns[0].title).toBe('Updated Title')
  })

  it('updates store when column is removed from RxDB', async () => {
    unsubscribe = syncColumnsToStore(db)

    const now = new Date().toISOString()
    const column = await db.columns.insert({
      id: 'column1',
      boardId: 'board1',
      title: 'Test Column',
      order: 0,
      ownerId: 'user1',
      accessibleUserIds: ['user1'],
      createdAt: now,
      updatedAt: now,
    })

    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(useColumnsStore.getState().columns).toHaveLength(1)

    await column.remove()

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(useColumnsStore.getState().columns).toHaveLength(0)
  })

  it('can unsubscribe from columns sync', async () => {
    unsubscribe = syncColumnsToStore(db)

    const now = new Date().toISOString()
    await db.columns.insert({
      id: 'column1',
      boardId: 'board1',
      title: 'Test Column',
      order: 0,
      ownerId: 'user1',
      accessibleUserIds: ['user1'],
      createdAt: now,
      updatedAt: now,
    })

    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(useColumnsStore.getState().columns).toHaveLength(1)

    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }

    await db.columns.insert({
      id: 'column2',
      boardId: 'board1',
      title: 'Column 2',
      order: 1,
      ownerId: 'user1',
      accessibleUserIds: ['user1'],
      createdAt: now,
      updatedAt: now,
    })

    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(useColumnsStore.getState().columns).toHaveLength(1)
  })
})

