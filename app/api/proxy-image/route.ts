import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const imageUrl = searchParams.get('url')
    
    if (!imageUrl) {
      return NextResponse.json({ error: 'URL manquante' }, { status: 400 })
    }

    console.log('URL reçue:', imageUrl)
    
    // Validation de l'URL Firebase
    if (!imageUrl.includes('firebasestorage.googleapis.com')) {
      return NextResponse.json({ error: 'URL Firebase invalide' }, { status: 400 })
    }
    
    const finalUrl = imageUrl
    console.log('URL finale:', finalUrl)
    
    // Fetch l'image depuis Firebase Storage
    const response = await fetch(finalUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PDF-Generator/1.0)',
      },
    })

    if (!response.ok) {
      console.error('Erreur Firebase Storage:', response.status, response.statusText)
      return NextResponse.json(
        { error: `Erreur Firebase Storage: ${response.status} ${response.statusText}` }, 
        { status: response.status }
      )
    }
    
    console.log('Image récupérée avec succès, taille:', response.headers.get('content-length'))

    const imageBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/png'

    // Retourner l'image avec les bons headers CORS
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Cache-Control': 'public, max-age=3600', // Cache 1h
      },
    })
  } catch (error) {
    console.error('Erreur proxy image:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors du chargement de l\'image' }, 
      { status: 500 }
    )
  }
}
