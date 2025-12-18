import { create } from 'zustand'
import type { Column } from '@/lib/types/column'
import * as columnsService from '@/lib/services/columns'

interface ColumnsState {
  columns: Column[]
  isLoading: boolean
  error: string | null
}

interface ColumnsActions {
  setColumns: (columns: Column[]) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  createColumn: (boardId: string, title: string, order: number, ownerId: string) => Promise<Column>
  updateColumn: (id: string, updates: { title?: string; order?: number }) => Promise<void>
  deleteColumn: (id: string) => Promise<void>
  updateColumnsOrder: (reorderedColumns: Column[]) => Promise<void>
}

export type ColumnsStore = ColumnsState & ColumnsActions

export const useColumnsStore = create<ColumnsStore>((set) => ({
  columns: [],
  isLoading: false,
  error: null,

  setColumns: (columns) => set({ columns }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  createColumn: async (boardId: string, title: string, order: number, ownerId: string) => {
    set({ error: null })
    try {
      const column = await columnsService.createColumn(boardId, title.trim(), order, ownerId)
      return column
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create column'
      set({ error: errorMessage })
      throw error
    }
  },

  updateColumn: async (id: string, updates: { title?: string; order?: number }) => {
    set({ error: null })
    try {
      await columnsService.updateColumn(id, updates)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update column'
      set({ error: errorMessage })
      throw error
    }
  },

  deleteColumn: async (id: string) => {
    set({ error: null })
    try {
      await columnsService.deleteColumn(id)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete column'
      set({ error: errorMessage })
      throw error
    }
  },

  updateColumnsOrder: async (reorderedColumns: Column[]) => {
    set({ error: null })
    try {
      await columnsService.updateColumnsOrder(reorderedColumns)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update columns order'
      set({ error: errorMessage })
      throw error
    }
  },
}))

