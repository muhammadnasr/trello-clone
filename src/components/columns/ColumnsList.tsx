import { useState, useMemo } from 'react'
import { DragDropContext, Droppable, type DropResult } from '@hello-pangea/dnd'
import { useColumnsStore } from '@/stores/columns'
import { useCardsStore } from '@/stores/cards'
import { reorder } from '@/lib/utils/reorder'
import { calculateCardUpdates } from '@/lib/utils/card-updates'
import { ColumnCard } from './ColumnCard'
import { CreateColumnDialog } from './CreateColumnDialog'
import type { Card } from '@/lib/types/card'

interface ColumnsListProps {
  boardId: string
}

export function ColumnsList({ boardId }: ColumnsListProps) {
  const allColumns = useColumnsStore((s) => s.columns)
  const allCards = useCardsStore((s) => s.cards)
  const updateColumnsOrder = useColumnsStore((s) => s.updateColumnsOrder)
  const updateCardsOrder = useCardsStore((s) => s.updateCardsOrder)

  const [optimisticColumnOrder, setOptimisticColumnOrder] =
    useState<Record<string, number> | null>(null)

  const [optimisticCards, setOptimisticCards] =
    useState<Record<string, { order?: number; columnId?: string }> | null>(null)

  /* -------------------- derived state -------------------- */

  const columns = useMemo(() => {
    return allColumns
      .filter((c) => c.boardId === boardId)
      .map((c) => ({
        ...c,
        order: optimisticColumnOrder?.[c.id] ?? c.order,
      }))
      .sort((a, b) => a.order - b.order)
  }, [allColumns, boardId, optimisticColumnOrder])

  const cardsByColumn = useMemo(() => {
    const map: Record<string, Card[]> = {}

    for (const column of columns) {
      map[column.id] = allCards
        .filter((card) => {
          const colId = optimisticCards?.[card.id]?.columnId ?? card.columnId
          return colId === column.id
        })
        .map((card) => ({
          ...card,
          ...optimisticCards?.[card.id],
        }))
        .sort((a, b) => a.order - b.order)
    }

    return map
  }, [allCards, columns, optimisticCards])

  /* -------------------- drag handlers -------------------- */

  const onColumnDrag = async (result: DropResult) => {
    const reordered = reorder(columns, result.source.index, result.destination!.index)
    // Convert the reordered array to an object with the item id as the key and the index as the value
    //for example: [{ id: '1', order: 0 }, { id: '2', order: 1 }] -> { '1': 0, '2': 1 }
    const orderMap = Object.fromEntries(reordered.map((item, i) => [item.id, i]))

    setOptimisticColumnOrder(orderMap)

    try {
      await updateColumnsOrder(reordered)
    } finally {
      setOptimisticColumnOrder(null)
    }
  }

  const onCardDrag = async (result: DropResult) => {
    const { source, destination, draggableId } = result
    // destination is guaranteed to be non-null by handleDragEnd validation

    const dragged = allCards.find((c) => c.id === draggableId)
    if (!dragged) return

    const srcCol = source.droppableId
    const dstCol = destination!.droppableId
    const srcCards = cardsByColumn[srcCol]
    const dstCards = cardsByColumn[dstCol]

    const updates = calculateCardUpdates(
      dragged,
      srcCards,
      dstCards,
      source.index,
      destination!.index,
      srcCol,
      dstCol
    )

    setOptimisticCards(updates)

    try {
      await updateCardsOrder(updates)
    } finally {
      setOptimisticCards(null)
    }
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return
    if (
      result.source.droppableId === result.destination.droppableId &&
      result.source.index === result.destination.index
    )
      return

    if (result.type === 'COLUMN') {
      onColumnDrag(result)
    } else {
      onCardDrag(result)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Columns</h2>
        <CreateColumnDialog boardId={boardId} nextOrder={columns.length} />
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="columns" direction="horizontal" type="COLUMN">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex overflow-auto pb-4"
            >
              {columns.map((column, index) => (
                <ColumnCard
                  key={column.id}
                  column={column}
                  index={index}
                  cards={cardsByColumn[column.id] || []}
                />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  )
}
