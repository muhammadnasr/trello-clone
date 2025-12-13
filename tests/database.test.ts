import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createRxDatabase } from 'rxdb/plugins/core'
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie'
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv'
import { addRxPlugin } from 'rxdb/plugins/core'
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode'
import type { TrelloDatabase } from '../src/lib/db/database'
import { boardSchema } from '../src/lib/db/collections'

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

