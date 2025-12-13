import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { initDatabase } from './lib/db/init'
import './index.css'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

// Create a new router instance
const router = createRouter({ routeTree })

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Initialize database before rendering the app
async function bootstrap() {
  try {
    await initDatabase()
    
    // Database initialized, now render the app
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <RouterProvider router={router} />
      </StrictMode>,
    )
  } catch (error) {
    console.error('Failed to initialize database:', error)
    // Render error state
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

// Start the app
bootstrap()
