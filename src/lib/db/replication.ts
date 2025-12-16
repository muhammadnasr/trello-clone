import { replicateFirestore, type RxFirestoreReplicationState } from 'rxdb/plugins/replication-firestore'
import { collection, type CollectionReference } from 'firebase/firestore'
import type { TrelloDatabase } from './database'
import { getFirestoreDatabase } from '../firebase/config'
import type { Board } from '../types/board'
import type { Column } from '../types/column'

let boardsReplication: RxFirestoreReplicationState<Board> | null = null
let columnsReplication: RxFirestoreReplicationState<Column> | null = null

export function setupFirestoreReplication(
  database: TrelloDatabase
): {
  boardsReplication: RxFirestoreReplicationState<Board>
  columnsReplication: RxFirestoreReplicationState<Column>
} {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID
  const firestoreDatabase = getFirestoreDatabase()

  if (!projectId) {
    throw new Error('VITE_FIREBASE_PROJECT_ID is not set in environment variables')
  }

  console.log('🔥 Setting up Firestore replication...')
  console.log('🔥 Firestore database instance:', firestoreDatabase)
  console.log('🔥 Firestore database app:', firestoreDatabase.app?.name)

  // Set up replication for boards collection
  // Create collection reference - RxDB will validate it internally
  let boardsFirestoreCollection
  try {
    boardsFirestoreCollection = collection(firestoreDatabase, 'boards')
    console.log('✅ Boards collection reference created')
  } catch (error) {
    console.error('❌ Failed to create boards collection reference:', error)
    throw error
  }
  
  try {
    boardsReplication = replicateFirestore<Board>({
      replicationIdentifier: `https://firestore.googleapis.com/${projectId}/boards`,
      collection: database.boards,
      firestore: {
        projectId,
        database: firestoreDatabase,
        // Type assertion needed because RxDB expects a specific Firestore collection type
        collection: boardsFirestoreCollection as CollectionReference<Board>,
      },
      pull: {},
      push: {},
      live: true,
      serverTimestampField: 'serverTimestamp',
    })
    console.log('✅ Boards replication created successfully')
  } catch (error) {
    console.error('❌ Failed to create boards replication:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    throw error
  }

  // Monitor boards replication status
  boardsReplication.active$.subscribe((active) => {
    console.log('📊 Boards replication active:', active)
  })
  boardsReplication.received$.subscribe((received) => {
    console.log('📥 Boards replication received:', received)
  })
  boardsReplication.sent$.subscribe((sent) => {
    console.log('📤 Boards replication sent:', sent)
  })
  boardsReplication.error$.subscribe((error) => {
    if (error) {
      console.error('❌ Boards replication error:', error)
    }
  })

  // Start replication explicitly
  boardsReplication.start().catch((error) => {
    console.error('❌ Failed to start boards replication:', error)
  })

  // Set up replication for columns collection
  let columnsFirestoreCollection
  try {
    columnsFirestoreCollection = collection(firestoreDatabase, 'columns')
    console.log('✅ Columns collection reference created')
  } catch (error) {
    console.error('❌ Failed to create columns collection reference:', error)
    throw error
  }
  
  try {
    columnsReplication = replicateFirestore<Column>({
      replicationIdentifier: `https://firestore.googleapis.com/${projectId}/columns`,
      collection: database.columns,
      firestore: {
        projectId,
        database: firestoreDatabase,
        // Type assertion needed because RxDB expects a specific Firestore collection type
        collection: columnsFirestoreCollection as CollectionReference<Column>,
      },
      pull: {},
      push: {},
      live: true,
      serverTimestampField: 'serverTimestamp',
    })
    console.log('✅ Columns replication created successfully')
  } catch (error) {
    console.error('❌ Failed to create columns replication:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    throw error
  }

  // Monitor columns replication status
  columnsReplication.active$.subscribe((active) => {
    console.log('📊 Columns replication active:', active)
  })
  columnsReplication.received$.subscribe((received) => {
    console.log('📥 Columns replication received:', received)
  })
  columnsReplication.sent$.subscribe((sent) => {
    console.log('📤 Columns replication sent:', sent)
  })
  columnsReplication.error$.subscribe((error) => {
    if (error) {
      console.error('❌ Columns replication error:', error)
    }
  })

  // Start replication explicitly
  columnsReplication.start().catch((error) => {
    console.error('❌ Failed to start columns replication:', error)
  })

  console.log('✅ Firestore replication setup complete')

  return {
    boardsReplication: boardsReplication!,
    columnsReplication: columnsReplication!,
  }
}

export function cancelReplication(): void {
  if (boardsReplication) {
    boardsReplication.cancel()
    boardsReplication = null
  }
  if (columnsReplication) {
    columnsReplication.cancel()
    columnsReplication = null
  }
}

export function getReplicationStates(): {
  boards: RxFirestoreReplicationState<Board> | null
  columns: RxFirestoreReplicationState<Column> | null
} {
  return {
    boards: boardsReplication,
    columns: columnsReplication,
  }
}

export async function waitForInitialReplication(): Promise<void> {
  if (boardsReplication) {
    await boardsReplication.awaitInitialReplication()
    console.log('✅ Boards initial replication complete')
  }
  if (columnsReplication) {
    await columnsReplication.awaitInitialReplication()
    console.log('✅ Columns initial replication complete')
  }
}

