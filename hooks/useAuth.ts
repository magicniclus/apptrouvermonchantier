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

interface UserData {
  id: string
  nom: string
  prenom: string
  email: string
  role: string
  uid: string
  isPrimary?: boolean
  [key: string]: any
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [clientData, setClientData] = useState<ClientData | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
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
            const clientDataFromDoc = clientDoc.data()
            setClientData({
              id: clientDoc.id,
              ...clientDataFromDoc
            } as ClientData)
            
            // Pour un client principal, créer userData à partir des données client
            setUserData({
              id: clientDoc.id,
              nom: clientDataFromDoc.nom || '',
              prenom: clientDataFromDoc.prenom || '',
              email: clientDataFromDoc.email || '',
              role: 'admin',
              uid: user.uid,
              isPrimary: true
            } as UserData)
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
                // Sous-compte trouvé
                console.log('Sous-compte trouvé dans le client:', clientDoc.id)
                const userDocData = userSnapshot.docs[0].data()
                const userDocId = userSnapshot.docs[0].id
                console.log('Données utilisateur:', userDocData)
                
                // Définir les données du client principal
                setClientData({
                  id: clientDoc.id,
                  ...clientDoc.data()
                } as ClientData)
                
                // Définir les données de l'utilisateur sous-compte
                setUserData({
                  id: userDocId,
                  nom: userDocData.nom || '',
                  prenom: userDocData.prenom || '',
                  email: userDocData.email || '',
                  role: userDocData.role || 'user',
                  uid: user.uid,
                  isPrimary: userDocData.isPrimary || false,
                  ...userDocData
                } as UserData)
                
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
        setUserData(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return { user, clientData, userData, loading }
}
