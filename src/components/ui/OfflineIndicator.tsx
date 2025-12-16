import { useState, useEffect, useRef } from 'react'
import { Wifi, WifiOff, CloudOff, AlertCircle, Loader2 } from 'lucide-react'
import { getReplicationStates } from '@/lib/db/replication'
import { useAuthStore } from '@/stores/auth'

type SyncStatus = 'online' | 'offline' | 'syncing' | 'synced' | 'error' | 'disabled'

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('disabled')
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const hasFirebase = !!import.meta.env.VITE_FIREBASE_PROJECT_ID

  useEffect(() => {
    // Monitor browser online/offline status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const stateRef = useRef({ hasActive: false, hasError: false })

  useEffect(() => {
    // Monitor RxDB replication states if Firebase is enabled and user is authenticated
    if (!hasFirebase || !isAuthenticated) {
      setSyncStatus('disabled')
      return
    }

    if (!isOnline) {
      setSyncStatus('offline')
      return
    }

    const replicationStates = getReplicationStates()
    const states = [replicationStates.boards, replicationStates.columns, replicationStates.cards].filter(Boolean)

    if (states.length === 0) {
      setSyncStatus('disabled')
      return
    }

    // Reset state
    stateRef.current = { hasActive: false, hasError: false }

    // Subscribe to replication state changes
    const subscriptions: Array<() => void> = []

    const updateStatus = () => {
      if (stateRef.current.hasError) {
        setSyncStatus('error')
      } else if (stateRef.current.hasActive) {
        setSyncStatus('syncing')
      } else {
        setSyncStatus('offline')
      }
    }

    states.forEach((state) => {
      const activeSub = state!.active$.subscribe((active) => {
        stateRef.current.hasActive = active
        updateStatus()
      })

      const errorSub = state!.error$.subscribe((error) => {
        stateRef.current.hasError = !!error
        updateStatus()
      })

      subscriptions.push(() => {
        activeSub.unsubscribe()
        errorSub.unsubscribe()
      })
    })

    return () => {
      subscriptions.forEach((unsub) => unsub())
    }
  }, [isOnline, isAuthenticated, hasFirebase])

  // Determine overall status
  const getStatus = (): { status: SyncStatus; icon: React.ReactNode; color: string; label: string } => {
    if (!hasFirebase || !isAuthenticated) {
      return {
        status: 'disabled',
        icon: <CloudOff className="h-4 w-4" />,
        color: 'text-gray-400',
        label: 'Sync disabled (not authenticated)',
      }
    }

    if (!isOnline) {
      return {
        status: 'offline',
        icon: <WifiOff className="h-4 w-4" />,
        color: 'text-red-500',
        label: 'Offline - Changes will sync when online',
      }
    }

    if (syncStatus === 'error') {
      return {
        status: 'error',
        icon: <AlertCircle className="h-4 w-4" />,
        color: 'text-red-500',
        label: 'Sync error - Check connection',
      }
    }

    if (syncStatus === 'syncing') {
      return {
        status: 'syncing',
        icon: <Loader2 className="h-4 w-4 animate-spin" />,
        color: 'text-yellow-500',
        label: 'Syncing...',
      }
    }

    return {
      status: 'online',
      icon: <Wifi className="h-4 w-4" />,
      color: 'text-green-500',
      label: 'Online',
    }
  }

  const { icon, color, label } = getStatus()

  return (
    <div className="flex items-center gap-2" title={label}>
      <div className={`${color} transition-colors`}>{icon}</div>
      <span className="text-xs text-gray-600 hidden sm:inline">{label}</span>
    </div>
  )
}

