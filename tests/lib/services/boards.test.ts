import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createBoard, updateBoard, deleteBoard } from '../../../src/lib/services/boards'
import { initDatabase, cleanupDatabase, getDatabase } from '../../../src/lib/db/init'
import { createTestDatabase } from '../db/test-helpers'

describe('Board Service Functions', () => {
  beforeEach(async () => {
    await cleanupDatabase()
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
    
    await new Promise((resolve) => setTimeout(resolve, 10))
    
    await updateBoard(board.id, { title: 'Updated Title' })

    const db = getDatabase()
    const updatedBoard = await db.boards.findOne(board.id).exec()
    
    expect(updatedBoard?.title).toBe('Updated Title')
    expect(updatedBoard?.updatedAt).not.toBe(originalUpdatedAt)
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

  it('proves cascading delete: when board is deleted, all columns and cards are deleted', async () => {
    const { createColumn, getColumnsByBoardId } = await import('../../../src/lib/services/columns')
    const { createCard, getCardsByColumnId } = await import('../../../src/lib/services/cards')
    
    // Create a board with columns and cards
    const board = await createBoard('Board with Columns and Cards', 'user1')
    const column1 = await createColumn(board.id, 'Column 1', 0)
    const column2 = await createColumn(board.id, 'Column 2', 1)
    
    const card1 = await createCard(column1.id, 'Card 1', 0)
    const card2 = await createCard(column1.id, 'Card 2', 1)
    const card3 = await createCard(column2.id, 'Card 3', 0)
    
    // Verify everything exists before deletion
    const db = getDatabase()
    const boardBeforeDelete = await db.boards.findOne(board.id).exec()
    const column1BeforeDelete = await db.columns.findOne(column1.id).exec()
    const column2BeforeDelete = await db.columns.findOne(column2.id).exec()
    const card1BeforeDelete = await db.cards.findOne(card1.id).exec()
    const card2BeforeDelete = await db.cards.findOne(card2.id).exec()
    const card3BeforeDelete = await db.cards.findOne(card3.id).exec()
    
    expect(boardBeforeDelete).not.toBeNull()
    expect(column1BeforeDelete).not.toBeNull()
    expect(column2BeforeDelete).not.toBeNull()
    expect(card1BeforeDelete).not.toBeNull()
    expect(card2BeforeDelete).not.toBeNull()
    expect(card3BeforeDelete).not.toBeNull()
    
    // Delete the board
    await deleteBoard(board.id)
    
    // Verify board is deleted
    const deletedBoard = await db.boards.findOne(board.id).exec()
    expect(deletedBoard).toBeNull()
    
    // PROOF: All columns are deleted (cascading delete)
    const deletedColumn1 = await db.columns.findOne(column1.id).exec()
    const deletedColumn2 = await db.columns.findOne(column2.id).exec()
    expect(deletedColumn1).toBeNull() // Column deleted
    expect(deletedColumn2).toBeNull() // Column deleted
    
    // PROOF: All cards are deleted (cascading delete)
    const deletedCard1 = await db.cards.findOne(card1.id).exec()
    const deletedCard2 = await db.cards.findOne(card2.id).exec()
    const deletedCard3 = await db.cards.findOne(card3.id).exec()
    expect(deletedCard1).toBeNull() // Card deleted
    expect(deletedCard2).toBeNull() // Card deleted
    expect(deletedCard3).toBeNull() // Card deleted
    
    // Additional verification: query by boardId and columnId return empty arrays
    const columnsAfterDelete = await getColumnsByBoardId(board.id)
    expect(columnsAfterDelete).toHaveLength(0) // No columns remain
    
    const cardsInColumn1AfterDelete = await getCardsByColumnId(column1.id)
    const cardsInColumn2AfterDelete = await getCardsByColumnId(column2.id)
    expect(cardsInColumn1AfterDelete).toHaveLength(0) // No cards remain
    expect(cardsInColumn2AfterDelete).toHaveLength(0) // No cards remain
  })
})

