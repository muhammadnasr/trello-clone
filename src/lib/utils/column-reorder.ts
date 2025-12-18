import type { DropResult } from '@hello-pangea/dnd'
import type { Column } from '@/lib/types/column'
import * as columnsService from '@/lib/services/columns'

/**
 * Reorders an array by moving an item from one index to another.
 * Standard @hello-pangea/dnd pattern - uses destination.index directly.
 */
function reorder<T>(list: T[], startIndex: number, endIndex: number): T[] {
  const result = Array.from(list)
  const [removed] = result.splice(startIndex, 1)
  result.splice(endIndex, 0, removed)
  return result
}

/**
 * Handles column reordering after a drag and drop operation.
 * Extracted to a utility function for testability.
 */
export async function handleColumnReorder(
  result: DropResult,
  columns: Column[],
  boardId: string
): Promise<void> {
  const { source, destination } = result

  if (!destination) return
  if (source.droppableId === destination.droppableId && source.index === destination.index) return

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

