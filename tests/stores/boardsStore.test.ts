import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useBoardsStore } from '../../src/stores/boards'
import type { Board } from '../../src/lib/types/board'
import * as boardsService from '../../src/lib/services/boards'

// Mock the boards service
vi.mock('../../src/lib/services/boards', () => ({
  createBoard: vi.fn(),
  updateBoard: vi.fn(),
  deleteBoard: vi.fn(),
}))

describe('Boards Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useBoardsStore.setState({
      boards: [],
      isLoading: false,
      error: null,
    })
  })

  it('initializes with empty state', () => {
    const state = useBoardsStore.getState()
    expect(state.boards).toEqual([])
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
  })

  it('sets boards', () => {
    const boards: Board[] = [
      {
        id: 'board1',
        title: 'Board 1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ownerId: 'user1',
      },
    ]

    useBoardsStore.getState().setBoards(boards)
    expect(useBoardsStore.getState().boards).toEqual(boards)
  })

  describe('Async actions', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('createBoard calls service and clears error on success', async () => {
      const mockCreateBoard = vi.mocked(boardsService.createBoard)
      const newBoard: Board = {
        id: 'board-new',
        title: 'New Board',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ownerId: 'user1',
      }
      mockCreateBoard.mockResolvedValue(newBoard)

      // Set an error first
      useBoardsStore.getState().setError('Previous error')
      
      const createBoard = useBoardsStore.getState().createBoard
      const result = await createBoard('New Board', 'user1')

      expect(mockCreateBoard).toHaveBeenCalledWith('New Board', 'user1')
      expect(result).toEqual(newBoard)
      // Error should be cleared on success
      expect(useBoardsStore.getState().error).toBeNull()
    })

    it('createBoard sets error on failure', async () => {
      const mockCreateBoard = vi.mocked(boardsService.createBoard)
      mockCreateBoard.mockRejectedValue(new Error('Service error'))

      const createBoard = useBoardsStore.getState().createBoard

      await expect(createBoard('New Board', 'user1')).rejects.toThrow('Service error')
      expect(useBoardsStore.getState().error).toBe('Service error')
    })

    it('updateBoard calls service and clears error on success', async () => {
      const mockUpdateBoard = vi.mocked(boardsService.updateBoard)
      mockUpdateBoard.mockResolvedValue(undefined)

      // Set an error first
      useBoardsStore.getState().setError('Previous error')

      const updateBoard = useBoardsStore.getState().updateBoard
      await updateBoard('board1', { title: 'Updated Title' })

      expect(mockUpdateBoard).toHaveBeenCalledWith('board1', { title: 'Updated Title' })
      // Error should be cleared on success
      expect(useBoardsStore.getState().error).toBeNull()
    })

    it('updateBoard sets error on failure', async () => {
      const mockUpdateBoard = vi.mocked(boardsService.updateBoard)
      mockUpdateBoard.mockRejectedValue(new Error('Service error'))

      const updateBoard = useBoardsStore.getState().updateBoard

      await expect(updateBoard('board1', { title: 'Updated Title' })).rejects.toThrow('Service error')
      expect(useBoardsStore.getState().error).toBe('Service error')
    })

    it('deleteBoard calls service and clears error on success', async () => {
      const mockDeleteBoard = vi.mocked(boardsService.deleteBoard)
      mockDeleteBoard.mockResolvedValue(undefined)

      // Set an error first
      useBoardsStore.getState().setError('Previous error')

      const deleteBoard = useBoardsStore.getState().deleteBoard
      await deleteBoard('board1')

      expect(mockDeleteBoard).toHaveBeenCalledWith('board1')
      // Error should be cleared on success
      expect(useBoardsStore.getState().error).toBeNull()
    })

    it('deleteBoard sets error on failure', async () => {
      const mockDeleteBoard = vi.mocked(boardsService.deleteBoard)
      mockDeleteBoard.mockRejectedValue(new Error('Service error'))

      const deleteBoard = useBoardsStore.getState().deleteBoard

      await expect(deleteBoard('board1')).rejects.toThrow('Service error')
      expect(useBoardsStore.getState().error).toBe('Service error')
    })
  })

  it('sets loading state', () => {
    useBoardsStore.getState().setLoading(true)
    expect(useBoardsStore.getState().isLoading).toBe(true)

    useBoardsStore.getState().setLoading(false)
    expect(useBoardsStore.getState().isLoading).toBe(false)
  })

  it('sets error state', () => {
    useBoardsStore.getState().setError('Something went wrong')
    expect(useBoardsStore.getState().error).toBe('Something went wrong')

    useBoardsStore.getState().setError(null)
    expect(useBoardsStore.getState().error).toBeNull()
  })
})

