import { createDatabase } from './database'
import { syncBoardsToStore } from './sync'
import type { TrelloDatabase } from './database'

let databaseInstance: TrelloDatabase | null = null
let unsubscribeSync: (() => void) | null = null

export async function initDatabase(testDatabase?: TrelloDatabase): Promise<TrelloDatabase> {
  if (databaseInstance) {
    return databaseInstance
  }

  const db = testDatabase || await createDatabase()
  databaseInstance = db
  unsubscribeSync = syncBoardsToStore(db)

  return db
}

export function getDatabase(): TrelloDatabase {
  if (!databaseInstance) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return databaseInstance
}

export async function cleanupDatabase(): Promise<void> {
  if (unsubscribeSync) {
    unsubscribeSync()
    unsubscribeSync = null
  }
  if (databaseInstance) {
    await databaseInstance.remove()
    databaseInstance = null
  }
}

