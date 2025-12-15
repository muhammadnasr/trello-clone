import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { TrelloDatabase } from '../../../src/lib/db/database'
import { syncBoardsToStore } from '../../../src/lib/db/sync'
import { useBoardsStore } from '../../../src/stores/boards'
import { createTestDatabase } from './test-helpers'

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
    })

    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(useBoardsStore.getState().boards).toHaveLength(1)
  })
})

