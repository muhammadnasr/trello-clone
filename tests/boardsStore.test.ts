import { describe, it, expect, beforeEach } from 'vitest'
import { useBoardsStore } from '../src/stores/boards'
import type { BoardDocument } from '../src/lib/types/board'

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
    const boards: BoardDocument[] = [
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

  it('adds a board', () => {
    const board: BoardDocument = {
      id: 'board1',
      title: 'New Board',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ownerId: 'user1',
    }

    useBoardsStore.getState().addBoard(board)
    const state = useBoardsStore.getState()
    expect(state.boards).toHaveLength(1)
    expect(state.boards[0]).toEqual(board)
  })

  it('updates a board', () => {
    const board: BoardDocument = {
      id: 'board1',
      title: 'Original Title',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ownerId: 'user1',
    }

    useBoardsStore.getState().addBoard(board)
    useBoardsStore.getState().updateBoard('board1', { title: 'Updated Title' })

    const state = useBoardsStore.getState()
    expect(state.boards[0].title).toBe('Updated Title')
    expect(state.boards[0].id).toBe('board1')
  })

  it('removes a board', () => {
    const board1: BoardDocument = {
      id: 'board1',
      title: 'Board 1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ownerId: 'user1',
    }
    const board2: BoardDocument = {
      id: 'board2',
      title: 'Board 2',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ownerId: 'user1',
    }

    useBoardsStore.getState().addBoard(board1)
    useBoardsStore.getState().addBoard(board2)
    useBoardsStore.getState().removeBoard('board1')

    const state = useBoardsStore.getState()
    expect(state.boards).toHaveLength(1)
    expect(state.boards[0].id).toBe('board2')
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

