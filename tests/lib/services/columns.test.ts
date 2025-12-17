import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createColumn, updateColumn, deleteColumn, getColumnsByBoardId } from '../../../src/lib/services/columns'
import { createBoard } from '../../../src/lib/services/boards'
import { initDatabase, cleanupDatabase, getDatabase } from '../../../src/lib/db/init'
import { createTestDatabase } from '../db/test-helpers'

describe('Column Service Functions', () => {
  let boardId: string

  beforeEach(async () => {
    await cleanupDatabase()
    const testDb = await createTestDatabase()
    await initDatabase(testDb)
    const board = await createBoard('Test Board', 'user1')
    boardId = board.id
  })

  afterEach(async () => {
    await cleanupDatabase()
  })

  it('creates a column successfully', async () => {
    const column = await createColumn(boardId, 'Test Column', 0)
    
    expect(column).toBeTruthy()
    expect(column.title).toBe('Test Column')
    expect(column.boardId).toBe(boardId)
    expect(column.order).toBe(0)
    expect(column.id).toBeTruthy()
    expect(column.createdAt).toBeTruthy()
    expect(column.updatedAt).toBeTruthy()
  })

  it('updates a column title', async () => {
    const column = await createColumn(boardId, 'Original Title', 0)
    const originalUpdatedAt = column.updatedAt
    
    await new Promise((resolve) => setTimeout(resolve, 10))
    
    await updateColumn(column.id, { title: 'Updated Title' })

    const db = getDatabase()
    const updatedColumn = await db.columns.findOne(column.id).exec()
    
    expect(updatedColumn?.title).toBe('Updated Title')
    expect(updatedColumn?.updatedAt).not.toBe(originalUpdatedAt)
    expect(new Date(updatedColumn!.updatedAt).getTime()).toBeGreaterThan(new Date(originalUpdatedAt).getTime())
  })

  it('updates a column order', async () => {
    const column = await createColumn(boardId, 'Test Column', 0)
    
    await updateColumn(column.id, { order: 5 })

    const db = getDatabase()
    const updatedColumn = await db.columns.findOne(column.id).exec()
    
    expect(updatedColumn?.order).toBe(5)
  })

  it('throws error when updating non-existent column', async () => {
    await expect(
      updateColumn('non-existent-id', { title: 'New Title' })
    ).rejects.toThrow('Column with id non-existent-id not found')
  })

  it('deletes a column successfully', async () => {
    const column = await createColumn(boardId, 'Column to Delete', 0)
    await deleteColumn(column.id)

    const db = getDatabase()
    const deletedColumn = await db.columns.findOne(column.id).exec()
    
    expect(deletedColumn).toBeNull()
  })

  it('throws error when deleting non-existent column', async () => {
    await expect(
      deleteColumn('non-existent-id')
    ).rejects.toThrow('Column with id non-existent-id not found')
  })

  it('gets columns by boardId sorted by order', async () => {
    await createColumn(boardId, 'Column 2', 2)
    await createColumn(boardId, 'Column 0', 0)
    await createColumn(boardId, 'Column 1', 1)

    const columns = await getColumnsByBoardId(boardId)
    
    expect(columns).toHaveLength(3)
    expect(columns[0].title).toBe('Column 0')
    expect(columns[1].title).toBe('Column 1')
    expect(columns[2].title).toBe('Column 2')
  })

  it('returns empty array when board has no columns', async () => {
    const columns = await getColumnsByBoardId(boardId)
    expect(columns).toEqual([])
  })

  it('only returns columns for the specified board', async () => {
    const board2 = await createBoard('Board 2', 'user1')
    await createColumn(boardId, 'Column 1', 0)
    await createColumn(board2.id, 'Column 2', 0)

    const columns = await getColumnsByBoardId(boardId)
    
    expect(columns).toHaveLength(1)
    expect(columns[0].title).toBe('Column 1')
  })

  it('proves cascading delete: when column is deleted, all cards are deleted', async () => {
    const { createCard, getCardsByColumnId } = await import('../../../src/lib/services/cards')
    
    // Create a column with cards
    const column = await createColumn(boardId, 'Column with Cards', 0)
    
    const card1 = await createCard(column.id, 'Card 1', 0)
    const card2 = await createCard(column.id, 'Card 2', 1)
    const card3 = await createCard(column.id, 'Card 3', 2)
    
    // Verify everything exists before deletion
    const db = getDatabase()
    const columnBeforeDelete = await db.columns.findOne(column.id).exec()
    const card1BeforeDelete = await db.cards.findOne(card1.id).exec()
    const card2BeforeDelete = await db.cards.findOne(card2.id).exec()
    const card3BeforeDelete = await db.cards.findOne(card3.id).exec()
    
    expect(columnBeforeDelete).not.toBeNull()
    expect(card1BeforeDelete).not.toBeNull()
    expect(card2BeforeDelete).not.toBeNull()
    expect(card3BeforeDelete).not.toBeNull()
    
    // Delete the column
    await deleteColumn(column.id)
    
    // Verify column is deleted
    const deletedColumn = await db.columns.findOne(column.id).exec()
    expect(deletedColumn).toBeNull()
    
    // PROOF: All cards are deleted (cascading delete)
    const deletedCard1 = await db.cards.findOne(card1.id).exec()
    const deletedCard2 = await db.cards.findOne(card2.id).exec()
    const deletedCard3 = await db.cards.findOne(card3.id).exec()
    expect(deletedCard1).toBeNull() // Card deleted
    expect(deletedCard2).toBeNull() // Card deleted
    expect(deletedCard3).toBeNull() // Card deleted
    
    // Additional verification: query by columnId returns empty array
    const cardsAfterDelete = await getCardsByColumnId(column.id)
    expect(cardsAfterDelete).toHaveLength(0) // No cards remain
  })
})

