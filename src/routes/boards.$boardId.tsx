import { createFileRoute } from '@tanstack/react-router'
import { BoardPage } from '@/components/pages/BoardPage'

export const Route = createFileRoute('/boards/$boardId')({
  component: BoardPageComponent,
}) 

function BoardPageComponent() {
  const { boardId } = Route.useParams()
  return <BoardPage boardId={boardId} />
}

