import { useState } from 'react'
import type { CSSProperties } from 'react'
import { Draggable } from '@hello-pangea/dnd'
import type { Card as CardType } from '@/lib/types/card'
import { GripVertical, Edit2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCardsStore } from '@/stores/cards'

interface CardProps {
  card: CardType
  index: number
}

// Base unit for spacing (8px grid system - common design convention)
// Used to calculate consistent padding and margins
const grid = 8

const getItemStyle = (_isDragging: boolean, draggableStyle: CSSProperties | undefined) => ({
  userSelect: 'none' as const,
  padding: grid * 1,
  marginBottom: grid,
  overflow: 'visible',
  ...(draggableStyle || {}),
})

export function Card({ card, index }: CardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editTitle, setEditTitle] = useState(card.title)
  const [isSaving, setIsSaving] = useState(false)
  const updateCard = useCardsStore((state) => state.updateCard)
  const deleteCard = useCardsStore((state) => state.deleteCard)

  const handleSave = async () => {
    if (!editTitle.trim() || editTitle.trim() === card.title) {
      setIsEditing(false)
      setEditTitle(card.title)
      return
    }

    setIsSaving(true)
    try {
      await updateCard(card.id, { title: editTitle.trim() })
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update card:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditTitle(card.title)
    setIsEditing(false)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteCard(card.id)
      setIsDeleteDialogOpen(false)
    } catch (error) {
      console.error('Failed to delete card:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Draggable draggableId={card.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            style={getItemStyle(snapshot.isDragging, provided.draggableProps.style)}
            className="bg-white dark:bg-gray-700 rounded-md shadow-sm border border-gray-200 dark:border-gray-600"
          >
            {isEditing ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSave()
                }}
                className="space-y-2"
              >
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={handleSave}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleSave()
                    } else if (e.key === 'Escape') {
                      handleCancel()
                    }
                  }}
                  autoFocus
                  className="text-sm"
                  disabled={isSaving}
                />
              </form>
            ) : (
              <div className="flex items-start justify-between gap-2 group">
                <button
                  {...provided.dragHandleProps}
                  className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 mr-1 mt-0.5"
                  aria-label="Drag handle"
                >
                  <GripVertical className="h-4 w-4" />
                </button>
                <p
                  className="flex-1 text-sm cursor-pointer"
                  onClick={() => setIsEditing(true)}
                >
                  {card.title}
                </p>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsEditing(true)
                    }}
                    className="h-6 w-6"
                    title="Edit card"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsDeleteDialogOpen(true)
                    }}
                    className="h-6 w-6 text-destructive"
                    title="Delete card"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Draggable>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Card</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{card.title}"? This action cannot be undone.
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

