import { describe, it, expect, beforeEach, vi } from 'vitest'
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreateColumnDialog } from '../../../src/components/columns/CreateColumnDialog'
import { useColumnsStore } from '../../../src/stores/columns'
import * as columnsService from '../../../src/lib/services/columns'

vi.mock('../../../src/lib/services/columns', () => ({
  createColumn: vi.fn(),
}))


describe('CreateColumnDialog', () => {
  beforeEach(() => {
    useColumnsStore.setState({
      columns: [],
      isLoading: false,
      error: null,
    })
    vi.clearAllMocks()
  })

  it('renders trigger button', () => {
    render(<CreateColumnDialog boardId="board1" nextOrder={0} />)
    expect(screen.getByText('Add Column')).toBeInTheDocument()
  })

  it('opens dialog when trigger is clicked', async () => {
    const user = userEvent.setup()
    render(<CreateColumnDialog boardId="board1" nextOrder={0} />)

    await user.click(screen.getByText('Add Column'))

    await waitFor(() => {
      expect(screen.getByText('Create New Column')).toBeInTheDocument()
    })
  })

  it('creates column when form is submitted', async () => {
    const user = userEvent.setup()
    const mockCreateColumn = vi.mocked(columnsService.createColumn)
    const newColumn = {
      id: 'column1',
      boardId: 'board1',
      title: 'New Column',
      order: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    mockCreateColumn.mockResolvedValue(newColumn)

    render(<CreateColumnDialog boardId="board1" nextOrder={0} />)

    await user.click(screen.getByText('Add Column'))
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Column name')).toBeInTheDocument()
    })

    await user.type(screen.getByPlaceholderText('Column name'), 'New Column')
    await user.click(screen.getByText('Create'))

    expect(mockCreateColumn).toHaveBeenCalledWith('board1', 'New Column', 0)
  })

  it('closes dialog after successful creation', async () => {
    const user = userEvent.setup()
    const mockCreateColumn = vi.mocked(columnsService.createColumn)
    mockCreateColumn.mockResolvedValue({
      id: 'column1',
      boardId: 'board1',
      title: 'New Column',
      order: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    render(<CreateColumnDialog boardId="board1" nextOrder={0} />)

    await user.click(screen.getByText('Add Column'))
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Column name')).toBeInTheDocument()
    })

    await user.type(screen.getByPlaceholderText('Column name'), 'New Column')
    await user.click(screen.getByText('Create'))

    await waitFor(() => {
      expect(screen.queryByText('Create New Column')).not.toBeInTheDocument()
    })
  })

  it('displays error message when creation fails', async () => {
    const user = userEvent.setup()
    const mockCreateColumn = vi.mocked(columnsService.createColumn)
    mockCreateColumn.mockRejectedValue(new Error('Failed to create'))

    // Suppress console.error for this test since we're intentionally testing error handling
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

    useColumnsStore.setState({ error: 'Failed to create' })

    render(<CreateColumnDialog boardId="board1" nextOrder={0} />)

    await user.click(screen.getByText('Add Column'))
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Column name')).toBeInTheDocument()
    })

    await user.type(screen.getByPlaceholderText('Column name'), 'New Column')
    await user.click(screen.getByText('Create'))

    await waitFor(() => {
      expect(screen.getByText('Failed to create')).toBeInTheDocument()
    })

    consoleErrorSpy.mockRestore()
  })

  it('disables create button when input is empty', async () => {
    const user = userEvent.setup()
    render(<CreateColumnDialog boardId="board1" nextOrder={0} />)

    await user.click(screen.getByText('Add Column'))
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Column name')).toBeInTheDocument()
    })

    const createButton = screen.getByText('Create')
    expect(createButton).toBeDisabled()
  })
})

