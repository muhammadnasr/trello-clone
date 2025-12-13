import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
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
  updateBoard: vi.fn(),
  deleteBoard: vi.fn(),
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

describe('BoardsList Integration - Update Board', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset store
    useBoardsStore.setState({
      boards: [],
      isLoading: false,
      error: null,
    })
  })

  it('updates board title when renamed', async () => {
    const user = userEvent.setup()
    const mockUpdateBoard = vi.mocked(boardsService.updateBoard)
    
    const existingBoard: Board = {
      id: 'board-existing',
      title: 'Original Title',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ownerId: 'user1',
    }

    // Set up initial board in store
    useBoardsStore.setState({
      boards: [existingBoard],
      isLoading: false,
      error: null,
    })

    mockUpdateBoard.mockResolvedValue(undefined)

    router.history.push('/')
    render(<RouterProvider router={router} />)

    // Wait for board to appear
    await waitFor(() => {
      expect(screen.getByText('Original Title')).toBeInTheDocument()
    })

    // Find the board card and hover over it to reveal the buttons
    const boardCard = screen.getByText('Original Title').closest('div.group')
    expect(boardCard).toBeInTheDocument()
    
    // Hover over the card to make buttons visible
    await user.hover(boardCard!)

    // Find edit button by its accessible name (title attribute)
    const editButton = await screen.findByTitle('Rename board')
    
    // Click the edit button
    await user.click(editButton)

    // Wait for rename dialog to open
    await waitFor(() => {
      expect(screen.getByText('Rename Board')).toBeInTheDocument()
    })

    // Find the input field and update the title
    const input = screen.getByPlaceholderText('Board name')
    await user.clear(input)
    await user.type(input, 'Updated Title')

    // Click Save button
    await user.click(screen.getByRole('button', { name: 'Save' }))

    // Verify updateBoard was called with correct parameters
    await waitFor(() => {
      expect(mockUpdateBoard).toHaveBeenCalledWith('board-existing', { title: 'Updated Title' })
    })

    // Simulate the board being updated in the store (this happens via RxDB sync in real app)
    useBoardsStore.getState().updateBoard('board-existing', { title: 'Updated Title' })

    // Verify the updated title appears in the list
    await waitFor(() => {
      expect(screen.getByText('Updated Title')).toBeInTheDocument()
      expect(screen.queryByText('Original Title')).not.toBeInTheDocument()
    })
  })

  it('cancels rename when Cancel button is clicked', async () => {
    const user = userEvent.setup()
    const mockUpdateBoard = vi.mocked(boardsService.updateBoard)
    
    const existingBoard: Board = {
      id: 'board-existing',
      title: 'Original Title',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ownerId: 'user1',
    }

    // Set up initial board in store
    useBoardsStore.setState({
      boards: [existingBoard],
      isLoading: false,
      error: null,
    })

    router.history.push('/')
    render(<RouterProvider router={router} />)

    // Wait for board to appear
    await waitFor(() => {
      expect(screen.getByText('Original Title')).toBeInTheDocument()
    })

    // Find the board card and hover over it
    const boardCard = screen.getByText('Original Title').closest('div.group')
    await user.hover(boardCard!)

    // Find and click edit button
    const editButton = await screen.findByTitle('Rename board')
    await user.click(editButton)

    // Wait for rename dialog to open
    await waitFor(() => {
      expect(screen.getByText('Rename Board')).toBeInTheDocument()
    })

    // Type a new title
    const input = screen.getByPlaceholderText('Board name')
    await user.clear(input)
    await user.type(input, 'New Title')

    // Click Cancel button
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    // Verify updateBoard was NOT called
    expect(mockUpdateBoard).not.toHaveBeenCalled()

    // Verify the original title is still displayed
    expect(screen.getByText('Original Title')).toBeInTheDocument()
    expect(screen.queryByText('New Title')).not.toBeInTheDocument()
  })
})

describe('BoardsList Integration - Delete Board', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset store
    useBoardsStore.setState({
      boards: [],
      isLoading: false,
      error: null,
    })
    // Mock window.confirm to return true by default
    window.confirm = vi.fn(() => true)
  })

  afterEach(() => {
    // Restore original confirm
    window.confirm = window.confirm as typeof confirm
  })

  it('deletes board when delete button is clicked and confirmed', async () => {
    const user = userEvent.setup()
    const mockDeleteBoard = vi.mocked(boardsService.deleteBoard)
    
    const boardToDelete: Board = {
      id: 'board-to-delete',
      title: 'Board to Delete',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ownerId: 'user1',
    }

    // Set up initial board in store
    useBoardsStore.setState({
      boards: [boardToDelete],
      isLoading: false,
      error: null,
    })

    mockDeleteBoard.mockResolvedValue(undefined)

    router.history.push('/')
    render(<RouterProvider router={router} />)

    // Wait for board to appear
    await waitFor(() => {
      expect(screen.getByText('Board to Delete')).toBeInTheDocument()
    })

    // Find the board card and hover over it to reveal the buttons
    const boardCard = screen.getByText('Board to Delete').closest('div.group')
    expect(boardCard).toBeInTheDocument()
    
    // Hover over the card to make buttons visible
    await user.hover(boardCard!)

    // Find delete button by its accessible name (title attribute)
    const deleteButton = await screen.findByTitle('Delete board')
    
    // Click the delete button
    await user.click(deleteButton)

    // Verify confirm was called with the board title
    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining('Board to Delete')
    )

    // Verify deleteBoard service was called
    await waitFor(() => {
      expect(mockDeleteBoard).toHaveBeenCalledWith('board-to-delete')
    })

    // Simulate the board being removed from the store (this happens via RxDB sync in real app)
    useBoardsStore.getState().removeBoard('board-to-delete')

    // Verify the board is removed from the list
    await waitFor(() => {
      expect(screen.queryByText('Board to Delete')).not.toBeInTheDocument()
    })
  })

  it('does not delete board when confirmation is cancelled', async () => {
    const user = userEvent.setup()
    const mockDeleteBoard = vi.mocked(boardsService.deleteBoard)
    
    // Mock confirm to return false (cancelled)
    window.confirm = vi.fn(() => false)
    
    const boardToKeep: Board = {
      id: 'board-to-keep',
      title: 'Board to Keep',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ownerId: 'user1',
    }

    // Set up initial board in store
    useBoardsStore.setState({
      boards: [boardToKeep],
      isLoading: false,
      error: null,
    })

    router.history.push('/')
    render(<RouterProvider router={router} />)

    // Wait for board to appear
    await waitFor(() => {
      expect(screen.getByText('Board to Keep')).toBeInTheDocument()
    })

    // Find the board card and hover over it to reveal the buttons
    const boardCard = screen.getByText('Board to Keep').closest('div.group')
    expect(boardCard).toBeInTheDocument()
    
    // Hover over the card to make buttons visible
    await user.hover(boardCard!)

    // Find delete button by its accessible name
    const deleteButton = await screen.findByTitle('Delete board')

    // Click the delete button
    await user.click(deleteButton)

    // Verify confirm was called
    expect(window.confirm).toHaveBeenCalled()

    // Verify deleteBoard was NOT called
    expect(mockDeleteBoard).not.toHaveBeenCalled()

    // Verify the board is still in the list
    expect(screen.getByText('Board to Keep')).toBeInTheDocument()
  })
})

