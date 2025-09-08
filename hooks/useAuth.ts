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
          // D'abord chercher si c'est un client principal
          const clientsRef = collection(db, 'clients')
          const q = query(clientsRef, where('uidclient', '==', user.uid))
          const querySnapshot = await getDocs(q)
          
          if (!querySnapshot.empty) {
            // Client principal trouvé
            const clientDoc = querySnapshot.docs[0]
            setClientData({
              id: clientDoc.id,
              ...clientDoc.data()
            } as ClientData)
          } else {
            // Pas trouvé comme client principal, chercher dans les sous-comptes
            console.log('Recherche dans les sous-comptes pour UID:', user.uid)
            
            // Récupérer tous les clients principaux
            const allClientsSnapshot = await getDocs(collection(db, 'clients'))
            console.log('Nombre de clients principaux:', allClientsSnapshot.size)
            
            let found = false
            for (const clientDoc of allClientsSnapshot.docs) {
              console.log('Vérification client:', clientDoc.id)
              
              // Chercher dans la sous-collection users de chaque client
              const usersRef = collection(db, `clients/${clientDoc.id}/users`)
              const userQuery = query(usersRef, where('uid', '==', user.uid))
              const userSnapshot = await getDocs(userQuery)
              
              console.log(`Sous-comptes trouvés dans ${clientDoc.id}:`, userSnapshot.size)
              
              if (!userSnapshot.empty) {
                // Sous-compte trouvé, utiliser les données du client principal
                console.log('Sous-compte trouvé dans le client:', clientDoc.id)
                const userData = userSnapshot.docs[0].data()
                console.log('Données utilisateur:', userData)
                
                setClientData({
                  id: clientDoc.id,
                  ...clientDoc.data()
                } as ClientData)
                found = true
                break
              }
            }
            
            if (!found) {
              console.log('ERREUR: Aucun sous-compte trouvé pour cet UID')
            }
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
