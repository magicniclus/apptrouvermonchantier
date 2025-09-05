'use client'

import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'

export interface Client {
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
}

export function useClients() {
  const { user } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setClients([])
      setLoading(false)
      return
    }

    console.log('🔍 Recherche des clients pour user:', user.uid)

    let unsubscribe: (() => void) | null = null

    const setupListener = async () => {
      try {
        // D'abord essayer avec la structure sous-collection
        const clientsRef = collection(db, 'clients')
        const userQuery = query(clientsRef, where('uidclient', '==', user.uid))
        
        const userSnapshot = await getDocs(userQuery)
        
        if (!userSnapshot.empty) {
          console.log('👤 Document utilisateur trouvé, utilisation sous-collection')
          const userClientDoc = userSnapshot.docs[0]
          const userClientId = userClientDoc.id
          
          // Écouter la sous-collection
          const userClientsRef = collection(db, 'clients', userClientId, 'clients')
          unsubscribe = onSnapshot(userClientsRef, (snapshot) => {
            console.log('📊 Sous-collection snapshot:', snapshot.docs.length)
            
            const clientsList: Client[] = []
            snapshot.forEach((doc) => {
              const clientData = {
                id: doc.id,
                ...doc.data()
              } as Client
              console.log('👤 Client sous-collection:', clientData)
              clientsList.push(clientData)
            })
            
            clientsList.sort((a, b) => {
              if (a.dateCreation && b.dateCreation) {
                return b.dateCreation.toDate() - a.dateCreation.toDate()
              }
              return 0
            })
            
            console.log('✅ Clients sous-collection:', clientsList)
            setClients(clientsList)
            setLoading(false)
          })
        } else {
          console.log('📁 Pas de document utilisateur, utilisation collection principale')
          // Fallback: collection principale avec userId
          const q = query(clientsRef, where('userId', '==', user.uid))
          
          unsubscribe = onSnapshot(q, (snapshot) => {
            console.log('📊 Collection principale snapshot:', snapshot.docs.length)
            
            const clientsList: Client[] = []
            snapshot.forEach((doc) => {
              const clientData = {
                id: doc.id,
                ...doc.data()
              } as Client
              console.log('👤 Client collection principale:', clientData)
              clientsList.push(clientData)
            })
            
            clientsList.sort((a, b) => {
              if (a.dateCreation && b.dateCreation) {
                return b.dateCreation.toDate() - a.dateCreation.toDate()
              }
              return 0
            })
            
            console.log('✅ Clients collection principale:', clientsList)
            setClients(clientsList)
            setLoading(false)
          }, (err) => {
            console.error('❌ Erreur dans onSnapshot:', err)
            setError('Erreur lors du chargement des clients')
            setLoading(false)
          })
        }
      } catch (err) {
        console.error('❌ Erreur lors de la configuration du listener:', err)
        setError('Erreur lors du chargement des clients')
        setLoading(false)
      }
    }

    setupListener()

    return () => {
      console.log('🧹 Nettoyage du listener')
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [user])

  return { clients, loading, error }
}
