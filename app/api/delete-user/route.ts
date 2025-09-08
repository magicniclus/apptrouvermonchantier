import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'

export async function DELETE(request: NextRequest) {
  try {
    console.log('=== DEBUT DELETE-USER API ===')
    const { userUid } = await request.json()
    console.log('UID utilisateur à supprimer:', userUid)

    if (!userUid) {
      return NextResponse.json(
        { error: 'UID utilisateur requis' },
        { status: 400 }
      )
    }

    // Supprimer l'utilisateur de Firebase Auth avec Admin SDK
    console.log('Suppression de Firebase Auth avec Admin SDK...')
    await adminAuth.deleteUser(userUid)
    console.log('Utilisateur supprimé de Firebase Auth')

    return NextResponse.json({ 
      success: true,
      message: 'Utilisateur supprimé de Firebase Auth avec succès'
    })

  } catch (error: any) {
    console.error('=== ERREUR DELETE-USER ===')
    console.error('Type d\'erreur:', error.constructor?.name)
    console.error('Message d\'erreur:', error.message)
    console.error('Erreur complète:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message || 'Erreur inconnue' },
      { status: 500 }
    )
  }
}
