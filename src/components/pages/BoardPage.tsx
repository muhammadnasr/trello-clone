import { useBoardsStore } from '@/stores/boards'
import { ColumnsList } from '@/components/columns/ColumnsList'

interface BoardPageProps {
  boardId: string
}

export function BoardPage({ boardId }: BoardPageProps) {
  const boards = useBoardsStore((state) => state.boards)
  const board = boards.find((b) => b.id === boardId)

  return (
    <div className="p-8">
      {!board ? (
        <>
          <h1 className="text-3xl font-bold mb-4">Board Not Found</h1>
          <p className="text-gray-600">The board you're looking for doesn't exist.</p>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-bold mb-6">{board.title}</h1>
          <ColumnsList boardId={boardId} />
        </>
      )}
    </div>
  )
}

