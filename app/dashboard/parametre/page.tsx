'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { db } from '@/lib/firebase'
import { doc, updateDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ArrowLeftIcon, UserIcon, EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline'
import Loader from '@/components/ui/loader'

export default function ParametrePage() {
  const { user, clientData, loading: authLoading } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    ville: '',
    SiteInternetClient: ''
  })

  useEffect(() => {
    if (clientData) {
      setFormData({
        nom: clientData.nom || '',
        prenom: clientData.prenom || '',
        email: clientData.email || '',
        telephone: clientData.telephone || '',
        ville: clientData.ville || '',
        SiteInternetClient: clientData.SiteInternetClient || ''
      })
    }
  }, [clientData])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    if (!clientData?.id) return
    
    setLoading(true)
    try {
      const clientRef = doc(db, 'clients', clientData.id)
      await updateDoc(clientRef, formData)
      
      // Optionnel: afficher un message de succès
      alert('Informations mises à jour avec succès!')
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      alert('Erreur lors de la mise à jour des informations')
    } finally {
      setLoading(false)
    }
  }

  const handleUnsubscribe = () => {
    const subject = encodeURIComponent('Demande de désabonnement')
    const body = encodeURIComponent(`Bonjour,

Je souhaite me désabonner de vos services.

Nom: ${formData.prenom} ${formData.nom}
Email: ${formData.email}

Merci de traiter ma demande.

Cordialement,
${formData.prenom} ${formData.nom}`)
    
    window.location.href = `mailto:service@trouver-mon-chantier.fr?subject=${subject}&body=${body}`
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Loader size="lg" />
      </div>
    )
  }

  if (!user || !clientData) {
    router.push('/')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <motion.div
        className="container mx-auto px-4 py-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <img src="/favicon.png" alt="Logo" className="w-8 h-8" />
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                Paramètres
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Gérez vos informations personnelles
              </p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Retour
          </Button>
        </motion.div>

        {/* Informations personnelles */}
        <motion.div variants={itemVariants} className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="w-5 h-5" />
                Informations personnelles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="prenom">Prénom</Label>
                  <Input
                    id="prenom"
                    value={formData.prenom}
                    onChange={(e) => handleInputChange('prenom', e.target.value)}
                    placeholder="Votre prénom"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => handleInputChange('nom', e.target.value)}
                    placeholder="Votre nom"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <EnvelopeIcon className="w-4 h-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="votre@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telephone" className="flex items-center gap-2">
                  <PhoneIcon className="w-4 h-4" />
                  Téléphone
                </Label>
                <Input
                  id="telephone"
                  value={formData.telephone}
                  onChange={(e) => handleInputChange('telephone', e.target.value)}
                  placeholder="Votre numéro de téléphone"
                />
              </div>


              <div className="flex justify-end">
                <Button 
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  {loading && <Loader size="sm" />}
                  Sauvegarder les modifications
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Désabonnement */}
        <motion.div variants={itemVariants} className="text-center mt-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUnsubscribe}
            className="text-gray-400 hover:text-gray-600 text-xs"
          >
            Se désabonner
          </Button>
        </motion.div>
      </motion.div>
    </div>
  )
}
