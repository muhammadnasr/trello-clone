import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createBoard, updateBoard, deleteBoard } from '../../../src/lib/services/boards'
import { initDatabase, cleanupDatabase, getDatabase } from '../../../src/lib/db/init'
import { createTestDatabase } from '../db/test-helpers'

describe('Board Service Functions', () => {
  beforeEach(async () => {
    await cleanupDatabase()
    // Create in-memory test database and inject it
    const testDb = await createTestDatabase()
    await initDatabase(testDb)
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
    const originalUpdatedAt = board.updatedAt
    
    // Add a small delay to ensure updatedAt will be different
    await new Promise((resolve) => setTimeout(resolve, 10))
    
    await updateBoard(board.id, { title: 'Updated Title' })

    const db = getDatabase()
    const updatedBoard = await db.boards.findOne(board.id).exec()
    
    expect(updatedBoard?.title).toBe('Updated Title')
    expect(updatedBoard?.updatedAt).not.toBe(originalUpdatedAt)
    // Verify updatedAt is actually newer
    expect(new Date(updatedBoard!.updatedAt).getTime()).toBeGreaterThan(new Date(originalUpdatedAt).getTime())
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

