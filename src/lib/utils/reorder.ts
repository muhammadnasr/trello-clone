import type { DropResult } from '@hello-pangea/dnd'

/**
 * Reorders an array by moving an item from one index to another.
 * Standard @hello-pangea/dnd pattern.
 */
export function reorder<T>(list: T[], from: number, to: number): T[] {
  const copy = [...list]
  const [item] = copy.splice(from, 1)
  copy.splice(to, 0, item)
  return copy
}

/**
 * Validates a drag and drop result.
 * Returns false if the drag should be ignored (no destination, same position).
 * Type guard: if this returns true, result.destination is guaranteed to be non-null.
 */
export function isValidDrag(result: DropResult): result is DropResult & { destination: NonNullable<DropResult['destination']> } {
  if (!result.destination) return false
  if (
    result.source.droppableId === result.destination.droppableId &&
    result.source.index === result.destination.index
  ) {
    return false
  }
  return true
}

