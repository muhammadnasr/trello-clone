import { addRxPlugin } from 'rxdb/plugins/core'
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode'
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie'
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv'
import { createRxDatabase } from 'rxdb/plugins/core'
import type { RxDatabase } from 'rxdb'
import type { BoardCollection } from './collections'
import { boardSchema } from './collections'

// Enable dev-mode for helpful checks and validations
addRxPlugin(RxDBDevModePlugin)

// Get Dexie.js storage (free IndexedDB storage)
// Wrap storage with schema validator (required in dev-mode, optional in production)
// Schema validation ensures all documents match the schema before being saved
const storage = wrappedValidateAjvStorage({
  storage: getRxStorageDexie(),
})

// Database type
export type TrelloDatabase = RxDatabase<BoardCollection>

// Create database
export async function createDatabase(): Promise<TrelloDatabase> {
  const database = await createRxDatabase<TrelloDatabase>({
    name: 'trello-clone',
    storage: storage,
    // multiInstance: true (default) enables automatic BroadcastChannel-based synchronization
    // between browser tabs. Changes made in one tab will automatically appear
    // in other tabs without any additional replication setup.
    multiInstance: true,
  })

  // Add boards collection
  await database.addCollections({
    boards: {
      schema: boardSchema,
    },
  })

  return database
}

