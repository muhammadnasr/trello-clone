import { arrayMove } from '@dnd-kit/sortable'
import type { DragEndEvent } from '@dnd-kit/core'
import type { Card } from '@/lib/types/card'
import type { Column } from '@/lib/types/column'
import * as cardsService from '@/lib/services/cards'

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
 * If targetIndex is undefined, moves card to the end of target column.
 */
async function moveCardToColumn(
  draggedCard: Card,
  sourceColumnCards: Card[],
  targetColumnCards: Card[],
  targetColumnId: string,
  targetIndex?: number
): Promise<void> {
  const updates: Promise<void>[] = []

  // Remove card from source column and renumber
  const cardsToRenumber = sourceColumnCards.filter((card) => card.id !== draggedCard.id)
  updates.push(...renumberCards(cardsToRenumber))

  // Determine final position and prepare target cards array
  let finalTargetCards: Card[]

  if (targetIndex === undefined) {
    // Move to end - append dragged card
    finalTargetCards = [...targetColumnCards, draggedCard]
  } else {
    // Insert at specific position
    finalTargetCards = [
      ...targetColumnCards.slice(0, targetIndex),
      draggedCard,
      ...targetColumnCards.slice(targetIndex),
    ]
  }

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
 * Reorders cards within the same column.
 */
async function reorderCardsInSameColumn(
  columnCards: Card[],
  activeId: string,
  overId: string
): Promise<void> {
  const oldIndex = columnCards.findIndex((card) => card.id === activeId)
  const newIndex = columnCards.findIndex((card) => card.id === overId)

  if (oldIndex === -1 || newIndex === -1) return

  const reorderedCards = arrayMove(columnCards, oldIndex, newIndex)

  // Renumber all cards in the column
  const updates = renumberCards(reorderedCards)
  await Promise.all(updates)
}

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
  const sourceColumnCards = getColumnCardsSorted(cards, sourceColumnId)

  // Check if dropping on a column (empty column area)
  const targetColumn = columns.find((col) => col.id === over.id)
  if (targetColumn) {
    // Dropping on a column - move card to the end
    const targetColumnCards = getColumnCardsSorted(cards, targetColumn.id)
    await moveCardToColumn(
      draggedCard,
      sourceColumnCards,
      targetColumnCards,
      targetColumn.id
      // targetIndex undefined = move to end
    )
    return
  }

  // Dropping on another card
  const targetCard = cards.find((card) => card.id === over.id)
  if (!targetCard) return

  const targetColumnId = targetCard.columnId

  if (sourceColumnId === targetColumnId) {
    // Same column - reorder within column
    await reorderCardsInSameColumn(sourceColumnCards, active.id as string, over.id as string)
  } else {
    // Different column - move card to target column at target card's position
    const targetColumnCards = getColumnCardsSorted(cards, targetColumnId)
    const targetIndex = targetColumnCards.findIndex((card) => card.id === targetCard.id)
    if (targetIndex === -1) return

    await moveCardToColumn(
      draggedCard,
      sourceColumnCards,
      targetColumnCards,
      targetColumnId,
      targetIndex
    )
  }
}

