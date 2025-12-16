import { useState, useRef, useEffect } from 'react'
import type { Card as CardType } from '@/lib/types/card'
import { Button } from '@/components/ui/button'
import { useCardsStore } from '@/stores/cards'
import { Trash2 } from 'lucide-react'

interface CardProps {
  card: CardType
}

export function Card({ card }: CardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(card.title)
  const inputRef = useRef<HTMLInputElement>(null)
  const updateCard = useCardsStore((state) => state.updateCard)
  const deleteCard = useCardsStore((state) => state.deleteCard)

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
    <div className="group bg-white dark:bg-gray-700 rounded-md shadow-sm p-3 mb-2 hover:shadow-md transition-shadow">
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
  )
}

