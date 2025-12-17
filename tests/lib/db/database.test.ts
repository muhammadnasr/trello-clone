import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { TrelloDatabase } from '../../../src/lib/db/database'
import { createTestDatabase } from './test-helpers'

describe('RxDB Database', () => {
  let db: TrelloDatabase

  beforeEach(async () => {
    db = await createTestDatabase()
  })

  afterEach(async () => {
    if (db && typeof db.remove === 'function') {
      await db.remove()
    }
  })

  it('creates database successfully', () => {
    expect(db).toBeTruthy()
    expect(db.name).toBeTruthy()
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
      accessibleUserIds: ['user1'],
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
      accessibleUserIds: ['user1'],
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
    db = await createTestDatabase()
  })

  afterEach(async () => {
    if (db && typeof db.remove === 'function') {
      await db.remove()
    }
  })

  it('rejects document with missing required field', async () => {
    const now = new Date().toISOString()
    
     
    const invalidDoc: any = {
      id: 'board1',
      title: 'Test Board',
      createdAt: now,
      // missing updatedAt, ownerId, and accessibleUserIds
    }
    
    await expect(db.boards.insert(invalidDoc)).rejects.toThrow()
  })

  it('rejects document with invalid date format', async () => {
     
    const invalidDoc: any = {
      id: 'board1',
      title: 'Test Board',
      createdAt: 'invalid-date',
      updatedAt: new Date().toISOString(),
      ownerId: 'user1',
      accessibleUserIds: ['user1'],
    }
    
    await expect(db.boards.insert(invalidDoc)).rejects.toThrow()
  })

  it('rejects document with wrong type for title', async () => {
    const now = new Date().toISOString()
    
     
    const invalidDoc: any = {
      id: 'board1',
      title: 123, // should be string
      createdAt: now,
      updatedAt: now,
      ownerId: 'user1',
      accessibleUserIds: ['user1'],
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
        accessibleUserIds: ['user1'],
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
      accessibleUserIds: ['user1'],
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
      accessibleUserIds: ['user1'],
    })

    expect(board.createdAt).toBe('2025-12-13T20:30:00.000Z')
    expect(board.updatedAt).toBe('2025-12-13T20:30:00.000Z')
  })
})

