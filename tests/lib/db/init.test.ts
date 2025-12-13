import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { initDatabase, getDatabase, cleanupDatabase } from '../../../src/lib/db/init'
import { useBoardsStore } from '../../../src/stores/boards'

describe('Database Initialization', () => {
  beforeEach(async () => {
    // Cleanup before each test
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
    const db = await initDatabase()
    expect(db).toBeTruthy()
    expect(db.name).toBe('trello-clone')
  })

  it('returns same instance on multiple calls', async () => {
    const db1 = await initDatabase()
    const db2 = await initDatabase()
    expect(db1).toBe(db2)
  })

  it('gets database instance after initialization', async () => {
    await initDatabase()
    const db = getDatabase()
    expect(db).toBeTruthy()
  })

  it('throws error if getDatabase called before init', () => {
    expect(() => getDatabase()).toThrow('Database not initialized')
  })

  it('hydrates store with existing boards from RxDB', async () => {
    // Initialize database
    const db = await initDatabase()

    // Insert some boards before sync starts (simulating existing data)
    const now = new Date().toISOString()
    await db.boards.insert({
      id: 'board1',
      title: 'Existing Board 1',
      createdAt: now,
      updatedAt: now,
      ownerId: 'user1',
    })
    await db.boards.insert({
      id: 'board2',
      title: 'Existing Board 2',
      createdAt: now,
      updatedAt: now,
      ownerId: 'user1',
    })

    // Wait for sync to process
    await new Promise((resolve) => setTimeout(resolve, 200))

    // Check that store was hydrated
    const boards = useBoardsStore.getState().boards
    expect(boards.length).toBeGreaterThanOrEqual(2)
    expect(boards.some((b) => b.id === 'board1')).toBe(true)
    expect(boards.some((b) => b.id === 'board2')).toBe(true)
  })

  it('cleans up database and subscriptions', async () => {
    await initDatabase()
    await cleanupDatabase()

    // Should throw error after cleanup
    expect(() => getDatabase()).toThrow('Database not initialized')
  })
})

