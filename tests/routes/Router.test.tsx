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
  it('renders the index route', async () => {
    render(<RouterProvider router={router} />)
    
    await waitFor(() => {
      expect(screen.getByText('Boards List')).toBeTruthy()
      expect(screen.getByText(/This is the boards list page/)).toBeTruthy()
    })
  })
})

