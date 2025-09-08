import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore'

export async function POST(request: NextRequest) {
  try {
    console.log('=== DEBUT ACTIVATE-USER ===')
    const { token, email, uid } = await request.json()
    console.log('Données reçues:', { token: token?.substring(0, 10) + '...', email, uid })

    if (!token || !email || !uid) {
      return NextResponse.json(
        { error: 'Token, email et UID requis' },
        { status: 400 }
      )
    }

    // Rechercher l'utilisateur pending
    console.log('Recherche de l\'utilisateur pending...')
    const pendingUsersRef = collection(db, 'pendingUsers')
    const q = query(
      pendingUsersRef,
      where('token', '==', token),
      where('email', '==', email),
      where('status', '==', 'pending')
    )
    
    const querySnapshot = await getDocs(q)
    console.log('Utilisateurs pending trouvés:', querySnapshot.size)
    
    if (querySnapshot.empty) {
      return NextResponse.json(
        { error: 'Token invalide' },
        { status: 404 }
      )
    }

    const pendingUserDoc = querySnapshot.docs[0]
    const pendingUserData = pendingUserDoc.data()
    console.log('Données utilisateur pending:', pendingUserData)

    // Trouver le client principal pour ajouter l'utilisateur dans sa sous-collection
    console.log('Recherche du client principal avec uidclient:', pendingUserData.clientId)
    const clientsRef = collection(db, 'clients')
    const clientQuery = query(clientsRef, where('uidclient', '==', pendingUserData.clientId))
    const clientSnapshot = await getDocs(clientQuery)
    console.log('Clients principaux trouvés:', clientSnapshot.size)

    if (clientSnapshot.empty) {
      return NextResponse.json(
        { error: 'Client non trouvé' },
        { status: 404 }
      )
    }

    const clientDoc = clientSnapshot.docs[0]
    const clientId = clientDoc.id
    console.log('Client principal trouvé:', clientId)

    // Créer l'utilisateur dans la sous-collection users du client
    console.log('Création de l\'utilisateur dans la sous-collection users...')
    const usersRef = collection(db, `clients/${clientId}/users`)
    const newUserData = {
      nom: pendingUserData.nom,
      prenom: pendingUserData.prenom,
      email: pendingUserData.email,
      role: pendingUserData.role,
      status: 'active',
      uid: uid,
      isPrimary: false,
      dateCreation: new Date(),
      dateActivation: new Date()
    }
    console.log('Données utilisateur à créer:', newUserData)
    
    const userDocRef = await addDoc(usersRef, newUserData)
    console.log('Utilisateur créé avec ID:', userDocRef.id)

    // Supprimer l'utilisateur pending
    console.log('Suppression de l\'utilisateur pending...')
    await deleteDoc(pendingUserDoc.ref)
    console.log('Utilisateur pending supprimé')

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('=== ERREUR ACTIVATE-USER ===')
    console.error('Type d\'erreur:', error.constructor?.name)
    console.error('Message d\'erreur:', error.message)
    console.error('Stack trace:', error.stack)
    console.error('Erreur complète:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message || 'Erreur inconnue' },
      { status: 500 }
    )
  }
}
