import { create } from 'zustand'
import type { Board } from '@/lib/types/board'
import * as boardsService from '@/lib/services/boards'

interface BoardsState {
  boards: Board[]
  isLoading: boolean
  error: string | null
}

interface BoardsActions {
  // Internal sync actions (used by RxDB reactive sync)
  setBoards: (boards: Board[]) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  
  // Public async actions (called by components)
  createBoard: (title: string, ownerId: string) => Promise<Board>
  updateBoard: (id: string, updates: { title?: string }) => Promise<void>
  deleteBoard: (id: string) => Promise<void>
}

export type BoardsStore = BoardsState & BoardsActions

export const useBoardsStore = create<BoardsStore>((set) => ({
  boards: [],
  isLoading: false,
  error: null,
  
  // Internal sync actions (used by RxDB reactive sync)
  setBoards: (boards) => set({ boards }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  
  // Public async actions (called by components)
  createBoard: async (title: string, ownerId: string) => {
    set({ error: null })
    try {
      // Call service to insert into RxDB
      const board = await boardsService.createBoard(title.trim(), ownerId)
      // Reactive sync will automatically update Zustand via setBoards()
      return board
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create board'
      set({ error: errorMessage })
      throw error
    }
  },
  
  updateBoard: async (id: string, updates: { title?: string }) => {
    set({ error: null })
    try {
      // Call service to update RxDB
      await boardsService.updateBoard(id, updates)
      // Reactive sync will automatically update Zustand via setBoards()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update board'
      set({ error: errorMessage })
      throw error
    }
  },
  
  deleteBoard: async (id: string) => {
    set({ error: null })
    try {
      // Call service to delete from RxDB
      await boardsService.deleteBoard(id)
      // Reactive sync will automatically update Zustand via setBoards()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete board'
      set({ error: errorMessage })
      throw error
    }
  },
}))

