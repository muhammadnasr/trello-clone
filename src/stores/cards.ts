import { create } from 'zustand'
import type { Card } from '@/lib/types/card'
import * as cardsService from '@/lib/services/cards'

interface CardsState {
  cards: Card[]
  isLoading: boolean
  error: string | null
}

interface CardsActions {
  setCards: (cards: Card[]) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  createCard: (columnId: string, title: string, order: number, ownerId: string) => Promise<Card>
  updateCard: (id: string, updates: { title?: string; order?: number; columnId?: string }) => Promise<void>
  deleteCard: (id: string) => Promise<void>
  updateCardsOrder: (cardId: string, sourceColumnId: string, sourceIndex: number, destinationColumnId: string, destinationIndex: number) => Promise<void>
}

export type CardsStore = CardsState & CardsActions

export const useCardsStore = create<CardsStore>((set) => ({
  cards: [],
  isLoading: false,
  error: null,

  setCards: (cards) => set({ cards }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  createCard: async (columnId: string, title: string, order: number, ownerId: string) => {
    set({ error: null })
    try {
      const card = await cardsService.createCard(columnId, title.trim(), order, ownerId)
      return card
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create card'
      set({ error: errorMessage })
      throw error
    }
  },

  updateCard: async (id: string, updates: { title?: string; order?: number; columnId?: string }) => {
    set({ error: null })
    try {
      await cardsService.updateCard(id, updates)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update card'
      set({ error: errorMessage })
      throw error
    }
  },

  deleteCard: async (id: string) => {
    set({ error: null })
    try {
      await cardsService.deleteCard(id)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete card'
      set({ error: errorMessage })
      throw error
    }
  },

  updateCardsOrder: async (cardId: string, sourceColumnId: string, sourceIndex: number, destinationColumnId: string, destinationIndex: number) => {
    set({ error: null })
    try {
      await cardsService.updateCardsOrder(cardId, sourceColumnId, sourceIndex, destinationColumnId, destinationIndex)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update cards order'
      set({ error: errorMessage })
      throw error
    }
  },
}))

