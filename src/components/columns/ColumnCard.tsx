import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Column } from '@/lib/types/column'
import { Button } from '@/components/ui/button'
import { useColumnsStore } from '@/stores/columns'
import { RenameColumnDialog } from './RenameColumnDialog'
import { Pencil, Trash2, GripVertical } from 'lucide-react'

interface ColumnCardProps {
  column: Column
}

export function ColumnCard({ column }: ColumnCardProps) {
  const [isRenameOpen, setIsRenameOpen] = useState(false)
  const deleteColumn = useColumnsStore((state) => state.deleteColumn)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${column.title}"?`)) {
      await deleteColumn(column.id)
    }
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 min-w-[280px]"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 flex-1">
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
              aria-label="Drag handle"
            >
              <GripVertical className="h-5 w-5" />
            </button>
            <h3 className="font-semibold text-lg">{column.title}</h3>
          </div>
          <div className="flex gap-1">
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
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Cards will appear here
        </div>
      </div>
      <RenameColumnDialog
        column={column}
        open={isRenameOpen}
        onOpenChange={setIsRenameOpen}
      />
    </>
  )
}

