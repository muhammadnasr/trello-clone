import { arrayMove } from '@dnd-kit/sortable'
import type { DragEndEvent } from '@dnd-kit/core'
import type { Column } from '@/lib/types/column'
import * as columnsService from '@/lib/services/columns'

/**
 * Handles column reordering after a drag and drop operation.
 * Extracted to a utility function for testability.
 */
export async function handleColumnReorder(
  event: DragEndEvent,
  columns: Column[],
  boardId: string
): Promise<void> {
  const { active, over } = event

  if (!over || active.id === over.id) return

  const boardColumns = columns
    .filter((col) => col.boardId === boardId)
    .sort((a, b) => a.order - b.order)

  const oldIndex = boardColumns.findIndex((col) => col.id === active.id)
  const newIndex = boardColumns.findIndex((col) => col.id === over.id)

  if (oldIndex === -1 || newIndex === -1) return

  const reorderedColumns = arrayMove(boardColumns, oldIndex, newIndex)

  // Update order for columns that changed position
  await Promise.all(
    reorderedColumns.map(async (column, index) => {
      if (column.order !== index) {
        await columnsService.updateColumn(column.id, { order: index })
      }
    })
  )
}

