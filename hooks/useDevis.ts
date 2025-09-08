'use client'

import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from './useAuth'

export interface Devis {
  id: string
  numeroDevis: string
  clientId: string
  clientNom: string
  clientEmail: string
  dateCreation: any
  dateValidite: any
  statut: 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire' | 'facture'
  factureId?: string
  montantHT: number
  montantTTC: number
  tauxTVA: number
  montantTVA: number
  devise: string
  validiteDuree: number
  adresseDevis: {
    nom: string
    adresse: string
    codePostal: string
    ville: string
    pays: string
  }
  lignes: Array<{
    articleId?: string
    designation: string
    quantite: number
    prixUnitaireHT: number
    remise: number
    montantHT: number
    tauxTVA: number
  }>
  conditions: string
  notes: string
  fichierPDF?: string
  envoye: boolean
  dateEnvoi?: any
  dateAcceptation?: any
  historique: Array<{
    date: any
    action: string
    utilisateur: string
    details: string
  }>
}

export function useDevis() {
  const [devis, setDevis] = useState<Devis[]>([])
  const [loading, setLoading] = useState(true)
  const { user, clientData } = useAuth()

  const loadDevis = async () => {
    if (!user || !clientData?.id) {
      console.log('❌ useDevis: Pas d\'utilisateur ou de client data')
      setLoading(false)
      return
    }

    try {
      console.log('🔄 useDevis: Chargement des devis pour client:', clientData.id)
      
      // Requête pour récupérer tous les devis du client
      const devisRef = collection(db, 'devis')
      const q = query(
        devisRef, 
        where('clientPrincipalId', '==', clientData.id)
      )
      
      const querySnapshot = await getDocs(q)
      console.log('📊 useDevis: Nombre de devis trouvés:', querySnapshot.size)
      
      const devisList: Devis[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        devisList.push({
          id: doc.id,
          ...data
        } as Devis)
      })
      
      // Trier par date de création (plus récent en premier)
      devisList.sort((a, b) => {
        const dateA = a.dateCreation?.toDate ? a.dateCreation.toDate() : new Date(a.dateCreation)
        const dateB = b.dateCreation?.toDate ? b.dateCreation.toDate() : new Date(b.dateCreation)
        return dateB.getTime() - dateA.getTime()
      })
      
      console.log('✅ useDevis: Devis chargés:', devisList)
      setDevis(devisList)
    } catch (error) {
      console.error('❌ useDevis: Erreur lors du chargement des devis:', error)
      setDevis([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDevis()
  }, [user, clientData])

  const createDevis = async (devisData: Omit<Devis, 'id'>) => {
    if (!clientData?.id) return null

    try {
      const devisRef = collection(db, 'devis')
      const docRef = await addDoc(devisRef, {
        ...devisData,
        clientPrincipalId: clientData.id,
        dateCreation: new Date(),
        historique: [{
          date: new Date(),
          action: 'creation',
          utilisateur: user?.email || '',
          details: 'Devis créé'
        }]
      })
      
      await loadDevis() // Recharger la liste
      return docRef.id
    } catch (error) {
      console.error('Erreur lors de la création du devis:', error)
      throw error
    }
  }

  const updateDevis = async (devisId: string, updates: Partial<Devis>) => {
    try {
      const devisRef = doc(db, 'devis', devisId)
      await updateDoc(devisRef, {
        ...updates,
        dateModification: new Date()
      })
      
      await loadDevis() // Recharger la liste
    } catch (error) {
      console.error('Erreur lors de la mise à jour du devis:', error)
      throw error
    }
  }

  const deleteDevis = async (devisId: string) => {
    try {
      const devisRef = doc(db, 'devis', devisId)
      await deleteDoc(devisRef)
      
      await loadDevis() // Recharger la liste
    } catch (error) {
      console.error('Erreur lors de la suppression du devis:', error)
      throw error
    }
  }

  return {
    devis,
    loading,
    createDevis,
    updateDevis,
    deleteDevis,
    refreshDevis: loadDevis
  }
}
