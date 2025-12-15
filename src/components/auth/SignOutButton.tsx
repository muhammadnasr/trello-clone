import { useState } from 'react'
import { signOutUser } from '@/lib/services/auth'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth'

export function SignOutButton() {
  const user = useAuthStore((state) => state.user)
  const [isLoading, setIsLoading] = useState(false)

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await signOutUser()
    } catch (error) {
      console.error('Failed to sign out:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-600">{user.email}</span>
      <Button onClick={handleSignOut} disabled={isLoading} variant="outline">
        {isLoading ? 'Signing out...' : 'Sign Out'}
      </Button>
    </div>
  )
}

