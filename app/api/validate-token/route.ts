import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'

export async function POST(request: NextRequest) {
  try {
    console.log('=== DEBUT VALIDATE-TOKEN ===')
    const { token, email } = await request.json()
    console.log('Token reçu:', token?.substring(0, 10) + '...')
    console.log('Email reçu:', email)

    if (!token || !email) {
      console.log('ERREUR: Token ou email manquant')
      return NextResponse.json(
        { error: 'Token et email requis' },
        { status: 400 }
      )
    }

    // Rechercher l'utilisateur avec ce token et cet email
    console.log('Recherche dans pendingUsers...')
    const usersRef = collection(db, 'pendingUsers')
    const q = query(
      usersRef,
      where('token', '==', token),
      where('email', '==', email),
      where('status', '==', 'pending')
    )
    
    const querySnapshot = await getDocs(q)
    console.log('Résultats trouvés:', querySnapshot.size)
    
    if (querySnapshot.empty) {
      console.log('ERREUR: Aucun utilisateur trouvé avec ce token/email')
      
      // Debug: chercher sans le status pour voir s'il existe
      const debugQuery = query(usersRef, where('token', '==', token))
      const debugSnapshot = await getDocs(debugQuery)
      console.log('Debug - utilisateurs avec ce token (tous status):', debugSnapshot.size)
      
      return NextResponse.json(
        { error: 'Token invalide ou expiré' },
        { status: 404 }
      )
    }

    const userDoc = querySnapshot.docs[0]
    const userData = userDoc.data()

    // Vérifier si le token n'a pas expiré (24h)
    console.log('Vérification de l\'expiration...')
    const tokenCreatedAt = userData.tokenCreatedAt?.toDate()
    const now = new Date()
    console.log('Token créé à:', tokenCreatedAt)
    console.log('Maintenant:', now)
    
    if (tokenCreatedAt) {
      const hoursDiff = (now.getTime() - tokenCreatedAt.getTime()) / (1000 * 60 * 60)
      console.log('Différence en heures:', hoursDiff)

      if (hoursDiff > 24) {
        console.log('ERREUR: Token expiré')
        return NextResponse.json(
          { error: 'Token expiré' },
          { status: 410 }
        )
      }
    } else {
      console.log('ATTENTION: tokenCreatedAt est null/undefined')
    }

    console.log('Token valide, retour des données utilisateur')
    return NextResponse.json({
      nom: userData.nom,
      prenom: userData.prenom,
      email: userData.email,
      role: userData.role
    })

  } catch (error) {
    console.error('Erreur lors de la validation du token:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
