import { create } from 'zustand'
import { getReplicationStates } from '@/lib/db/replication'
import { useAuthStore } from './auth'

export const SyncStatus = {
  DISABLED: 'DISABLED',// No Firebase or not authenticated
  OFFLINE: 'OFFLINE',// Browser is offline
  SYNCING: 'SYNCING',// Replication is active
  ERROR: 'ERROR',// Replication has error
  ONLINE: 'ONLINE',// Everything is working
} as const

export type SyncStatus = typeof SyncStatus[keyof typeof SyncStatus]

interface SyncStatusState {
  status: SyncStatus
  setStatus: (status: SyncStatus) => void
}

export const useSyncStatusStore = create<SyncStatusState>((set) => ({
  status: SyncStatus.DISABLED,
  setStatus: (status) => set({ status }),
}))

let replicationSubscriptions: Array<() => void> = []
let isMonitoring = false

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
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true

    console.log('📊 Sync status check:', { isAuthenticated, hasFirebase, isOnline })

    if (!hasFirebase || !isAuthenticated) {
      useSyncStatusStore.getState().setStatus(SyncStatus.DISABLED)
      return
    }

    if (!isOnline) {
      useSyncStatusStore.getState().setStatus(SyncStatus.OFFLINE)
      return
    }

    const replicationStates = getReplicationStates()
    const states = [replicationStates.boards, replicationStates.columns, replicationStates.cards].filter(Boolean)

    if (states.length === 0) {
      useSyncStatusStore.getState().setStatus(SyncStatus.DISABLED)
      return
    }

    states.forEach((state) => {
      const activeSub = state!.active$.subscribe((active) => {
        if(active) {
          useSyncStatusStore.getState().setStatus(SyncStatus.SYNCING)
        } else {
          useSyncStatusStore.getState().setStatus(SyncStatus.ONLINE)
        }
      })

      const errorSub = state!.error$.subscribe((error) => {
        if(error) {
          useSyncStatusStore.getState().setStatus(SyncStatus.ERROR)
        } else {
          useSyncStatusStore.getState().setStatus(SyncStatus.ONLINE)
        }
      })

      replicationSubscriptions.push(() => {
        activeSub.unsubscribe()
        errorSub.unsubscribe()
      })
    })

    // Initial status update
    console.log('🔄 Initial status update')
  }

  // Monitor browser online/offline
  const handleOnline = () => {
    updateSyncStatus()
  }
  
  const handleOffline = () => {
    useSyncStatusStore.getState().setStatus(SyncStatus.OFFLINE)
  }

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  // Subscribe to auth changes to reinitialize
  const authUnsubscribe = useAuthStore.subscribe(() => {
    updateSyncStatus()
  })

  // Initial update
  updateSyncStatus()
  
  const cleanup = () => {
    isMonitoring = false
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
    replicationSubscriptions.forEach((unsub) => unsub())
    replicationSubscriptions = []
    authUnsubscribe()
  }

  return cleanup
}
