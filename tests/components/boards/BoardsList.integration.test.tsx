import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from '../../../src/routeTree.gen'
import { useBoardsStore } from '../../../src/stores/boards'
import { initDatabase, cleanupDatabase } from '../../../src/lib/db/init'
import { createTestDatabase } from '../../lib/db/test-helpers'

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

describe('BoardsList Integration - Create Board', () => {
  beforeEach(async () => {
    await cleanupDatabase()
    // Create in-memory test database and inject it
    const testDb = await createTestDatabase()
    await initDatabase(testDb)
    // Reset store
    useBoardsStore.setState({
      boards: [],
      isLoading: false,
      error: null,
    })
  })

  afterEach(async () => {
    await cleanupDatabase()
  })

  it('displays newly created board in the list', async () => {
    const user = userEvent.setup()

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

    // Wait for board to appear via reactive sync (real RxDB + real service)
    await waitFor(() => {
      expect(screen.getByText('My New Board')).toBeTruthy()
    }, { timeout: 2000 })
  })

  it('shows board name in the list after creation', async () => {
    const user = userEvent.setup()

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

    // Wait for board to appear via reactive sync (real RxDB + real service)
    await waitFor(() => {
      const boardName = screen.getByText('Test Board Name')
      expect(boardName).toBeTruthy()
      // Verify it's in a heading (h2) as per BoardCard structure
      expect(boardName.tagName).toBe('H2')
    }, { timeout: 2000 })
  })
})

describe('BoardsList Integration - Update Board', () => {
  beforeEach(async () => {
    await cleanupDatabase()
    // Create in-memory test database and inject it
    const testDb = await createTestDatabase()
    await initDatabase(testDb)
    // Reset store
    useBoardsStore.setState({
      boards: [],
      isLoading: false,
      error: null,
    })
  })

  afterEach(async () => {
    await cleanupDatabase()
  })

  it('updates board title when renamed', async () => {
    const user = userEvent.setup()
    
    // Create a board first using the real service
    const { createBoard } = await import('../../../src/lib/services/boards')
    await createBoard('Original Title', 'user1')

    router.history.push('/')
    render(<RouterProvider router={router} />)

    // Wait for board to appear via reactive sync
    await waitFor(() => {
      expect(screen.getByText('Original Title')).toBeInTheDocument()
    }, { timeout: 2000 })

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

    // Wait for reactive sync to update the UI (real RxDB + real service)
    await waitFor(() => {
      expect(screen.getByText('Updated Title')).toBeInTheDocument()
      expect(screen.queryByText('Original Title')).not.toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('cancels rename when Cancel button is clicked', async () => {
    const user = userEvent.setup()
    
    // Create a board first using the real service
    const { createBoard } = await import('../../../src/lib/services/boards')
    await createBoard('Original Title', 'user1')

    router.history.push('/')
    render(<RouterProvider router={router} />)

    // Wait for board to appear via reactive sync
    await waitFor(() => {
      expect(screen.getByText('Original Title')).toBeInTheDocument()
    }, { timeout: 2000 })

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

    // Verify the original title is still displayed (no update happened)
    expect(screen.getByText('Original Title')).toBeInTheDocument()
    expect(screen.queryByText('New Title')).not.toBeInTheDocument()
  })
})

describe('BoardsList Integration - Delete Board', () => {
  beforeEach(async () => {
    await cleanupDatabase()
    // Create in-memory test database and inject it
    const testDb = await createTestDatabase()
    await initDatabase(testDb)
    // Reset store
    useBoardsStore.setState({
      boards: [],
      isLoading: false,
      error: null,
    })
    // Mock window.confirm to return true by default
    window.confirm = vi.fn(() => true)
  })

  afterEach(async () => {
    await cleanupDatabase()
    // Restore original confirm
    window.confirm = window.confirm as typeof confirm
  })

  it('deletes board when delete button is clicked and confirmed', async () => {
    const user = userEvent.setup()
    
    // Create a board first using the real service
    const { createBoard } = await import('../../../src/lib/services/boards')
    await createBoard('Board to Delete', 'user1')

    router.history.push('/')
    render(<RouterProvider router={router} />)

    // Wait for board to appear via reactive sync
    await waitFor(() => {
      expect(screen.getByText('Board to Delete')).toBeInTheDocument()
    }, { timeout: 2000 })

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

    // Wait for reactive sync to remove the board from UI (real RxDB + real service)
    await waitFor(() => {
      expect(screen.queryByText('Board to Delete')).not.toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('does not delete board when confirmation is cancelled', async () => {
    const user = userEvent.setup()
    
    // Mock confirm to return false (cancelled)
    window.confirm = vi.fn(() => false)
    
    // Create a board first using the real service
    const { createBoard } = await import('../../../src/lib/services/boards')
    await createBoard('Board to Keep', 'user1')

    router.history.push('/')
    render(<RouterProvider router={router} />)

    // Wait for board to appear via reactive sync
    await waitFor(() => {
      expect(screen.getByText('Board to Keep')).toBeInTheDocument()
    }, { timeout: 2000 })

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

    // Verify the board is still in the list (not deleted)
    expect(screen.getByText('Board to Keep')).toBeInTheDocument()
  })
})

