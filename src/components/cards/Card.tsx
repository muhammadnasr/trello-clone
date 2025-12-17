import { useState, useRef, useEffect } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Card as CardType } from '@/lib/types/card'
import { Button } from '@/components/ui/button'
import { useCardsStore } from '@/stores/cards'
import { Trash2, GripVertical } from 'lucide-react'

interface CardProps {
  card: CardType
  isDragging?: boolean
  isOver?: boolean
  isAnyCardDragging?: boolean
}

export function Card({ card, isDragging = false, isOver = false, isAnyCardDragging = false }: CardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(card.title)
  const inputRef = useRef<HTMLInputElement>(null)
  const updateCard = useCardsStore((state) => state.updateCard)
  const deleteCard = useCardsStore((state) => state.deleteCard)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: card.id })

  // Prevent transform when dragging - we want to show placeholder instead
  // Also prevent transform when any card is being dragged to prevent other cards from moving
  const shouldPreventTransform = isDragging || isAnyCardDragging

  const style = shouldPreventTransform
    ? { opacity: 1, transform: 'none', transition: 'none' }
    : {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: 1,
    }

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  // Only sync title when card.id changes (different card)
  // This avoids cascading renders from syncing on every card.title change
  useEffect(() => {
    setTitle(card.title)
  }, [card.id])

  const handleSave = async () => {
    const trimmedTitle = title.trim()
    if (trimmedTitle && trimmedTitle !== card.title) {
      await updateCard(card.id, { title: trimmedTitle })
    } else if (!trimmedTitle) {
      setTitle(card.title)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setTitle(card.title)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${card.title}"?`)) {
      await deleteCard(card.id)
    }
  }

  return (
    <>
      {isDragging ? (
        // Placeholder for the dragged card
        <div
          ref={setNodeRef}
          className="group bg-gray-100 dark:bg-gray-600 rounded-md border-2 border-dashed border-gray-300 dark:border-gray-500 p-3 mb-2"
          style={{ opacity: 1, transform: 'none', transition: 'none' }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="text-gray-400 mr-1">
              <GripVertical className="h-4 w-4" />
            </div>
            <p className="flex-1 text-sm text-gray-400">{card.title}</p>
          </div>
        </div>
      ) : (
        <div
          ref={setNodeRef}
          style={{ ...style, opacity: 1 }}
          className={`group bg-white dark:bg-gray-700 rounded-md shadow-sm p-3 mb-2 hover:shadow-md transition-shadow ${isOver ? 'ring-2 ring-blue-500 ring-offset-1' : ''
            }`}
        >
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              className="w-full px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <div className="flex items-start justify-between gap-2">
              <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 mr-1"
                aria-label="Drag handle"
              >
                <GripVertical className="h-4 w-4" />
              </button>
              <p
                className="flex-1 text-sm cursor-text hover:bg-gray-100 dark:hover:bg-gray-600 px-2 py-1 rounded -mx-2 -my-1"
                onClick={() => setIsEditing(true)}
                onDoubleClick={() => setIsEditing(true)}
              >
                {card.title}
              </p>
              <Button
                variant="ghost"
                size="sm"
                title="Delete card"
                onClick={handleDelete}
                className="h-6 w-6 p-0 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity -mt-0.5"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  )
}

