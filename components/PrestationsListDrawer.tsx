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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { X, Search, Edit, Trash2, Plus } from 'lucide-react'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { useAuth } from '@/hooks/useAuth'

interface Prestation {
  id: string
  code: string
  designation: string
  prixUnitaire: number
  unite: string
  type: string
  tauxTVA: number
  dateCreation: any
  dateModification?: any
  creePar: string
  modifiePar?: string
  status: string
}

interface PrestationsListDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectPrestation?: (prestation: Prestation) => void
  onEditPrestation?: (prestation: Prestation) => void
}

export function PrestationsListDrawer({ 
  open, 
  onOpenChange, 
  onSelectPrestation,
  onEditPrestation 
}: PrestationsListDrawerProps) {
  const { user } = useAuth()
  const [prestations, setPrestations] = useState<Prestation[]>([])
  const [filteredPrestations, setFilteredPrestations] = useState<Prestation[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Fetch prestations from Firebase                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
  const fetchPrestations = async () => {
    if (!user) {
      console.log('❌ Pas d\'utilisateur connecté')
      return
    }

    setIsLoading(true)
    try {
      console.log('🔍 Recherche du client principal avec uidclient:', user.uid)
      
      // Find main client document using uidclient
      const clientsRef = collection(db, 'clients')
      const clientsQuery = query(clientsRef, where('uidclient', '==', user.uid))
      const clientsSnapshot = await getDocs(clientsQuery)

      if (clientsSnapshot.empty) {
        console.log('❌ Aucun client trouvé avec uidclient:', user.uid)
        toast.error('Aucun profil client trouvé')
        return
      }

      const mainClientDoc = clientsSnapshot.docs[0]
      const mainClientId = mainClientDoc.id
      console.log('✅ Client principal trouvé avec ID:', mainClientId)

      // Fetch prestations from subcollection - try without status filter first
      const prestationsRef = collection(db, `clients/${mainClientId}/prestations`)
      console.log('🔍 Recherche des prestations dans:', `clients/${mainClientId}/prestations`)
      
      // First try without any filters to see if there are any prestations at all
      const allPrestationsSnapshot = await getDocs(prestationsRef)
      console.log('📊 Total prestations trouvées (tous statuts):', allPrestationsSnapshot.docs.length)
      
      if (allPrestationsSnapshot.docs.length > 0) {
        allPrestationsSnapshot.docs.forEach(doc => {
          console.log('📋 Prestation:', doc.id, doc.data())
        })
      }

      // Now try with status filter
      let prestationsSnapshot
      try {
        const prestationsQuery = query(
          prestationsRef, 
          where('status', '==', 'actif'),
          orderBy('dateCreation', 'desc')
        )
        prestationsSnapshot = await getDocs(prestationsQuery)
        console.log('📊 Prestations actives trouvées:', prestationsSnapshot.docs.length)
      } catch (orderError) {
        console.log('⚠️ Erreur avec orderBy, essai sans tri:', orderError)
        // Fallback without orderBy if index doesn't exist
        const prestationsQuery = query(
          prestationsRef, 
          where('status', '==', 'actif')
        )
        prestationsSnapshot = await getDocs(prestationsQuery)
        console.log('📊 Prestations actives trouvées (sans tri):', prestationsSnapshot.docs.length)
      }

      const prestationsData = prestationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Prestation[]

      console.log('✅ Prestations finales chargées:', prestationsData)
      setPrestations(prestationsData)
      setFilteredPrestations(prestationsData)

    } catch (error) {
      console.error('❌ Erreur lors du chargement des prestations:', error)
      toast.error('Erreur lors du chargement des prestations')
    } finally {
      setIsLoading(false)
    }
  }

  // Load prestations when drawer opens
  useEffect(() => {
    if (open && user) {
      fetchPrestations()
    }
  }, [open, user])

  // Filter prestations based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredPrestations(prestations)
    } else {
      const filtered = prestations.filter(prestation =>
        prestation.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prestation.code.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredPrestations(filtered)
    }
  }, [searchTerm, prestations])

  const handleClose = () => {
    setSearchTerm('')
    onOpenChange(false)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(price)
  }

  const getTypeColor = (type: string) => {
    return type === 'prestation' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
  }

  return (
    <Sheet open={open} onOpenChange={(newOpen) => {
      if (!newOpen) {
        handleClose()
      }
      onOpenChange(newOpen)
    }}>
      <SheetContent className="w-[600px] sm:w-[800px] overflow-y-auto p-0">
        {/* Header fixe avec fond */}
        <div className="sticky top-0 z-10 bg-slate-900 border-b border-slate-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-xl font-semibold text-white">
                Prestations types
              </SheetTitle>
              <SheetDescription>
                Gérez vos prestations types enregistrées
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

        {/* Contenu avec padding */}
        <div className="px-6 py-6">
          {/* Barre de recherche */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Rechercher une prestation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Liste des prestations */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2 text-gray-500">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                Chargement des prestations...
              </div>
            </div>
          ) : filteredPrestations.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                {searchTerm ? 'Aucune prestation trouvée' : 'Aucune prestation enregistrée'}
              </div>
              {!searchTerm && (
                <p className="text-sm text-gray-400">
                  Créez votre première prestation type pour la voir apparaître ici
                </p>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredPrestations.map((prestation) => (
                <div key={prestation.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                  {/* Header avec badges */}
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {prestation.code && (
                          <Badge variant="outline" className="text-xs font-mono bg-white dark:bg-gray-800">
                            {prestation.code}
                          </Badge>
                        )}
                        <Badge className={`text-xs font-medium ${getTypeColor(prestation.type)}`}>
                          {prestation.type === 'prestation' ? '🔧 Service' : '📦 Bien'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {onEditPrestation && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onEditPrestation(prestation)}
                            className="h-7 w-7 p-0 hover:bg-gray-200 dark:hover:bg-gray-600"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contenu principal */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 leading-tight">
                      {prestation.designation}
                    </h3>
                    
                    {/* Informations tarifaires */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-4">
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div className="text-center">
                          <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Prix unitaire</div>
                          <div className="font-bold text-blue-600 dark:text-blue-400">
                            {formatPrice(prestation.prixUnitaire)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">HT</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Unité</div>
                          <div className="font-medium text-gray-700 dark:text-gray-300">
                            {prestation.unite}
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">TVA</div>
                          <div className="font-medium text-gray-700 dark:text-gray-300">
                            {prestation.tauxTVA}%
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bouton d'action */}
                    {onSelectPrestation && (
                      <Button
                        onClick={() => {
                          onSelectPrestation(prestation)
                          handleClose()
                        }}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2"
                        size="sm"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Utiliser cette prestation
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
