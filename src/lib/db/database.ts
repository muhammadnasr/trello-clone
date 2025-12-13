import { addRxPlugin } from 'rxdb/plugins/core'
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode'
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie'
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv'
import { createRxDatabase } from 'rxdb/plugins/core'
import type { RxDatabase } from 'rxdb'
import type { BoardCollection } from './collections'
import { boardSchema } from './collections'

addRxPlugin(RxDBDevModePlugin)

const storage = wrappedValidateAjvStorage({
  storage: getRxStorageDexie(),
})

export type TrelloDatabase = RxDatabase<BoardCollection>

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
  })

  return database
}

