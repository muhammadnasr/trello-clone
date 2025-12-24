import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useColumnsStore } from '../../src/stores/columns'
import type { Column } from '../../src/lib/types/column'
import * as columnsService from '../../src/lib/services/columns'

vi.mock('../../src/lib/services/columns', () => ({
  createColumn: vi.fn(),
  updateColumn: vi.fn(),
  deleteColumn: vi.fn(),
  updateColumnsOrder: vi.fn(),
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

    it('createColumn calls service and updates store state on success', async () => {
      const mockCreateColumn = vi.mocked(columnsService.createColumn)
      const newColumn: Column = {
        id: 'column-new',
        boardId: 'board1',
        title: 'New Column',
        order: 0,
        ownerId: 'user1',
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
      // Verify store state was updated
      expect(useColumnsStore.getState().columns).toHaveLength(1)
      expect(useColumnsStore.getState().columns[0]).toEqual(newColumn)
    })

    it('createColumn sets error on failure', async () => {
      const mockCreateColumn = vi.mocked(columnsService.createColumn)
      mockCreateColumn.mockRejectedValue(new Error('Service error'))

      const createColumn = useColumnsStore.getState().createColumn

      await expect(createColumn('board1', 'New Column', 0, 'user1')).rejects.toThrow('Service error')
      expect(useColumnsStore.getState().error).toBe('Service error')
    })

    it('updateColumn calls service and updates store state on success', async () => {
      const mockUpdateColumn = vi.mocked(columnsService.updateColumn)
      mockUpdateColumn.mockResolvedValue(undefined)

      const existingColumn: Column = {
        id: 'column1',
        boardId: 'board1',
        title: 'Original Title',
        order: 0,
        ownerId: 'user1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      useColumnsStore.getState().setColumns([existingColumn])
      useColumnsStore.getState().setError('Previous error')

      const updateColumn = useColumnsStore.getState().updateColumn
      await updateColumn('column1', { title: 'Updated Title' })

      expect(mockUpdateColumn).toHaveBeenCalledWith('column1', { title: 'Updated Title' })
      expect(useColumnsStore.getState().error).toBeNull()
      // Verify store state was updated
      const updatedColumn = useColumnsStore.getState().columns.find(c => c.id === 'column1')
      expect(updatedColumn?.title).toBe('Updated Title')
      expect(updatedColumn?.updatedAt).toBeDefined()
    })

    it('updateColumn sets error on failure', async () => {
      const mockUpdateColumn = vi.mocked(columnsService.updateColumn)
      mockUpdateColumn.mockRejectedValue(new Error('Service error'))

      const updateColumn = useColumnsStore.getState().updateColumn

      await expect(updateColumn('column1', { title: 'Updated Title' })).rejects.toThrow('Service error')
      expect(useColumnsStore.getState().error).toBe('Service error')
    })

    it('deleteColumn calls service and updates store state on success', async () => {
      const mockDeleteColumn = vi.mocked(columnsService.deleteColumn)
      mockDeleteColumn.mockResolvedValue(undefined)

      const existingColumn: Column = {
        id: 'column1',
        boardId: 'board1',
        title: 'Column to Delete',
        order: 0,
        ownerId: 'user1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      useColumnsStore.getState().setColumns([existingColumn])
      useColumnsStore.getState().setError('Previous error')

      const deleteColumn = useColumnsStore.getState().deleteColumn
      await deleteColumn('column1')

      expect(mockDeleteColumn).toHaveBeenCalledWith('column1')
      expect(useColumnsStore.getState().error).toBeNull()
      // Verify store state was updated
      expect(useColumnsStore.getState().columns).toHaveLength(0)
      expect(useColumnsStore.getState().columns.find(c => c.id === 'column1')).toBeUndefined()
    })

    it('deleteColumn sets error on failure', async () => {
      const mockDeleteColumn = vi.mocked(columnsService.deleteColumn)
      mockDeleteColumn.mockRejectedValue(new Error('Service error'))

      const deleteColumn = useColumnsStore.getState().deleteColumn

      await expect(deleteColumn('column1')).rejects.toThrow('Service error')
      expect(useColumnsStore.getState().error).toBe('Service error')
    })

    it('updateColumnsOrder calls service and updates store state on success', async () => {
      const mockUpdateColumnsOrder = vi.mocked(columnsService.updateColumnsOrder)
      mockUpdateColumnsOrder.mockResolvedValue(undefined)

      const columns: Column[] = [
        {
          id: 'column1',
          boardId: 'board1',
          title: 'Column 1',
          order: 0,
          ownerId: 'user1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'column2',
          boardId: 'board1',
          title: 'Column 2',
          order: 1,
          ownerId: 'user1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]
      useColumnsStore.getState().setColumns(columns)

      const reorderedColumns: Column[] = [
        { ...columns[1], order: 0 },
        { ...columns[0], order: 1 },
      ]

      const updateColumnsOrder = useColumnsStore.getState().updateColumnsOrder
      await updateColumnsOrder(reorderedColumns)

      expect(mockUpdateColumnsOrder).toHaveBeenCalledWith(reorderedColumns)
      // Verify store state was updated
      const stateColumns = useColumnsStore.getState().columns
      expect(stateColumns).toEqual(reorderedColumns)
      expect(stateColumns[0].id).toBe('column2')
      expect(stateColumns[1].id).toBe('column1')
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

