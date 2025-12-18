import { useState, useMemo } from 'react'
import { DragDropContext, Droppable, type DropResult } from '@hello-pangea/dnd'
import { useColumnsStore } from '@/stores/columns'
import { useCardsStore } from '@/stores/cards'
import { handleColumnReorder } from '@/lib/utils/column-reorder'
import { handleCardReorder } from '@/lib/utils/card-reorder'
import { ColumnCard } from './ColumnCard'
import { CreateColumnDialog } from './CreateColumnDialog'
import type { Card } from '@/lib/types/card'

function reorder<T>(list: T[], startIndex: number, endIndex: number): T[] {
  const result = Array.from(list)
  const [removed] = result.splice(startIndex, 1)
  result.splice(endIndex, 0, removed)
  return result
}

interface ColumnsListProps {
  boardId: string
}

export function ColumnsList({ boardId }: ColumnsListProps) {
  // Use dynamic columns from store
  const allColumns = useColumnsStore((state) => state.columns)

  // Track optimistic column order updates to prevent flicker
  const [optimisticOrder, setOptimisticOrder] = useState<Record<string, number> | null>(null)

  // Derive columns from store, applying optimistic order if present
  const columns = useMemo(() => {
    const boardColumns = allColumns
      .filter((col) => col.boardId === boardId)
      .map((col) => ({
        ...col,
        order: optimisticOrder?.[col.id] ?? col.order,
      }))
      .sort((a, b) => a.order - b.order)

    return boardColumns
  }, [allColumns, boardId, optimisticOrder])

  // Use dynamic cards from store
  const allCards = useCardsStore((state) => state.cards)

  // Get cards for each column, sorted by order
  const cardsByColumn = useMemo(() => {
    const cardsMap: Record<string, Card[]> = {}
    columns.forEach((column) => {
      cardsMap[column.id] = allCards
        .filter((card) => card.columnId === column.id)
        .sort((a, b) => a.order - b.order)
    })
    return cardsMap
  }, [allCards, columns])

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, type } = result

    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    if (type === 'COLUMN') {
      // Optimistically update order immediately (no flicker)
      const reorderedColumns = reorder(columns, source.index, destination.index)
      const newOrder: Record<string, number> = {}
      reorderedColumns.forEach((col, index) => {
        newOrder[col.id] = index
      })

      // Update optimistic order immediately
      setOptimisticOrder(newOrder)

      // Update store optimistically
      const updatedColumns = reorderedColumns.map((col, index) => ({
        ...col,
        order: index,
      }))
      const otherColumns = allColumns.filter((col) => col.boardId !== boardId)
      useColumnsStore.getState().setColumns([...otherColumns, ...updatedColumns])

      // Then sync to database in background
      handleColumnReorder(result, allColumns, boardId)
        .then(() => {
          // Clear optimistic order after successful DB update
          setOptimisticOrder(null)
        })
        .catch((error) => {
          console.error('Failed to update column order:', error)
          // Revert optimistic order on error
          setOptimisticOrder(null)
        })
    } else if (type === 'CARD') {
      // Handle card reordering using the utility function
      await handleCardReorder(result)
    }
  }

  // Calculate next order for new column
  const nextOrder = columns.length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Columns</h2>
        <CreateColumnDialog boardId={boardId} nextOrder={nextOrder} />
      </div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="columns" direction="horizontal" type="COLUMN">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              style={{
                display: 'flex',
                overflow: 'auto',
                paddingBottom: '1rem',
              }}
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

