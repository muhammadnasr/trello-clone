import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { initDatabase, getDatabase, cleanupDatabase } from '../../../src/lib/db/init'
import { useBoardsStore } from '../../../src/stores/boards'
import { createTestDatabase } from './test-helpers'

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
    // Use in-memory test database
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
    // Initialize database with in-memory test database
    const testDb = await createTestDatabase()
    
    // Insert some boards BEFORE sync starts (simulating existing data)
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

    // Now initialize database (this starts sync)
    await initDatabase(testDb)

    // Wait for sync to process
    await new Promise((resolve) => setTimeout(resolve, 300))

    // Check that store was hydrated
    const boards = useBoardsStore.getState().boards
    expect(boards.length).toBeGreaterThanOrEqual(2)
    expect(boards.some((b) => b.id === 'board1')).toBe(true)
    expect(boards.some((b) => b.id === 'board2')).toBe(true)
  })

  it('cleans up database and subscriptions', async () => {
    const testDb = await createTestDatabase()
    await initDatabase(testDb)
    await cleanupDatabase()

    // Should throw error after cleanup
    expect(() => getDatabase()).toThrow('Database not initialized')
  })
})

