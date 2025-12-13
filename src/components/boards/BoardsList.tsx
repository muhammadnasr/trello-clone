import { useBoardsStore } from '@/stores/boards'
import { CreateBoardDialog } from './CreateBoardDialog'
import { BoardCard } from './BoardCard'

export function BoardsList() {
  const boards = useBoardsStore((state) => state.boards)
  const isLoading = useBoardsStore((state) => state.isLoading)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-600">Loading boards...</p>
      </div>
    )
  }

  if (boards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <p className="text-gray-600 mb-4">No boards yet. Create your first board!</p>
        <CreateBoardDialog />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Boards</h1>
        <CreateBoardDialog />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {boards.map((board) => (
          <BoardCard key={board.id} board={board} />
        ))}
      </div>
    </div>
  )
}

