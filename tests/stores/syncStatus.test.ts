import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useSyncStatusStore, initSyncStatusMonitoring, SyncStatus } from '../../src/stores/syncStatus'
import * as replicationModule from '../../src/lib/db/localdb-firestore-sync'

// Mock replication module
vi.mock('../../src/lib/db/localdb-firestore-sync', () => ({
  getReplicationStates: vi.fn(),
}))

  // Mock auth store
const mockAuthState = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  setUser: vi.fn(),
  setLoading: vi.fn(),
}

vi.mock('../../src/stores/auth', () => ({
  useAuthStore: Object.assign(
    vi.fn((selector: any) => selector(mockAuthState)),
    {
      getState: () => mockAuthState,
      subscribe: vi.fn(() => {
        // Return unsubscribe function
        return () => {}
      }),
    }
  ),
}))

// Track cleanup function to ensure proper cleanup
let cleanupFn: (() => void) | null = null

describe('SyncStatus Store', () => {
  beforeEach(() => {
    // Clean up any previous monitoring
    if (cleanupFn) {
      try {
        cleanupFn()
      } catch {
        // Ignore errors during cleanup
      }
      cleanupFn = null
    }
    
    // Reset store state
    useSyncStatusStore.setState({
      status: SyncStatus.DISABLED,
    })
    
    // Reset mocks
    vi.clearAllMocks()
    vi.spyOn(replicationModule, 'getReplicationStates').mockReturnValue({
      boards: null,
      columns: null,
      cards: null,
    })
    
    // Reset auth state
    mockAuthState.isAuthenticated = false
    mockAuthState.isLoading = false
    
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    })
  })

  afterEach(() => {
    // Clean up monitoring
    if (cleanupFn) {
      try {
        cleanupFn()
      } catch {
        // Ignore errors during cleanup
      }
      cleanupFn = null
    }
  })

  describe('Store State', () => {
    it('initializes with default state', () => {
      const state = useSyncStatusStore.getState()
      expect(state.status).toBe(SyncStatus.DISABLED)
    })

    it('sets sync status', () => {
      useSyncStatusStore.getState().setStatus(SyncStatus.SYNCING)
      expect(useSyncStatusStore.getState().status).toBe(SyncStatus.SYNCING)
    })
  })

  describe('initSyncStatusMonitoring', () => {
    it('sets status to disabled when not authenticated', () => {
      mockAuthState.isAuthenticated = false
      vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project')
      
      cleanupFn = initSyncStatusMonitoring()
      
      expect(useSyncStatusStore.getState().status).toBe(SyncStatus.DISABLED)
    })

    it('sets status to disabled when no Firebase', () => {
      mockAuthState.isAuthenticated = true
      vi.stubEnv('VITE_FIREBASE_PROJECT_ID', undefined)
      
      cleanupFn = initSyncStatusMonitoring()
      
      expect(useSyncStatusStore.getState().status).toBe(SyncStatus.DISABLED)
    })

    it('sets status to offline when browser is offline', () => {
      mockAuthState.isAuthenticated = true
      vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project')
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      })
      
      cleanupFn = initSyncStatusMonitoring()
      
      expect(useSyncStatusStore.getState().status).toBe(SyncStatus.OFFLINE)
    })

    it('sets status to disabled when no replication states available', () => {
      mockAuthState.isAuthenticated = true
      vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project')
      vi.spyOn(replicationModule, 'getReplicationStates').mockReturnValue({
        boards: null,
        columns: null,
        cards: null,
      })
      
      cleanupFn = initSyncStatusMonitoring()
      
      expect(useSyncStatusStore.getState().status).toBe(SyncStatus.DISABLED)
    })

    it('subscribes to replication states when available', () => {
      mockAuthState.isAuthenticated = true
      vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project')
      
      // Create mock observables
      const mockActive$ = {
        subscribe: vi.fn((callback: (value: boolean) => void) => {
          // Simulate initial value
          callback(false)
          return { unsubscribe: vi.fn() }
        }),
      }
      
      const mockError$ = {
        subscribe: vi.fn((callback: (error: unknown) => void) => {
          callback(null)
          return { unsubscribe: vi.fn() }
        }),
      }
      
      const mockReplicationState = {
        active$: mockActive$,
        error$: mockError$,
      }
      
      vi.spyOn(replicationModule, 'getReplicationStates').mockReturnValue({
        boards: mockReplicationState as any,
        columns: null,
        cards: null,
      })
      
      cleanupFn = initSyncStatusMonitoring()
      
      // Verify subscriptions were set up
      expect(mockActive$.subscribe).toHaveBeenCalled()
      expect(mockError$.subscribe).toHaveBeenCalled()
    })

    it('updates status to syncing when replication is active', () => {
      mockAuthState.isAuthenticated = true
      vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project')
      
      const callbacks: Array<(value: boolean) => void> = []
      const mockActive$ = {
        subscribe: vi.fn((callback: (value: boolean) => void) => {
          callbacks.push(callback)
          callback(false) // Initial value
          return { unsubscribe: vi.fn() }
        }),
      }
      
      const mockError$ = {
        subscribe: vi.fn((callback: (error: unknown) => void) => {
          callback(null)
          return { unsubscribe: vi.fn() }
        }),
      }
      
      const mockReplicationState = {
        active$: mockActive$,
        error$: mockError$,
      }
      
      vi.spyOn(replicationModule, 'getReplicationStates').mockReturnValue({
        boards: mockReplicationState as any,
        columns: null,
        cards: null,
      })
      
      cleanupFn = initSyncStatusMonitoring()
      
      // Simulate replication becoming active
      callbacks.forEach((cb) => cb(true))
      
      expect(useSyncStatusStore.getState().status).toBe(SyncStatus.SYNCING)
    })

    it('updates status to error when replication has error', () => {
      mockAuthState.isAuthenticated = true
      vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project')
      
      const errorCallbacks: Array<(error: unknown) => void> = []
      const mockActive$ = {
        subscribe: vi.fn((callback: (value: boolean) => void) => {
          callback(false)
          return { unsubscribe: vi.fn() }
        }),
      }
      
      const mockError$ = {
        subscribe: vi.fn((callback: (error: unknown) => void) => {
          errorCallbacks.push(callback)
          callback(null) // Initial value
          return { unsubscribe: vi.fn() }
        }),
      }
      
      const mockReplicationState = {
        active$: mockActive$,
        error$: mockError$,
      }
      
      vi.spyOn(replicationModule, 'getReplicationStates').mockReturnValue({
        boards: mockReplicationState as any,
        columns: null,
        cards: null,
      })
      
      cleanupFn = initSyncStatusMonitoring()
      
      // Simulate replication error
      errorCallbacks.forEach((cb) => cb(new Error('Replication error')))
      
      expect(useSyncStatusStore.getState().status).toBe(SyncStatus.ERROR)
    })

    it('handles browser online/offline events', () => {
      mockAuthState.isAuthenticated = true
      vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project')
      
      cleanupFn = initSyncStatusMonitoring()
      
      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      })
      window.dispatchEvent(new Event('offline'))
      
      expect(useSyncStatusStore.getState().status).toBe(SyncStatus.OFFLINE)
      
      // Simulate going online
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      })
      window.dispatchEvent(new Event('online'))
      
      // After going online, status should update based on replication state
      // Since we have no replication states in this test, it will be DISABLED
      expect(useSyncStatusStore.getState().status).toBe(SyncStatus.DISABLED)
    })

    it('cleans up subscriptions on cleanup', () => {
      mockAuthState.isAuthenticated = true
      vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project')
      
      const unsubscribeActive = vi.fn()
      const unsubscribeError = vi.fn()
      
      const mockActive$ = {
        subscribe: vi.fn(() => ({ unsubscribe: unsubscribeActive })),
      }
      
      const mockError$ = {
        subscribe: vi.fn(() => ({ unsubscribe: unsubscribeError })),
      }
      
      const mockReplicationState = {
        active$: mockActive$,
        error$: mockError$,
      }
      
      vi.spyOn(replicationModule, 'getReplicationStates').mockReturnValue({
        boards: mockReplicationState as any,
        columns: null,
        cards: null,
      })
      
      cleanupFn = initSyncStatusMonitoring()
      cleanupFn()
      
      expect(unsubscribeActive).toHaveBeenCalled()
      expect(unsubscribeError).toHaveBeenCalled()
    })

  })

})

