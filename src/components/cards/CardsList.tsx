import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useDndContext } from '@dnd-kit/core'
import { useCardsStore } from '@/stores/cards'
import { Card } from './Card'

interface CardsListProps {
  columnId: string
}

export function CardsList({ columnId }: CardsListProps) {
  const cards = useCardsStore((state) => state.cards)
  const { active } = useDndContext()
  const activeId = active?.id as string | undefined
  
  const columnCards = cards
    .filter((card) => card.columnId === columnId)
    .filter((card) => card.id !== activeId) // Filter out the card being dragged
    .sort((a, b) => a.order - b.order)

  if (columnCards.length === 0 && !activeId) {
    return null
  }

  return (
    <SortableContext
      items={columnCards.map((card) => card.id)}
      strategy={verticalListSortingStrategy}
    >
      <div className="mt-2">
        {columnCards.map((card) => (
          <Card key={card.id} card={card} />
        ))}
      </div>
    </SortableContext>
  )
}

