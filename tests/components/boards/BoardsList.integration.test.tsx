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
    const testDb = await createTestDatabase()
    await initDatabase(testDb)
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

    await waitFor(() => {
      expect(screen.getByText(/No boards yet/)).toBeTruthy()
    })

    await user.click(screen.getByText('Create Board'))

    await waitFor(() => {
      expect(screen.getByText('Create New Board')).toBeTruthy()
    })

    const input = screen.getByPlaceholderText('Board name')
    await user.type(input, 'My New Board')

    await user.click(screen.getByText('Create'))

    await waitFor(() => {
      expect(screen.getByText('My New Board')).toBeTruthy()
    }, { timeout: 2000 })
  })

  it('shows board name in the list after creation', async () => {
    const user = userEvent.setup()

    router.history.push('/')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByText('Create Board')).toBeTruthy()
    })

    await user.click(screen.getByText('Create Board'))
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Board name')).toBeTruthy()
    })

    await user.type(screen.getByPlaceholderText('Board name'), 'Test Board Name')
    await user.click(screen.getByText('Create'))

    await waitFor(() => {
      const boardName = screen.getByText('Test Board Name')
      expect(boardName).toBeTruthy()
      expect(boardName.tagName).toBe('H2')
    }, { timeout: 2000 })
  })
})

describe('BoardsList Integration - Update Board', () => {
  beforeEach(async () => {
    await cleanupDatabase()
    const testDb = await createTestDatabase()
    await initDatabase(testDb)
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
    
    const { createBoard } = await import('../../../src/lib/services/boards')
    await createBoard('Original Title', 'user1')

    router.history.push('/')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByText('Original Title')).toBeInTheDocument()
    }, { timeout: 2000 })

    const boardCard = screen.getByText('Original Title').closest('div.group')
    expect(boardCard).toBeInTheDocument()
    
    await user.hover(boardCard!)

    const editButton = await screen.findByTitle('Rename board')
    
    await user.click(editButton)

    await waitFor(() => {
      expect(screen.getByText('Rename Board')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('Board name')
    await user.clear(input)
    await user.type(input, 'Updated Title')

    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(screen.getByText('Updated Title')).toBeInTheDocument()
      expect(screen.queryByText('Original Title')).not.toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('cancels rename when Cancel button is clicked', async () => {
    const user = userEvent.setup()
    
    const { createBoard } = await import('../../../src/lib/services/boards')
    await createBoard('Original Title', 'user1')

    router.history.push('/')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByText('Original Title')).toBeInTheDocument()
    }, { timeout: 2000 })

    const boardCard = screen.getByText('Original Title').closest('div.group')
    await user.hover(boardCard!)

    const editButton = await screen.findByTitle('Rename board')
    await user.click(editButton)

    await waitFor(() => {
      expect(screen.getByText('Rename Board')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('Board name')
    await user.clear(input)
    await user.type(input, 'New Title')

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.getByText('Original Title')).toBeInTheDocument()
    expect(screen.queryByText('New Title')).not.toBeInTheDocument()
  })
})

describe('BoardsList Integration - Delete Board', () => {
  beforeEach(async () => {
    await cleanupDatabase()
    const testDb = await createTestDatabase()
    await initDatabase(testDb)
    useBoardsStore.setState({
      boards: [],
      isLoading: false,
      error: null,
    })
    window.confirm = vi.fn(() => true)
  })

  afterEach(async () => {
    await cleanupDatabase()
    window.confirm = window.confirm as typeof confirm
  })

  it('deletes board when delete button is clicked and confirmed', async () => {
    const user = userEvent.setup()
    
    const { createBoard } = await import('../../../src/lib/services/boards')
    await createBoard('Board to Delete', 'user1')

    router.history.push('/')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByText('Board to Delete')).toBeInTheDocument()
    }, { timeout: 2000 })

    const boardCard = screen.getByText('Board to Delete').closest('div.group')
    expect(boardCard).toBeInTheDocument()
    
    await user.hover(boardCard!)

    const deleteButton = await screen.findByTitle('Delete board')
    
    await user.click(deleteButton)

    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining('Board to Delete')
    )

    await waitFor(() => {
      expect(screen.queryByText('Board to Delete')).not.toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('does not delete board when confirmation is cancelled', async () => {
    const user = userEvent.setup()
    
    window.confirm = vi.fn(() => false)
    
    const { createBoard } = await import('../../../src/lib/services/boards')
    await createBoard('Board to Keep', 'user1')

    router.history.push('/')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByText('Board to Keep')).toBeInTheDocument()
    }, { timeout: 2000 })

    const boardCard = screen.getByText('Board to Keep').closest('div.group')
    expect(boardCard).toBeInTheDocument()
    
    await user.hover(boardCard!)

    const deleteButton = await screen.findByTitle('Delete board')

    await user.click(deleteButton)

    expect(window.confirm).toHaveBeenCalled()

    expect(screen.getByText('Board to Keep')).toBeInTheDocument()
  })
})

