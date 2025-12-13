import { describe, it, expect, beforeEach, vi } from 'vitest'
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from '../../../src/routeTree.gen'
import { useBoardsStore } from '../../../src/stores/boards'
import * as boardsService from '../../../src/lib/services/boards'
import type { Board } from '../../../src/lib/types/board'

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Mock the boards service
vi.mock('../../../src/lib/services/boards', () => ({
  createBoard: vi.fn(),
}))

describe('BoardsList Integration - Create Board', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset store
    useBoardsStore.setState({
      boards: [],
      isLoading: false,
      error: null,
    })
  })

  it('displays newly created board in the list', async () => {
    const user = userEvent.setup()
    const mockCreateBoard = vi.mocked(boardsService.createBoard)
    
    const newBoard: Board = {
      id: 'board-new',
      title: 'My New Board',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ownerId: 'user1',
    }

    mockCreateBoard.mockResolvedValue(newBoard)

    router.history.push('/')
    render(<RouterProvider router={router} />)

    // Wait for empty state
    await waitFor(() => {
      expect(screen.getByText(/No boards yet/)).toBeTruthy()
    })

    // Click create board button
    await user.click(screen.getByText('Create Board'))

    // Wait for dialog to open
    await waitFor(() => {
      expect(screen.getByText('Create New Board')).toBeTruthy()
    })

    // Type board name
    const input = screen.getByPlaceholderText('Board name')
    await user.type(input, 'My New Board')

    // Click create
    await user.click(screen.getByText('Create'))

    // Wait for board to be created
    await waitFor(() => {
      expect(mockCreateBoard).toHaveBeenCalledWith('My New Board', 'user1')
    })

    // Simulate the board being added to the store (this happens via RxDB sync in real app)
    useBoardsStore.getState().addBoard(newBoard)

    // Verify the board name appears in the list
    await waitFor(() => {
      expect(screen.getByText('My New Board')).toBeTruthy()
    })
  })

  it('shows board name in the list after creation', async () => {
    const user = userEvent.setup()
    const mockCreateBoard = vi.mocked(boardsService.createBoard)
    
    const newBoard: Board = {
      id: 'board-test',
      title: 'Test Board Name',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ownerId: 'user1',
    }

    mockCreateBoard.mockResolvedValue(newBoard)

    router.history.push('/')
    render(<RouterProvider router={router} />)

    // Create board
    await waitFor(() => {
      expect(screen.getByText('Create Board')).toBeTruthy()
    })

    await user.click(screen.getByText('Create Board'))
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Board name')).toBeTruthy()
    })

    await user.type(screen.getByPlaceholderText('Board name'), 'Test Board Name')
    await user.click(screen.getByText('Create'))

    // Add board to store (simulating RxDB sync)
    useBoardsStore.getState().addBoard(newBoard)

    // Verify board name is visible in the list
    await waitFor(() => {
      const boardName = screen.getByText('Test Board Name')
      expect(boardName).toBeTruthy()
      // Verify it's in a heading (h2) as per BoardCard structure
      expect(boardName.tagName).toBe('H2')
    })
  })
})

