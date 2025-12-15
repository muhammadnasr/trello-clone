import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { initDatabase, getDatabase, cleanupDatabase } from '../../../src/lib/db/init'
import { useBoardsStore } from '../../../src/stores/boards'
import { createTestDatabase } from './test-helpers'

// Mock auth store
const mockUser = {
  uid: 'user1',
  email: 'test@example.com',
} as any

const mockAuthState = {
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

describe('Database Initialization', () => {
  beforeEach(async () => {
    await cleanupDatabase()
    useBoardsStore.setState({
      boards: [],
      isLoading: false,
      error: null,
    })
  })

  afterEach(async () => {
    await cleanupDatabase()
  })

  it('initializes database successfully', async () => {
    const testDb = await createTestDatabase()
    const db = await initDatabase(testDb)
    expect(db).toBeTruthy()
    expect(db.name).toBeTruthy()
  })

  it('returns same instance on multiple calls', async () => {
    const testDb = await createTestDatabase()
    const db1 = await initDatabase(testDb)
    const db2 = await initDatabase(testDb)
    expect(db1).toBe(db2)
  })

  it('gets database instance after initialization', async () => {
    const testDb = await createTestDatabase()
    await initDatabase(testDb)
    const db = getDatabase()
    expect(db).toBeTruthy()
  })

  it('throws error if getDatabase called before init', () => {
    expect(() => getDatabase()).toThrow('Database not initialized')
  })

  it('hydrates store with existing boards from RxDB', async () => {
    const testDb = await createTestDatabase()
    
    const now = new Date().toISOString()
    await testDb.boards.insert({
      id: 'board1',
      title: 'Existing Board 1',
      createdAt: now,
      updatedAt: now,
      ownerId: 'user1',
    })
    await testDb.boards.insert({
      id: 'board2',
      title: 'Existing Board 2',
      createdAt: now,
      updatedAt: now,
      ownerId: 'user1',
    })

    await initDatabase(testDb)

    await new Promise((resolve) => setTimeout(resolve, 300))

    const boards = useBoardsStore.getState().boards
    expect(boards.length).toBeGreaterThanOrEqual(2)
    expect(boards.some((b) => b.id === 'board1')).toBe(true)
    expect(boards.some((b) => b.id === 'board2')).toBe(true)
  })

  it('cleans up database and subscriptions', async () => {
    const testDb = await createTestDatabase()
    await initDatabase(testDb)
    await cleanupDatabase()

    expect(() => getDatabase()).toThrow('Database not initialized')
  })
})

