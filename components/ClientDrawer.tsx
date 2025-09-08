'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { X, Trash2 } from 'lucide-react'
import { AddressAutocomplete } from '@/components/AddressAutocomplete'
import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { useAuth } from '@/hooks/useAuth'

interface ClientDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingClient?: {
    id: string
    typeClient: string
    localisation: string
    genre: string
    nom: string
    prenom: string
    nomEntreprise: string
    email: string
    telephone: string
    adresse: string
    complementAdresse: string
    codePostal: string
    ville: string
    commentaires: string
    dateCreation: any
    status: string
  } | null
}

export function ClientDrawer({ open, onOpenChange, editingClient }: ClientDrawerProps) {
  const { user } = useAuth()
  
  const initialFormData = {
    typeClient: 'particulier',
    localisation: 'france',
    genre: 'non-specifie',
    nom: '',
    prenom: '',
    nomEntreprise: '',
    email: '',
    telephone: '',
    adresse: '',
    complementAdresse: '',
    codePostal: '',
    ville: '',
    commentaires: ''
  }

  const [formData, setFormData] = useState(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const isEditMode = !!editingClient

  // Initialize form with editing client data
  useEffect(() => {
    if (editingClient) {
      setFormData({
        typeClient: String(editingClient.typeClient || 'particulier'),
        localisation: String(editingClient.localisation || 'france'),
        genre: String(editingClient.genre || 'non-specifie'),
        nom: String(editingClient.nom || ''),
        prenom: String(editingClient.prenom || ''),
        nomEntreprise: String(editingClient.nomEntreprise || ''),
        email: String(editingClient.email || ''),
        telephone: String(editingClient.telephone || ''),
        adresse: String(editingClient.adresse || ''),
        complementAdresse: String(editingClient.complementAdresse || ''),
        codePostal: String(editingClient.codePostal || ''),
        ville: String(editingClient.ville || ''),
        commentaires: String(editingClient.commentaires || '')
      })
    } else {
      setFormData(initialFormData)
    }
  }, [editingClient])

  // Validation des champs obligatoires selon le type de client
  const isFormValid = formData.typeClient === 'particulier' 
    ? formData.nom.trim() !== '' 
    : formData.nomEntreprise.trim() !== '' // Nom d'entreprise obligatoire pour les entreprises
  
  // Debug validation en temps réel
  useEffect(() => {
    console.log('🔍 Form validation:', { 
      typeClient: formData.typeClient, 
      nom: formData.nom, 
      nomTrimmed: formData.nom.trim(), 
      isFormValid 
    })
  }, [formData.nom, formData.typeClient, isFormValid])
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🚀 Form submitted!', { 
      isFormValid, 
      isSubmitting, 
      user: user?.uid, 
      formData,
      isEditMode,
      editingClient: editingClient?.id 
    })
    
    
    if (!isFormValid) {
      console.log('❌ Form not valid')
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }
    
    if (isSubmitting) {
      console.log('❌ Already submitting')
      return
    }
    
    if (!user) {
      console.log('❌ No user')
      toast.error('Utilisateur non connecté')
      return
    }

    setIsSubmitting(true)
    console.log('🔄 Début de la sauvegarde...', { isEditMode, user: user.uid, formData })

    try {
      if (isEditMode && editingClient) {
        console.log('✏️ Mode édition détecté', editingClient.id)
        
        // Trouver le document client principal avec uidclient correspondant à l'utilisateur connecté
        console.log('🔍 Recherche du client principal avec uidclient:', user.uid)
        
        const mainClientsQuery = query(
          collection(db, 'clients'),
          where('uidclient', '==', user.uid)
        )
        const mainClientsSnapshot = await getDocs(mainClientsQuery)
        
        if (mainClientsSnapshot.empty) {
          console.log('❌ Aucun client principal trouvé avec uidclient:', user.uid)
          toast.error('Aucun profil client principal trouvé pour cet utilisateur')
          setIsSubmitting(false)
          return
        }
        
        // Prendre le premier document client principal trouvé
        const mainClientDoc = mainClientsSnapshot.docs[0]
        const mainClientId = mainClientDoc.id
        console.log('✅ Client principal trouvé avec ID:', mainClientId)
        
        // Mode édition - mise à jour dans la sous-collection du client principal
        const clientRef = doc(db, 'clients', mainClientId, 'clients', editingClient.id)
        const updatedData = {
          ...formData,
          dateCreation: editingClient.dateCreation,
          status: editingClient.status
        }
        
        console.log('📝 Données à mettre à jour:', updatedData)
        console.log('📍 Mise à jour dans clients/{mainClientId}/clients/{clientId}:', mainClientId, editingClient.id)
        await updateDoc(clientRef, updatedData)
        console.log('✅ Client mis à jour avec succès')
        toast.success('Client modifié avec succès!')
      } else {
        console.log('➕ Mode création détecté')
        
        // Trouver le document client existant avec uidclient correspondant à l'utilisateur connecté
        console.log('🔍 Recherche du client existant avec uidclient:', user.uid)
        
        const existingClientsQuery = query(
          collection(db, 'clients'),
          where('uidclient', '==', user.uid)
        )
        const existingClientsSnapshot = await getDocs(existingClientsQuery)
        
        if (existingClientsSnapshot.empty) {
          console.log('❌ Aucun client trouvé avec uidclient:', user.uid)
          toast.error('Aucun profil client trouvé pour cet utilisateur')
          setIsSubmitting(false)
          return
        }
        
        // Prendre le premier document client trouvé
        const mainClientDoc = existingClientsSnapshot.docs[0]
        const mainClientId = mainClientDoc.id
        console.log('✅ Client existant trouvé avec ID:', mainClientId)

        // Mode création - vérification email dans la sous-collection du client existant
        if (formData.email) {
          const clientSubcollectionRef = collection(db, 'clients', mainClientId, 'clients')
          const emailQuery = query(
            clientSubcollectionRef,
            where('email', '==', formData.email)
          )
          const emailSnapshot = await getDocs(emailQuery)
          
          if (!emailSnapshot.empty) {
            console.log('❌ Email déjà existant')
            toast.error('Un client avec cet email existe déjà')
            setIsSubmitting(false)
            return
          }
        }
        
        // Créer nouveau client dans la sous-collection du client existant
        const newClientData = {
          ...formData,
          dateCreation: serverTimestamp(),
          status: 'actif'
        }

        console.log('📝 Données du nouveau client:', newClientData)
        console.log('📍 Sauvegarde dans clients/{clientId}/clients:', mainClientId)
        
        // Sauvegarder dans clients/{mainClientId}/clients
        const clientSubcollectionRef = collection(db, 'clients', mainClientId, 'clients')
        const docRef = await addDoc(clientSubcollectionRef, newClientData)
        console.log('✅ Client créé avec ID:', docRef.id)
        toast.success('Client créé avec succès!')
      }
      
      // Reset form and close drawer
      setFormData(initialFormData)
      onOpenChange(false)
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde du client:', error)
      toast.error(`Erreur lors de la sauvegarde: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClient = async () => {
    if (!editingClient || !user) {
      return
    }

    setIsDeleting(true)
    console.log('🗑️ Début de la suppression du client:', editingClient.id)

    try {
      // Trouver le document client principal avec uidclient correspondant à l'utilisateur connecté
      console.log('🔍 Recherche du client principal avec uidclient:', user.uid)
      
      const mainClientsQuery = query(
        collection(db, 'clients'),
        where('uidclient', '==', user.uid)
      )
      const mainClientsSnapshot = await getDocs(mainClientsQuery)
      
      if (mainClientsSnapshot.empty) {
        console.log('❌ Aucun client principal trouvé avec uidclient:', user.uid)
        toast.error('Aucun profil client principal trouvé pour cet utilisateur')
        setIsDeleting(false)
        return
      }
      
      // Prendre le premier document client principal trouvé
      const mainClientDoc = mainClientsSnapshot.docs[0]
      const mainClientId = mainClientDoc.id
      console.log('✅ Client principal trouvé avec ID:', mainClientId)
      
      // Supprimer le client de la sous-collection
      const clientRef = doc(db, 'clients', mainClientId, 'clients', editingClient.id)
      console.log('🗑️ Suppression dans clients/{mainClientId}/clients/{clientId}:', mainClientId, editingClient.id)
      
      await deleteDoc(clientRef)
      console.log('✅ Client supprimé avec succès')
      
      toast.success('Client supprimé avec succès!')
      setShowDeleteDialog(false)
      onOpenChange(false)
    } catch (error) {
      console.error('❌ Erreur lors de la suppression du client:', error)
      toast.error(`Erreur lors de la suppression: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleAddressSelect = (address: string, postalCode: string, city: string) => {
    setFormData({
      ...formData,
      adresse: address,
      codePostal: postalCode,
      ville: city
    })
  }

  const resetForm = () => {
    console.log('🔄 Reset form called')
    setFormData(initialFormData)
  }

  const handleCancel = () => {
    console.log('❌ Cancel clicked')
    resetForm()
    onOpenChange(false)
  }

  return (
    <>
    <Sheet open={open} onOpenChange={(newOpen) => {
      if (!newOpen) {
        resetForm()
      }
      onOpenChange(newOpen)
    }}>
      <SheetContent className="w-[550px] sm:w-[750px] overflow-y-auto p-0">
        {/* Header fixe avec fond */}
        <div className="sticky top-0 z-10 bg-slate-900 border-b border-slate-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div>
                <SheetTitle className="text-xl font-semibold text-white">
                  {isEditMode ? 'Modifier le client' : 'Ajouter un nouveau client'}
                </SheetTitle>
                <SheetDescription>
                  {isEditMode 
                    ? 'Modifiez les informations du client.' 
                    : 'Remplissez les informations du client pour l\'ajouter à votre base de données.'
                  }
                </SheetDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              className="h-10 w-10 hover:bg-slate-600 hover:text-white text-white -mt-1"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Contenu du formulaire avec padding */}
        <div className="px-6 py-6">
          <form onSubmit={(e) => {
          console.log('📋 Form onSubmit triggered!')
          handleSubmit(e)
        }} className="space-y-8">
            {/* Le client */}
            <div className="space-y-6 pb-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Le client</h3>
              
              {/* Type de client */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Type de client</Label>
                <RadioGroup
                  value={formData.typeClient || 'particulier'}
                  onValueChange={(value) => setFormData({ ...formData, typeClient: value })}
                  className="flex flex-col space-y-3"
                >
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <RadioGroupItem value="particulier" id="particulier" />
                    <Label htmlFor="particulier" className="cursor-pointer flex-1">Particulier</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <RadioGroupItem value="entreprise" id="entreprise" />
                    <Label htmlFor="entreprise" className="cursor-pointer flex-1">Entreprise</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Localisation du client */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Localisation du client</Label>
                <RadioGroup
                  value={formData.localisation || 'france'}
                  onValueChange={(value) => setFormData({ ...formData, localisation: value })}
                  className="flex flex-col space-y-3"
                >
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <RadioGroupItem value="france" id="france" />
                    <Label htmlFor="france" className="cursor-pointer flex-1">France</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <RadioGroupItem value="international" id="international" />
                    <Label htmlFor="international" className="cursor-pointer flex-1">International</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            {/* Informations du client */}
            <div className="space-y-6 pb-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Informations du client</h3>
              
              {/* Genre */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Genre</Label>
                <RadioGroup
                  value={formData.genre || 'non-specifie'}
                  onValueChange={(value) => setFormData({ ...formData, genre: value })}
                  className="flex flex-col space-y-3"
                >
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <RadioGroupItem value="madame" id="madame" />
                    <Label htmlFor="madame" className="cursor-pointer flex-1">Madame</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <RadioGroupItem value="monsieur" id="monsieur" />
                    <Label htmlFor="monsieur" className="cursor-pointer flex-1">Monsieur</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <RadioGroupItem value="non-specifie" id="non-specifie" />
                    <Label htmlFor="non-specifie" className="cursor-pointer flex-1">Non spécifié</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Nom (si particulier) */}
                {formData.typeClient === 'particulier' && (
                  <div className="space-y-2">
                    <Label htmlFor="nom" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nom <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="nom"
                      value={formData.nom}
                      onChange={(e) => {
                        console.log('✏️ Nom changed:', e.target.value)
                        setFormData({ ...formData, nom: e.target.value })
                      }}
                      placeholder="Nom du client"
                      className="h-11"
                    />
                  </div>
                )}

                {/* Nom de l'entreprise (si entreprise) */}
                {formData.typeClient === 'entreprise' && (
                  <div className="space-y-2">
                    <Label htmlFor="nomEntreprise" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nom de l'entreprise <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="nomEntreprise"
                      placeholder="Entrer le nom de l'entreprise"
                      value={formData.nomEntreprise}
                      onChange={(e) => {
                        console.log('✏️ Nom entreprise changed:', e.target.value)
                        setFormData({ ...formData, nomEntreprise: e.target.value })
                      }}
                      required
                      className="h-11"
                    />
                  </div>
                )}


                {/* Prénom */}
                <div className="space-y-2">
                  <Label htmlFor="prenom" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Prénom
                  </Label>
                  <Input
                    id="prenom"
                    placeholder="Entrer le prénom du client"
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    className="h-11"
                  />
                </div>

                {/* Adresse email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">Adresse email (optionnel)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Entrer l'email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-11"
                  />
                </div>

                {/* Numéro de téléphone */}
                <div className="space-y-2">
                  <Label htmlFor="telephone" className="text-sm font-medium text-gray-700 dark:text-gray-300">Numéro de téléphone (optionnel)</Label>
                  <Input
                    id="telephone"
                    type="tel"
                    placeholder="Entrer le numéro"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    className="h-11"
                  />
                </div>
              </div>
            </div>

            {/* Adresse */}
            <div className="space-y-6 pb-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Adresse</h3>
              
              <div className="grid grid-cols-1 gap-4">
                {/* Adresse avec autocomplete */}
                <div className="space-y-2">
                  <Label htmlFor="adresse" className="text-sm font-medium text-gray-700 dark:text-gray-300">Adresse</Label>
                  <AddressAutocomplete
                    value={formData.adresse}
                    onChange={(value) => setFormData({ ...formData, adresse: value })}
                    onAddressSelect={handleAddressSelect}
                    placeholder="Entrer l'adresse..."
                    className="h-11"
                  />
                </div>

                {/* Complément d'adresse */}
                <div className="space-y-2">
                  <Label htmlFor="complement-adresse" className="text-sm font-medium text-gray-700 dark:text-gray-300">Complément d'adresse (optionnel)</Label>
                  <Input
                    id="complement-adresse"
                    placeholder="Appartement, étage, etc."
                    value={formData.complementAdresse}
                    onChange={(e) => setFormData({ ...formData, complementAdresse: e.target.value })}
                    className="h-11"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Code Postal */}
                  <div className="space-y-2">
                    <Label htmlFor="code-postal" className="text-sm font-medium text-gray-700 dark:text-gray-300">Code Postal</Label>
                    <Input
                      id="code-postal"
                      placeholder="Code postal"
                      value={formData.codePostal}
                      onChange={(e) => setFormData({ ...formData, codePostal: e.target.value })}
                      className="h-11"
                    />
                  </div>

                  {/* Ville */}
                  <div className="space-y-2">
                    <Label htmlFor="ville" className="text-sm font-medium text-gray-700 dark:text-gray-300">Ville</Label>
                    <Input
                      id="ville"
                      placeholder="Ville"
                      value={formData.ville}
                      onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                      className="h-11"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Autre */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Autre</h3>
              
              {/* Commentaires */}
              <div className="space-y-2">
                <Label htmlFor="commentaires" className="text-sm font-medium text-gray-700 dark:text-gray-300">Commentaires (optionnel)</Label>
                <Textarea
                  id="commentaires"
                  placeholder="Ajouter des commentaires..."
                  value={formData.commentaires}
                  onChange={(e) => setFormData({ ...formData, commentaires: e.target.value })}
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer fixe avec actions */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-950 border-t px-6 py-4">
          <div className="flex justify-center space-x-3">
            {/* <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="px-6"
            >
              Annuler
            </Button> */}
            <div className="flex flex-col space-y-2">
              <Button
                type="button"
                disabled={!isFormValid || isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={(e) => {
                  console.log('🔘 Button clicked directly!', { disabled: !isFormValid || isSubmitting, isFormValid, isSubmitting })
                  e.preventDefault()
                  handleSubmit(e as any)
                }}
              >
                {isSubmitting 
                  ? (isEditMode ? 'Modification en cours...' : 'Ajout en cours...') 
                  : (isEditMode ? 'Modifier le client' : 'Ajouter le client')
                }
              </Button>
              {isEditMode && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isDeleting || isSubmitting}
                  className="flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer
                </Button>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
    
    {/* Dialog de confirmation de suppression */}
    <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmer la suppression</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer ce client ? Cette action est irréversible.
            {editingClient && (
              <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <span className="font-medium">
                  {editingClient.typeClient === 'entreprise' 
                    ? editingClient.nomEntreprise 
                    : `${editingClient.nom} ${editingClient.prenom}`
                  }
                </span>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="destructive"
            onClick={handleDeleteClient}
            disabled={isDeleting}
            className="flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Suppression...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Supprimer définitivement
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
