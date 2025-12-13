import { createDatabase } from './database'
import { syncBoardsToStore } from './sync'
import type { TrelloDatabase } from './database'

let databaseInstance: TrelloDatabase | null = null
let unsubscribeSync: (() => void) | null = null

/**
 * Initialize the database and sync with Zustand store.
 * Call this once when the app starts.
 */
export async function initDatabase(): Promise<TrelloDatabase> {
  if (databaseInstance) {
    return databaseInstance
  }

  // Create database
  const db = await createDatabase()
  databaseInstance = db

  // Sync RxDB to Zustand store
  unsubscribeSync = syncBoardsToStore(db)

  return db
}

/**
 * Get the database instance (must be initialized first)
 */
export function getDatabase(): TrelloDatabase {
  if (!databaseInstance) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return databaseInstance
}

/**
 * Cleanup database and sync subscriptions
 */
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

