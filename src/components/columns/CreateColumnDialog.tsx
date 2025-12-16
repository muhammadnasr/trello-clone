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
import { useColumnsStore } from '@/stores/columns'
import { useAuthStore } from '@/stores/auth'

interface CreateColumnDialogProps {
  boardId: string
  nextOrder: number
}

export function CreateColumnDialog({ boardId, nextOrder }: CreateColumnDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const createColumn = useColumnsStore((state) => state.createColumn)
  const error = useColumnsStore((state) => state.error)
  const user = useAuthStore((state) => state.user)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsSubmitting(true)
    try {
      const ownerId = user?.uid || 'anonymous'
      await createColumn(boardId, title.trim(), nextOrder, ownerId)
      setTitle('')
      setOpen(false)
    } catch (err) {
      console.error('Failed to create column:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Column</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Column</DialogTitle>
          <DialogDescription>
            Add a new column to organize your cards.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="column-name" className="text-sm font-medium">
                Column name
              </label>
              <Input
                id="column-name"
                placeholder="Column name"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="default" disabled={isSubmitting || !title.trim()}>
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

