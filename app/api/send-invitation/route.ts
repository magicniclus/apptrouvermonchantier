import { NextRequest, NextResponse } from 'next/server'
import sgMail from '@sendgrid/mail'
import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    console.log('=== DEBUT API SEND-INVITATION ===')
    
    // Configuration SendGrid
    console.log('Vérification SENDGRID_API_KEY...')
    if (!process.env.SENDGRID_API_KEY) {
      console.log('ERREUR: SENDGRID_API_KEY manquante')
      return NextResponse.json(
        { error: 'SENDGRID_API_KEY is required' },
        { status: 500 }
      )
    }

    console.log('SENDGRID_API_KEY trouvée, longueur:', process.env.SENDGRID_API_KEY.length)
    
    if (!process.env.SENDGRID_API_KEY.startsWith('SG.')) {
      console.log('ERREUR: SENDGRID_API_KEY ne commence pas par SG.')
      return NextResponse.json(
        { error: 'SENDGRID_API_KEY must start with "SG."' },
        { status: 500 }
      )
    }

    console.log('Configuration SendGrid...')
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    
    console.log('Parsing request body...')
    const { email, nom, prenom, role, clientId } = await request.json()
    console.log('Données reçues:', { email, nom, prenom, role, clientId })

    if (!email || !nom || !prenom || !role || !clientId) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      )
    }

    // Générer un token unique
    console.log('Génération du token...')
    const token = crypto.randomBytes(32).toString('hex')
    console.log('Token généré:', token.substring(0, 10) + '...')

    // Sauvegarder l'utilisateur en attente
    console.log('Sauvegarde dans pendingUsers...')
    const pendingUsersRef = collection(db, 'pendingUsers')
    await addDoc(pendingUsersRef, {
      email,
      nom,
      prenom,
      role,
      clientId,
      token,
      status: 'pending',
      tokenCreatedAt: serverTimestamp(),
      dateCreation: serverTimestamp()
    })
    console.log('Utilisateur pending sauvegardé')

    // URL de création de mot de passe
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://trouver-mon-chantier.fr' 
      : 'http://localhost:3000'
    const passwordCreationUrl = `${baseUrl}/creation-mot-de-passe?token=${token}&email=${encodeURIComponent(email)}`
    console.log('URL générée:', passwordCreationUrl)

    // Template HTML de l'email
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invitation à rejoindre Trouver Mon Chantier</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 0;
                background-color: #f8fafc;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
            }
            .logo {
                width: 60px;
                height: 60px;
                margin: 0 auto 20px;
                background-color: rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                font-weight: bold;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 700;
            }
            .header p {
                margin: 10px 0 0;
                font-size: 16px;
                opacity: 0.9;
            }
            .content {
                padding: 40px 30px;
            }
            .greeting {
                font-size: 18px;
                font-weight: 600;
                color: #1f2937;
                margin-bottom: 20px;
            }
            .message {
                font-size: 16px;
                color: #4b5563;
                margin-bottom: 30px;
                line-height: 1.7;
            }
            .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                color: white;
                text-decoration: none;
                padding: 16px 32px;
                border-radius: 8px;
                font-weight: 600;
                font-size: 16px;
                text-align: center;
                margin: 20px 0;
                box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);
                transition: all 0.2s ease;
            }
            .cta-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 12px rgba(59, 130, 246, 0.4);
            }
            .info-box {
                background-color: #f1f5f9;
                border-left: 4px solid #3b82f6;
                padding: 20px;
                margin: 30px 0;
                border-radius: 0 8px 8px 0;
            }
            .info-box h3 {
                margin: 0 0 10px;
                color: #1f2937;
                font-size: 16px;
                font-weight: 600;
            }
            .info-box p {
                margin: 0;
                color: #4b5563;
                font-size: 14px;
            }
            .footer {
                background-color: #f8fafc;
                padding: 30px;
                text-align: center;
                border-top: 1px solid #e5e7eb;
            }
            .footer p {
                margin: 0;
                color: #6b7280;
                font-size: 14px;
            }
            .footer a {
                color: #3b82f6;
                text-decoration: none;
            }
            .security-note {
                background-color: #fef3c7;
                border: 1px solid #f59e0b;
                border-radius: 8px;
                padding: 15px;
                margin: 20px 0;
            }
            .security-note p {
                margin: 0;
                color: #92400e;
                font-size: 14px;
            }
            @media (max-width: 600px) {
                .container {
                    margin: 0;
                    border-radius: 0;
                }
                .header, .content, .footer {
                    padding: 20px;
                }
                .cta-button {
                    display: block;
                    width: 100%;
                    box-sizing: border-box;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">TMC</div>
                <h1>Invitation à rejoindre</h1>
                <p>Trouver Mon Chantier</p>
            </div>
            
            <div class="content">
                <div class="greeting">
                    Bonjour ${prenom} ${nom},
                </div>
                
                <div class="message">
                    Vous avez été invité(e) à rejoindre la plateforme <strong>Trouver Mon Chantier</strong> en tant que <strong>${role}</strong>.
                    <br><br>
                    Pour finaliser la création de votre compte, vous devez créer votre mot de passe en cliquant sur le bouton ci-dessous.
                </div>
                
                <div style="text-align: center;">
                    <a href="${passwordCreationUrl}" class="cta-button">
                        🔐 Créer mon mot de passe
                    </a>
                </div>
                
                <div class="info-box">
                    <h3>📧 Votre adresse email</h3>
                    <p>${email}</p>
                </div>
                
                <div class="security-note">
                    <p>
                        <strong>⚠️ Important :</strong> Ce lien est valide pendant 24 heures. 
                        Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email.
                    </p>
                </div>
                
                <div class="message">
                    Une fois votre compte créé, vous pourrez accéder à toutes les fonctionnalités de la plateforme selon vos permissions.
                    <br><br>
                    Si vous rencontrez des difficultés, n'hésitez pas à nous contacter.
                </div>
            </div>
            
            <div class="footer">
                <p>
                    Cet email a été envoyé par <strong>Trouver Mon Chantier</strong><br>
                    <a href="mailto:service@trouver-mon-chantier.fr">service@trouver-mon-chantier.fr</a>
                </p>
                <p style="margin-top: 15px; font-size: 12px; color: #9ca3af;">
                    Si vous ne souhaitez plus recevoir ces emails, 
                    <a href="#" style="color: #9ca3af;">cliquez ici pour vous désabonner</a>
                </p>
            </div>
        </div>
    </body>
    </html>
    `

    // Configuration de l'email
    const msg = {
      to: email,
      from: {
        email: 'service@trouver-mon-chantier.fr',
        name: 'Trouver Mon Chantier'
      },
      subject: `Invitation à rejoindre Trouver Mon Chantier - ${prenom} ${nom}`,
      html: htmlContent,
      text: `
Bonjour ${prenom} ${nom},

Vous avez été invité(e) à rejoindre la plateforme Trouver Mon Chantier en tant que ${role}.

Pour finaliser la création de votre compte, créez votre mot de passe en suivant ce lien :
${passwordCreationUrl}

Votre adresse email : ${email}

Ce lien est valide pendant 24 heures.

Cordialement,
L'équipe Trouver Mon Chantier
service@trouver-mon-chantier.fr
      `
    }

    // Envoyer l'email
    await sgMail.send(msg)

    return NextResponse.json({ 
      success: true, 
      message: 'Invitation envoyée avec succès' 
    })

  } catch (error: any) {
    console.error('Erreur lors de l\'envoi de l\'invitation:', error)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
    if (error.response?.body?.errors) {
      console.error('Erreurs SendGrid:', error.response.body.errors)
    }

    return NextResponse.json(
      { 
        error: 'Erreur lors de l\'envoi de l\'invitation',
        details: error.message,
        sendgridErrors: error.response?.body?.errors || null
      },
      { status: 500 }
    )
  }
}
