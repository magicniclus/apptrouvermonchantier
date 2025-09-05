'use client'

import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { X } from 'lucide-react'
import { AddressAutocomplete } from '@/components/AddressAutocomplete'

interface ClientDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ClientDrawer({ open, onOpenChange }: ClientDrawerProps) {
  const initialFormData = {
    typeClient: 'particulier',
    localisation: 'france',
    genre: 'non-specifie',
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    adresse: '',
    complementAdresse: '',
    codePostal: '',
    ville: '',
    commentaires: ''
  }

  const [formData, setFormData] = useState(initialFormData)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Client data:', formData)
    // TODO: Implement client creation logic
    onOpenChange(false)
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
    setFormData(initialFormData)
  }

  const handleCancel = () => {
    resetForm()
    onOpenChange(false)
  }

  return (
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
              <SheetTitle className="text-xl font-semibold text-white">
                Ajouter un client
              </SheetTitle>
              {/* <SheetDescription className="text-sm text-gray-200 mt-1">
                Créez un nouveau client pour optimiser la gestion de vos factures et devis.
              </SheetDescription> */}
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
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Le client */}
            <div className="space-y-6 pb-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Le client</h3>
              
              {/* Type de client */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Type de client</Label>
                <RadioGroup
                  value={formData.typeClient}
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
                  value={formData.localisation}
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
                  value={formData.genre}
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
                {/* Nom de famille */}
                <div className="space-y-2">
                  <Label htmlFor="nom" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nom de famille <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="nom"
                    placeholder="Entrer le nom de famille du client"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    required
                    className="h-11"
                  />
                </div>

                {/* Prénom */}
                <div className="space-y-2">
                  <Label htmlFor="prenom" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Prénom <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="prenom"
                    placeholder="Entrer le prénom du client"
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    required
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
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="px-6"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-700 px-6"
            >
              Ajouter
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
