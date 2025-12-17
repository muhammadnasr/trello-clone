import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useCardsStore } from '@/stores/cards'
import { Card } from './Card'

interface CardsListProps {
  columnId: string
  draggedCardId?: string | null
  overCardId?: string | null
}

export function CardsList({ columnId, draggedCardId = null, overCardId = null }: CardsListProps) {
  const cards = useCardsStore((state) => state.cards)

  const columnCards = cards
    .filter((card) => card.columnId === columnId)
    .sort((a, b) => a.order - b.order)

  // Include all cards (don't filter out dragged card - we'll show placeholder instead)
  const allColumnCards = columnCards.map((card) => card.id)

  return (
    <SortableContext
      items={allColumnCards}
      strategy={verticalListSortingStrategy}
    >
      <div className="mt-2">
        {columnCards.map((card) => (
          <Card
            key={card.id}
            card={card}
            isDragging={draggedCardId === card.id}
            isOver={overCardId === card.id}
            isAnyCardDragging={draggedCardId !== null}
          />
        ))}
      </div>
    </SortableContext>
  )
}

