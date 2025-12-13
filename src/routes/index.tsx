import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: IndexPage,
})

function IndexPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Boards List</h1>
      <p className="text-gray-600">This is the boards list page (/)</p>
    </div>
  )
}

