'use client'

import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from './useAuth'

export interface Facture {
  id: string
  numeroFacture: string
  clientId: string
  clientNom: string
  clientEmail: string
  dateCreation: any
  dateEcheance: any
  dateReglement?: any
  statut: 'brouillon' | 'facturee' | 'payee' | 'en_retard' | 'annulee'
  montantHT: number
  montantTTC: number
  tauxTVA: number
  montantTVA: number
  devise: string
  conditions: {
    delaiPaiement: number
    penalitesRetard: number
    escompte: number
  }
  adresseFacturation: {
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
  notes: string
  fichierPDF?: string
  envoyee: boolean
  dateEnvoi?: any
  historique: Array<{
    date: any
    action: string
    utilisateur: string
    details: string
  }>
}

export function useFactures() {
  const [factures, setFactures] = useState<Facture[]>([])
  const [loading, setLoading] = useState(true)
  const { user, clientData } = useAuth()

  const loadFactures = async () => {
    if (!user?.uid) {
      console.log('❌ useFactures: Pas d\'utilisateur connecté')
      setLoading(false)
      return
    }

    try {
      console.log('🔄 useFactures: Chargement des factures pour utilisateur:', user.uid)
      
      // Trouver le client principal
      const clientsRef = collection(db, 'clients')
      const clientsSnapshot = await getDocs(query(clientsRef, where('uidclient', '==', user.uid)))
      
      if (clientsSnapshot.empty) {
        console.log('❌ useFactures: Aucun client principal trouvé')
        setFactures([])
        setLoading(false)
        return
      }

      const mainClientDoc = clientsSnapshot.docs[0]
      const mainClientId = mainClientDoc.id
      console.log('✅ useFactures: Client principal trouvé:', mainClientId)
      
      // Récupérer les factures de la sous-collection
      const facturesRef = collection(db, `clients/${mainClientId}/factures`)
      const querySnapshot = await getDocs(facturesRef)
      console.log('📊 useFactures: Nombre de factures trouvées:', querySnapshot.size)
      
      const facturesList: Facture[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        facturesList.push({
          id: doc.id,
          ...data
        } as Facture)
      })
      
      // Trier par date de création (plus récent en premier)
      facturesList.sort((a, b) => {
        const dateA = a.dateCreation?.toDate ? a.dateCreation.toDate() : new Date(a.dateCreation)
        const dateB = b.dateCreation?.toDate ? b.dateCreation.toDate() : new Date(b.dateCreation)
        return dateB.getTime() - dateA.getTime()
      })
      
      console.log('✅ useFactures: Factures chargées:', facturesList)
      setFactures(facturesList)
    } catch (error) {
      console.error('❌ useFactures: Erreur lors du chargement des factures:', error)
      setFactures([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFactures()
  }, [user])

  const createFacture = async (factureData: Omit<Facture, 'id'>) => {
    if (!user?.uid) return null

    try {
      // Trouver le client principal
      const clientsRef = collection(db, 'clients')
      const clientsSnapshot = await getDocs(query(clientsRef, where('uidclient', '==', user.uid)))
      
      if (clientsSnapshot.empty) {
        throw new Error('Client principal non trouvé')
      }

      const mainClientId = clientsSnapshot.docs[0].id
      const facturesRef = collection(db, `clients/${mainClientId}/factures`)
      
      const docRef = await addDoc(facturesRef, {
        ...factureData,
        dateCreation: new Date(),
        historique: [{
          date: new Date(),
          action: 'creation',
          utilisateur: user?.email || '',
          details: 'Facture créée'
        }]
      })
      
      await loadFactures() // Recharger la liste
      return docRef.id
    } catch (error) {
      console.error('Erreur lors de la création de la facture:', error)
      throw error
    }
  }

  const updateFacture = async (factureId: string, updates: Partial<Facture>) => {
    if (!user?.uid) return

    try {
      // Trouver le client principal
      const clientsRef = collection(db, 'clients')
      const clientsSnapshot = await getDocs(query(clientsRef, where('uidclient', '==', user.uid)))
      
      if (clientsSnapshot.empty) {
        throw new Error('Client principal non trouvé')
      }

      const mainClientId = clientsSnapshot.docs[0].id
      const factureRef = doc(db, `clients/${mainClientId}/factures`, factureId)
      
      await updateDoc(factureRef, {
        ...updates,
        dateModification: new Date()
      })
      
      await loadFactures() // Recharger la liste
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la facture:', error)
      throw error
    }
  }

  const deleteFacture = async (factureId: string) => {
    if (!user?.uid) return

    try {
      // Trouver le client principal
      const clientsRef = collection(db, 'clients')
      const clientsSnapshot = await getDocs(query(clientsRef, where('uidclient', '==', user.uid)))
      
      if (clientsSnapshot.empty) {
        throw new Error('Client principal non trouvé')
      }

      const mainClientId = clientsSnapshot.docs[0].id
      const factureRef = doc(db, `clients/${mainClientId}/factures`, factureId)
      
      await deleteDoc(factureRef)
      
      await loadFactures() // Recharger la liste
    } catch (error) {
      console.error('Erreur lors de la suppression de la facture:', error)
      throw error
    }
  }

  return {
    factures,
    loading,
    createFacture,
    updateFacture,
    deleteFacture,
    refreshFactures: loadFactures
  }
}
