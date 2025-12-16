import { arrayMove } from '@dnd-kit/sortable'
import type { DragEndEvent } from '@dnd-kit/core'
import type { Card } from '@/lib/types/card'
import * as cardsService from '@/lib/services/cards'

/**
 * Handles card reordering within a column after a drag and drop operation.
 * Extracted to a utility function for testability.
 */
export async function handleCardReorder(
  event: DragEndEvent,
  cards: Card[],
  columnId: string
): Promise<void> {
  const { active, over } = event

  if (!over || active.id === over.id) return

  const columnCards = cards
    .filter((card) => card.columnId === columnId)
    .sort((a, b) => a.order - b.order)

  const oldIndex = columnCards.findIndex((card) => card.id === active.id)
  const newIndex = columnCards.findIndex((card) => card.id === over.id)

  if (oldIndex === -1 || newIndex === -1) return

  const reorderedCards = arrayMove(columnCards, oldIndex, newIndex)

  // Update order for cards that changed position
  await Promise.all(
    reorderedCards.map(async (card, index) => {
      if (card.order !== index) {
        await cardsService.updateCard(card.id, { order: index })
      }
    })
  )
}

