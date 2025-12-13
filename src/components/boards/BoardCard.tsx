import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Trash2, Edit2 } from 'lucide-react'
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
import { updateBoard, deleteBoard } from '@/lib/services/boards'
import type { Board } from '@/lib/types/board'

interface BoardCardProps {
  board: Board
}

export function BoardCard({ board }: BoardCardProps) {
  const [isRenaming, setIsRenaming] = useState(false)
  const [newTitle, setNewTitle] = useState(board.title)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleRename = async () => {
    if (!newTitle.trim() || newTitle.trim() === board.title) {
      setIsRenaming(false)
      return
    }

    try {
      await updateBoard(board.id, { title: newTitle.trim() })
      setIsRenaming(false)
    } catch (error) {
      console.error('Failed to rename board:', error)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${board.title}"?`)) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteBoard(board.id)
    } catch (error) {
      console.error('Failed to delete board:', error)
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className="group relative p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200">
        <Link
          to="/boards/$boardId"
          params={{ boardId: board.id }}
          className="block"
        >
          <h2 className="text-lg font-semibold mb-2">{board.title}</h2>
          <p className="text-sm text-gray-500">
            {new Date(board.createdAt).toLocaleDateString()}
          </p>
        </Link>
        
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.preventDefault()
              setIsRenaming(true)
            }}
            className="h-7 w-7"
            title="Rename board"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.preventDefault()
              handleDelete()
            }}
            disabled={isDeleting}
            className="h-7 w-7 text-destructive"
            title="Delete board"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={isRenaming} onOpenChange={setIsRenaming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Board</DialogTitle>
            <DialogDescription>
              Enter a new name for this board.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Board name"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRename()
                }
                if (e.key === 'Escape') {
                  setIsRenaming(false)
                  setNewTitle(board.title)
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRenaming(false)
                setNewTitle(board.title)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={!newTitle.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

