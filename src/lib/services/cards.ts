import { getDatabase } from '@/lib/db/init'
import type { Card } from '@/lib/types/card'
import { uuidv7 } from 'uuidv7'

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
 * Accepts updates map from UI layer to avoid duplication.
 */
export async function updateCardsOrder(
  updates: Record<string, { order?: number; columnId?: string }>
): Promise<void> {
  // Apply all updates
  await Promise.all(
    Object.entries(updates).map(([cardId, update]) => updateCard(cardId, update))
  )
}

