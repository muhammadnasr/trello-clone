import { useState } from 'react'
import { Draggable, Droppable } from '@hello-pangea/dnd'
import type { CSSProperties } from 'react'
import type { Column } from '@/lib/types/column'
import { CardsList } from '@/components/cards/CardsList'
import { CreateCard } from '@/components/cards/CreateCard'
import { GripVertical, Edit2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { RenameColumnDialog } from './RenameColumnDialog'
import { useColumnsStore } from '@/stores/columns'

import type { Card } from '@/lib/types/card'

interface ColumnCardProps {
  column: Column
  index: number
  cards: Card[]
}

const grid = 8

const getItemStyle = (_isDragging: boolean, draggableStyle: CSSProperties | undefined) => ({
  userSelect: 'none' as const,
  padding: grid * 2,
  margin: `0 ${grid}px 0 0`,
  width: '280px',
  flexShrink: 0,
  ...(draggableStyle || {}),
})

export function ColumnCard({ column, index, cards }: ColumnCardProps) {
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const deleteColumn = useColumnsStore((state) => state.deleteColumn)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteColumn(column.id)
      setIsDeleteDialogOpen(false)
    } catch (error) {
      console.error('Failed to delete column:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Draggable draggableId={column.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            style={getItemStyle(snapshot.isDragging, provided.draggableProps.style)}
            className="bg-white dark:bg-gray-800 rounded-lg shadow"
          >
            <div className="relative flex items-center justify-between mb-2 group">
              <div className="flex items-center gap-2 flex-1">
                <div
                  {...provided.dragHandleProps}
                  className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
                  aria-label="Drag handle"
                >
                  <GripVertical className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg">{column.title}</h3>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsRenameDialogOpen(true)
                  }}
                  className="h-7 w-7"
                  title="Rename column"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsDeleteDialogOpen(true)
                  }}
                  className="h-7 w-7 text-destructive"
                  title="Delete column"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Droppable droppableId={column.id} type="CARD">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`min-h-[100px] ${snapshot.isDraggingOver ? 'bg-blue-50 dark:bg-blue-900/20 rounded' : ''
                    }`}
                >
                  <CardsList cards={cards} />
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
            <div className="mt-2">
              <CreateCard columnId={column.id} nextOrder={cards.length} />
            </div>
          </div>
        )}
      </Draggable>

      <RenameColumnDialog
        column={column}
        open={isRenameDialogOpen}
        onOpenChange={setIsRenameDialogOpen}
      />

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Column</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{column.title}"? This will also delete all cards in this column. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

