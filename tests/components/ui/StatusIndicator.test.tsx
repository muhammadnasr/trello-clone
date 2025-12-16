import { describe, it, expect, beforeEach, vi } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import { StatusIndicator } from '../../../src/components/ui/StatusIndicator'
import { useSyncStatusStore, SyncStatus } from '../../../src/stores/syncStatus'

// Mock stores
vi.mock('../../../src/stores/syncStatus', async () => {
  const actual = await vi.importActual('../../../src/stores/syncStatus')
  return {
    ...actual,
    useSyncStatusStore: vi.fn(),
  }
})

describe('StatusIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset to default state - will be overridden in individual tests
    ;(useSyncStatusStore as any).mockImplementation((selector: any) => {
      const state = {
        status: SyncStatus.DISABLED,
        setStatus: vi.fn(),
      }
      return selector(state)
    })
  })

  describe('Disabled State', () => {
    it('shows disabled status', () => {
      ;(useSyncStatusStore as any).mockImplementation((selector: any) => {
        return selector({
          status: SyncStatus.DISABLED,
        })
      })
      
      render(<StatusIndicator />)
      
      expect(screen.getByText('Sync disabled')).toBeTruthy()
    })
  })

  describe('Offline State', () => {
    it('shows offline status when browser is offline', () => {
      ;(useSyncStatusStore as any).mockImplementation((selector: any) => {
        return selector({
          status: SyncStatus.OFFLINE,
        })
      })
      
      render(<StatusIndicator />)
      
      expect(screen.getByText('Offline - Changes will sync when online')).toBeTruthy()
    })
  })

  describe('Error State', () => {
    it('shows error status when sync has error', () => {
      ;(useSyncStatusStore as any).mockImplementation((selector: any) => {
        return selector({
          status: SyncStatus.ERROR,
        })
      })
      
      render(<StatusIndicator />)
      
      expect(screen.getByText('Sync error - Check connection')).toBeTruthy()
    })
  })

  describe('Syncing State', () => {
    it('shows syncing status when replication is active', () => {
      ;(useSyncStatusStore as any).mockImplementation((selector: any) => {
        return selector({
          status: SyncStatus.SYNCING,
        })
      })
      
      render(<StatusIndicator />)
      
      expect(screen.getByText('Syncing...')).toBeTruthy()
    })
  })

  describe('Online State', () => {
    it('shows online status when everything is working', () => {
      ;(useSyncStatusStore as any).mockImplementation((selector: any) => {
        return selector({
          status: SyncStatus.ONLINE,
        })
      })
      
      render(<StatusIndicator />)
      
      expect(screen.getByText('Online')).toBeTruthy()
    })
  })

  describe('Icon Display', () => {
    it('shows CloudOff icon for disabled state', () => {
      ;(useSyncStatusStore as any).mockImplementation((selector: any) => {
        return selector({
          status: SyncStatus.DISABLED,
        })
      })
      
      const { container } = render(<StatusIndicator />)
      
      // Check for CloudOff icon (lucide-react icons have specific class names)
      const icon = container.querySelector('svg')
      expect(icon).toBeTruthy()
    })

    it('shows WifiOff icon for offline state', () => {
      ;(useSyncStatusStore as any).mockImplementation((selector: any) => {
        return selector({
          status: SyncStatus.OFFLINE,
        })
      })
      
      const { container } = render(<StatusIndicator />)
      
      // Icon should be present
      const icon = container.querySelector('svg')
      expect(icon).toBeTruthy()
    })

    it('shows spinning Loader2 icon for syncing state', () => {
      ;(useSyncStatusStore as any).mockImplementation((selector: any) => {
        return selector({
          status: SyncStatus.SYNCING,
        })
      })
      
      const { container } = render(<StatusIndicator />)
      
      // Check for spinning icon (has animate-spin class)
      const icon = container.querySelector('.animate-spin')
      expect(icon).toBeTruthy()
    })

    it('shows Wifi icon for online state', () => {
      ;(useSyncStatusStore as any).mockImplementation((selector: any) => {
        return selector({
          status: SyncStatus.ONLINE,
        })
      })
      
      const { container } = render(<StatusIndicator />)
      
      const icon = container.querySelector('svg')
      expect(icon).toBeTruthy()
    })
  })

  describe('Responsive Display', () => {
    it('hides label on small screens', () => {
      ;(useSyncStatusStore as any).mockImplementation((selector: any) => {
        return selector({
          status: SyncStatus.SYNCING,
        })
      })
      
      render(<StatusIndicator />)
      
      // Label should have hidden sm:inline classes
      const label = screen.getByText('Syncing...')
      expect(label).toBeTruthy()
      expect(label.className).toContain('hidden')
      expect(label.className).toContain('sm:inline')
    })

    it('shows tooltip with full status', () => {
      ;(useSyncStatusStore as any).mockImplementation((selector: any) => {
        return selector({
          status: SyncStatus.SYNCING,
        })
      })
      
      const { container } = render(<StatusIndicator />)
      
      // Check for title attribute
      const wrapper = container.querySelector('div[title]')
      expect(wrapper).toBeTruthy()
      expect(wrapper?.getAttribute('title')).toBe('Syncing...')
    })
  })
})

