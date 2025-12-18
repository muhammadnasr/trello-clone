import type { Card } from '@/lib/types/card'
import { reorder } from './reorder'

/**
 * Calculates card updates map for drag and drop operations.
 * Returns a map of cardId -> { order?, columnId? } for cards that need updates.
 */
export function calculateCardUpdates(
  draggedCard: Card,
  sourceCards: Card[],
  destinationCards: Card[],
  sourceIndex: number,
  destinationIndex: number,
  sourceColumnId: string,
  destinationColumnId: string
): Record<string, { order?: number; columnId?: string }> {
  const updates: Record<string, { order?: number; columnId?: string }> = {}

  if (sourceColumnId === destinationColumnId) {
    // Same column - reorder
    const reordered = reorder(sourceCards, sourceIndex, destinationIndex)
    reordered.forEach((c, i) => {
      if (c.order !== i) updates[c.id] = { order: i }
    })
  } else {
    // Cross-column move
    const newDst = [
      ...destinationCards.slice(0, destinationIndex),
      draggedCard,
      ...destinationCards.slice(destinationIndex),
    ]

    // Update dragged card
    updates[draggedCard.id] = {
      columnId: destinationColumnId,
      order: destinationIndex,
    }

    // Update source column cards (remove dragged card)
    sourceCards
      .filter((c) => c.id !== draggedCard.id)
      .forEach((c, i) => {
        if (c.order !== i) updates[c.id] = { order: i }
      })

    // Update destination column cards (include dragged card)
    newDst.forEach((c, i) => {
      if (c.id !== draggedCard.id && c.order !== i) {
        updates[c.id] = { order: i }
      }
    })
  }

  return updates
}

