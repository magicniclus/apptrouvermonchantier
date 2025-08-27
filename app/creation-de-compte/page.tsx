'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function CreationDeComptePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [uid, setUid] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  })

  useEffect(() => {
    const uidParam = searchParams.get('uid')
    if (uidParam) {
      setUid(uidParam)
    } else {
      setError('UID manquant dans l\'URL')
    }
  }, [searchParams])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (error) setError('')
  }

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError('Tous les champs obligatoires doivent être remplis')
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return false
    }

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Veuillez entrer une adresse email valide')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    if (!uid) {
      setError('UID manquant')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Créer le compte Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      )
      
      const user = userCredential.user

      // Sauvegarder les données client dans Firestore (merge pour préserver les données existantes)
      await setDoc(doc(db, 'clients', uid), {
        uidclient: user.uid,
        email: formData.email,
        dateCreation: new Date(),
        statut: 'actif'
      }, { merge: true })

      // Rediriger vers le dashboard
      router.push('/dashboard')
      
    } catch (error: unknown) {
      console.error('Erreur lors de la création du compte:', error)
      
      // Gérer les erreurs Firebase spécifiques
      const firebaseError = error as { code?: string; message?: string }
      switch (firebaseError.code) {
        case 'auth/email-already-in-use':
          setError('Cette adresse email est déjà utilisée')
          break
        case 'auth/weak-password':
          setError('Le mot de passe est trop faible')
          break
        case 'auth/invalid-email':
          setError('Adresse email invalide')
          break
        default:
          setError('Erreur lors de la création du compte. Veuillez réessayer.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Création de compte
          </CardTitle>
          <CardDescription className="text-center">
            Créez votre compte pour accéder à votre espace personnel
          </CardDescription>
          {uid && (
            <div className="text-xs text-gray-500 text-center">
              ID Client: {uid}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !uid}
            >
              {loading ? 'Création en cours...' : 'Créer le compte'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function CreationDeComptePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50">Chargement...</div>}>
      <CreationDeComptePageContent />
    </Suspense>
  )
}
