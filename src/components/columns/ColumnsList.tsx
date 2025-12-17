import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useState } from 'react'
import { useColumnsStore } from '@/stores/columns'
import { useCardsStore } from '@/stores/cards'
import { handleColumnReorder } from '@/lib/utils/column-reorder'
import { handleCardReorder } from '@/lib/utils/card-reorder'
import { ColumnCard } from './ColumnCard'
import { CreateColumnDialog } from './CreateColumnDialog'
import { Card } from '@/components/cards/Card'

interface ColumnsListProps {
  boardId: string
}

export function ColumnsList({ boardId }: ColumnsListProps) {
  const columns = useColumnsStore((state) => state.columns)
  const cards = useCardsStore((state) => state.cards)
  const setCards = useCardsStore((state) => state.setCards)
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null)
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null)
  const [overColumnId, setOverColumnId] = useState<string | null>(null)

  const boardColumns = columns
    .filter((col) => col.boardId === boardId)
    .sort((a, b) => a.order - b.order)

  const nextOrder = boardColumns.length > 0
    ? Math.max(...boardColumns.map((col) => col.order)) + 1
    : 0

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    // Check if it's a column
    const isColumnDrag = boardColumns.some((col) => col.id === active.id)
    if (isColumnDrag) {
      setDraggedColumnId(active.id as string)
    } else {
      // Check if it's a card
      const draggedCard = cards.find((card) => card.id === active.id)
      if (draggedCard) {
        setDraggedCardId(active.id as string)
      }
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    // Only track column hover if we're dragging a column
    const isColumnDrag = boardColumns.some((col) => col.id === active.id)
    if (isColumnDrag && over) {
      // Check if hovering over another column directly
      let targetColumn = boardColumns.find((col) => col.id === over.id)

      // If not a column, check if hovering over a card - find the column that contains it
      if (!targetColumn) {
        const targetCard = cards.find((card) => card.id === over.id)
        if (targetCard) {
          targetColumn = boardColumns.find((col) => col.id === targetCard.columnId)
        }
      }

      if (targetColumn && targetColumn.id !== active.id) {
        setOverColumnId(targetColumn.id)
      } else {
        setOverColumnId(null)
      }
    }
  }

  const handleDragCancel = () => {
    setDraggedColumnId(null)
    setDraggedCardId(null)
    setOverColumnId(null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    // Check if dragging a column or a card
    const isColumnDrag = boardColumns.some((col) => col.id === active.id)

    if (isColumnDrag) {
      await handleColumnReorder(event, columns, boardId, cards)
      // Clear drag state
      setDraggedColumnId(null)
      setOverColumnId(null)
    } else {
      // It's a card drag
      if (!over || active.id === over.id) {
        // Drag was cancelled - clear drag state
        setDraggedCardId(null)
        return
      }

      // Optimistically update the card's columnId immediately
      const draggedCard = cards.find((card) => card.id === active.id)
      if (draggedCard) {
        let targetColumnId: string | null = null

        // Check if dropping on a column
        const targetColumn = boardColumns.find((col) => col.id === over.id)
        if (targetColumn) {
          targetColumnId = targetColumn.id
        } else {
          // Dropping on another card
          const targetCard = cards.find((card) => card.id === over.id)
          if (targetCard) {
            targetColumnId = targetCard.columnId
          }
        }

        if (targetColumnId && targetColumnId !== draggedCard.columnId) {
          // Optimistically move card to target column
          const updatedCards = cards.map((card) =>
            card.id === active.id
              ? { ...card, columnId: targetColumnId! }
              : card
          )
          setCards(updatedCards)
        }
      }

      // Clear drag state
      setDraggedCardId(null)

      // Then handle the actual reorder (which will sync with database)
      await handleCardReorder(event, cards, boardColumns)
    }
  }

  const draggedCard = draggedCardId ? cards.find((card) => card.id === draggedCardId) : null
  const draggedColumn = draggedColumnId ? boardColumns.find((col) => col.id === draggedColumnId) : null

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Columns</h2>
        <CreateColumnDialog boardId={boardId} nextOrder={nextOrder} />
      </div>
      {boardColumns.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext
            items={boardColumns.map((col) => col.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex gap-4 overflow-x-auto pb-4">
              {boardColumns.map((column) => (
                <ColumnCard
                  key={column.id}
                  column={column}
                  isDragging={draggedColumnId === column.id}
                  isOver={overColumnId === column.id}
                  isAnyColumnDragging={draggedColumnId !== null}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {draggedCard ? (
              <div className="rotate-3 opacity-90">
                <Card card={draggedCard} />
              </div>
            ) : draggedColumn ? (
              <div className="rotate-3 opacity-90">
                <ColumnCard column={draggedColumn} isDragging={false} isOver={false} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  )
}

