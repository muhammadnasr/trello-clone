import { useState, useRef, useEffect } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Card as CardType } from '@/lib/types/card'
import { Button } from '@/components/ui/button'
import { useCardsStore } from '@/stores/cards'
import { Trash2, GripVertical } from 'lucide-react'

interface CardProps {
  card: CardType
}

export function Card({ card }: CardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const updateCard = useCardsStore((state) => state.updateCard)
  const deleteCard = useCardsStore((state) => state.deleteCard)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const startEditing = () => {
    setEditTitle(card.title)
    setIsEditing(true)
  }

  const handleSave = async () => {
    const trimmedTitle = editTitle.trim()
    if (trimmedTitle && trimmedTitle !== card.title) {
      await updateCard(card.id, { title: trimmedTitle })
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
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
    <div
      ref={setNodeRef}
      style={style}
      className="group bg-white dark:bg-gray-700 rounded-md shadow-sm p-3 mb-2 hover:shadow-md transition-shadow"
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
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
            onClick={startEditing}
            onDoubleClick={startEditing}
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
  )
}

