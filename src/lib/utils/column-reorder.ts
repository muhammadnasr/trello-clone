import type { DropResult } from '@hello-pangea/dnd'
import type { Column } from '@/lib/types/column'
import * as columnsService from '@/lib/services/columns'
import { reorder, isValidDrag } from './reorder'

/**
 * Handles column reordering after a drag and drop operation.
 * Extracted to a utility function for testability.
 */
export async function handleColumnReorder(
  result: DropResult,
  columns: Column[],
  boardId: string
): Promise<void> {
  if (!isValidDrag(result)) return

  const { source, destination } = result

  const boardColumns = columns
    .filter((col) => col.boardId === boardId)
    .sort((a, b) => a.order - b.order)

  // Reorder columns
  const reorderedColumns = reorder(boardColumns, source.index, destination.index)

  // Update order for columns that changed position
  await Promise.all(
    reorderedColumns.map(async (column: Column, index: number) => {
      if (column.order !== index) {
        await columnsService.updateColumn(column.id, { order: index })
      }
    })
  )
}

