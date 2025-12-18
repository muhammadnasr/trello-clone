import type { Card } from '@/lib/types/card'
import { Card as CardComponent } from './Card'
import { CreateCard } from './CreateCard'

interface CardsListProps {
  cards: Card[]
  columnId: string
}

export function CardsList({ cards, columnId }: CardsListProps) {
  // Calculate next order for new card
  const nextOrder = cards.length

  return (
    <div className="mt-2">
      {cards.map((card, index) => (
        <CardComponent key={card.id} card={card} index={index} />
      ))}
      <div className="mt-2">
        <CreateCard columnId={columnId} nextOrder={nextOrder} />
      </div>
    </div>
  )
}

