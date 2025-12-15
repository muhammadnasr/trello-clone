import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { getAuthInstance } from '../firebase/config'
import { useAuthStore } from '@/stores/auth'

export async function signIn(email: string, password: string): Promise<User> {
  const auth = getAuthInstance()
  const userCredential = await signInWithEmailAndPassword(auth, email, password)
  return userCredential.user
}

export async function signUp(email: string, password: string): Promise<User> {
  const auth = getAuthInstance()
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  return userCredential.user
}

export async function signOutUser(): Promise<void> {
  const auth = getAuthInstance()
  await signOut(auth)
}

export function initAuthStateListener(): () => void {
  const auth = getAuthInstance()
  const { setUser, setLoading } = useAuthStore.getState()

  setLoading(true)

  const unsubscribe = onAuthStateChanged(
    auth,
    (user) => {
      setUser(user)
      setLoading(false)
    },
    (error) => {
      console.error('Auth state listener error:', error)
      setUser(null)
      setLoading(false)
    }
  )

  return unsubscribe
}

