import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export function LoginSignupButtons() {
  return (
    <div className="flex items-center gap-2">
      <Link to="/login">
        <Button variant="ghost">Login</Button>
      </Link>
      <Link to="/login">
        <Button>Sign Up</Button>
      </Link>
    </div>
  )
}

