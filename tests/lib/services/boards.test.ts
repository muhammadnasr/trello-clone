import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createRxDatabase } from 'rxdb/plugins/core'
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie'
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv'
import { addRxPlugin } from 'rxdb/plugins/core'
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode'
import type { TrelloDatabase } from '../../../src/lib/db/database'
import { boardSchema } from '../../../src/lib/db/collections'
import { createBoard, updateBoard, deleteBoard } from '../../../src/lib/services/boards'
import { getDatabase, initDatabase, cleanupDatabase } from '../../../src/lib/db/init'

// Enable dev-mode
addRxPlugin(RxDBDevModePlugin)

describe('Board Service Functions', () => {
  beforeEach(async () => {
    await cleanupDatabase()
    // Create a test database instance
    const storage = wrappedValidateAjvStorage({
      storage: getRxStorageDexie(),
    })
    
    const db = await createRxDatabase<TrelloDatabase>({
      name: `test-boards-service-${Date.now()}`,
      storage: storage,
      ignoreDuplicate: true,
    })

    await db.addCollections({
      boards: {
        schema: boardSchema,
      },
    })

    // Mock getDatabase to return our test database
    // We'll need to set up the database instance manually
    // For now, let's use initDatabase but with a unique name
    await initDatabase()
  })

  afterEach(async () => {
    await cleanupDatabase()
  })

  it('creates a board successfully', async () => {
    const board = await createBoard('Test Board', 'user1')
    
    expect(board).toBeTruthy()
    expect(board.title).toBe('Test Board')
    expect(board.ownerId).toBe('user1')
    expect(board.id).toBeTruthy()
    expect(board.createdAt).toBeTruthy()
    expect(board.updatedAt).toBeTruthy()
  })

  it('updates a board title', async () => {
    const board = await createBoard('Original Title', 'user1')
    await updateBoard(board.id, { title: 'Updated Title' })

    const db = getDatabase()
    const updatedBoard = await db.boards.findOne(board.id).exec()
    
    expect(updatedBoard?.title).toBe('Updated Title')
    expect(updatedBoard?.updatedAt).not.toBe(board.updatedAt)
  })

  it('throws error when updating non-existent board', async () => {
    await expect(
      updateBoard('non-existent-id', { title: 'New Title' })
    ).rejects.toThrow('Board with id non-existent-id not found')
  })

  it('deletes a board successfully', async () => {
    const board = await createBoard('Board to Delete', 'user1')
    await deleteBoard(board.id)

    const db = getDatabase()
    const deletedBoard = await db.boards.findOne(board.id).exec()
    
    expect(deletedBoard).toBeNull()
  })

  it('throws error when deleting non-existent board', async () => {
    await expect(
      deleteBoard('non-existent-id')
    ).rejects.toThrow('Board with id non-existent-id not found')
  })
})

