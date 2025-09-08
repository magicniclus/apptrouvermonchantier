import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

// Configuration Firebase Admin
const firebaseAdminConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // Pour la production, vous devrez ajouter les clés de service
  // credential: cert({
  //   projectId: process.env.FIREBASE_PROJECT_ID,
  //   clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  //   privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  // }),
}

// Initialiser Firebase Admin (éviter la double initialisation)
const adminApp = getApps().length === 0 
  ? initializeApp(firebaseAdminConfig, 'admin')
  : getApps().find(app => app.name === 'admin') || initializeApp(firebaseAdminConfig, 'admin')

export const adminAuth = getAuth(adminApp)
