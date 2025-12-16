import { useCardsStore } from '@/stores/cards'
import { Card } from './Card'

interface CardsListProps {
  columnId: string
}

export function CardsList({ columnId }: CardsListProps) {
  const cards = useCardsStore((state) => state.cards)
  const columnCards = cards
    .filter((card) => card.columnId === columnId)
    .sort((a, b) => a.order - b.order)

  if (columnCards.length === 0) {
    return null
  }

  return (
    <div className="mt-2">
      {columnCards.map((card) => (
        <Card key={card.id} card={card} />
      ))}
    </div>
  )
}

