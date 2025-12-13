import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { initDatabase } from './lib/db/init'
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
    await initDatabase()
    
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
