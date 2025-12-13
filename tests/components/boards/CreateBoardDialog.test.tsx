import { describe, it, expect, beforeEach, vi } from 'vitest'
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreateBoardDialog } from '../../../src/components/boards/CreateBoardDialog'
import * as boardsService from '../../../src/lib/services/boards'

// Mock the boards service
vi.mock('../../../src/lib/services/boards', () => ({
  createBoard: vi.fn(),
}))

describe('CreateBoardDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders trigger button', () => {
    render(<CreateBoardDialog />)
    expect(screen.getByText('Create Board')).toBeTruthy()
  })

  it('opens dialog when trigger is clicked', async () => {
    const user = userEvent.setup()
    render(<CreateBoardDialog />)

    const trigger = screen.getByText('Create Board')
    await user.click(trigger)

    await waitFor(() => {
      expect(screen.getByText('Create New Board')).toBeTruthy()
      expect(screen.getByPlaceholderText('Board name')).toBeTruthy()
    })
  })

  it('creates board when form is submitted', async () => {
    const user = userEvent.setup()
    const mockCreateBoard = vi.mocked(boardsService.createBoard)
    mockCreateBoard.mockResolvedValue({
      id: 'board1',
      title: 'New Board',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ownerId: 'user1',
    })

    render(<CreateBoardDialog />)

    // Open dialog
    await user.click(screen.getByText('Create Board'))

    // Wait for dialog to open and verify board name input is visible
    await waitFor(() => {
      expect(screen.getByText('Create New Board')).toBeTruthy()
      expect(screen.getByPlaceholderText('Board name')).toBeTruthy()
    })

    // Type board name
    const input = screen.getByPlaceholderText('Board name')
    await user.type(input, 'New Board')

    // Verify the board name is visible in the input
    expect(input).toHaveValue('New Board')

    // Click create button
    const createButton = screen.getByText('Create')
    await user.click(createButton)

    // Verify createBoard was called
    await waitFor(() => {
      expect(mockCreateBoard).toHaveBeenCalledWith('New Board', 'user1')
    })
  })

  it('disables create button when title is empty', async () => {
    const user = userEvent.setup()
    render(<CreateBoardDialog />)

    await user.click(screen.getByText('Create Board'))

    await waitFor(() => {
      const createButton = screen.getByText('Create')
      expect(createButton).toBeDisabled()
    })
  })

  it('closes dialog when cancel is clicked', async () => {
    const user = userEvent.setup()
    render(<CreateBoardDialog />)

    await user.click(screen.getByText('Create Board'))

    await waitFor(() => {
      expect(screen.getByText('Create New Board')).toBeTruthy()
    })

    await user.click(screen.getByText('Cancel'))

    await waitFor(() => {
      expect(screen.queryByText('Create New Board')).not.toBeInTheDocument()
    })
  })

  it('calls createBoard service when form is submitted', async () => {
    const user = userEvent.setup()
    const mockCreateBoard = vi.mocked(boardsService.createBoard)
    mockCreateBoard.mockResolvedValue({
      id: 'board1',
      title: 'New Board',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ownerId: 'user1',
    })

    render(<CreateBoardDialog />)

    expect(screen.getByText('Create Board')).toBeTruthy()

    await user.click(screen.getByText('Create Board'))
    await waitFor(() => {
      expect(screen.getByText('Create New Board')).toBeTruthy()
    })

    await user.type(screen.getByPlaceholderText('Board name'), 'New Board')
    await user.click(screen.getByText('Create'))

    await waitFor(() => {
      expect(mockCreateBoard).toHaveBeenCalledWith('New Board', 'user1')
    })
  })
})

