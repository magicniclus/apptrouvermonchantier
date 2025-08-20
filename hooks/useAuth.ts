'use client'

import { useState, useEffect } from 'react'
import { User, onAuthStateChanged } from 'firebase/auth'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'

interface ClientData {
  id: string
  nom: string
  prenom: string
  email: string
  telephone: string
  ville: string
  [key: string]: any
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [clientData, setClientData] = useState<ClientData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user)
        
        // Récupérer les données client depuis Firestore
        try {
          const clientsRef = collection(db, 'clients')
          const q = query(clientsRef, where('uidclient', '==', user.uid))
          const querySnapshot = await getDocs(q)
          
          if (!querySnapshot.empty) {
            const clientDoc = querySnapshot.docs[0]
            setClientData({
              id: clientDoc.id,
              ...clientDoc.data()
            } as ClientData)
          }
        } catch (error) {
          console.error('Erreur lors de la récupération des données client:', error)
        }
      } else {
        setUser(null)
        setClientData(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return { user, clientData, loading }
}
