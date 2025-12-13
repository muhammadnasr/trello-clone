import { createRxDatabase } from 'rxdb/plugins/core'
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory'
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv'
import { addRxPlugin } from 'rxdb/plugins/core'
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode'
import type { TrelloDatabase } from '../../../src/lib/db/database'
import { boardSchema } from '../../../src/lib/db/collections'

// Enable dev-mode
addRxPlugin(RxDBDevModePlugin)

/**
 * Create an in-memory RxDB database for testing.
 * This avoids IndexedDB issues in Node test environment and allows
 * real reactive sync to work automatically.
 */
export async function createTestDatabase(name?: string): Promise<TrelloDatabase> {
  const storage = wrappedValidateAjvStorage({
    storage: getRxStorageMemory(),
  })
  
  const database = await createRxDatabase<TrelloDatabase>({
    name: name || `test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    storage: storage,
    multiInstance: false, // No need for multi-instance in tests
  })

  await database.addCollections({
    boards: {
      schema: boardSchema,
    },
  })

  return database
}

