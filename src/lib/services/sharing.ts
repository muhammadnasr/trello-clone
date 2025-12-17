import { getDatabase } from '@/lib/db/init'

export async function addEditor(boardId: string, userId: string): Promise<void> {
  const db = getDatabase()
  const board = await db.boards.findOne(boardId).exec()
  
  if (!board) throw new Error('Board not found')
  
  const currentEditors = board.editors || []
  if (currentEditors.includes(userId)) return
  if (board.ownerId === userId) return
  
  await board.patch({
    editors: [...currentEditors, userId],
    updatedAt: new Date().toISOString()
  })
}

export async function removeEditor(boardId: string, userId: string): Promise<void> {
  const db = getDatabase()
  const board = await db.boards.findOne(boardId).exec()
  
  if (!board) throw new Error('Board not found')
  
  await board.patch({
    editors: (board.editors || []).filter((id: string) => id !== userId),
    updatedAt: new Date().toISOString()
  })
}

export async function getEditors(boardId: string): Promise<string[]> {
  const db = getDatabase()
  const board = await db.boards.findOne(boardId).exec()
  return board?.editors || []
}

