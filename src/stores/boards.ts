import { create } from 'zustand'
import type { Board } from '@/lib/types/board'

interface BoardsState {
  boards: Board[]
  isLoading: boolean
  error: string | null
}

interface BoardsActions {
  setBoards: (boards: Board[]) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  addBoard: (board: Board) => void
  updateBoard: (id: string, updates: Partial<Board>) => void
  removeBoard: (id: string) => void
}

export type BoardsStore = BoardsState & BoardsActions

export const useBoardsStore = create<BoardsStore>((set) => ({
  boards: [],
  isLoading: false,
  error: null,
  
  setBoards: (boards) => set({ boards }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  
  addBoard: (board) => set((state) => ({
    boards: [...state.boards, board],
  })),
  
  updateBoard: (id, updates) => set((state) => ({
    boards: state.boards.map((board) =>
      board.id === id ? { ...board, ...updates } : board
    ),
  })),
  
  removeBoard: (id) => set((state) => ({
    boards: state.boards.filter((board) => board.id !== id),
  })),
}))

