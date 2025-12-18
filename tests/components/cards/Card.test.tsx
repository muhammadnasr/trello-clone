import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DragDropContext, Droppable } from '@hello-pangea/dnd'
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
    ownerId: 'user1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  // Helper to render Card with required DragDropContext
  const renderCard = (card = mockCard, index = 0) => {
    return render(
      <DragDropContext onDragEnd={() => { }}>
        <Droppable droppableId={card.columnId} type="CARD">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              <Card card={card} index={index} />
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    )
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
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders card title', () => {
    renderCard()
    expect(screen.getByText('Test Card')).toBeInTheDocument()
  })

  it('enters edit mode when title is clicked', async () => {
    const user = userEvent.setup()
    renderCard()

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
    renderCard()

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
    renderCard()

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
    renderCard()

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
    renderCard()

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
    renderCard()

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
    renderCard()

    const cardElement = screen.getByText('Test Card').closest('.group')
    expect(cardElement).toBeInTheDocument()

    // Delete button container should be hidden initially (opacity-0 on parent div)
    const deleteButton = screen.getByTitle('Delete card')
    const buttonContainer = deleteButton.closest('div')
    expect(buttonContainer).toHaveClass('opacity-0')
  })

  it('deletes card when delete button is clicked and confirmed', async () => {
    mockDeleteCard.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderCard()

    const deleteButton = screen.getByTitle('Delete card')
    await user.click(deleteButton)

    // Wait for dialog to appear
    await waitFor(() => {
      expect(screen.getByText('Delete Card')).toBeInTheDocument()
      expect(screen.getByText(/Are you sure you want to delete "Test Card"/)).toBeInTheDocument()
    })

    // Click the Delete button in the dialog
    const confirmDeleteButton = screen.getByRole('button', { name: 'Delete' })
    await user.click(confirmDeleteButton)

    await waitFor(() => {
      expect(mockDeleteCard).toHaveBeenCalledWith('card1')
    })
  })

  it('does not delete card when confirmation is cancelled', async () => {
    const user = userEvent.setup()
    renderCard()

    const deleteButton = screen.getByTitle('Delete card')
    await user.click(deleteButton)

    // Wait for dialog to appear
    await waitFor(() => {
      expect(screen.getByText('Delete Card')).toBeInTheDocument()
      expect(screen.getByText(/Are you sure you want to delete "Test Card"/)).toBeInTheDocument()
    })

    // Click the Cancel button in the dialog
    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
    await user.click(cancelButton)

    expect(mockDeleteCard).not.toHaveBeenCalled()
  })

  it('syncs title when card.id changes', async () => {
    const { rerender } = renderCard()

    expect(screen.getByText('Test Card')).toBeInTheDocument()

    const newCard = {
      ...mockCard,
      id: 'card2',
      title: 'New Card Title',
    }

    rerender(
      <DragDropContext onDragEnd={() => { }}>
        <Droppable droppableId={newCard.columnId} type="CARD">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              <Card card={newCard} index={0} />
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    )

    await waitFor(() => {
      expect(screen.getByText('New Card Title')).toBeInTheDocument()
    })
  })
})

