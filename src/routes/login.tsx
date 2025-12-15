import { createFileRoute, redirect } from '@tanstack/react-router'
import { LoginForm } from '@/components/auth/LoginForm'
import { useAuthStore } from '@/stores/auth'

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    if (!import.meta.env.VITE_FIREBASE_PROJECT_ID) {
      return
    }

    const authStore = useAuthStore.getState()
    
    // Wait for auth to finish loading
    if (authStore.isLoading) {
      await new Promise<void>((resolve) => {
        const unsubscribe = useAuthStore.subscribe((state) => {
          if (!state.isLoading) {
            unsubscribe()
            resolve()
          }
        })
        
        // If already loaded, resolve immediately
        if (!authStore.isLoading) {
          unsubscribe()
          resolve()
        }
      })
    }

    const { isAuthenticated } = useAuthStore.getState()

    if (isAuthenticated) {
      throw redirect({
        to: '/',
      })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  return <LoginForm />
}
