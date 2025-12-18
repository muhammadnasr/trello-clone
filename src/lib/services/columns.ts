import { getDatabase } from '@/lib/db/init'
import type { Column } from '@/lib/types/column'
import { uuidv7 } from 'uuidv7'
import { reorder } from '@/lib/utils/reorder'

export async function createColumn(boardId: string, title: string, order: number, ownerId: string): Promise<Column> {
  const db = getDatabase()
  const now = new Date().toISOString()

  const column = await db.columns.insert({
    id: uuidv7(),
    boardId,
    title,
    order,
    ownerId,
    createdAt: now,
    updatedAt: now,
  })

  return column.toJSON() as Column
}

export async function updateColumn(id: string, updates: { title?: string; order?: number }): Promise<void> {
  const db = getDatabase()
  const column = await db.columns.findOne(id).exec()

  if (!column) {
    throw new Error(`Column with id ${id} not found`)
  }

  await column.patch({
    ...updates,
    updatedAt: new Date().toISOString(),
  })
}

export async function deleteColumn(id: string): Promise<void> {
  const db = getDatabase()
  const column = await db.columns.findOne(id).exec()

  if (!column) {
    throw new Error(`Column with id ${id} not found`)
  }

  // Cascade delete: Delete all cards in this column using find().remove()
  await db.cards.find({
    selector: {
      columnId: id,
    },
  }).remove()

  // Finally, delete the column
  await column.remove()
}

export async function getColumnsByBoardId(boardId: string): Promise<Column[]> {
  const db = getDatabase()
  const columns = await db.columns.find({
    selector: {
      boardId,
    },
    sort: [{ order: 'asc' }],
  }).exec()

  return columns.map((doc) => doc.toJSON() as Column)
}

/**
 * Updates column order after a drag and drop operation.
 */
export async function updateColumnsOrder(
  columns: Column[],
  boardId: string,
  sourceIndex: number,
  destinationIndex: number
): Promise<void> {
  const boardColumns = columns
    .filter((col) => col.boardId === boardId)
    .sort((a, b) => a.order - b.order)

  // Reorder columns
  const reorderedColumns = reorder(boardColumns, sourceIndex, destinationIndex)

  // Update order for columns that changed position
  await Promise.all(
    reorderedColumns.map(async (column: Column, index: number) => {
      if (column.order !== index) {
        await updateColumn(column.id, { order: index })
      }
    })
  )
}

