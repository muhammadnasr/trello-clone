import type { TrelloDatabase } from './database'
import { useBoardsStore } from '@/stores/boards'
import { useColumnsStore } from '@/stores/columns'
import { useAuthStore } from '@/stores/auth'
import type { Board } from '@/lib/types/board'
import type { Column } from '@/lib/types/column'

export function syncBoardsToStore(database: TrelloDatabase): () => void {
  let unsubscribe: (() => void) | null = null
  let authUnsubscribe: (() => void) | null = null

  const setupSubscription = () => {
    // Unsubscribe from previous subscription if exists
    if (unsubscribe) {
      unsubscribe()
    }

    // Get current auth state
    const authState = useAuthStore.getState()
    const ownerId = authState.isAuthenticated && authState.user 
      ? authState.user.uid 
      : 'anonymous'

    // Set up reactive query filtered by ownerId
    const subscription = database.boards
      .find({
        selector: {
          ownerId,
        },
      })
      .$.subscribe((rxDocuments) => {
        const boards: Board[] = rxDocuments
          .map((doc) => doc.toJSON() as Board)
        useBoardsStore.getState().setBoards(boards)
      })

    unsubscribe = () => subscription.unsubscribe()
  }

  // Set up initial subscription
  setupSubscription()

  // Subscribe to auth changes to update filter
  authUnsubscribe = useAuthStore.subscribe(() => {
    setupSubscription()
  })

  return () => {
    if (unsubscribe) {
      unsubscribe()
    }
    if (authUnsubscribe) {
      authUnsubscribe()
    }
  }
}

export function syncColumnsToStore(database: TrelloDatabase): () => void {
  let unsubscribe: (() => void) | null = null
  let authUnsubscribe: (() => void) | null = null
  let boardsUnsubscribe: (() => void) | null = null
  let userBoardIds: string[] = []

  const updateUserBoards = () => {
    // Unsubscribe from previous boards subscription if exists
    if (boardsUnsubscribe) {
      boardsUnsubscribe()
    }

    // Get current auth state
    const authState = useAuthStore.getState()
    const ownerId = authState.isAuthenticated && authState.user 
      ? authState.user.uid 
      : 'anonymous'

    // Subscribe to user's boards to get board IDs
    const boardsSub = database.boards
      .find({
        selector: {
          ownerId,
        },
      })
      .$.subscribe((rxDocuments) => {
        userBoardIds = rxDocuments.map((doc) => doc.id)
        // Trigger columns update when boards change
        updateColumns()
      })

    boardsUnsubscribe = () => boardsSub.unsubscribe()
  }

  const updateColumns = () => {
    // Get all columns and filter by user's board IDs
    database.columns
      .find({
        selector: {},
      })
      .exec()
      .then((rxDocuments) => {
        const columns: Column[] = rxDocuments
          .map((doc) => doc.toJSON() as Column)
          .filter((column) => userBoardIds.includes(column.boardId))
        useColumnsStore.getState().setColumns(columns)
      })
  }

  const setupSubscription = () => {
    // Unsubscribe from previous subscription if exists
    if (unsubscribe) {
      unsubscribe()
    }

    // Set up reactive query for columns
    const subscription = database.columns
      .find({
        selector: {},
      })
      .$.subscribe(() => {
        // When columns change, filter by current user's boards
        updateColumns()
      })

    unsubscribe = () => subscription.unsubscribe()
    
    // Update user boards and columns
    updateUserBoards()
  }

  // Set up initial subscription
  setupSubscription()

  // Subscribe to auth changes to update filter
  authUnsubscribe = useAuthStore.subscribe(() => {
    updateUserBoards()
  })

  return () => {
    if (unsubscribe) {
      unsubscribe()
    }
    if (authUnsubscribe) {
      authUnsubscribe()
    }
    if (boardsUnsubscribe) {
      boardsUnsubscribe()
    }
  }
}

