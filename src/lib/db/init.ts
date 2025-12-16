import { createDatabase } from './database'
import { syncStoresToDatabase } from './sync'
import { setupFirestoreReplication, cancelReplication, getReplicationStates } from './replication'
import type { TrelloDatabase } from './database'

let databaseInstance: TrelloDatabase | null = null
let unsubscribeSync: (() => void) | null = null

/**
 * Initialize database and hydrate from IndexedDB.
 * This should be called on app startup to load local data.
 * Backend subscriptions (Firestore replication) should be attached separately
 * when user is authenticated.
 */
export async function initDatabase(testDatabase?: TrelloDatabase): Promise<TrelloDatabase> {
  if (databaseInstance) {
    return databaseInstance
  }

  // Create database - RxDB automatically hydrates from IndexedDB
  const db = testDatabase || await createDatabase()
  databaseInstance = db
  
  // Sync RxDB data to Zustand stores (hydrates stores with IndexedDB data)
  // This sets up reactive queries for both boards and columns
  unsubscribeSync = syncStoresToDatabase(db)

  return db
}

/**
 * Attach Firestore replication subscriptions.
 * Should only be called when user is authenticated.
 * Idempotent - will not attach if already attached.
 */
export async function attachBackendSubscriptions(): Promise<void> {
  if (!databaseInstance) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }

  if (!import.meta.env.VITE_FIREBASE_PROJECT_ID) {
    return
  }

  // Check if replication is already attached
  const replicationStates = getReplicationStates()
  if (replicationStates.boards && replicationStates.columns) {
    return
  }

  try {
    const replication = setupFirestoreReplication(databaseInstance)
    console.log('✅ Firestore replication attached:', {
      boards: !!replication.boardsReplication,
      columns: !!replication.columnsReplication,
    })
  } catch (error) {
    console.error('❌ Failed to attach Firestore replication:', error)
    throw error
  }
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
  cancelReplication()
  if (databaseInstance) {
    await databaseInstance.remove()
    databaseInstance = null
  }
}

