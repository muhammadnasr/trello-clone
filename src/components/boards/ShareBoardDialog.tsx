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
import { addEditor, removeEditor } from '@/lib/services/sharing'
import { Share2, X, Crown } from 'lucide-react'
import type { Board } from '@/lib/types/board'

interface ShareBoardDialogProps {
  board: Board
}

export function ShareBoardDialog({ board }: ShareBoardDialogProps) {
  const [open, setOpen] = useState(false)
  const [userId, setUserId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddEditor = async () => {
    if (!userId.trim()) return

    setIsSubmitting(true)
    setError(null)
    try {
      await addEditor(board.id, userId.trim())
      setUserId('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add editor')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveEditor = async (editorId: string) => {
    setError(null)
    try {
      await removeEditor(board.id, editorId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove editor')
    }
  }

  const editors = board.editors || []

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Board</DialogTitle>
          <DialogDescription>
            Add editors to collaborate on this board. Enter their user ID.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Add editor input */}
          <div className="flex gap-2">
            <Input
              placeholder="Enter user ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isSubmitting) {
                  handleAddEditor()
                }
              }}
            />
            <Button
              onClick={handleAddEditor}
              disabled={isSubmitting || !userId.trim()}
            >
              Add
            </Button>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {/* Members list */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Members</h4>

            {/* Owner */}
            <div className="flex items-center justify-between p-2 rounded-md bg-muted">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">{board.ownerId}</span>
              </div>
              <span className="text-xs text-muted-foreground">Owner</span>
            </div>

            {/* Editors */}
            {editors.map((editorId) => (
              <div
                key={editorId}
                className="flex items-center justify-between p-2 rounded-md bg-muted"
              >
                <span className="text-sm">{editorId}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Editor</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleRemoveEditor(editorId)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {editors.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No editors yet. Add someone to collaborate!
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

