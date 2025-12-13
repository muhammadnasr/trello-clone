import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/')({
  component: IndexPage,
})

function IndexPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold mb-4">Boards List</h1>
      <p className="text-gray-600 mb-4">This is the boards list page (/)</p>
      <Button>Click me</Button>
    </div>
  )
}

