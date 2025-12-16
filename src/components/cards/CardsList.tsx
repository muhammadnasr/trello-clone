import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useCardsStore } from '@/stores/cards'
import { handleCardReorder } from '@/lib/utils/card-reorder'
import { Card } from './Card'

interface CardsListProps {
  columnId: string
}

export function CardsList({ columnId }: CardsListProps) {
  const cards = useCardsStore((state) => state.cards)
  const columnCards = cards
    .filter((card) => card.columnId === columnId)
    .sort((a, b) => a.order - b.order)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    await handleCardReorder(event, cards, columnId)
  }

  if (columnCards.length === 0) {
    return null
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
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
    </DndContext>
  )
}

