import { describe, it, expect, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from '../../../src/routeTree.gen'
import { useBoardsStore } from '../../../src/stores/boards'
import type { Board } from '../../../src/lib/types/board'

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

describe('BoardsList', () => {
  beforeEach(() => {
    // Reset store before each test
    useBoardsStore.setState({
      boards: [],
      isLoading: false,
      error: null,
    })
  })

  it('displays loading state', async () => {
    useBoardsStore.setState({ isLoading: true })
    router.history.push('/')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      expect(screen.getByText('Loading boards...')).toBeTruthy()
    })
  })

  it('displays empty state when no boards', async () => {
    router.history.push('/')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      expect(screen.getByText(/No boards yet/)).toBeTruthy()
      expect(screen.getByText('Create Board')).toBeTruthy()
    })
  })

  it('displays list of boards', async () => {
    const boards: Board[] = [
      {
        id: 'board1',
        title: 'My First Board',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
        ownerId: 'user1',
      },
      {
        id: 'board2',
        title: 'My Second Board',
        createdAt: '2025-01-02T00:00:00.000Z',
        updatedAt: '2025-01-02T00:00:00.000Z',
        ownerId: 'user1',
      },
    ]

    useBoardsStore.setState({ boards })
    router.history.push('/')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByText('My Boards')).toBeTruthy()
      expect(screen.getByText('My First Board')).toBeTruthy()
      expect(screen.getByText('My Second Board')).toBeTruthy()
    })
  })

  it('renders board cards with correct structure', async () => {
    const boards: Board[] = [
      {
        id: 'board1',
        title: 'Test Board',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
        ownerId: 'user1',
      },
    ]

    useBoardsStore.setState({ boards })
    router.history.push('/')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      const boardTitle = screen.getByText('Test Board')
      expect(boardTitle).toBeTruthy()
      // Check that it's in a heading element
      expect(boardTitle.tagName).toBe('H2')
    })
  })
})

