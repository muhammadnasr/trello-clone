import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { Column } from '@/lib/types/column'
import { Button } from '@/components/ui/button'
import { useColumnsStore } from '@/stores/columns'
import { useCardsStore } from '@/stores/cards'
import { RenameColumnDialog } from './RenameColumnDialog'
import { CardsList } from '@/components/cards/CardsList'
import { CreateCard } from '@/components/cards/CreateCard'
import { Pencil, Trash2, GripVertical } from 'lucide-react'

interface ColumnCardProps {
  column: Column
  isDragging?: boolean
  isOver?: boolean
  isAnyColumnDragging?: boolean
}

export function ColumnCard({ column, isDragging = false, isOver = false, isAnyColumnDragging = false }: ColumnCardProps) {
  const [isRenameOpen, setIsRenameOpen] = useState(false)
  const deleteColumn = useColumnsStore((state) => state.deleteColumn)
  const cards = useCardsStore((state) => state.cards)
  const columnCards = cards.filter((card) => card.columnId === column.id)
  const nextOrder = columnCards.length > 0
    ? Math.max(...columnCards.map((card) => card.order), -1) + 1
    : 0

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: column.id })

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: column.id,
  })

  // Prevent transform when dragging - we want to show placeholder instead
  // Also prevent transform when any column is being dragged to prevent other columns from moving
  const shouldPreventTransform = isDragging || isAnyColumnDragging

  // Always explicitly set opacity to 1 when not dragging to prevent transparency issues
  // When dragging, we show placeholder instead, so this style is only for non-dragging state
  const style = shouldPreventTransform
    ? { opacity: 1, transform: 'none', transition: 'none' }
    : {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: 1,
    }

  // Combine refs for both sortable (change column order) and droppable (allow cards to be dropped)
  const combinedRef = (node: HTMLDivElement | null) => {
    setNodeRef(node)
    setDroppableRef(node)
  }

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${column.title}"?`)) {
      await deleteColumn(column.id)
    }
  }

  return (
    <>
      {isDragging ? (
        // Placeholder for the dragged column - still needs ref for drag detection
        // Explicitly prevent any transform on the placeholder
        <div
          ref={combinedRef}
          className="bg-gray-100 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-4 min-w-[280px]"
          style={{ opacity: 1, transform: 'none', transition: 'none' }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 flex-1">
              <div className="text-gray-400">
                <GripVertical className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-lg text-gray-400">{column.title}</h3>
            </div>
          </div>
          <div className="text-sm text-gray-400 text-center py-4">
            Drop column here
          </div>
        </div>
      ) : (
        <div
          ref={combinedRef}
          style={{ ...style, opacity: 1 }}
          className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 min-w-[280px] transition-all ${isOver ? 'ring-2 ring-blue-500 ring-offset-2' : ''
            }`}
        >
          <div className="relative flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 flex-1">
              <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
                aria-label="Drag handle"
              >
                <GripVertical className="h-5 w-5" />
              </button>
              <div className="group relative flex-1">
                <h3 className="font-semibold text-lg">{column.title}</h3>
                <div className="absolute right-0 top-[-2px] flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Rename column"
                    onClick={() => setIsRenameOpen(true)}
                    className="h-8 w-8 p-0"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Delete column"
                    onClick={handleDelete}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <CardsList columnId={column.id} />
          <div className="mt-2">
            <CreateCard columnId={column.id} nextOrder={nextOrder} />
          </div>
        </div>
      )}
      <RenameColumnDialog
        column={column}
        open={isRenameOpen}
        onOpenChange={setIsRenameOpen}
      />
    </>
  )
}

