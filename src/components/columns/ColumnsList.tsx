import { useColumnsStore } from '@/stores/columns'
import { ColumnCard } from './ColumnCard'
import { CreateColumnDialog } from './CreateColumnDialog'

interface ColumnsListProps {
  boardId: string
}

export function ColumnsList({ boardId }: ColumnsListProps) {
  const columns = useColumnsStore((state) => state.columns)
  const boardColumns = columns.filter((col) => col.boardId === boardId)
  const nextOrder = boardColumns.length > 0 
    ? Math.max(...boardColumns.map((col) => col.order)) + 1 
    : 0

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Columns</h2>
        <CreateColumnDialog boardId={boardId} nextOrder={nextOrder} />
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {boardColumns.map((column) => (
          <ColumnCard key={column.id} column={column} />
        ))}
      </div>
    </div>
  )
}

