import { describe, it, expect } from 'vitest'
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from '../../src/routeTree.gen'

const router = createRouter({ 
  routeTree,
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

describe('TanStack Router', () => {
  it('renders the index route with BoardsList component', async () => {
    render(<RouterProvider router={router} />)
    
    await waitFor(() => {
      // The BoardsList component shows empty state when no boards
      expect(screen.getByText(/No boards yet/)).toBeTruthy()
      expect(screen.getByText('Create Board')).toBeTruthy()
    })
  })
})

