import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { TrelloDatabase } from '../../../src/lib/db/database'
import { cancelReplication, getReplicationStates } from '../../../src/lib/db/replication'
import { createTestDatabase } from './test-helpers'

// Mock Firebase config
const mockFirestoreDatabase = {
  app: {
    name: '[DEFAULT]',
    options: {
      projectId: 'test-project',
    },
  },
}

// Mock RxDB's replicateFirestore function
vi.mock('rxdb/plugins/replication-firestore', () => ({
  replicateFirestore: vi.fn((options: any) => {
      const activeSubject = { subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })) }
      const receivedSubject = { subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })) }
      const sentSubject = { subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })) }
      const errorSubject = { subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })) }
      
      return {
        collection: options.collection,
        active$: activeSubject,
        received$: receivedSubject,
        sent$: sentSubject,
        error$: errorSubject,
        cancel: vi.fn(),
        start: vi.fn().mockResolvedValue(undefined),
        replicationIdentifierHash: 'test-hash',
        live: options.live ?? true,
        firestore: {
          projectId: options.firestore.projectId,
          database: options.firestore.database,
          collection: options.firestore.collection,
        },
      }
    }),
}))

// Mock Firebase Firestore collection
vi.mock('firebase/firestore', () => ({
  collection: vi.fn((db, collectionName) => ({
    id: collectionName,
    path: collectionName,
    parent: null,
    type: 'collection',
    firestore: db,
  })),
  getFirestore: vi.fn(),
}))

vi.mock('../../../src/lib/firebase/config', () => ({
  getFirestoreDatabase: vi.fn(() => mockFirestoreDatabase),
  initFirebase: vi.fn(() => ({
    app: {
      name: '[DEFAULT]',
      options: {
        projectId: 'test-project',
      },
    },
    firestore: mockFirestoreDatabase,
  })),
}))

