import type { DropResult } from '@hello-pangea/dnd'
import type { Card } from '@/lib/types/card'
import * as cardsService from '@/lib/services/cards'

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

function getColumnCardsSorted(cards: Card[], columnId: string): Card[] {
  return cards
    .filter((card) => card.columnId === columnId)
    .sort((a, b) => a.order - b.order)
}

/**
 * Renumbers cards in a column sequentially (0, 1, 2, ...).
 * Returns an array of update promises.
 */
function renumberCards(
  cardsToRenumber: Card[],
): Promise<void>[] {
  const updates: Promise<void>[] = []

  cardsToRenumber.forEach((card, index) => {
    if (card.order !== index) {
      updates.push(cardsService.updateCard(card.id, { order: index }))
    }
  })

  return updates
}

/**
 * Moves a card from source column to target column at a specific position.
 */
async function moveCardToColumn(
  draggedCard: Card,
  sourceColumnCards: Card[],
  targetColumnCards: Card[],
  targetColumnId: string,
  targetIndex: number
): Promise<void> {
  const updates: Promise<void>[] = []

  // Remove card from source column and renumber
  const cardsToRenumber = sourceColumnCards.filter((card) => card.id !== draggedCard.id)
  updates.push(...renumberCards(cardsToRenumber))

  // Insert card at target position
  const finalTargetCards = [
    ...targetColumnCards.slice(0, targetIndex),
    draggedCard,
    ...targetColumnCards.slice(targetIndex),
  ]

  // Update target column cards
  finalTargetCards.forEach((card, index) => {
    if (card.id === draggedCard.id) {
      // Move the dragged card to target column
      updates.push(
        cardsService.updateCard(card.id, { columnId: targetColumnId, order: index })
      )
    } else if (card.order !== index) {
      // Renumber other cards if needed
      updates.push(cardsService.updateCard(card.id, { order: index }))
    }
  })

  await Promise.all(updates)
}

/**
 * Handles card reordering within and between columns after a drag and drop operation.
 * Supports:
 * - Reordering within the same column
 * - Moving cards between columns
 * Extracted to a utility function for testability.
 */
export async function handleCardReorder(
  result: DropResult
): Promise<void> {
  const { source, destination, draggableId } = result

  if (!destination) return
  if (source.droppableId === destination.droppableId && source.index === destination.index) return

  const sourceColumnId = source.droppableId
  const destinationColumnId = destination.droppableId

  // Only fetch cards from the columns we actually need (optimization)
  // Get fresh cards from database via service layer to avoid conflicts with optimistic updates
  const columnIds = sourceColumnId === destinationColumnId 
    ? [sourceColumnId]  // Same column - only need one column's cards
    : [sourceColumnId, destinationColumnId]  // Different columns - need both

  const cards = await cardsService.getCardsByColumnIds(columnIds)

  // Find the dragged card
  const draggedCard = cards.find((card) => card.id === draggableId)
  if (!draggedCard) return

  const sourceColumnCards = getColumnCardsSorted(cards, sourceColumnId)
  const destinationColumnCards = getColumnCardsSorted(cards, destinationColumnId)

  if (sourceColumnId === destinationColumnId) {
    // Same column - reorder within column
    const reorderedCards = reorder(sourceColumnCards, source.index, destination.index)
    
    // Update database - let store sync naturally
    const updates = renumberCards(reorderedCards)
    await Promise.all(updates)
  } else {
    // Different column - move card to target column
    // Update database - let store sync naturally
    await moveCardToColumn(
      draggedCard,
      sourceColumnCards,
      destinationColumnCards,
      destinationColumnId,
      destination.index
    )
  }
}

