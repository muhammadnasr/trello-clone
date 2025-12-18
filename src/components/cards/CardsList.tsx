import type { Card } from '@/lib/types/card'
import { Card as CardComponent } from './Card'

interface CardsListProps {
  cards: Card[]
}

export function CardsList({ cards }: CardsListProps) {
  return (
    <div className="mt-2">
      {cards.map((card, index) => (
        <CardComponent key={card.id} card={card} index={index} />
      ))}
    </div>
  )
}