describe('Firestore Replication', () => {
  let db: TrelloDatabase

  beforeEach(async () => {
    db = await createTestDatabase()
    import.meta.env.VITE_FIREBASE_PROJECT_ID = 'test-project'
  })

  afterEach(async () => {
    cancelReplication()
    if (db && typeof db.remove === 'function') {
      await db.remove()
    }
    delete import.meta.env.VITE_FIREBASE_PROJECT_ID
  })

  describe('setupFirestoreReplication', () => {
    let setupFirestoreReplication: typeof import('../../../src/lib/db/replication').setupFirestoreReplication

    beforeEach(async () => {
      const module = await import('../../../src/lib/db/replication')
      setupFirestoreReplication = module.setupFirestoreReplication
    })

    it('throws error when VITE_FIREBASE_PROJECT_ID is not set', () => {
      delete import.meta.env.VITE_FIREBASE_PROJECT_ID
      expect(() => {
        setupFirestoreReplication(db)
      }).toThrow('VITE_FIREBASE_PROJECT_ID is not set in environment variables')
    })

    it('creates replication state for boards collection', () => {
      const replication = setupFirestoreReplication(db)
      
      expect(replication.boardsReplication).toBeTruthy()
      expect(replication.boardsReplication.collection).toBe(db.boards)
      expect(replication.boardsReplication).toHaveProperty('active$')
      expect(replication.boardsReplication).toHaveProperty('received$')
      expect(replication.boardsReplication).toHaveProperty('sent$')
      expect(replication.boardsReplication).toHaveProperty('error$')
      expect(replication.boardsReplication).toHaveProperty('cancel')
      expect(replication.boardsReplication).toHaveProperty('start')
    })

    it('creates replication state for columns collection', () => {
      const replication = setupFirestoreReplication(db)
      
      expect(replication.columnsReplication).toBeTruthy()
      expect(replication.columnsReplication.collection).toBe(db.columns)
      expect(replication.columnsReplication).toHaveProperty('active$')
      expect(replication.columnsReplication).toHaveProperty('received$')
      expect(replication.columnsReplication).toHaveProperty('sent$')
      expect(replication.columnsReplication).toHaveProperty('error$')
      expect(replication.columnsReplication).toHaveProperty('cancel')
      expect(replication.columnsReplication).toHaveProperty('start')
    })

    it('creates Firestore collection references with correct names', async () => {
      const { collection } = await import('firebase/firestore')
      setupFirestoreReplication(db)
      
      expect(collection).toHaveBeenCalledWith(mockFirestoreDatabase, 'boards')
      expect(collection).toHaveBeenCalledWith(mockFirestoreDatabase, 'columns')
    })

    it('uses correct replication identifier format', () => {
      const replication = setupFirestoreReplication(db)
      
      // Check that replication identifier includes project ID
      expect(replication.boardsReplication.replicationIdentifierHash).toBeTruthy()
      expect(replication.columnsReplication.replicationIdentifierHash).toBeTruthy()
    })

    it('configures replication with correct options', () => {
      const replication = setupFirestoreReplication(db)
      
      // Verify replication is configured with live mode
      expect(replication.boardsReplication.live).toBe(true)
      expect(replication.columnsReplication.live).toBe(true)
      
      // Verify firestore options are set
      expect(replication.boardsReplication.firestore).toBeTruthy()
      expect(replication.boardsReplication.firestore.projectId).toBe('test-project')
      expect(replication.boardsReplication.firestore.database).toBe(mockFirestoreDatabase)
      
      expect(replication.columnsReplication.firestore).toBeTruthy()
      expect(replication.columnsReplication.firestore.projectId).toBe('test-project')
      expect(replication.columnsReplication.firestore.database).toBe(mockFirestoreDatabase)
    })
  })

  describe('getReplicationStates', () => {
    let setupFirestoreReplication: typeof import('../../../src/lib/db/replication').setupFirestoreReplication

    beforeEach(async () => {
      const module = await import('../../../src/lib/db/replication')
      setupFirestoreReplication = module.setupFirestoreReplication
    })

    it('returns null when replication is not initialized', () => {
      const states = getReplicationStates()
      expect(states.boards).toBeNull()
      expect(states.columns).toBeNull()
    })

    it('returns replication states after setup', () => {
      setupFirestoreReplication(db)
      const states = getReplicationStates()
      
      expect(states.boards).toBeTruthy()
      expect(states.columns).toBeTruthy()
      expect(states.boards?.collection).toBe(db.boards)
      expect(states.columns?.collection).toBe(db.columns)
    })
  })

  describe('cancelReplication', () => {
    let setupFirestoreReplication: typeof import('../../../src/lib/db/replication').setupFirestoreReplication

    beforeEach(async () => {
      const module = await import('../../../src/lib/db/replication')
      setupFirestoreReplication = module.setupFirestoreReplication
    })

    it('handles cancel when replication is not set up', () => {
      expect(() => cancelReplication()).not.toThrow()
    })

    it('cancels boards replication when set up', () => {
      const replication = setupFirestoreReplication(db)
      const cancelSpy = vi.spyOn(replication.boardsReplication, 'cancel')
      
      cancelReplication()
      
      expect(cancelSpy).toHaveBeenCalled()
    })

    it('cancels columns replication when set up', () => {
      const replication = setupFirestoreReplication(db)
      const cancelSpy = vi.spyOn(replication.columnsReplication, 'cancel')
      
      cancelReplication()
      
      expect(cancelSpy).toHaveBeenCalled()
    })

    it('clears replication states after cancel', () => {
      setupFirestoreReplication(db)
      cancelReplication()
      
      const states = getReplicationStates()
      expect(states.boards).toBeNull()
      expect(states.columns).toBeNull()
    })
  })

  describe('replication observables', () => {
    let setupFirestoreReplication: typeof import('../../../src/lib/db/replication').setupFirestoreReplication

    beforeEach(async () => {
      const module = await import('../../../src/lib/db/replication')
      setupFirestoreReplication = module.setupFirestoreReplication
    })

    it('boards replication has all required observables', () => {
      const replication = setupFirestoreReplication(db)
      
      expect(replication.boardsReplication.active$).toBeDefined()
      expect(replication.boardsReplication.received$).toBeDefined()
      expect(replication.boardsReplication.sent$).toBeDefined()
      expect(replication.boardsReplication.error$).toBeDefined()
    })

    it('columns replication has all required observables', () => {
      const replication = setupFirestoreReplication(db)
      
      expect(replication.columnsReplication.active$).toBeDefined()
      expect(replication.columnsReplication.received$).toBeDefined()
      expect(replication.columnsReplication.sent$).toBeDefined()
      expect(replication.columnsReplication.error$).toBeDefined()
    })

    it('can subscribe to replication observables', () => {
      const replication = setupFirestoreReplication(db)
      
      const activeSub = replication.boardsReplication.active$.subscribe(() => {})
      const receivedSub = replication.boardsReplication.received$.subscribe(() => {})
      const sentSub = replication.boardsReplication.sent$.subscribe(() => {})
      const errorSub = replication.boardsReplication.error$.subscribe(() => {})
      
      expect(activeSub).toBeTruthy()
      expect(receivedSub).toBeTruthy()
      expect(sentSub).toBeTruthy()
      expect(errorSub).toBeTruthy()
      
      activeSub.unsubscribe()
      receivedSub.unsubscribe()
      sentSub.unsubscribe()
      errorSub.unsubscribe()
    })
  })
})

describe('Replication Integration with Database Init', () => {
  it('skips replication setup when testDatabase is provided', async () => {
    const { initDatabase, cleanupDatabase } = await import('../../../src/lib/db/init') // Dynamic import to avoid circular dependency
    const testDb = await createTestDatabase()
    
    // Should not throw even if Firebase is not configured
    const db = await initDatabase(testDb)
    expect(db).toBeTruthy()
    
    // Replication should not be set up in test environment
    const states = getReplicationStates()
    expect(states.boards).toBeNull()
    expect(states.columns).toBeNull()
    
    await cleanupDatabase()
  })
})
