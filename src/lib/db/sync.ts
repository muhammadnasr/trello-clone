import type { TrelloDatabase } from './database'
import { useBoardsStore } from '@/stores/boards'
import { useColumnsStore } from '@/stores/columns'
import { useCardsStore } from '@/stores/cards'
import { useAuthStore } from '@/stores/auth'
import type { Board } from '@/lib/types/board'
import type { Column } from '@/lib/types/column'
import type { Card } from '@/lib/types/card'

export function syncStoresToDatabase(database: TrelloDatabase): () => void {
  let boardsUnsubscribe: (() => void) | null = null
  let columnsUnsubscribe: (() => void) | null = null
  let cardsUnsubscribe: (() => void) | null = null
  let authUnsubscribe: (() => void) | null = null

  const setupSubscriptions = () => {
    // Unsubscribe from previous subscriptions if they exist
    if (boardsUnsubscribe) {
      boardsUnsubscribe()
      boardsUnsubscribe = null
    }
    if (columnsUnsubscribe) {
      columnsUnsubscribe()
      columnsUnsubscribe = null
    }
    if (cardsUnsubscribe) {
      cardsUnsubscribe()
      cardsUnsubscribe = null
    }

    // Firestore rules handle access control - sync all replicated data
    // Boards subscription
    const boardsSub = database.boards
      .find()
      .$.subscribe((rxDocuments) => {
        const boards = rxDocuments.map((doc) => doc.toJSON() as Board)
        useBoardsStore.getState().setBoards(boards)
      })

    boardsUnsubscribe = () => boardsSub.unsubscribe()

    // Columns subscription
    const columnsSub = database.columns
      .find()
      .$.subscribe((rxDocuments) => {
        const columns = rxDocuments.map((doc) => doc.toJSON() as Column)
        useColumnsStore.getState().setColumns(columns)
      })

    columnsUnsubscribe = () => columnsSub.unsubscribe()

    // Cards subscription
    if (database.cards) {
      const cardsSub = database.cards
        .find()
        .$.subscribe((rxDocuments) => {
          const cards = rxDocuments.map((doc) => doc.toJSON() as Card)
          useCardsStore.getState().setCards(cards)
        })

      cardsUnsubscribe = () => cardsSub.unsubscribe()
    }
  }

  // Set up initial subscriptions
  setupSubscriptions()

  // Subscribe to auth changes to recreate subscriptions when user changes
  authUnsubscribe = useAuthStore.subscribe(() => {
    setupSubscriptions()
  })

  return () => {
    if (boardsUnsubscribe) {
      boardsUnsubscribe()
    }
    if (columnsUnsubscribe) {
      columnsUnsubscribe()
    }
    if (cardsUnsubscribe) {
      cardsUnsubscribe()
    }
    if (authUnsubscribe) {
      authUnsubscribe()
    }
  }
}

// Backward compatibility: individual functions that use the unified sync
// Note: These set up both boards and columns subscriptions, but tests can still use them
export function syncBoardsToStore(database: TrelloDatabase): () => void {
  return syncStoresToDatabase(database)
}

export function syncColumnsToStore(database: TrelloDatabase): () => void {
  return syncStoresToDatabase(database)
}
