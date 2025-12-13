import type { TrelloDatabase } from './database'
import { useBoardsStore } from '@/stores/boards'
import type { Board } from '@/lib/types/board'

// Sync RxDB (single source of truth) -> Zustand (state management)
export function syncBoardsToStore(database: TrelloDatabase): () => void {
  const subscription = database.boards
    .find({
      selector: {},
    })
    .$.subscribe((rxDocuments) => {
      const boards: Board[] = rxDocuments.map((doc) => doc.toJSON() as Board)
      useBoardsStore.getState().setBoards(boards)
    })

  return () => subscription.unsubscribe()
}

