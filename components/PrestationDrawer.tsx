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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X, Trash2 } from 'lucide-react'
import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { useAuth } from '@/hooks/useAuth'

interface PrestationDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingPrestation?: {
    id: string
    code: string
    designation: string
    prixUnitaire: number
    unite: string
    type: string
    tauxTVA: number
    dateCreation: any
  } | null
}

export function PrestationDrawer({ open, onOpenChange, editingPrestation }: PrestationDrawerProps) {
  const { user } = useAuth()
  
  const initialFormData = {
    code: '',
    designation: '',
    prixUnitaire: '',
    unite: 'heure',
    type: 'prestation',
    tauxTVA: '20'
  }

  const [formData, setFormData] = useState(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const isEditMode = !!editingPrestation

  // Initialize form with editing prestation data
  useEffect(() => {
    if (editingPrestation) {
      setFormData({
        code: String(editingPrestation.code || ''),
        designation: String(editingPrestation.designation || ''),
        prixUnitaire: String(editingPrestation.prixUnitaire || ''),
        unite: String(editingPrestation.unite || 'heure'),
        type: String(editingPrestation.type || 'prestation'),
        tauxTVA: String(editingPrestation.tauxTVA || '20')
      })
    } else {
      setFormData(initialFormData)
    }
  }, [editingPrestation])

  // Validation des champs obligatoires
  const isFormValid = formData.designation.trim() !== '' && parseFloat(formData.prixUnitaire) > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isFormValid) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }
    
    if (isSubmitting) return
    
    if (!user) {
      toast.error('Utilisateur non connecté')
      return
    }

    setIsSubmitting(true)

    try {
      // Find main client document
      const clientsRef = collection(db, 'clients')
      const clientsSnapshot = await getDocs(query(clientsRef, where('uidclient', '==', user.uid)))
      
      if (clientsSnapshot.empty) {
        toast.error('Erreur: profil client non trouvé')
        return
      }

      const mainClientDoc = clientsSnapshot.docs[0]
      const mainClientId = mainClientDoc.id

      if (isEditMode && editingPrestation) {
        // Update existing prestation
        const prestationRef = doc(db, `clients/${mainClientId}/prestations`, editingPrestation.id)
        await updateDoc(prestationRef, {
          code: formData.code,
          designation: formData.designation,
          prixUnitaire: parseFloat(formData.prixUnitaire),
          unite: formData.unite,
          type: formData.type,
          tauxTVA: parseFloat(formData.tauxTVA),
          dateModification: serverTimestamp(),
          modifiePar: user.uid
        })
        
        toast.success('Prestation modifiée avec succès')
      } else {
        // Check for duplicate code if provided
        if (formData.code.trim()) {
          const prestationsRef = collection(db, `clients/${mainClientId}/prestations`)
          const duplicateQuery = query(prestationsRef, where('code', '==', formData.code.trim()))
          const duplicateSnapshot = await getDocs(duplicateQuery)
          
          if (!duplicateSnapshot.empty) {
            toast.error('Ce code de prestation existe déjà')
            return
          }
        }

        // Create new prestation
        const prestationData = {
          code: formData.code,
          designation: formData.designation,
          prixUnitaire: parseFloat(formData.prixUnitaire),
          unite: formData.unite,
          type: formData.type,
          tauxTVA: parseFloat(formData.tauxTVA),
          dateCreation: serverTimestamp(),
          creePar: user.uid,
          status: 'actif'
        }

        const prestationsRef = collection(db, `clients/${mainClientId}/prestations`)
        await addDoc(prestationsRef, prestationData)
        
        toast.success('Prestation créée avec succès')
      }

      // Reset form and close drawer
      setFormData(initialFormData)
      onOpenChange(false)
      
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error)
      toast.error('Erreur lors de la sauvegarde de la prestation')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!editingPrestation || !user) return

    setIsDeleting(true)
    try {
      // Find main client document
      const clientsRef = collection(db, 'clients')
      const clientsSnapshot = await getDocs(query(clientsRef, where('uidclient', '==', user.uid)))
      
      if (!clientsSnapshot.empty) {
        const mainClientDoc = clientsSnapshot.docs[0]
        const mainClientId = mainClientDoc.id
        
        const prestationRef = doc(db, `clients/${mainClientId}/prestations`, editingPrestation.id)
        await deleteDoc(prestationRef)
        
        toast.success('Prestation supprimée avec succès')
        setShowDeleteDialog(false)
        onOpenChange(false)
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      toast.error('Erreur lors de la suppression de la prestation')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClose = () => {
    setFormData(initialFormData)
    onOpenChange(false)
  }

  return (
    <>
      <Sheet open={open} onOpenChange={(newOpen) => {
        if (!newOpen) {
          handleClose()
        }
        onOpenChange(newOpen)
      }}>
        <SheetContent className="w-[550px] sm:w-[750px] overflow-y-auto p-0">
          {/* Header fixe avec fond */}
          <div className="sticky top-0 z-10 bg-slate-900 border-b border-slate-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-xl font-semibold text-white">
                  {isEditMode ? 'Modifier la prestation' : 'Ajouter une prestation type'}
                </SheetTitle>
                <SheetDescription>
                  {isEditMode 
                    ? 'Modifiez les informations de cette prestation type'
                    : 'Créez une nouvelle prestation type pour vos devis'
                  }
                </SheetDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-10 w-10 hover:bg-slate-600 hover:text-white text-white -mt-1"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Contenu du formulaire avec padding */}
          <div className="px-6 py-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Informations de base */}
              <div className="space-y-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Informations de base</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Code prestation
                  </Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="Ex: MAIN-H, ELEC-INST..."
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground">
                    Optionnel - Code court pour identifier rapidement la prestation
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="designation" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Désignation <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="designation"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="Ex: Main d'œuvre électricien qualifié"
                    className="mt-1"
                    rows={3}
                    required
                  />
                </div>
              </div>

              {/* Tarification */}
              <div className="space-y-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tarification</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="prixUnitaire" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Prix unitaire HT <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="prixUnitaire"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.prixUnitaire}
                      onChange={(e) => setFormData({ ...formData, prixUnitaire: e.target.value })}
                      placeholder="0.00"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tauxTVA" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Taux TVA
                    </Label>
                    <Select
                      value={formData.tauxTVA}
                      onValueChange={(value) => setFormData({ ...formData, tauxTVA: value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="20">20 %</SelectItem>
                        <SelectItem value="10">10 %</SelectItem>
                        <SelectItem value="5.5">5,5 %</SelectItem>
                        <SelectItem value="2.1">2,1 %</SelectItem>
                        <SelectItem value="0">0 %</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unite" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Unité
                  </Label>
                  <Select
                    value={formData.unite}
                    onValueChange={(value) => setFormData({ ...formData, unite: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Sélectionner une unité" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="heure">heure</SelectItem>
                      <SelectItem value="jour">jour</SelectItem>
                      <SelectItem value="forfait">forfait</SelectItem>
                      <SelectItem value="m²">m²</SelectItem>
                      <SelectItem value="ml">ml</SelectItem>
                      <SelectItem value="unité">unité</SelectItem>
                      <SelectItem value="lot">lot</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Type de prestation */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Type de prestation</h3>
                
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Type</Label>
                  <RadioGroup
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                    className="flex flex-col space-y-3"
                  >
                    <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <RadioGroupItem value="prestation" id="prestation" />
                      <Label htmlFor="prestation" className="cursor-pointer flex-1">Prestation de services</Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <RadioGroupItem value="livraison" id="livraison" />
                      <Label htmlFor="livraison" className="cursor-pointer flex-1">Livraison de biens</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="px-6"
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting} className="px-6">
                  {isSubmitting ? (isEditMode ? 'Modification en cours...' : 'Ajout en cours...') : (isEditMode ? 'Modifier' : 'Ajouter')}
                </Button>
              </div>
            </form>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      {isEditMode && (
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Supprimer la prestation</DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir supprimer cette prestation type ? Cette action est irréversible.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Annuler
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Suppression...
                  </div>
                ) : (
                  'Supprimer'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
