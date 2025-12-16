import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useColumnsStore } from '@/stores/columns'
import { handleColumnReorder } from '@/lib/utils/column-reorder'
import { ColumnCard } from './ColumnCard'
import { CreateColumnDialog } from './CreateColumnDialog'

interface ColumnsListProps {
  boardId: string
}

export function ColumnsList({ boardId }: ColumnsListProps) {
  const columns = useColumnsStore((state) => state.columns)
  
  const boardColumns = columns
    .filter((col) => col.boardId === boardId)
    .sort((a, b) => a.order - b.order)
  
  const nextOrder = boardColumns.length > 0 
    ? Math.max(...boardColumns.map((col) => col.order)) + 1 
    : 0

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    await handleColumnReorder(event, columns, boardId)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Columns</h2>
        <CreateColumnDialog boardId={boardId} nextOrder={nextOrder} />
      </div>
      {boardColumns.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={boardColumns.map((col) => col.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex gap-4 overflow-x-auto pb-4">
              {boardColumns.map((column) => (
                <ColumnCard key={column.id} column={column} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}

