import { Link, useRouterState } from '@tanstack/react-router'
import { useBoardsStore } from '@/stores/boards'

export function Breadcrumbs() {
  const router = useRouterState()
  const pathname = router.location.pathname
  const boards = useBoardsStore((state) => state.boards)

  // Extract boardId from pathname if on board detail page
  const boardIdMatch = pathname.match(/^\/boards\/([^/]+)/)
  const boardId = boardIdMatch ? boardIdMatch[1] : null
  const board = boardId ? boards.find((b) => b.id === boardId) : null

  // Build breadcrumb items
  const items: Array<{ label: string; href?: string }> = []

  // Always start with "Trello Clone"
  items.push({ label: 'Trello Clone', href: '/' })

  // Always add "Boards" (home page is the boards list)
  items.push({ label: 'Boards', href: '/' })

  // Add board name if on board detail page
  if (boardId && board) {
    items.push({ label: board.title, href: `/boards/${boardId}` })
  }

  // Add column name if on column detail page (future)
  // For now, columns are shown within the board page, so we don't add them to breadcrumbs

  return (
    <nav className="flex items-center gap-2 text-sm">
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        const content = (
          <>
            {item.href && !isLast ? (
              <Link
                to={item.href}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'text-gray-900 font-medium' : 'text-gray-600'}>
                {item.label}
              </span>
            )}
          </>
        )

        return (
          <div key={index} className="flex items-center gap-2">
            {content}
            {!isLast && <span className="text-gray-400">/</span>}
          </div>
        )
      })}
    </nav>
  )
}

