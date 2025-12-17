import { describe, it, expect, beforeEach, vi } from 'vitest'
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreateCard } from '../../../src/components/cards/CreateCard'
import { useCardsStore } from '../../../src/stores/cards'

vi.mock('../../../src/lib/services/cards', () => ({
  createCard: vi.fn(),
}))

vi.mock('../../../src/stores/cards', async () => {
  const actual = await vi.importActual('../../../src/stores/cards')
  return {
    ...actual,
    useCardsStore: vi.fn(),
  }
})


describe('CreateCard', () => {
  const mockCreateCard = vi.fn()

  beforeEach(() => {
    vi.mocked(useCardsStore).mockImplementation((selector: any) => {
      const state = {
        cards: [],
        isLoading: false,
        error: null,
        createCard: mockCreateCard,
      }
      return selector(state)
    })
    vi.clearAllMocks()
  })

  it('renders add card button initially', () => {
    render(<CreateCard columnId="column1" nextOrder={0} />)
    expect(screen.getByText('+ Add a card')).toBeInTheDocument()
  })

  it('shows input form when button is clicked', async () => {
    const user = userEvent.setup()
    render(<CreateCard columnId="column1" nextOrder={0} />)

    const button = screen.getByText('+ Add a card')
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter a title for this card...')).toBeInTheDocument()
      expect(screen.getByText('Add card')).toBeInTheDocument()
    })
  })

  it('creates card when form is submitted', async () => {
    mockCreateCard.mockResolvedValue({
      id: 'card1',
      columnId: 'column1',
      title: 'New Card',
      order: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    const user = userEvent.setup()
    render(<CreateCard columnId="column1" nextOrder={0} />)

    const button = screen.getByText('+ Add a card')
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter a title for this card...')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('Enter a title for this card...')
    await user.type(input, 'New Card')

    const submitButton = screen.getByText('Add card')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockCreateCard).toHaveBeenCalledWith('column1', 'New Card', 0)
    })

    // Form should close after submission
    await waitFor(() => {
      expect(screen.getByText('+ Add a card')).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('cancels form when X button is clicked', async () => {
    const user = userEvent.setup()
    render(<CreateCard columnId="column1" nextOrder={0} />)

    const button = screen.getByText('+ Add a card')
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter a title for this card...')).toBeInTheDocument()
    })

    const cancelButton = screen.getByRole('button', { name: '' })
    await user.click(cancelButton)

    await waitFor(() => {
      expect(screen.getByText('+ Add a card')).toBeInTheDocument()
      expect(screen.queryByPlaceholderText('Enter a title for this card...')).not.toBeInTheDocument()
    })
  })

  it('cancels form when Escape key is pressed', async () => {
    const user = userEvent.setup()
    render(<CreateCard columnId="column1" nextOrder={0} />)

    const button = screen.getByText('+ Add a card')
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter a title for this card...')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('Enter a title for this card...')
    await user.type(input, '{Escape}')

    await waitFor(() => {
      expect(screen.getByText('+ Add a card')).toBeInTheDocument()
      expect(screen.queryByPlaceholderText('Enter a title for this card...')).not.toBeInTheDocument()
    })
  })

  it('disables submit button when input is empty', async () => {
    const user = userEvent.setup()
    render(<CreateCard columnId="column1" nextOrder={0} />)

    const button = screen.getByText('+ Add a card')
    await user.click(button)

    await waitFor(() => {
      const submitButton = screen.getByText('Add card')
      expect(submitButton).toBeDisabled()
    })
  })

})

