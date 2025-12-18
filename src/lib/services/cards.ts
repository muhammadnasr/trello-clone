import { getDatabase } from '@/lib/db/init'
import type { Card } from '@/lib/types/card'
import { uuidv7 } from 'uuidv7'
import { reorder } from '@/lib/utils/reorder'

export async function createCard(columnId: string, title: string, order: number, ownerId: string): Promise<Card> {
  const db = getDatabase()
  const now = new Date().toISOString()

  const card = await db.cards.insert({
    id: uuidv7(),
    columnId,
    title,
    order,
    ownerId,
    createdAt: now,
    updatedAt: now,
  })

  return card.toJSON() as Card
}

export async function updateCard(id: string, updates: { title?: string; order?: number; columnId?: string }): Promise<void> {
  const db = getDatabase()
  const card = await db.cards.findOne(id).exec()

  if (!card) {
    throw new Error(`Card with id ${id} not found`)
  }

  await card.patch({
    ...updates,
    updatedAt: new Date().toISOString(),
  })
}

export async function deleteCard(id: string): Promise<void> {
  const db = getDatabase()
  const card = await db.cards.findOne(id).exec()

  if (!card) {
    throw new Error(`Card with id ${id} not found`)
  }

  await card.remove()
}

export async function getCardsByColumnId(columnId: string): Promise<Card[]> {
  const db = getDatabase()
  const cards = await db.cards.find({
    selector: {
      columnId,
    },
    sort: [{ order: 'asc' }],
  }).exec()

  return cards.map((doc) => doc.toJSON() as Card)
}

export async function getCardsByColumnIds(columnIds: string[]): Promise<Card[]> {
  const db = getDatabase()
  const cards = await db.cards.find({
    selector: {
      columnId: { $in: columnIds }
    },
    sort: [{ order: 'asc' }],
  }).exec()

  return cards.map((doc) => doc.toJSON() as Card)
}

/**
 * Updates card order within and between columns after a drag and drop operation.
 */
export async function updateCardsOrder(
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
  const cards = await getCardsByColumnIds(columnIds)

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
        if (c.order !== i) return updateCard(c.id, { order: i })
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
      ...newSource.map((c, i) => (c.order !== i ? updateCard(c.id, { order: i }) : Promise.resolve())),
      ...newDestination.map((c, i) => (
        c.id === dragged.id || c.order !== i
          ? updateCard(c.id, { columnId: c.id === dragged.id ? destinationColumnId : c.columnId, order: i })
          : Promise.resolve()
      ))
    ])
  }
}

