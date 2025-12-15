import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'

let firebaseApp: FirebaseApp | null = null
let firestoreDatabase: Firestore | null = null

export function initFirebase(): { app: FirebaseApp; firestore: Firestore } {
  if (firebaseApp && firestoreDatabase) {
    console.log('🔥 Firebase already initialized')
    return { app: firebaseApp, firestore: firestoreDatabase }
  }

  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN
  const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET
  const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID
  const appId = import.meta.env.VITE_FIREBASE_APP_ID

  console.log('🔥 Initializing Firebase with project:', projectId)

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

  // Ensure we get the Firestore instance correctly
  // Use the app instance to get Firestore to ensure compatibility
  firestoreDatabase = getFirestore(firebaseApp)
  
  // Verify the Firestore instance
  if (!firestoreDatabase) {
    throw new Error('Failed to initialize Firestore database')
  }

  console.log('✅ Firebase initialized successfully')
  console.log('✅ Firestore instance created:', {
    type: typeof firestoreDatabase,
    app: firebaseApp.name,
    projectId: firestoreDatabase.app.options.projectId,
  })

  return { app: firebaseApp, firestore: firestoreDatabase }
}

export function getFirestoreDatabase(): Firestore {
  if (!firestoreDatabase) {
    initFirebase()
  }
  return firestoreDatabase!
}

