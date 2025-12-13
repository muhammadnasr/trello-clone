import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/boards/$boardId')({
  component: BoardPage,
})

function BoardPage() {
  const { boardId } = Route.useParams()
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Board Detail</h1>
      <p className="text-gray-600">Board ID: {boardId}</p>
      <p className="text-gray-600">This is the board detail page (/boards/:boardId)</p>
    </div>
  )
}

