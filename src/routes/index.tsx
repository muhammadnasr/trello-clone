import { createFileRoute } from '@tanstack/react-router'
import { BoardsList } from '@/components/boards/BoardsList'

export const Route = createFileRoute('/')({
  component: IndexPage,
})

function IndexPage() {
  return <BoardsList />
}

