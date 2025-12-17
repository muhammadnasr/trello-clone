import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCardsStore } from '@/stores/cards'
import { X } from 'lucide-react'

interface CreateCardProps {
  columnId: string
  nextOrder: number
}

export function CreateCard({ columnId, nextOrder }: CreateCardProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [title, setTitle] = useState('')
  const createCard = useCardsStore((state) => state.createCard)
  const error = useCardsStore((state) => state.error)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setIsCreating(false)
      return
    }

    try {
      await createCard(columnId, title.trim(), nextOrder)
      setTitle('')
      setIsCreating(false)
    } catch (err) {
      console.error('Failed to create card:', err)
    }
  }

  const handleCancel = () => {
    setTitle('')
    setIsCreating(false)
  }

  if (!isCreating) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start text-gray-600 hover:text-gray-900"
        onClick={() => setIsCreating(true)}
      >
        + Add a card
      </Button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Input
        placeholder="Enter a title for this card..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            handleCancel()
          }
        }}
        autoFocus
        className="text-sm"
      />
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={!title.trim()}>
          Add card
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </form>
  )
}

