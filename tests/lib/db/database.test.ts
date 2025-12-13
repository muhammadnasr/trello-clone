import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createRxDatabase } from 'rxdb/plugins/core'
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie'
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv'
import { addRxPlugin } from 'rxdb/plugins/core'
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode'
import type { TrelloDatabase } from '../../../src/lib/db/database'
import { boardSchema } from '../../../src/lib/db/collections'

// Enable dev-mode
addRxPlugin(RxDBDevModePlugin)

async function createTestDatabase(name: string): Promise<TrelloDatabase> {
  // Wrap storage with schema validator
  const storage = wrappedValidateAjvStorage({
    storage: getRxStorageDexie(),
  })
  
  const database = await createRxDatabase<TrelloDatabase>({
    name: `test-${name}-${Date.now()}`,
    storage: storage,
    ignoreDuplicate: true,
  })

  await database.addCollections({
    boards: {
      schema: boardSchema,
    },
  })

  return database
}

describe('RxDB Database', () => {
  let db: TrelloDatabase

  beforeEach(async () => {
    db = await createTestDatabase('trello-clone')
  })

  afterEach(async () => {
    if (db && typeof db.remove === 'function') {
      await db.remove()
    }
  })

  it('creates database successfully', () => {
    expect(db).toBeTruthy()
    expect(db.name).toContain('test-trello-clone')
  })

  it('has boards collection', () => {
    expect(db.boards).toBeTruthy()
  })

  it('can insert a board document', async () => {
    const now = new Date().toISOString()
    const board = await db.boards.insert({
      id: 'board1',
      title: 'Test Board',
      createdAt: now,
      updatedAt: now,
      ownerId: 'user1',
    })

    expect(board.id).toBe('board1')
    expect(board.title).toBe('Test Board')
  })

  it('can query boards', async () => {
    const now = new Date().toISOString()
    await db.boards.insert({
      id: 'board1',
      title: 'Test Board',
      createdAt: now,
      updatedAt: now,
      ownerId: 'user1',
    })

    const found = await db.boards.find({
      selector: {
        id: { $eq: 'board1' },
      },
    }).exec()

    expect(found.length).toBe(1)
    expect(found[0].title).toBe('Test Board')
  })
})

describe('Schema Validation', () => {
  let db: TrelloDatabase

  beforeEach(async () => {
    db = await createTestDatabase('schema-validation')
  })

  afterEach(async () => {
    if (db && typeof db.remove === 'function') {
      await db.remove()
    }
  })

  it('rejects document with missing required field', async () => {
    const now = new Date().toISOString()
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invalidDoc: any = {
      id: 'board1',
      title: 'Test Board',
      createdAt: now,
      // missing updatedAt and ownerId
    }
    
    await expect(db.boards.insert(invalidDoc)).rejects.toThrow()
  })

  it('rejects document with invalid date format', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invalidDoc: any = {
      id: 'board1',
      title: 'Test Board',
      createdAt: 'invalid-date',
      updatedAt: new Date().toISOString(),
      ownerId: 'user1',
    }
    
    await expect(db.boards.insert(invalidDoc)).rejects.toThrow()
  })

  it('rejects document with wrong type for title', async () => {
    const now = new Date().toISOString()
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invalidDoc: any = {
      id: 'board1',
      title: 123, // should be string
      createdAt: now,
      updatedAt: now,
      ownerId: 'user1',
    }
    
    await expect(db.boards.insert(invalidDoc)).rejects.toThrow()
  })

  it('rejects document with id exceeding maxLength', async () => {
    const now = new Date().toISOString()
    const longId = 'a'.repeat(101) // exceeds maxLength of 100
    
    await expect(
      db.boards.insert({
        id: longId,
        title: 'Test Board',
        createdAt: now,
        updatedAt: now,
        ownerId: 'user1',
      })
    ).rejects.toThrow()
  })

  it('accepts valid document with all required fields', async () => {
    const now = new Date().toISOString()
    
    const board = await db.boards.insert({
      id: 'board1',
      title: 'Test Board',
      createdAt: now,
      updatedAt: now,
      ownerId: 'user1',
    })

    expect(board).toBeTruthy()
    expect(board.id).toBe('board1')
    expect(board.title).toBe('Test Board')
  })

  it('accepts valid ISO date-time strings', async () => {
    const board = await db.boards.insert({
      id: 'board1',
      title: 'Test Board',
      createdAt: '2025-12-13T20:30:00.000Z',
      updatedAt: '2025-12-13T20:30:00.000Z',
      ownerId: 'user1',
    })

    expect(board.createdAt).toBe('2025-12-13T20:30:00.000Z')
    expect(board.updatedAt).toBe('2025-12-13T20:30:00.000Z')
  })
})

