import { Wifi, WifiOff, CloudOff, AlertCircle, Loader2 } from 'lucide-react'
import { useSyncStatusStore, SyncStatus } from '@/stores/syncStatus'

export function StatusIndicator() {
  const status = useSyncStatusStore((state) => state.status)

  // Determine overall status based on sync status enum
  const getStatus = (): { icon: React.ReactNode; color: string; label: string } => {
    switch (status) {
      case SyncStatus.OFFLINE:
        return {
          icon: <WifiOff className="h-4 w-4" />,
          color: 'text-red-500',
          label: 'Offline - Changes will sync when online',
        }
      case SyncStatus.ERROR:
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          color: 'text-red-500',
          label: 'Sync error - Check connection',
        }
      case SyncStatus.SYNCING:
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          color: 'text-yellow-500',
          label: 'Syncing...',
        }
      case SyncStatus.ONLINE:
        return {
          icon: <Wifi className="h-4 w-4" />,
          color: 'text-green-500',
          label: 'Online',
        }
      case SyncStatus.DISABLED:
      default:
        return {
          icon: <CloudOff className="h-4 w-4" />,
          color: 'text-gray-400',
          label: 'Sync disabled',
        }
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
