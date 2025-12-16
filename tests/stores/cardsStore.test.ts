import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useCardsStore } from '../../src/stores/cards'
import type { Card } from '../../src/lib/types/card'
import * as cardsService from '../../src/lib/services/cards'

vi.mock('../../src/lib/services/cards', () => ({
  createCard: vi.fn(),
  updateCard: vi.fn(),
  deleteCard: vi.fn(),
}))

describe('Cards Store', () => {
  beforeEach(() => {
    useCardsStore.setState({
      cards: [],
      isLoading: false,
      error: null,
    })
  })

  it('initializes with empty state', () => {
    const state = useCardsStore.getState()
    expect(state.cards).toEqual([])
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
  })

  it('sets cards', () => {
    const cards: Card[] = [
      {
        id: 'card1',
        columnId: 'column1',
        title: 'Card 1',
        order: 0,
        ownerId: 'user1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]

    useCardsStore.getState().setCards(cards)
    expect(useCardsStore.getState().cards).toEqual(cards)
  })

  describe('Async actions', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('createCard calls service and clears error on success', async () => {
      const mockCreateCard = vi.mocked(cardsService.createCard)
      const newCard: Card = {
        id: 'card-new',
        columnId: 'column1',
        title: 'New Card',
        order: 0,
        ownerId: 'user1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      mockCreateCard.mockResolvedValue(newCard)

      useCardsStore.getState().setError('Previous error')
      
      const createCard = useCardsStore.getState().createCard
      const result = await createCard('column1', 'New Card', 0, 'user1')

      expect(mockCreateCard).toHaveBeenCalledWith('column1', 'New Card', 0, 'user1')
      expect(result).toEqual(newCard)
      expect(useCardsStore.getState().error).toBeNull()
    })

    it('createCard sets error on failure', async () => {
      const mockCreateCard = vi.mocked(cardsService.createCard)
      mockCreateCard.mockRejectedValue(new Error('Service error'))

      const createCard = useCardsStore.getState().createCard

      await expect(createCard('column1', 'New Card', 0, 'user1')).rejects.toThrow('Service error')
      expect(useCardsStore.getState().error).toBe('Service error')
    })

    it('updateCard calls service and clears error on success', async () => {
      const mockUpdateCard = vi.mocked(cardsService.updateCard)
      mockUpdateCard.mockResolvedValue(undefined)

      useCardsStore.getState().setError('Previous error')

      const updateCard = useCardsStore.getState().updateCard
      await updateCard('card1', { title: 'Updated Title' })

      expect(mockUpdateCard).toHaveBeenCalledWith('card1', { title: 'Updated Title' })
      expect(useCardsStore.getState().error).toBeNull()
    })

    it('updateCard sets error on failure', async () => {
      const mockUpdateCard = vi.mocked(cardsService.updateCard)
      mockUpdateCard.mockRejectedValue(new Error('Service error'))

      const updateCard = useCardsStore.getState().updateCard

      await expect(updateCard('card1', { title: 'Updated Title' })).rejects.toThrow('Service error')
      expect(useCardsStore.getState().error).toBe('Service error')
    })

    it('deleteCard calls service and clears error on success', async () => {
      const mockDeleteCard = vi.mocked(cardsService.deleteCard)
      mockDeleteCard.mockResolvedValue(undefined)

      useCardsStore.getState().setError('Previous error')

      const deleteCard = useCardsStore.getState().deleteCard
      await deleteCard('card1')

      expect(mockDeleteCard).toHaveBeenCalledWith('card1')
      expect(useCardsStore.getState().error).toBeNull()
    })

    it('deleteCard sets error on failure', async () => {
      const mockDeleteCard = vi.mocked(cardsService.deleteCard)
      mockDeleteCard.mockRejectedValue(new Error('Service error'))

      const deleteCard = useCardsStore.getState().deleteCard

      await expect(deleteCard('card1')).rejects.toThrow('Service error')
      expect(useCardsStore.getState().error).toBe('Service error')
    })
  })

  it('sets loading state', () => {
    useCardsStore.getState().setLoading(true)
    expect(useCardsStore.getState().isLoading).toBe(true)

    useCardsStore.getState().setLoading(false)
    expect(useCardsStore.getState().isLoading).toBe(false)
  })

  it('sets error state', () => {
    useCardsStore.getState().setError('Something went wrong')
    expect(useCardsStore.getState().error).toBe('Something went wrong')

    useCardsStore.getState().setError(null)
    expect(useCardsStore.getState().error).toBeNull()
  })
})

