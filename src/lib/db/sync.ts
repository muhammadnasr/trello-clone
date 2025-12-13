import type { TrelloDatabase } from './database'
import { useBoardsStore } from '@/stores/boards'
import type { Board } from '@/lib/types/board'

/**
 * Syncs RxDB boards collection with Zustand store using reactive queries.
 * This keeps the Zustand store in sync with RxDB changes automatically.
 * RxDB is the single source of truth for the data.
 */
export function syncBoardsToStore(database: TrelloDatabase): () => void {
  // Subscribe to all boards using RxDB reactive query
  const subscription = database.boards
    .find({
      selector: {}, // Get all boards
    })
    .$.subscribe((rxDocuments) => {
      // Convert RxDocuments to plain Board objects
      const boards: Board[] = rxDocuments.map((doc) => doc.toJSON() as Board)
      
      // Update Zustand store
      useBoardsStore.getState().setBoards(boards)
    })

  // Return unsubscribe function
  return () => subscription.unsubscribe()
}

