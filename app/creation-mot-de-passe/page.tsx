"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Lock, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { auth, db } from '@/lib/firebase'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { doc, updateDoc, getDoc } from 'firebase/firestore'

export default function CreationMotDePassePage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('')
  const [token, setToken] = useState('')
  const [isValidToken, setIsValidToken] = useState(false)
  const [isCheckingToken, setIsCheckingToken] = useState(true)
  
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    const emailParam = searchParams.get('email')
    
    if (!tokenParam || !emailParam) {
      toast.error('Lien invalide ou expiré')
      router.push('/')
      return
    }

    setToken(tokenParam)
    setUserEmail(emailParam)
    validateToken(tokenParam, emailParam)
  }, [searchParams, router])

  const validateToken = async (tokenParam: string, emailParam: string) => {
    try {
      setIsCheckingToken(true)
      console.log('=== VALIDATION TOKEN CÔTÉ CLIENT ===')
      console.log('Token:', tokenParam?.substring(0, 10) + '...')
      console.log('Email:', emailParam)
      
      // Vérifier le token dans la base de données
      const response = await fetch('/api/validate-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: tokenParam, email: emailParam }),
      })

      console.log('Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Token validé avec succès:', data)
        setUserName(`${data.prenom} ${data.nom}`)
        setIsValidToken(true)
      } else {
        const errorData = await response.json()
        console.error('Erreur de validation:', errorData)
        toast.error('Lien invalide ou expiré')
        router.push('/')
      }
    } catch (error) {
      console.error('Erreur lors de la validation du token:', error)
      toast.error('Erreur lors de la validation du lien')
      router.push('/')
    } finally {
      setIsCheckingToken(false)
    }
  }

  const validatePassword = (pwd: string) => {
    const minLength = pwd.length >= 8
    const hasUpperCase = /[A-Z]/.test(pwd)
    const hasLowerCase = /[a-z]/.test(pwd)
    const hasNumbers = /\d/.test(pwd)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pwd)

    return {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar
    }
  }

  const passwordValidation = validatePassword(password)
  const passwordsMatch = password === confirmPassword && confirmPassword !== ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!passwordValidation.isValid) {
      toast.error('Le mot de passe ne respecte pas les critères requis')
      return
    }

    if (!passwordsMatch) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }

    setIsLoading(true)

    try {
      // Créer le compte Firebase Auth
      console.log('=== CRÉATION COMPTE FIREBASE AUTH ===')
      console.log('Email:', userEmail)
      
      let userCredential
      try {
        userCredential = await createUserWithEmailAndPassword(auth, userEmail, password)
        console.log('Compte Firebase créé avec UID:', userCredential.user.uid)
      } catch (authError: any) {
        if (authError.code === 'auth/email-already-in-use') {
          console.log('Email déjà utilisé, tentative de connexion pour récupérer l\'UID...')
          // Si l'email existe déjà, on essaie de se connecter pour récupérer l'UID
          // Cela peut arriver si un utilisateur a été créé mais pas activé complètement
          throw new Error('Cette adresse email est déjà utilisée. Veuillez contacter l\'administrateur.')
        } else {
          throw authError
        }
      }
      
      // Mettre à jour le statut de l'utilisateur dans Firestore
      console.log('=== APPEL API ACTIVATE-USER ===')
      const activateResponse = await fetch('/api/activate-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token, 
          email: userEmail,
          uid: userCredential.user.uid 
        }),
      })

      console.log('Response status:', activateResponse.status)
      const activateResult = await activateResponse.json()
      console.log('Response body:', activateResult)

      if (!activateResponse.ok) {
        throw new Error(`Erreur API: ${activateResult.error}`)
      }

      toast.success('Votre compte a été créé avec succès!')
      
      // Rediriger vers la page de connexion
      setTimeout(() => {
        router.push('/')
      }, 2000)

    } catch (error: any) {
      console.error('Erreur lors de la création du compte:', error)
      
      if (error.code === 'auth/email-already-in-use') {
        toast.error('Cette adresse email est déjà utilisée')
      } else if (error.code === 'auth/weak-password') {
        toast.error('Le mot de passe est trop faible')
      } else {
        toast.error('Erreur lors de la création du compte')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isCheckingToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Vérification du lien...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Lien invalide</h2>
            <p className="text-gray-600 mb-4">Ce lien est invalide ou a expiré.</p>
            <Button onClick={() => router.push('/')} className="w-full">
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="Logo" className="h-12 w-auto" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Créer votre mot de passe
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Bonjour {userName}, créez votre mot de passe pour accéder à votre compte.
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={userEmail}
                disabled
                className="bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Entrez votre mot de passe"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmez votre mot de passe"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Critères de validation du mot de passe */}
            {password && (
              <div className="space-y-2 text-sm">
                <p className="font-medium text-gray-700">Critères du mot de passe :</p>
                <div className="space-y-1">
                  <div className={`flex items-center gap-2 ${passwordValidation.minLength ? 'text-green-600' : 'text-red-600'}`}>
                    {passwordValidation.minLength ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    <span>Au moins 8 caractères</span>
                  </div>
                  <div className={`flex items-center gap-2 ${passwordValidation.hasUpperCase ? 'text-green-600' : 'text-red-600'}`}>
                    {passwordValidation.hasUpperCase ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    <span>Une lettre majuscule</span>
                  </div>
                  <div className={`flex items-center gap-2 ${passwordValidation.hasLowerCase ? 'text-green-600' : 'text-red-600'}`}>
                    {passwordValidation.hasLowerCase ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    <span>Une lettre minuscule</span>
                  </div>
                  <div className={`flex items-center gap-2 ${passwordValidation.hasNumbers ? 'text-green-600' : 'text-red-600'}`}>
                    {passwordValidation.hasNumbers ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    <span>Un chiffre</span>
                  </div>
                  <div className={`flex items-center gap-2 ${passwordValidation.hasSpecialChar ? 'text-green-600' : 'text-red-600'}`}>
                    {passwordValidation.hasSpecialChar ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    <span>Un caractère spécial</span>
                  </div>
                </div>
              </div>
            )}

            {/* Validation de la correspondance des mots de passe */}
            {confirmPassword && (
              <div className={`flex items-center gap-2 text-sm ${passwordsMatch ? 'text-green-600' : 'text-red-600'}`}>
                {passwordsMatch ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                <span>Les mots de passe correspondent</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={!passwordValidation.isValid || !passwordsMatch || isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Création en cours...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Créer mon compte
                </div>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
