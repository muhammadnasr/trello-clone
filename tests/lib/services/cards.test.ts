import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createCard, updateCard, deleteCard, getCardsByColumnId } from '../../../src/lib/services/cards'
import { createBoard } from '../../../src/lib/services/boards'
import { createColumn } from '../../../src/lib/services/columns'
import { initDatabase, cleanupDatabase, getDatabase } from '../../../src/lib/db/init'
import { createTestDatabase } from '../db/test-helpers'

describe('Card Service Functions', () => {
  let boardId: string
  let columnId: string

  beforeEach(async () => {
    await cleanupDatabase()
    const testDb = await createTestDatabase()
    await initDatabase(testDb)
    const board = await createBoard('Test Board', 'user1')
    boardId = board.id
    const column = await createColumn(boardId, 'Test Column', 0, 'user1')
    columnId = column.id
  })

  afterEach(async () => {
    await cleanupDatabase()
  })

  it('creates a card successfully', async () => {
    const card = await createCard(columnId, 'Test Card', 0, 'user1')
    
    expect(card).toBeTruthy()
    expect(card.title).toBe('Test Card')
    expect(card.columnId).toBe(columnId)
    expect(card.order).toBe(0)
    expect(card.ownerId).toBe('user1')
    expect(card.id).toBeTruthy()
    expect(card.createdAt).toBeTruthy()
    expect(card.updatedAt).toBeTruthy()
  })

  it('updates a card title', async () => {
    const card = await createCard(columnId, 'Original Title', 0, 'user1')
    
    await updateCard(card.id, { title: 'Updated Title' })
    
    const db = getDatabase()
    const updatedCard = await db.cards.findOne(card.id).exec()
    expect(updatedCard?.toJSON().title).toBe('Updated Title')
  })

  it('updates a card order', async () => {
    const card = await createCard(columnId, 'Test Card', 0, 'user1')
    
    await updateCard(card.id, { order: 5 })
    
    const db = getDatabase()
    const updatedCard = await db.cards.findOne(card.id).exec()
    expect(updatedCard?.toJSON().order).toBe(5)
  })

  it('updates a card columnId', async () => {
    const card = await createCard(columnId, 'Test Card', 0, 'user1')
    const newColumn = await createColumn(boardId, 'New Column', 1, 'user1')
    
    await updateCard(card.id, { columnId: newColumn.id })
    
    const db = getDatabase()
    const updatedCard = await db.cards.findOne(card.id).exec()
    expect(updatedCard?.toJSON().columnId).toBe(newColumn.id)
  })

  it('throws error when updating non-existent card', async () => {
    await expect(updateCard('non-existent-id', { title: 'New Title' })).rejects.toThrow()
  })

  it('deletes a card successfully', async () => {
    const card = await createCard(columnId, 'Test Card', 0, 'user1')
    
    await deleteCard(card.id)
    
    const db = getDatabase()
    const deletedCard = await db.cards.findOne(card.id).exec()
    expect(deletedCard).toBeNull()
  })

  it('throws error when deleting non-existent card', async () => {
    await expect(deleteCard('non-existent-id')).rejects.toThrow()
  })

  it('gets cards by columnId sorted by order', async () => {
    await createCard(columnId, 'Card 1', 2, 'user1')
    await createCard(columnId, 'Card 2', 0, 'user1')
    await createCard(columnId, 'Card 3', 1, 'user1')
    
    const cards = await getCardsByColumnId(columnId)
    
    expect(cards).toHaveLength(3)
    expect(cards[0].title).toBe('Card 2')
    expect(cards[1].title).toBe('Card 3')
    expect(cards[2].title).toBe('Card 1')
  })

  it('returns empty array when column has no cards', async () => {
    const cards = await getCardsByColumnId(columnId)
    expect(cards).toEqual([])
  })

  it('only returns cards for the specified column', async () => {
    const column2 = await createColumn(boardId, 'Column 2', 1, 'user1')
    
    await createCard(columnId, 'Card in Column 1', 0, 'user1')
    await createCard(column2.id, 'Card in Column 2', 0, 'user1')
    
    const cards = await getCardsByColumnId(columnId)
    
    expect(cards).toHaveLength(1)
    expect(cards[0].title).toBe('Card in Column 1')
    expect(cards[0].columnId).toBe(columnId)
  })
})

