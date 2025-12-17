import { createDatabase } from './database'
import { syncStoresToDatabase } from './localdb-store-sync'
import { setupFirestoreReplication, cancelReplication, getReplicationStates } from './localdb-firestore-sync'
import type { TrelloDatabase } from './database'
import { useAuthStore } from '@/stores/auth'
import { updateSyncStatus } from '@/stores/syncStatus'

let databaseInstance: TrelloDatabase | null = null
let unsubscribeSync: (() => void) | null = null

/**
 * Migrate anonymous data to the authenticated user.
 * This allows offline-first usage where users can create data
 * without logging in, then claim it after authentication.
 */
async function migrateAnonymousData(userId: string): Promise<void> {
  if (!databaseInstance) return
  
  // Find all boards owned by "anonymous"
  const anonymousBoards = await databaseInstance.boards
    .find({ selector: { ownerId: 'anonymous' } })
    .exec()
  
  if (anonymousBoards.length === 0) return
  
  console.log(`🔄 Migrating ${anonymousBoards.length} anonymous board(s) to user ${userId}`)
  
  // Update boards
  for (const board of anonymousBoards) {
    await board.patch({
      ownerId: userId,
      updatedAt: new Date().toISOString()
    })
  }

  // Find and update anonymous columns
  const anonymousColumns = await databaseInstance.columns
    .find({ selector: { ownerId: 'anonymous' } })
    .exec()
  
  for (const column of anonymousColumns) {
    await column.patch({
      ownerId: userId,
      updatedAt: new Date().toISOString()
    })
  }

  // Find and update anonymous cards
  const anonymousCards = await databaseInstance.cards
    .find({ selector: { ownerId: 'anonymous' } })
    .exec()
  
  for (const card of anonymousCards) {
    await card.patch({
      ownerId: userId,
      updatedAt: new Date().toISOString()
    })
  }
  
  console.log('✅ Anonymous data migration complete')
}

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
    // Migrate anonymous data to the authenticated user BEFORE starting replication
    const user = useAuthStore.getState().user
    if (user?.uid) {
      await migrateAnonymousData(user.uid)
    }

    const replication = setupFirestoreReplication(databaseInstance)
    console.log('✅ Firestore replication attached:', {
      boards: !!replication.boardsReplication,
      columns: !!replication.columnsReplication,
    })
    
    // Update sync status after replication is successfully set up
    updateSyncStatus()
   
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

