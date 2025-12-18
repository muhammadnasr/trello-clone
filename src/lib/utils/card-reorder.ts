import * as cardsService from '@/lib/services/cards'
import { reorder } from './reorder'

/**
 * Handles card reordering within and between columns after a drag and drop.
 * Uses service layer to persist changes.
 */
export async function handleCardReorder(
  cardId: string,
  sourceColumnId: string,
  sourceIndex: number,
  destinationColumnId: string,
  destinationIndex: number
): Promise<void> {

  // Fetch cards from relevant columns only
  const columnIds = sourceColumnId === destinationColumnId
    ? [sourceColumnId]
    : [sourceColumnId, destinationColumnId]
  const cards = await cardsService.getCardsByColumnIds(columnIds)

  const dragged = cards.find(c => c.id === cardId)
  if (!dragged) return

  const getSorted = (colId: string) => cards
    .filter(c => c.columnId === colId)
    .sort((a, b) => a.order - b.order)

  const sourceCards = getSorted(sourceColumnId)
  const destinationCards = getSorted(destinationColumnId)

  if (sourceColumnId === destinationColumnId) {
    // Same column - reorder
    const reordered = reorder(sourceCards, sourceIndex, destinationIndex)
    await Promise.all(
      reordered.map((c, i) => {
        if (c.order !== i) return cardsService.updateCard(c.id, { order: i })
        return Promise.resolve()
      })
    )
  } else {
    // Cross-column move
    const newDestination = [
      ...destinationCards.slice(0, destinationIndex),
      dragged,
      ...destinationCards.slice(destinationIndex),
    ]
    const newSource = sourceCards.filter(c => c.id !== dragged.id)

    await Promise.all([
      ...newSource.map((c, i) => (c.order !== i ? cardsService.updateCard(c.id, { order: i }) : Promise.resolve())),
      ...newDestination.map((c, i) => (
        c.id === dragged.id || c.order !== i
          ? cardsService.updateCard(c.id, { columnId: c.id === dragged.id ? destinationColumnId : c.columnId, order: i })
          : Promise.resolve()
      ))
    ])
  }
}
