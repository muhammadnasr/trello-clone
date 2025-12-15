import { createDatabase } from './database'
import { syncBoardsToStore, syncColumnsToStore } from './sync'
import { setupFirestoreReplication, cancelReplication } from './replication'
import { initFirebase } from '../firebase/config'
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

  // Set up Firestore replication if Firebase is configured
  // Skip replication in test environment
  if (!testDatabase && import.meta.env.VITE_FIREBASE_PROJECT_ID) {
    try {
      console.log('🔄 Initializing Firestore replication...')
      initFirebase()
      const replication = setupFirestoreReplication(db)
      console.log('✅ Firestore replication initialized:', {
        boards: !!replication.boardsReplication,
        columns: !!replication.columnsReplication,
      })
    } catch (error) {
      console.error('❌ Firebase replication setup failed:', error)
      // Continue without replication if Firebase is not configured
    }
  } else if (!testDatabase) {
    console.log('⚠️ Firebase replication skipped: VITE_FIREBASE_PROJECT_ID not set')
  }

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
  cancelReplication()
  if (databaseInstance) {
    await databaseInstance.remove()
    databaseInstance = null
  }
}

