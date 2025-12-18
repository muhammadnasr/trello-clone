import { ColumnsList } from '@/components/columns/ColumnsList'

interface BoardPageProps {
  boardId: string
}

export function BoardPage({ boardId }: BoardPageProps) {
  return (
    <div className="p-8">
      <ColumnsList boardId={boardId} />
    </div>
  )
}

