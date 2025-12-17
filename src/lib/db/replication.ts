import { replicateFirestore, type RxFirestoreReplicationState } from 'rxdb/plugins/replication-firestore'
import { collection, where, type CollectionReference } from 'firebase/firestore'
import type { TrelloDatabase } from './database'
import { getFirestoreDatabase } from '../firebase/config'
import { useAuthStore } from '@/stores/auth'
import type { Board } from '../types/board'
import type { Column } from '../types/column'
import type { Card } from '../types/card'

let boardsReplication: RxFirestoreReplicationState<Board> | null = null
let columnsReplication: RxFirestoreReplicationState<Column> | null = null
let cardsReplication: RxFirestoreReplicationState<Card> | null = null

export function setupFirestoreReplication(
  database: TrelloDatabase
): {
  boardsReplication: RxFirestoreReplicationState<Board>
  columnsReplication: RxFirestoreReplicationState<Column>
  cardsReplication: RxFirestoreReplicationState<Card>
} {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID
  const firestoreDatabase = getFirestoreDatabase()

  if (!projectId) {
    throw new Error('VITE_FIREBASE_PROJECT_ID is not set in environment variables')
  }

  // Get current user ID for filtering - must be authenticated
  const currentUserId = useAuthStore.getState().user?.uid
  if (!currentUserId) {
    throw new Error('Cannot setup Firestore replication without authenticated user')
  }
  console.log('🔥 Setting up Firestore replication for user:', currentUserId)
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
      pull: {
        filter: [where('accessibleUserIds', 'array-contains', currentUserId)]
      },
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
      pull: {
        filter: [where('accessibleUserIds', 'array-contains', currentUserId)]
      },
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

  // Set up replication for cards collection
  let cardsFirestoreCollection
  try {
    cardsFirestoreCollection = collection(firestoreDatabase, 'cards')
    console.log('✅ Cards collection reference created')
  } catch (error) {
    console.error('❌ Failed to create cards collection reference:', error)
    throw error
  }
  
  try {
    cardsReplication = replicateFirestore<Card>({
      replicationIdentifier: `https://firestore.googleapis.com/${projectId}/cards`,
      collection: database.cards,
      firestore: {
        projectId,
        database: firestoreDatabase,
        collection: cardsFirestoreCollection as CollectionReference<Card>,
      },
      pull: {
        filter: [where('accessibleUserIds', 'array-contains', currentUserId)]
      },
      push: {},
      live: true,
      serverTimestampField: 'serverTimestamp',
    })
    console.log('✅ Cards replication created successfully')
  } catch (error) {
    console.error('❌ Failed to create cards replication:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    throw error
  }

  // Monitor cards replication status
  cardsReplication.active$.subscribe((active) => {
    console.log('📊 Cards replication active:', active)
  })
  cardsReplication.received$.subscribe((received) => {
    console.log('📥 Cards replication received:', received)
  })
  cardsReplication.sent$.subscribe((sent) => {
    console.log('📤 Cards replication sent:', sent)
  })
  cardsReplication.error$.subscribe((error) => {
    if (error) {
      console.error('❌ Cards replication error:', error)
    }
  })

  // Start replication explicitly
  cardsReplication.start().catch((error) => {
    console.error('❌ Failed to start cards replication:', error)
  })

  console.log('✅ Firestore replication setup complete')

  return {
    boardsReplication: boardsReplication!,
    columnsReplication: columnsReplication!,
    cardsReplication: cardsReplication!,
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
  if (cardsReplication) {
    cardsReplication.cancel()
    cardsReplication = null
  }
}

export function getReplicationStates(): {
  boards: RxFirestoreReplicationState<Board> | null
  columns: RxFirestoreReplicationState<Column> | null
  cards: RxFirestoreReplicationState<Card> | null
} {
  return {
    boards: boardsReplication,
    columns: columnsReplication,
    cards: cardsReplication,
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
  if (cardsReplication) {
    await cardsReplication.awaitInitialReplication()
    console.log('✅ Cards initial replication complete')
  }
}

