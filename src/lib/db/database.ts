import { addRxPlugin } from 'rxdb/plugins/core'
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode'
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie'
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv'
import { createRxDatabase } from 'rxdb/plugins/core'
import type { RxDatabase } from 'rxdb'
import type { TrelloCollections } from './collections'
import { boardSchema } from './schemas/board.schema'
import { columnSchema } from './schemas/column.schema'

addRxPlugin(RxDBDevModePlugin)

const storage = wrappedValidateAjvStorage({
  storage: getRxStorageDexie(),
})

export type TrelloDatabase = RxDatabase<TrelloCollections>

export async function createDatabase(): Promise<TrelloDatabase> {
  const database = await createRxDatabase<TrelloDatabase>({
    name: 'trello-clone',
    storage: storage,
    multiInstance: true,
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

