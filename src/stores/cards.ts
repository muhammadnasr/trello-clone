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
  updateCardsOrder: (updates: Record<string, { order?: number; columnId?: string }>) => Promise<void>
}

export type CardsStore = CardsState & CardsActions

export const useCardsStore = create<CardsStore>((set, get) => ({
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
      // Update store state directly (single data flow)
      // Check if card already exists to avoid duplicates from RxDB subscription
      const currentCards = get().cards
      if (!currentCards.find((c) => c.id === card.id)) {
        set({ cards: [...currentCards, card] })
      }
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
      // Update store state directly (single data flow)
      set({
        cards: get().cards.map((card) =>
          card.id === id ? { ...card, ...updates, updatedAt: new Date().toISOString() } : card
        ),
      })
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
      // Update store state directly (single data flow)
      set({ cards: get().cards.filter((card) => card.id !== id) })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete card'
      set({ error: errorMessage })
      throw error
    }
  },

  updateCardsOrder: async (updates: Record<string, { order?: number; columnId?: string }>) => {
    set({ error: null })
    try {
      await cardsService.updateCardsOrder(updates)
      // Update store state directly (single data flow)
      set({
        cards: get().cards.map((card) => {
          const update = updates[card.id]
          if (update) {
            return { ...card, ...update, updatedAt: new Date().toISOString() }
          }
          return card
        }),
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update cards order'
      set({ error: errorMessage })
      throw error
    }
  },
}))

