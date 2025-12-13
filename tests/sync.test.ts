import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createRxDatabase } from 'rxdb/plugins/core'
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie'
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv'
import { addRxPlugin } from 'rxdb/plugins/core'
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode'
import type { TrelloDatabase } from '../src/lib/db/database'
import { boardSchema } from '../src/lib/db/collections'
import { syncBoardsToStore } from '../src/lib/db/sync'
import { useBoardsStore } from '../src/stores/boards'

// Enable dev-mode
addRxPlugin(RxDBDevModePlugin)

async function createTestDatabase(name: string): Promise<TrelloDatabase> {
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

describe('RxDB-Zustand Sync', () => {
  let db: TrelloDatabase
  let unsubscribe: (() => void) | null = null

  beforeEach(async () => {
    db = await createTestDatabase('sync-test')
    // Reset store
    useBoardsStore.setState({
      boards: [],
      isLoading: false,
      error: null,
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

  it('syncs boards from RxDB to Zustand store', async () => {
    // Start sync
    unsubscribe = syncBoardsToStore(db)

    // Insert a board in RxDB
    const now = new Date().toISOString()
    await db.boards.insert({
      id: 'board1',
      title: 'Test Board',
      createdAt: now,
      updatedAt: now,
      ownerId: 'user1',
    })

    // Wait a bit for the subscription to update
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Check that Zustand store was updated
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
    })

    await new Promise((resolve) => setTimeout(resolve, 100))

    // Update board in RxDB
    await board.patch({
      title: 'Updated Title',
      updatedAt: new Date().toISOString(),
    })

    await new Promise((resolve) => setTimeout(resolve, 100))

    // Check store was updated
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
    })

    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(useBoardsStore.getState().boards).toHaveLength(1)

    // Remove board from RxDB
    await board.remove()

    await new Promise((resolve) => setTimeout(resolve, 100))

    // Check store was updated
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
    })

    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(useBoardsStore.getState().boards).toHaveLength(1)

    // Unsubscribe
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }

    // Add another board - store should not update
    await db.boards.insert({
      id: 'board2',
      title: 'Board 2',
      createdAt: now,
      updatedAt: now,
      ownerId: 'user1',
    })

    await new Promise((resolve) => setTimeout(resolve, 100))
    // Store should still have only 1 board (not synced)
    expect(useBoardsStore.getState().boards).toHaveLength(1)
  })
})

