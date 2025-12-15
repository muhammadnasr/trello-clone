import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { initDatabase, attachBackendSubscriptions } from './lib/db/init'
import { cancelReplication } from './lib/db/replication'
import { initFirebase } from './lib/firebase/config'
import { initAuthStateListener } from './lib/services/auth'
import { useAuthStore } from './stores/auth'
import './index.css'
import { routeTree } from './routeTree.gen'

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

async function bootstrap() {
  try {
    // Step 1: Hydrate from IndexedDB on startup
    await initDatabase()

    // Step 2: Initialize Firebase and auth (if configured)
    if (import.meta.env.VITE_FIREBASE_PROJECT_ID) {
      initFirebase()
      
      // Set up auth state listener
      initAuthStateListener()
      
      // Subscribe to auth changes to attach/remove backend subscriptions
      let hasAttachedSubscriptions = false
      useAuthStore.subscribe((state) => {
        // Only sync with Firestore if user is authenticated
        if (state.isAuthenticated && !state.isLoading && !hasAttachedSubscriptions) {
          hasAttachedSubscriptions = true
          attachBackendSubscriptions().catch((error) => {
            console.error('Failed to attach backend subscriptions:', error)
            hasAttachedSubscriptions = false
          })
        }
        
        // Cancel Firestore replication if user logs out (use IndexedDB only)
        if (!state.isAuthenticated && !state.isLoading && hasAttachedSubscriptions) {
          hasAttachedSubscriptions = false
          cancelReplication()
        }
      })
    }
    
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <RouterProvider router={router} />
      </StrictMode>,
    )
  } catch (error) {
    console.error('Failed to initialize database:', error)
    const root = document.getElementById('root')!
    root.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; flex-direction: column; gap: 1rem;">
        <h1 style="font-size: 1.5rem; font-weight: bold;">Failed to initialize database</h1>
        <p style="color: #ef4444;">${error instanceof Error ? error.message : 'Unknown error'}</p>
        <p style="color: #6b7280;">Please refresh the page to try again.</p>
      </div>
    `
  }
}

bootstrap()
