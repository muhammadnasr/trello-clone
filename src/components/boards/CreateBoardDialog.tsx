import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useBoardsStore } from '@/stores/boards'

interface CreateBoardDialogProps {
  onBoardCreated?: () => void
}

export function CreateBoardDialog({ onBoardCreated }: CreateBoardDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const createBoard = useBoardsStore((state) => state.createBoard)
  const error = useBoardsStore((state) => state.error)

  const handleCreate = async () => {
    if (!title.trim()) {
      return
    }

    setIsCreating(true)
    try {
      // For now, use a placeholder ownerId. Later we'll get it from auth
      const ownerId = 'user1'
      await createBoard(title.trim(), ownerId)
      setTitle('')
      setOpen(false)
      onBoardCreated?.()
    } catch (error) {
      // Error is already set in Zustand store, just log for debugging
      console.error('Failed to create board:', error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Board</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Board</DialogTitle>
          <DialogDescription>
            Enter a name for your new board.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            placeholder="Board name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isCreating) {
                handleCreate()
              }
            }}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button 
            variant="default"
            onClick={handleCreate} 
            disabled={isCreating || !title.trim()}
          >
            {isCreating ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
        {error && (
          <p className="text-sm text-destructive mt-2">{error}</p>
        )}
      </DialogContent>
    </Dialog>
  )
}

