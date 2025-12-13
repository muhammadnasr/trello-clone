import type { TrelloDatabase } from './database'
import { useBoardsStore } from '@/stores/boards'
import type { BoardDocument } from '@/lib/types/board'

/**
 * Syncs RxDB boards collection with Zustand store using reactive queries.
 * This keeps the Zustand store in sync with RxDB changes automatically.
 */
export function syncBoardsToStore(database: TrelloDatabase): () => void {
  // Subscribe to all boards using RxDB reactive query
  const subscription = database.boards
    .find({
      selector: {}, // Get all boards
    })
    .$.subscribe((rxDocuments) => {
      // Convert RxDocuments to plain BoardDocument objects
      const boards: BoardDocument[] = rxDocuments.map((doc) => doc.toJSON() as BoardDocument)
      
      // Update Zustand store
      useBoardsStore.getState().setBoards(boards)
    })

  // Return unsubscribe function
  return () => subscription.unsubscribe()
}

