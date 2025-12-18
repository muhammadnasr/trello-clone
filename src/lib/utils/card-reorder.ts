import type { DropResult } from '@hello-pangea/dnd'
import * as cardsService from '@/lib/services/cards'

/**
 * Reorders an array by moving an item from one index to another.
 */
function reorder<T>(list: T[], from: number, to: number): T[] {
  const copy = [...list]
  const [item] = copy.splice(from, 1)
  copy.splice(to, 0, item)
  return copy
}

/**
 * Handles card reordering within and between columns after a drag and drop.
 * Uses service layer to persist changes.
 */
export async function handleCardReorder(result: DropResult): Promise<void> {
  const { source, destination, draggableId } = result
  if (!destination) return
  if (source.droppableId === destination.droppableId && source.index === destination.index) return

  const sourceColumnId = source.droppableId
  const destinationColumnId = destination.droppableId

  // Fetch cards from relevant columns only
  const columnIds = sourceColumnId === destinationColumnId
    ? [sourceColumnId]
    : [sourceColumnId, destinationColumnId]
  const cards = await cardsService.getCardsByColumnIds(columnIds)

  const dragged = cards.find(c => c.id === draggableId)
  if (!dragged) return

  const getSorted = (colId: string) => cards
    .filter(c => c.columnId === colId)
    .sort((a, b) => a.order - b.order)

  const sourceCards = getSorted(sourceColumnId)
  const destinationCards = getSorted(destinationColumnId)

  if (sourceColumnId === destinationColumnId) {
    // Same column - reorder
    const reordered = reorder(sourceCards, source.index, destination.index)
    await Promise.all(
      reordered.map((c, i) => {
        if (c.order !== i) return cardsService.updateCard(c.id, { order: i })
        return Promise.resolve()
      })
    )
  } else {
    // Cross-column move
    const newDestination = [
      ...destinationCards.slice(0, destination.index),
      dragged,
      ...destinationCards.slice(destination.index),
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
