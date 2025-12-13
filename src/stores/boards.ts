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
  
  setBoards: (boards) => set({ boards }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  
  createBoard: async (title: string, ownerId: string) => {
    set({ error: null })
    try {
      const board = await boardsService.createBoard(title.trim(), ownerId)
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
      await boardsService.updateBoard(id, updates)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update board'
      set({ error: errorMessage })
      throw error
    }
  },
  
  deleteBoard: async (id: string) => {
    set({ error: null })
    try {
      await boardsService.deleteBoard(id)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete board'
      set({ error: errorMessage })
      throw error
    }
  },
}))

