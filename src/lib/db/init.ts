import { createDatabase } from './database'
import { syncBoardsToStore, syncColumnsToStore } from './sync'
import type { TrelloDatabase } from './database'

let databaseInstance: TrelloDatabase | null = null
let unsubscribeBoardsSync: (() => void) | null = null
let unsubscribeColumnsSync: (() => void) | null = null

export async function initDatabase(testDatabase?: TrelloDatabase): Promise<TrelloDatabase> {
  if (databaseInstance) {
    return databaseInstance
  }

  const db = testDatabase || await createDatabase()
  databaseInstance = db
  unsubscribeBoardsSync = syncBoardsToStore(db)
  unsubscribeColumnsSync = syncColumnsToStore(db)

  return db
}

export function getDatabase(): TrelloDatabase {
  if (!databaseInstance) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return databaseInstance
}

export async function cleanupDatabase(): Promise<void> {
  if (unsubscribeBoardsSync) {
    unsubscribeBoardsSync()
    unsubscribeBoardsSync = null
  }
  if (unsubscribeColumnsSync) {
    unsubscribeColumnsSync()
    unsubscribeColumnsSync = null
  }
  if (databaseInstance) {
    await databaseInstance.remove()
    databaseInstance = null
  }
}

