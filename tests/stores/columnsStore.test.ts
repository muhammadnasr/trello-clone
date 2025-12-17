import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useColumnsStore } from '../../src/stores/columns'
import type { Column } from '../../src/lib/types/column'
import * as columnsService from '../../src/lib/services/columns'

vi.mock('../../src/lib/services/columns', () => ({
  createColumn: vi.fn(),
  updateColumn: vi.fn(),
  deleteColumn: vi.fn(),
}))

describe('Columns Store', () => {
  beforeEach(() => {
    useColumnsStore.setState({
      columns: [],
      isLoading: false,
      error: null,
    })
  })

  it('initializes with empty state', () => {
    const state = useColumnsStore.getState()
    expect(state.columns).toEqual([])
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
  })

  it('sets columns', () => {
    const columns: Column[] = [
      {
        id: 'column1',
        boardId: 'board1',
        title: 'Column 1',
        order: 0,
        ownerId: 'user1',
        accessibleUserIds: ['user1'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]

    useColumnsStore.getState().setColumns(columns)
    expect(useColumnsStore.getState().columns).toEqual(columns)
  })

  describe('Async actions', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('createColumn calls service and clears error on success', async () => {
      const mockCreateColumn = vi.mocked(columnsService.createColumn)
      const newColumn: Column = {
        id: 'column-new',
        boardId: 'board1',
        title: 'New Column',
        order: 0,
        ownerId: 'user1',
        accessibleUserIds: ['user1'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      mockCreateColumn.mockResolvedValue(newColumn)

      useColumnsStore.getState().setError('Previous error')
      
      const createColumn = useColumnsStore.getState().createColumn
      const result = await createColumn('board1', 'New Column', 0, 'user1')

      expect(mockCreateColumn).toHaveBeenCalledWith('board1', 'New Column', 0, 'user1')
      expect(result).toEqual(newColumn)
      expect(useColumnsStore.getState().error).toBeNull()
    })

    it('createColumn sets error on failure', async () => {
      const mockCreateColumn = vi.mocked(columnsService.createColumn)
      mockCreateColumn.mockRejectedValue(new Error('Service error'))

      const createColumn = useColumnsStore.getState().createColumn

      await expect(createColumn('board1', 'New Column', 0, 'user1')).rejects.toThrow('Service error')
      expect(useColumnsStore.getState().error).toBe('Service error')
    })

    it('updateColumn calls service and clears error on success', async () => {
      const mockUpdateColumn = vi.mocked(columnsService.updateColumn)
      mockUpdateColumn.mockResolvedValue(undefined)

      useColumnsStore.getState().setError('Previous error')

      const updateColumn = useColumnsStore.getState().updateColumn
      await updateColumn('column1', { title: 'Updated Title' })

      expect(mockUpdateColumn).toHaveBeenCalledWith('column1', { title: 'Updated Title' })
      expect(useColumnsStore.getState().error).toBeNull()
    })

    it('updateColumn sets error on failure', async () => {
      const mockUpdateColumn = vi.mocked(columnsService.updateColumn)
      mockUpdateColumn.mockRejectedValue(new Error('Service error'))

      const updateColumn = useColumnsStore.getState().updateColumn

      await expect(updateColumn('column1', { title: 'Updated Title' })).rejects.toThrow('Service error')
      expect(useColumnsStore.getState().error).toBe('Service error')
    })

    it('deleteColumn calls service and clears error on success', async () => {
      const mockDeleteColumn = vi.mocked(columnsService.deleteColumn)
      mockDeleteColumn.mockResolvedValue(undefined)

      useColumnsStore.getState().setError('Previous error')

      const deleteColumn = useColumnsStore.getState().deleteColumn
      await deleteColumn('column1')

      expect(mockDeleteColumn).toHaveBeenCalledWith('column1')
      expect(useColumnsStore.getState().error).toBeNull()
    })

    it('deleteColumn sets error on failure', async () => {
      const mockDeleteColumn = vi.mocked(columnsService.deleteColumn)
      mockDeleteColumn.mockRejectedValue(new Error('Service error'))

      const deleteColumn = useColumnsStore.getState().deleteColumn

      await expect(deleteColumn('column1')).rejects.toThrow('Service error')
      expect(useColumnsStore.getState().error).toBe('Service error')
    })
  })

  it('sets loading state', () => {
    useColumnsStore.getState().setLoading(true)
    expect(useColumnsStore.getState().isLoading).toBe(true)

    useColumnsStore.getState().setLoading(false)
    expect(useColumnsStore.getState().isLoading).toBe(false)
  })

  it('sets error state', () => {
    useColumnsStore.getState().setError('Something went wrong')
    expect(useColumnsStore.getState().error).toBe('Something went wrong')

    useColumnsStore.getState().setError(null)
    expect(useColumnsStore.getState().error).toBeNull()
  })
})

