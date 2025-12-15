import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useColumnsStore } from '@/stores/columns'
import type { Column } from '@/lib/types/column'

interface RenameColumnDialogProps {
  column: Column | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RenameColumnDialog({ column, open, onOpenChange }: RenameColumnDialogProps) {
  const [title, setTitle] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const updateColumn = useColumnsStore((state) => state.updateColumn)
  const error = useColumnsStore((state) => state.error)

  useEffect(() => {
    if (column) {
      setTitle(column.title)
    }
  }, [column])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!column || !title.trim() || title.trim() === column.title) {
      onOpenChange(false)
      return
    }

    setIsSubmitting(true)
    try {
      await updateColumn(column.id, { title: title.trim() })
      onOpenChange(false)
    } catch (err) {
      console.error('Failed to update column:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!column) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Column</DialogTitle>
          <DialogDescription>
            Change the name of this column.
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
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="default" disabled={isSubmitting || !title.trim()}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

