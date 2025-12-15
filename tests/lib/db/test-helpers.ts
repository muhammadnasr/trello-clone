import { createRxDatabase } from 'rxdb/plugins/core'
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory'
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv'
import { addRxPlugin } from 'rxdb/plugins/core'
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode'
import type { TrelloDatabase } from '../../../src/lib/db/database'
import { boardSchema } from '../../../src/lib/db/schemas/board.schema'
import { columnSchema } from '../../../src/lib/db/schemas/column.schema'

addRxPlugin(RxDBDevModePlugin)

export async function createTestDatabase(name?: string): Promise<TrelloDatabase> {
  const storage = wrappedValidateAjvStorage({
    storage: getRxStorageMemory(),
  })
  
  const database = await createRxDatabase<TrelloDatabase>({
    name: name || `test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    storage: storage,
    multiInstance: false,
  })

  await database.addCollections({
    boards: {
      schema: boardSchema,
    },
    columns: {
      schema: columnSchema,
    },
  })

  return database
}

