import { Outlet, useRouterState } from '@tanstack/react-router'
import { SignOutButton } from '@/components/auth/SignOutButton'
import { LoginSignupButtons } from '@/components/auth/LoginSignupButtons'
import { useAuthStore } from '@/stores/auth'
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs'
import { OfflineIndicator } from '@/components/ui/OfflineIndicator'

export function RootLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isLoading = useAuthStore((state) => state.isLoading)
  const hasFirebase = !!import.meta.env.VITE_FIREBASE_PROJECT_ID
  const router = useRouterState()
  const isLoginPage = router.location.pathname === '/login'

  return (
    <div className="min-h-screen">
      {!isLoginPage && (
        <div className="border-b bg-white px-8 py-4">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <Breadcrumbs />
            <div className="flex items-center gap-4">
              <OfflineIndicator />
              {hasFirebase && !isLoading && (
                isAuthenticated ? <SignOutButton /> : <LoginSignupButtons />
              )}
            </div>
          </div>
        </div>
      )}
      <Outlet />
    </div>
  )
}

