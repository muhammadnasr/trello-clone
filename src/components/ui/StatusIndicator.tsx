import { Wifi, WifiOff, CloudOff, AlertCircle, Loader2 } from 'lucide-react'
import { useSyncStatusStore } from '@/stores/syncStatus'
import { useAuthStore } from '@/stores/auth'

export function StatusIndicator() {
  const syncStatus = useSyncStatusStore((state) => state.syncStatus)
  const isOnline = useSyncStatusStore((state) => state.isOnline)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const hasFirebase = !!import.meta.env.VITE_FIREBASE_PROJECT_ID

  // Determine overall status
  const getStatus = (): { icon: React.ReactNode; color: string; label: string } => {
    if (!hasFirebase || !isAuthenticated) {
      return {
        icon: <CloudOff className="h-4 w-4" />,
        color: 'text-gray-400',
        label: 'Sync disabled (not authenticated)',
      }
    }

    if (!isOnline) {
      return {
        icon: <WifiOff className="h-4 w-4" />,
        color: 'text-red-500',
        label: 'Offline - Changes will sync when online',
      }
    }

    if (syncStatus === 'error') {
      return {
        icon: <AlertCircle className="h-4 w-4" />,
        color: 'text-red-500',
        label: 'Sync error - Check connection',
      }
    }

    if (syncStatus === 'syncing') {
      return {
        icon: <Loader2 className="h-4 w-4 animate-spin" />,
        color: 'text-yellow-500',
        label: 'Syncing...',
      }
    }

    return {
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
