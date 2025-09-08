'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Loader, { PulseLoader } from '@/components/ui/loader'
import { EyeIcon, EyeSlashIcon, UserIcon, LockClosedIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    try {
      // Authentification Firebase
      console.log('Tentative de connexion avec:', { email, passwordLength: password.length })
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      console.log('Authentification réussie pour:', user.email)
      
      // Recherche du document client par uidClient
      console.log('UID utilisateur connecté:', user.uid)
      
      // Requête pour trouver le document où uidclient correspond à l'UID utilisateur
      const clientsRef = collection(db, 'clients')
      const q = query(clientsRef, where('uidclient', '==', user.uid))
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        // Document trouvé avec uidClient correspondant (client principal)
        const clientDoc = querySnapshot.docs[0]
        const clientData = clientDoc.data()
        
        console.log('Document client principal trouvé:', { id: clientDoc.id, data: clientData })
        console.log('Connexion réussie:', { uid: user.uid, clientData })
        
        // Redirection vers le dashboard
        router.push('/dashboard')
      } else {
        // Pas trouvé comme client principal, chercher dans les sous-comptes
        console.log('Recherche dans les sous-comptes pour UID:', user.uid)
        
        const allClientsSnapshot = await getDocs(collection(db, 'clients'))
        console.log('Nombre de clients principaux:', allClientsSnapshot.size)
        
        let found = false
        for (const clientDoc of allClientsSnapshot.docs) {
          console.log('Vérification client:', clientDoc.id)
          
          // Chercher dans la sous-collection users de chaque client
          const usersRef = collection(db, `clients/${clientDoc.id}/users`)
          const userQuery = query(usersRef, where('uid', '==', user.uid))
          const userSnapshot = await getDocs(userQuery)
          
          console.log(`Sous-comptes trouvés dans ${clientDoc.id}:`, userSnapshot.size)
          
          if (!userSnapshot.empty) {
            // Sous-compte trouvé
            console.log('Sous-compte trouvé dans le client:', clientDoc.id)
            const userData = userSnapshot.docs[0].data()
            console.log('Données utilisateur:', userData)
            
            // Redirection vers le dashboard
            router.push('/dashboard')
            found = true
            break
          }
        }
        
        if (!found) {
          console.log('ERREUR: Aucun sous-compte trouvé pour cet UID')
          setError('Aucun profil client trouvé pour ce compte.')
          await auth.signOut()
        }
      }
    } catch (error: unknown) {
      console.error('Erreur de connexion:', error)
      const firebaseError = error as { code?: string; message?: string }
      switch (firebaseError.code) {
        case 'auth/user-not-found':
          setError('Aucun compte trouvé avec cette adresse email.')
          break
        case 'auth/wrong-password':
          setError('Mot de passe incorrect.')
          break
        case 'auth/invalid-credential':
          setError('Email ou mot de passe incorrect. Vérifiez que le compte existe dans Firebase Auth.')
          break
        case 'auth/invalid-email':
          setError('Adresse email invalide.')
          break
        case 'auth/too-many-requests':
          setError('Trop de tentatives. Veuillez réessayer plus tard.')
          break
        case 'auth/user-disabled':
          setError('Ce compte a été désactivé.')
          break
        default:
          setError(`Erreur de connexion: ${firebaseError.message || 'Erreur inconnue'}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  }

  const buttonVariants = {
    idle: { scale: 1 },
    hover: { scale: 1.02 },
    tap: { scale: 0.98 }
  }

  // Affichage du loader pulse pendant la connexion
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <PulseLoader text="Connexion en cours..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md"
      >
        <motion.div variants={itemVariants} className="text-center mb-8">
          <motion.div
            className="inline-flex items-center justify-center bg-primary/10 rounded-full mb-4"
          >
            <Image src="/favicon.png" alt="Logo" width={70} height={70} />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Bienvenue
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Connectez-vous à votre espace
          </p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-semibold text-center">
                Connexion
              </CardTitle>
              <CardDescription className="text-center">
                Entrez vos identifiants pour accéder à votre espace
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2"
                >
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                      required
                      disabled={isLoading}
                    />
                    <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Mot de passe
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-12 h-12 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                      required
                      disabled={isLoading}
                    />
                    <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary/20"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Se souvenir de moi
                    </span>
                  </label>
                  <motion.a
                    href="#"
                    className="text-sm text-primary hover:text-primary/80 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Mot de passe oublié ?
                  </motion.a>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <motion.div
                    variants={buttonVariants}
                    initial="idle"
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <Button
                      type="submit"
                      className="w-full h-12 text-base font-medium"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader size="sm" text="Connexion..." />
                      ) : (
                        'Se connecter'
                      )}
                    </Button>
                  </motion.div>
                </motion.div>
              </form>
              <motion.div variants={itemVariants} className="mt-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Pas encore de compte ?{' '}
                  <motion.a
                    href="https://trouver-mon-chantier.fr/"
                    className="text-primary hover:text-primary/80 font-medium transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Créer un compte
                  </motion.a>
                </p>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}
