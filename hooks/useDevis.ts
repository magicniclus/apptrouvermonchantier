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
  conditionsAcceptation?: string
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
  const { user } = useAuth()

  const loadDevis = async () => {
    if (!user) {
      console.log('❌ useDevis: Pas d\'utilisateur connecté')
      setLoading(false)
      return
    }

    try {
      console.log('🔄 useDevis: Chargement des devis pour user:', user.uid)
      
      // Find main client document using uidclient
      const clientsRef = collection(db, 'clients')
      const clientsQuery = query(clientsRef, where('uidclient', '==', user.uid))
      const clientsSnapshot = await getDocs(clientsQuery)

      if (clientsSnapshot.empty) {
        console.log('❌ Aucun client trouvé avec uidclient:', user.uid)
        setDevis([])
        setLoading(false)
        return
      }

      const mainClientDoc = clientsSnapshot.docs[0]
      const mainClientId = mainClientDoc.id
      console.log('✅ Client principal trouvé avec ID:', mainClientId)

      // Fetch devis from subcollection
      const devisRef = collection(db, `clients/${mainClientId}/devis`)
      console.log('🔍 Recherche des devis dans:', `clients/${mainClientId}/devis`)
      
      const querySnapshot = await getDocs(devisRef)
      console.log('📊 useDevis: Nombre de devis trouvés:', querySnapshot.size)
      
      const devisList: Devis[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        devisList.push({
          id: doc.id,
          numeroDevis: data.numeroDevis || data.id,
          clientId: data.clientId || '',
          clientNom: data.clientNom || '',
          clientEmail: data.clientEmail || '',
          dateCreation: data.dateCreation,
          dateValidite: data.dateValidite,
          statut: data.status || 'brouillon', // Map status to statut
          montantHT: data.montantTotalHT || 0,
          montantTTC: data.montantTotalTTC || data.montantTotalHT || 0,
          montantTVA: data.montantTotalTVA || 0,
          tauxTVA: 20, // Default
          devise: 'EUR',
          validiteDuree: data.validiteDuree || 60,
          adresseDevis: {
            nom: data.clientNom || '',
            adresse: '',
            codePostal: '',
            ville: '',
            pays: 'France'
          },
          lignes: data.lignes || [],
          conditions: data.conditions || '',
          notes: data.notes || '',
          conditionsAcceptation: data.conditionsAcceptation || 'Pour être accepté, le devis doit être daté, signé et suivi de la mention manuscrite « Bon pour accord ».',
          envoye: data.status !== 'brouillon',
          historique: []
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
  }, [user])

  const createDevis = async (devisData: Omit<Devis, 'id'>) => {
    if (!user) return null

    try {
      // Find main client document using uidclient
      const clientsRef = collection(db, 'clients')
      const clientsQuery = query(clientsRef, where('uidclient', '==', user.uid))
      const clientsSnapshot = await getDocs(clientsQuery)

      if (clientsSnapshot.empty) {
        throw new Error('Aucun client trouvé')
      }

      const mainClientDoc = clientsSnapshot.docs[0]
      const mainClientId = mainClientDoc.id

      const devisRef = collection(db, `clients/${mainClientId}/devis`)
      const docRef = await addDoc(devisRef, {
        ...devisData,
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
    if (!user) return

    try {
      // Find main client document using uidclient
      const clientsRef = collection(db, 'clients')
      const clientsQuery = query(clientsRef, where('uidclient', '==', user.uid))
      const clientsSnapshot = await getDocs(clientsQuery)

      if (clientsSnapshot.empty) {
        throw new Error('Aucun client trouvé')
      }

      const mainClientDoc = clientsSnapshot.docs[0]
      const mainClientId = mainClientDoc.id

      // Préparer les données de mise à jour en mappant statut vers status
      const updateData: any = { ...updates }
      if (updates.statut) {
        updateData.status = updates.statut
        delete updateData.statut
      }
      updateData.dateModification = new Date()

      const devisRef = doc(db, `clients/${mainClientId}/devis`, devisId)
      await updateDoc(devisRef, updateData)
      
      // Mettre à jour le state local immédiatement pour une meilleure UX
      setDevis(prevDevis => 
        prevDevis.map(devis => 
          devis.id === devisId 
            ? { ...devis, ...updates }
            : devis
        )
      )
      
      // Recharger la liste pour s'assurer de la cohérence
      await loadDevis()
    } catch (error) {
      console.error('Erreur lors de la mise à jour du devis:', error)
      throw error
    }
  }

  const deleteDevis = async (devisId: string) => {
    if (!user) return

    try {
      // Find main client document using uidclient
      const clientsRef = collection(db, 'clients')
      const clientsQuery = query(clientsRef, where('uidclient', '==', user.uid))
      const clientsSnapshot = await getDocs(clientsQuery)

      if (clientsSnapshot.empty) {
        throw new Error('Aucun client trouvé')
      }

      const mainClientDoc = clientsSnapshot.docs[0]
      const mainClientId = mainClientDoc.id

      const devisRef = doc(db, `clients/${mainClientId}/devis`, devisId)
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
