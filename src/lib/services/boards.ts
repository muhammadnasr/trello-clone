import { getDatabase } from '@/lib/db/init'
import type { Board } from '@/lib/types/board'
import { uuidv7 } from 'uuidv7'
import { getColumnsByBoardId } from './columns'

export async function createBoard(title: string, ownerId: string): Promise<Board> {
  const db = getDatabase()
  const now = new Date().toISOString()
  
  const board = await db.boards.insert({
    id: uuidv7(),
    title,
    createdAt: now,
    updatedAt: now,
    ownerId,
    accessibleUserIds: [ownerId],
  })

  return board.toJSON() as Board
}

export async function updateBoard(id: string, updates: { title?: string }): Promise<void> {
  const db = getDatabase()
  const board = await db.boards.findOne(id).exec()
  
  if (!board) {
    throw new Error(`Board with id ${id} not found`)
  }

  await board.patch({
    ...updates,
    updatedAt: new Date().toISOString(),
  })
}

export async function deleteBoard(id: string): Promise<void> {
  const db = getDatabase()
  const board = await db.boards.findOne(id).exec()
  
  if (!board) {
    throw new Error(`Board with id ${id} not found`)
  }

  // Cascade delete: Delete all columns and their cards using bulk queries
  // Get all columns for this board
  const columns = await getColumnsByBoardId(id)
  
  // Delete all cards in all columns of this board using find().remove()
  for (const column of columns) {
    await db.cards.find({
      selector: {
        columnId: column.id,
      },
    }).remove()
  }
  
  // Delete all columns for this board using find().remove()
  await db.columns.find({
    selector: {
      boardId: id,
    },
  }).remove()

  // Finally, delete the board
  await board.remove()
}

