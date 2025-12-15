import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getAuth, type Auth } from 'firebase/auth'

let firebaseApp: FirebaseApp | null = null
let firestoreDatabase: Firestore | null = null
let auth: Auth | null = null

export function initFirebase(): { app: FirebaseApp; firestore: Firestore; auth: Auth } {
  if (firebaseApp && firestoreDatabase && auth) {
    return { app: firebaseApp, firestore: firestoreDatabase, auth }
  }

  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN
  const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET
  const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID
  const appId = import.meta.env.VITE_FIREBASE_APP_ID

  if (!projectId || !apiKey || !authDomain) {
    const missing = []
    if (!projectId) missing.push('VITE_FIREBASE_PROJECT_ID')
    if (!apiKey) missing.push('VITE_FIREBASE_API_KEY')
    if (!authDomain) missing.push('VITE_FIREBASE_AUTH_DOMAIN')
    throw new Error(
      `Firebase configuration is missing: ${missing.join(', ')}. Please check your .env file.`
    )
  }

  firebaseApp = initializeApp({
    projectId,
    apiKey,
    authDomain,
    storageBucket,
    messagingSenderId,
    appId,
  })

  firestoreDatabase = getFirestore(firebaseApp)
  auth = getAuth(firebaseApp)

  if (!firestoreDatabase) {
    throw new Error('Failed to initialize Firestore database')
  }

  return { app: firebaseApp, firestore: firestoreDatabase, auth }
}

export function getAuthInstance(): Auth {
  if (!auth) {
    initFirebase()
  }
  return auth!
}

export function getFirestoreDatabase(): Firestore {
  if (!firestoreDatabase) {
    initFirebase()
  }
  return firestoreDatabase!
}

