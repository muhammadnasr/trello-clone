import type { TrelloDatabase } from './database'
import { useBoardsStore } from '@/stores/boards'
import { useColumnsStore } from '@/stores/columns'
import type { Board } from '@/lib/types/board'
import type { Column } from '@/lib/types/column'

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

export function syncColumnsToStore(database: TrelloDatabase): () => void {
  const subscription = database.columns
    .find({
      selector: {},
    })
    .$.subscribe((rxDocuments) => {
      const columns: Column[] = rxDocuments.map((doc) => doc.toJSON() as Column)
      useColumnsStore.getState().setColumns(columns)
    })

  return () => subscription.unsubscribe()
}

