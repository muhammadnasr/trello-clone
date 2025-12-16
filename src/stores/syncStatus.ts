import { create } from 'zustand'
import { getReplicationStates } from '@/lib/db/replication'
import { useAuthStore } from './auth'

type SyncStatus = 'online' | 'offline' | 'syncing' | 'error' | 'disabled'

interface SyncStatusState {
  syncStatus: SyncStatus
  isOnline: boolean
  setSyncStatus: (status: SyncStatus) => void
  setIsOnline: (online: boolean) => void
}

export const useSyncStatusStore = create<SyncStatusState>((set) => ({
  syncStatus: 'disabled',
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  setSyncStatus: (status) => set({ syncStatus: status }),
  setIsOnline: (online) => set({ isOnline: online }),
}))

let replicationSubscriptions: Array<() => void> = []
let isMonitoring = false
const stateRef = { hasActive: false, hasError: false }
let updateSyncStatusFn: (() => void) | null = null

/**
 * Initialize sync status monitoring.
 * Should be called once when the app starts (after Firebase is initialized).
 */
export function initSyncStatusMonitoring(): () => void {
  if (isMonitoring) {
    // Return cleanup function if already monitoring
    return () => {
      cleanup()
    }
  }

  isMonitoring = true

  // Monitor RxDB replication states
  const updateSyncStatus = () => {
    console.log('🔄 updateSyncStatus called')
    
    // Clean up previous subscriptions
    replicationSubscriptions.forEach((unsub) => unsub())
    replicationSubscriptions = []

    const isAuthenticated = useAuthStore.getState().isAuthenticated
    const hasFirebase = !!import.meta.env.VITE_FIREBASE_PROJECT_ID
    const isOnline = useSyncStatusStore.getState().isOnline

    console.log('📊 Sync status check:', { isAuthenticated, hasFirebase, isOnline })

    if (!hasFirebase || !isAuthenticated) {
      console.log('❌ Sync disabled: no Firebase or not authenticated')
      useSyncStatusStore.getState().setSyncStatus('disabled')
      return
    }

    if (!isOnline) {
      console.log('❌ Sync offline: browser is offline')
      useSyncStatusStore.getState().setSyncStatus('offline')
      return
    }

    const replicationStates = getReplicationStates()
    const states = [replicationStates.boards, replicationStates.columns, replicationStates.cards].filter(Boolean)

    console.log('📦 Replication states found:', {
      boards: !!replicationStates.boards,
      columns: !!replicationStates.columns,
      cards: !!replicationStates.cards,
      totalStates: states.length,
    })

    if (states.length === 0) {
      console.log('❌ Sync disabled: no replication states available')
      useSyncStatusStore.getState().setSyncStatus('disabled')
      return
    }

    // Reset state
    stateRef.hasActive = false
    stateRef.hasError = false
    console.log('🔄 Reset stateRef:', { hasActive: stateRef.hasActive, hasError: stateRef.hasError })

    const updateStatus = () => {
      console.log('🔄 updateStatus called, stateRef:', { hasActive: stateRef.hasActive, hasError: stateRef.hasError })
      
      if (stateRef.hasError) {
        console.log('❌ Setting status to error')
        useSyncStatusStore.getState().setSyncStatus('error')
      } else if (stateRef.hasActive) {
        console.log('🔄 Setting status to syncing')
        useSyncStatusStore.getState().setSyncStatus('syncing')
      } else {
        console.log('📴 Setting status to offline')
        useSyncStatusStore.getState().setSyncStatus('offline')
      }
    }

    states.forEach((state, index) => {
      const stateName = ['boards', 'columns', 'cards'][index] || `state-${index}`
      console.log(`📡 Subscribing to ${stateName} replication state`)

      const activeSub = state!.active$.subscribe((active) => {
        console.log(`📡 ${stateName} active$ emitted:`, active)
        stateRef.hasActive = active
        updateStatus()
      })

      const errorSub = state!.error$.subscribe((error) => {
        console.log(`📡 ${stateName} error$ emitted:`, error)
        stateRef.hasError = !!error
        updateStatus()
      })

      replicationSubscriptions.push(() => {
        activeSub.unsubscribe()
        errorSub.unsubscribe()
      })
    })

    // Initial status update
    console.log('🔄 Initial status update')
    updateStatus()
  }

  // Monitor browser online/offline
  const handleOnline = () => {
    useSyncStatusStore.getState().setIsOnline(true)
    updateSyncStatus()
  }
  
  const handleOffline = () => {
    useSyncStatusStore.getState().setIsOnline(false)
    useSyncStatusStore.getState().setSyncStatus('offline')
  }

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  // Subscribe to auth changes to reinitialize
  const authUnsubscribe = useAuthStore.subscribe(() => {
    updateSyncStatus()
  })

  // Initial update
  updateSyncStatus()
  
  // Store the function so it can be called externally
  updateSyncStatusFn = updateSyncStatus

  const cleanup = () => {
    isMonitoring = false
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
    replicationSubscriptions.forEach((unsub) => unsub())
    replicationSubscriptions = []
    stateRef.hasActive = false
    stateRef.hasError = false
    authUnsubscribe()
  }

  return cleanup
}

/**
 * Trigger a sync status update manually.
 * Useful when replication is set up after monitoring has started.
 */
export function triggerSyncStatusUpdate(): void {
  if (updateSyncStatusFn) {
    console.log('🔄 Manually triggering sync status update')
    updateSyncStatusFn()
  } else {
    console.warn('⚠️ Sync status monitoring not initialized yet')
  }
}

