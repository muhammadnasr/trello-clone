import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

export function BackToBoards() {
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to Boards
    </Link>
  )
}

