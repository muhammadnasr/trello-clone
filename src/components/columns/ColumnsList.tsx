import { useState, useMemo } from 'react'
import { DragDropContext, Droppable, type DropResult } from '@hello-pangea/dnd'
import { useColumnsStore } from '@/stores/columns'
import { useCardsStore } from '@/stores/cards'
import { handleColumnReorder } from '@/lib/utils/column-reorder'
import { handleCardReorder } from '@/lib/utils/card-reorder'
import { ColumnCard } from './ColumnCard'
import { CreateColumnDialog } from './CreateColumnDialog'
import type { Card } from '@/lib/types/card'

/* -------------------- utils -------------------- */

const reorder = <T,>(list: T[], from: number, to: number): T[] => {
  const copy = [...list]
  const [item] = copy.splice(from, 1)
  copy.splice(to, 0, item)
  return copy
}

const renumber = <T extends { id: string }>(items: T[]) =>
  Object.fromEntries(items.map((item, i) => [item.id, i]))

/* -------------------- component -------------------- */

interface ColumnsListProps {
  boardId: string
}

export function ColumnsList({ boardId }: ColumnsListProps) {
  const allColumns = useColumnsStore((s) => s.columns)
  const allCards = useCardsStore((s) => s.cards)

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

  /* -------------------- optimistic helpers -------------------- */

  const commitCards = (updates: typeof optimisticCards) => {
    setOptimisticCards(updates)
    useCardsStore.getState().setCards(
      allCards.map((c) => ({
        ...c,
        ...updates?.[c.id],
      }))
    )
  }

  const commitColumns = (orderMap: Record<string, number>) => {
    setOptimisticColumnOrder(orderMap)

    const updated = allColumns.map((c) =>
      c.boardId === boardId
        ? { ...c, order: orderMap[c.id] }
        : c
    )

    useColumnsStore.getState().setColumns(updated)
  }

  /* -------------------- drag handlers -------------------- */

  const onColumnDrag = async (result: DropResult) => {
    const reordered = reorder(columns, result.source.index, result.destination!.index)
    const orderMap = renumber(reordered)

    commitColumns(orderMap)

    try {
      await handleColumnReorder(result, allColumns, boardId)
    } finally {
      setOptimisticColumnOrder(null)
    }
  }

  const onCardDrag = async (result: DropResult) => {
    const { source, destination, draggableId } = result
    if (!destination) return

    const dragged = allCards.find((c) => c.id === draggableId)
    if (!dragged) return

    const srcCol = source.droppableId
    const dstCol = destination.droppableId

    const srcCards = allCards
      .filter((c) => c.columnId === srcCol)
      .sort((a, b) => a.order - b.order)

    const dstCards = allCards
      .filter((c) => c.columnId === dstCol)
      .sort((a, b) => a.order - b.order)

    const updates: Record<string, { order?: number; columnId?: string }> = {}

    if (srcCol === dstCol) {
      const reordered = reorder(cardsByColumn[srcCol], source.index, destination.index)
      reordered.forEach((c, i) => {
        if (c.order !== i) updates[c.id] = { order: i }
      })
    } else {
      const newDst = [
        ...dstCards.slice(0, destination.index),
        dragged,
        ...dstCards.slice(destination.index),
      ]

      updates[dragged.id] = {
        columnId: dstCol,
        order: destination.index,
      }

      srcCards
        .filter((c) => c.id !== dragged.id)
        .forEach((c, i) => {
          if (c.order !== i) updates[c.id] = { order: i }
        })

      newDst.forEach((c, i) => {
        if (c.id !== dragged.id && c.order !== i) {
          updates[c.id] = { order: i }
        }
      })
    }

    commitCards(updates)

    try {
      await handleCardReorder(result)
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

  /* -------------------- render -------------------- */

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
