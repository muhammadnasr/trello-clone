import { arrayMove } from '@dnd-kit/sortable'
import type { DragEndEvent } from '@dnd-kit/core'
import type { Card } from '@/lib/types/card'
import type { Column } from '@/lib/types/column'
import * as cardsService from '@/lib/services/cards'

/**
 * Handles card reordering within and between columns after a drag and drop operation.
 * Supports:
 * - Reordering within the same column
 * - Moving cards between columns (dropping on a column or another card)
 * Extracted to a utility function for testability.
 */
export async function handleCardReorder(
  event: DragEndEvent,
  cards: Card[],
  columns: Column[]
): Promise<void> {
  const { active, over } = event

  if (!over || active.id === over.id) return

  // Find the dragged card
  const draggedCard = cards.find((card) => card.id === active.id)
  if (!draggedCard) return

  const sourceColumnId = draggedCard.columnId
  const sourceColumnCards = cards
    .filter((card) => card.columnId === sourceColumnId)
    .sort((a, b) => a.order - b.order)

  // Check if dropping on a column (cross-column move)
  const targetColumn = columns.find((col) => col.id === over.id)
  if (targetColumn) {
    // Dropping on a column - move card to the end of that column
    const targetColumnCards = cards
      .filter((card) => card.columnId === targetColumn.id)
      .sort((a, b) => a.order - b.order)

    const newOrder = targetColumnCards.length

    // Update orders in source column (remove the card and renumber)
    const updates: Promise<void>[] = []
    const remainingSourceCards = sourceColumnCards.filter((card) => card.id !== draggedCard.id)
    remainingSourceCards.forEach((card, index) => {
      if (card.order !== index) {
        updates.push(cardsService.updateCard(card.id, { order: index }))
      }
    })

    // Update orders in target column (ensure sequential ordering)
    targetColumnCards.forEach((card, index) => {
      if (card.order !== index) {
        updates.push(cardsService.updateCard(card.id, { order: index }))
      }
    })

    // Move the card to the target column
    updates.push(cardsService.updateCard(draggedCard.id, { columnId: targetColumn.id, order: newOrder }))

    await Promise.all(updates)
    return
  }

  // Dropping on another card - check if same column or different column
  const targetCard = cards.find((card) => card.id === over.id)
  if (!targetCard) return

  const targetColumnId = targetCard.columnId

  if (sourceColumnId === targetColumnId) {
    // Same column - reorder within column
    const oldIndex = sourceColumnCards.findIndex((card) => card.id === active.id)
    const newIndex = sourceColumnCards.findIndex((card) => card.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const reorderedCards = arrayMove(sourceColumnCards, oldIndex, newIndex)

    // Update order for cards that changed position
    await Promise.all(
      reorderedCards.map(async (card, index) => {
        if (card.order !== index) {
          await cardsService.updateCard(card.id, { order: index })
        }
      })
    )
  } else {
    // Different column - move card to target column at target card's position
    const targetColumnCards = cards
      .filter((card) => card.columnId === targetColumnId)
      .sort((a, b) => a.order - b.order)

    const targetIndex = targetColumnCards.findIndex((card) => card.id === targetCard.id)
    if (targetIndex === -1) return

    // Insert dragged card at target position
    const newTargetCards = [
      ...targetColumnCards.slice(0, targetIndex),
      draggedCard,
      ...targetColumnCards.slice(targetIndex),
    ]

    // Update orders in source column (remove the card and renumber)
    const updates: Promise<void>[] = []
    const remainingSourceCards = sourceColumnCards.filter((card) => card.id !== draggedCard.id)
    remainingSourceCards.forEach((card, index) => {
      if (card.order !== index) {
        updates.push(cardsService.updateCard(card.id, { order: index }))
      }
    })

    // Update orders in target column (insert the card and renumber)
    newTargetCards.forEach((card, index) => {
      if (card.id === draggedCard.id) {
        updates.push(cardsService.updateCard(card.id, { columnId: targetColumnId, order: index }))
      } else if (card.order !== index) {
        updates.push(cardsService.updateCard(card.id, { order: index }))
      }
    })

    await Promise.all(updates)
  }
}

