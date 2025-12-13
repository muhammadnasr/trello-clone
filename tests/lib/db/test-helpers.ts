import { createRxDatabase } from 'rxdb/plugins/core'
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory'
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv'
import { addRxPlugin } from 'rxdb/plugins/core'
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode'
import type { TrelloDatabase } from '../../../src/lib/db/database'
import { boardSchema } from '../../../src/lib/db/collections'

addRxPlugin(RxDBDevModePlugin)

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

