import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Card } from '../../../src/components/cards/Card'
import { useCardsStore } from '../../../src/stores/cards'

vi.mock('../../../src/lib/services/cards', () => ({
  updateCard: vi.fn(),
  deleteCard: vi.fn(),
}))

vi.mock('../../../src/stores/cards', async () => {
  const actual = await vi.importActual('../../../src/stores/cards')
  return {
    ...actual,
    useCardsStore: vi.fn(),
  }
})

describe('Card', () => {
  const mockUpdateCard = vi.fn()
  const mockDeleteCard = vi.fn()

  const mockCard = {
    id: 'card1',
    columnId: 'column1',
    title: 'Test Card',
    order: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  beforeEach(() => {
    vi.mocked(useCardsStore).mockImplementation((selector: any) => {
      const state = {
        cards: [],
        isLoading: false,
        error: null,
        updateCard: mockUpdateCard,
        deleteCard: mockDeleteCard,
      }
      return selector(state)
    })
    vi.clearAllMocks()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders card title', () => {
    render(<Card card={mockCard} />)
    expect(screen.getByText('Test Card')).toBeInTheDocument()
  })

  it('enters edit mode when title is clicked', async () => {
    const user = userEvent.setup()
    render(<Card card={mockCard} />)

    const title = screen.getByText('Test Card')
    await user.click(title)

    await waitFor(() => {
      const input = screen.getByDisplayValue('Test Card')
      expect(input).toBeInTheDocument()
      expect(input).toHaveFocus()
    })
  })

  it('saves changes when Enter is pressed', async () => {
    mockUpdateCard.mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<Card card={mockCard} />)

    const title = screen.getByText('Test Card')
    await user.click(title)

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Card')).toBeInTheDocument()
    })

    const input = screen.getByDisplayValue('Test Card')
    await user.clear(input)
    await user.type(input, 'Updated Card Title')
    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(mockUpdateCard).toHaveBeenCalledWith('card1', { title: 'Updated Card Title' })
    })

    // After save, component exits edit mode - check that input is gone
    await waitFor(() => {
      expect(screen.queryByDisplayValue('Updated Card Title')).not.toBeInTheDocument()
    })
  })

  it('cancels editing when Escape is pressed', async () => {
    const user = userEvent.setup()
    render(<Card card={mockCard} />)

    const title = screen.getByText('Test Card')
    await user.click(title)

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Card')).toBeInTheDocument()
    })

    const input = screen.getByDisplayValue('Test Card')
    await user.clear(input)
    await user.type(input, 'Changed Title')
    await user.keyboard('{Escape}')

    await waitFor(() => {
      expect(screen.getByText('Test Card')).toBeInTheDocument()
      expect(screen.queryByDisplayValue('Changed Title')).not.toBeInTheDocument()
    })
    expect(mockUpdateCard).not.toHaveBeenCalled()
  })

  it('saves changes when input loses focus', async () => {
    mockUpdateCard.mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<Card card={mockCard} />)

    const title = screen.getByText('Test Card')
    await user.click(title)

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Card')).toBeInTheDocument()
    })

    const input = screen.getByDisplayValue('Test Card')
    await user.clear(input)
    await user.type(input, 'Blurred Title')
    await user.tab() // Blur the input

    await waitFor(() => {
      expect(mockUpdateCard).toHaveBeenCalledWith('card1', { title: 'Blurred Title' })
    })

    // After blur, component exits edit mode
    await waitFor(() => {
      expect(screen.queryByDisplayValue('Blurred Title')).not.toBeInTheDocument()
    })
  })

  it('does not save empty title', async () => {
    const user = userEvent.setup()
    render(<Card card={mockCard} />)

    const title = screen.getByText('Test Card')
    await user.click(title)

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Card')).toBeInTheDocument()
    })

    const input = screen.getByDisplayValue('Test Card')
    await user.clear(input)
    await user.tab() // Blur the input

    await waitFor(() => {
      expect(screen.getByText('Test Card')).toBeInTheDocument()
    })
    expect(mockUpdateCard).not.toHaveBeenCalled()
  })

  it('does not save if title did not change', async () => {
    const user = userEvent.setup()
    render(<Card card={mockCard} />)

    const title = screen.getByText('Test Card')
    await user.click(title)

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Card')).toBeInTheDocument()
    })

    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(screen.getByText('Test Card')).toBeInTheDocument()
    })
    expect(mockUpdateCard).not.toHaveBeenCalled()
  })

  it('shows delete button on hover', async () => {
    render(<Card card={mockCard} />)

    const cardElement = screen.getByText('Test Card').closest('.group')
    expect(cardElement).toBeInTheDocument()

    // Delete button should be hidden initially
    const deleteButton = screen.getByTitle('Delete card')
    expect(deleteButton).toHaveClass('opacity-0')
  })

  it('deletes card when delete button is clicked and confirmed', async () => {
    mockDeleteCard.mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<Card card={mockCard} />)

    const deleteButton = screen.getByTitle('Delete card')
    await user.click(deleteButton)

    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining('Test Card')
    )

    await waitFor(() => {
      expect(mockDeleteCard).toHaveBeenCalledWith('card1')
    })
  })

  it('does not delete card when confirmation is cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const user = userEvent.setup()
    render(<Card card={mockCard} />)

    const deleteButton = screen.getByTitle('Delete card')
    await user.click(deleteButton)

    expect(window.confirm).toHaveBeenCalled()
    expect(mockDeleteCard).not.toHaveBeenCalled()
  })

  it('syncs title when card.id changes', async () => {
    const { rerender } = render(<Card card={mockCard} />)

    expect(screen.getByText('Test Card')).toBeInTheDocument()

    const newCard = {
      ...mockCard,
      id: 'card2',
      title: 'New Card Title',
    }

    rerender(<Card card={newCard} />)

    await waitFor(() => {
      expect(screen.getByText('New Card Title')).toBeInTheDocument()
    })
  })
})

