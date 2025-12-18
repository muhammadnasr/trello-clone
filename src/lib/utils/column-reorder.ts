import type { Column } from '@/lib/types/column'
import * as columnsService from '@/lib/services/columns'
import { reorder } from './reorder'

/**
 * Handles column reordering after a drag and drop operation.
 * Extracted to a utility function for testability.
 */
export async function handleColumnReorder(
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
        await columnsService.updateColumn(column.id, { order: index })
      }
    })
  )
}

