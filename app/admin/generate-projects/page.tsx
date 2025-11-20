'use client'

import { useState } from 'react'
import { collection, addDoc, doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// ID utilisateur fourni
const CLIENT_UID = "tRxySE0awOcnk3j4s6Fj"

// Données des projets à créer
const projetsData = [
  // OCTOBRE 2024 - 15 projets
  {
    nom: "Martin",
    prenom: "Jean",
    email: "jean.martin@gmail.com",
    telephone: "01 45 67 89 12",
    motif: "Réfection complète de toiture ardoise suite à tempête",
    status: "nouveau",
    dateCreation: new Date(2024, 9, 3),
    source: "popup",
    rgpd: true,
    uid: CLIENT_UID
  },
  {
    nom: "Dubois",
    prenom: "Marie",
    email: "marie.dubois@orange.fr",
    telephone: "02 34 56 78 90",
    motif: "Remplacement tuiles cassées et nettoyage gouttières",
    status: "A contacter",
    dateCreation: new Date(2024, 9, 5),
    source: "formulaire_contact",
    rgpd: true,
    uid: CLIENT_UID
  },
  {
    nom: "Bernard",
    prenom: "Pierre",
    email: "p.bernard@free.fr",
    telephone: "03 12 34 56 78",
    motif: "Isolation sous-toiture et pose de velux",
    status: "En cours",
    dateCreation: new Date(2024, 9, 8),
    source: "telephone",
    rgpd: true,
    uid: CLIENT_UID
  },
  {
    nom: "Thomas",
    prenom: "Nathalie",
    email: "nathalie.thomas@hotmail.fr",
    telephone: "04 98 76 54 32",
    motif: "Réparation fuite toiture après dégât des eaux",
    status: "nouveau",
    dateCreation: new Date(2024, 9, 10),
    source: "recommandation",
    rgpd: true,
    uid: CLIENT_UID
  },
  {
    nom: "Robert",
    prenom: "Michel",
    email: "michel.robert@yahoo.fr",
    telephone: "05 67 89 01 23",
    motif: "Démoussage et traitement hydrofuge de toiture",
    status: "En attente",
    dateCreation: new Date(2024, 9, 12),
    source: "site_web",
    rgpd: true,
    uid: CLIENT_UID
  },
  {
    nom: "Petit",
    prenom: "Isabelle",
    email: "isabelle.petit@outlook.fr",
    telephone: "06 45 67 89 01",
    motif: "Installation de panneaux solaires sur toiture",
    status: "nouveau",
    dateCreation: new Date(2024, 9, 15),
    source: "popup",
    rgpd: true,
    uid: CLIENT_UID
  },
  {
    nom: "Durand",
    prenom: "Philippe",
    email: "philippe.durand@wanadoo.fr",
    telephone: "01 23 45 67 89",
    motif: "Rénovation charpente et couverture maison ancienne",
    status: "A contacter",
    dateCreation: new Date(2024, 9, 17),
    source: "formulaire_contact",
    rgpd: true,
    uid: CLIENT_UID
  },
  {
    nom: "Leroy",
    prenom: "Sylvie",
    email: "sylvie.leroy@gmail.com",
    telephone: "02 87 65 43 21",
    motif: "Pose de gouttières zinc et descentes pluviales",
    status: "En cours",
    dateCreation: new Date(2024, 9, 19),
    source: "telephone",
    rgpd: true,
    uid: CLIENT_UID
  },
  {
    nom: "Moreau",
    prenom: "Alain",
    email: "alain.moreau@free.fr",
    telephone: "03 56 78 90 12",
    motif: "Étanchéité toit terrasse et membrane EPDM",
    status: "nouveau",
    dateCreation: new Date(2024, 9, 21),
    source: "recommandation",
    rgpd: true,
    uid: CLIENT_UID
  },
  {
    nom: "Simon",
    prenom: "Catherine",
    email: "catherine.simon@orange.fr",
    telephone: "04 34 56 78 90",
    motif: "Changement de faîtage et arêtiers défaillants",
    status: "Terminé",
    dateCreation: new Date(2024, 9, 23),
    source: "site_web",
    rgpd: true,
    uid: CLIENT_UID
  },
  {
    nom: "Laurent",
    prenom: "Bernard",
    email: "bernard.laurent@hotmail.fr",
    telephone: "05 12 34 56 78",
    motif: "Réparation urgente suite à chute d'arbre sur toit",
    status: "nouveau",
    dateCreation: new Date(2024, 9, 25),
    source: "popup",
    rgpd: true,
    uid: CLIENT_UID
  },
  {
    nom: "Lefebvre",
    prenom: "Françoise",
    email: "francoise.lefebvre@yahoo.fr",
    telephone: "06 90 12 34 56",
    motif: "Pose de chatières et aérateurs de toiture",
    status: "A contacter",
    dateCreation: new Date(2024, 9, 26),
    source: "formulaire_contact",
    rgpd: true,
    uid: CLIENT_UID
  },
  {
    nom: "Michel",
    prenom: "Christian",
    email: "christian.michel@outlook.fr",
    telephone: "01 78 90 12 34",
    motif: "Réfection zinguerie et évacuation eaux pluviales",
    status: "En cours",
    dateCreation: new Date(2024, 9, 28),
    source: "telephone",
    rgpd: true,
    uid: CLIENT_UID
  },
  {
    nom: "Garcia",
    prenom: "Monique",
    email: "monique.garcia@wanadoo.fr",
    telephone: "02 56 78 90 12",
    motif: "Installation de crochets de sécurité pour déneigement",
    status: "nouveau",
    dateCreation: new Date(2024, 9, 29),
    source: "recommandation",
    rgpd: true,
    uid: CLIENT_UID
  },
  {
    nom: "David",
    prenom: "Daniel",
    email: "daniel.david@gmail.com",
    telephone: "03 34 56 78 90",
    motif: "Traitement anti-mousse et peinture toiture fibro-ciment",
    status: "En attente",
    dateCreation: new Date(2024, 9, 31),
    source: "site_web",
    rgpd: true,
    uid: CLIENT_UID
  },

  // NOVEMBRE 2024 - 17 projets
  {
    nom: "Bertrand",
    prenom: "Brigitte",
    email: "brigitte.bertrand@free.fr",
    telephone: "04 12 34 56 78",
    motif: "Pose de bac acier isolé sur hangar agricole",
    status: "nouveau",
    dateCreation: new Date(2024, 10, 2),
    source: "popup",
    rgpd: true,
    uid: CLIENT_UID
  },
  {
    nom: "Roux",
    prenom: "Patrick",
    email: "patrick.roux@orange.fr",
    telephone: "05 90 12 34 56",
    motif: "Réparation solins de cheminée et étanchéité",
    status: "A contacter",
    dateCreation: new Date(2024, 10, 4),
    source: "formulaire_contact",
    rgpd: true,
    uid: CLIENT_UID
  },
  {
    nom: "Vincent",
    prenom: "Christine",
    email: "christine.vincent@hotmail.fr",
    telephone: "06 78 90 12 34",
    motif: "Installation de pare-neige et garde-corps toiture",
    status: "En cours",
    dateCreation: new Date(2024, 10, 6),
    source: "telephone",
    rgpd: true,
    uid: CLIENT_UID
  },
  {
    nom: "Fournier",
    prenom: "André",
    email: "andre.fournier@yahoo.fr",
    telephone: "01 56 78 90 12",
    motif: "Rénovation toiture tuiles mécaniques avec isolation",
    status: "nouveau",
    dateCreation: new Date(2024, 10, 8),
    source: "recommandation",
    rgpd: true,
    uid: CLIENT_UID
  },
  {
    nom: "Morel",
    prenom: "Véronique",
    email: "veronique.morel@outlook.fr",
    telephone: "02 34 56 78 90",
    motif: "Pose de membrane d'étanchéité sur toit plat",
    status: "En attente",
    dateCreation: new Date(2024, 10, 10),
    source: "site_web",
    rgpd: true,
    uid: CLIENT_UID
  },
  {
    nom: "Girard",
    prenom: "Julien",
    email: "julien.girard@wanadoo.fr",
    telephone: "03 12 34 56 78",
    motif: "Remplacement de la couverture en shingle",
    status: "nouveau",
    dateCreation: new Date(2024, 10, 12),
    source: "popup",
    rgpd: true,
    uid: CLIENT_UID
  },
  {
    nom: "Andre",
    prenom: "Nicolas",
    email: "nicolas.andre@gmail.com",
    telephone: "04 90 12 34 56",
    motif: "Installation de lucarnes et fenêtres de toit",
    status: "A contacter",
    dateCreation: new Date(2024, 10, 14),
    source: "formulaire_contact",
    rgpd: true,
    uid: CLIENT_UID
  },
  {
    nom: "Lefevre",
    prenom: "Sébastien",
    email: "sebastien.lefevre@free.fr",
    telephone: "05 78 90 12 34",
    motif: "Réparation de la charpente suite à insectes xylophages",
    status: "En cours",
    dateCreation: new Date(2024, 10, 16),
    source: "telephone",
    rgpd: true,
    uid: CLIENT_UID
  },
  {
    nom: "Mercier",
    prenom: "Christophe",
    email: "christophe.mercier@orange.fr",
    telephone: "06 56 78 90 12",
    motif: "Pose de bardage métallique sur pignon",
    status: "nouveau",
    dateCreation: new Date(2024, 10, 18),
    source: "recommandation",
    rgpd: true,
    uid: CLIENT_UID
  },
  {
    nom: "Dupont",
    prenom: "David",
    email: "david.dupont@hotmail.fr",
    telephone: "01 34 56 78 90",
    motif: "Étanchéité de terrasse accessible avec dalles",
    status: "Terminé",
    dateCreation: new Date(2024, 10, 20),
    source: "site_web",
    rgpd: true,
    uid: CLIENT_UID
  },
  {
    nom: "Lambert",
    prenom: "Stéphane",
    email: "stephane.lambert@yahoo.fr",
    telephone: "02 12 34 56 78",
    motif: "Installation de système de récupération d'eau de pluie",
    status: "nouveau",
    dateCreation: new Date(2024, 10, 22),
    source: "popup",
    rgpd: true,
    uid: CLIENT_UID
  },
  {
    nom: "Bonnet",
    prenom: "Pascal",
    email: "pascal.bonnet@outlook.fr",
    telephone: "03 90 12 34 56",
    motif: "Réfection complète toiture avec charpente traditionnelle",
    status: "A contacter",
    dateCreation: new Date(2024, 10, 24),
    source: "formulaire_contact",
    rgpd: true,
    uid: CLIENT_UID
  },
  {
    nom: "Francois",
    prenom: "Thierry",
    email: "thierry.francois@wanadoo.fr",
    telephone: "04 78 90 12 34",
    motif: "Pose de brise-soleil orientable sur terrasse",
    status: "En cours",
    dateCreation: new Date(2024, 10, 26),
    source: "telephone",
    rgpd: true,
    uid: CLIENT_UID
  },
  {
    nom: "Martinez",
    prenom: "Frédéric",
    email: "frederic.martinez@gmail.com",
    telephone: "05 56 78 90 12",
    motif: "Traitement préventif charpente contre les parasites",
    status: "nouveau",
    dateCreation: new Date(2024, 10, 28),
    source: "recommandation",
    rgpd: true,
    uid: CLIENT_UID
  },
  {
    nom: "Legrand",
    prenom: "Laurent",
    email: "laurent.legrand@free.fr",
    telephone: "06 34 56 78 90",
    motif: "Installation de verrière sur toit d'atelier",
    status: "En attente",
    dateCreation: new Date(2024, 10, 29),
    source: "site_web",
    rgpd: true,
    uid: CLIENT_UID
  },
  {
    nom: "Rousseau",
    prenom: "Sandrine",
    email: "sandrine.rousseau@orange.fr",
    telephone: "01 12 34 56 78",
    motif: "Réparation de noue et raccordement toitures",
    status: "nouveau",
    dateCreation: new Date(2024, 10, 30),
    source: "popup",
    rgpd: true,
    uid: CLIENT_UID
  }
]

export default function GenerateProjectsPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [generatedCount, setGeneratedCount] = useState(0)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${message}`])
  }

  const generateProjects = async () => {
    setIsGenerating(true)
    setProgress(0)
    setGeneratedCount(0)
    setLogs([])
    
    addLog("🚀 Début de la génération des projets pour le couvreur...")

    try {
      // Vérifier si le document client existe, sinon le créer
      const clientRef = doc(db, 'clients', CLIENT_UID)
      const clientDoc = await getDoc(clientRef)
      
      if (!clientDoc.exists()) {
        addLog("📝 Création du document client principal...")
        await setDoc(clientRef, {
          uidclient: CLIENT_UID,
          nom: "Test",
          prenom: "Couvreur",
          email: "test@couvreur.fr",
          dateCreation: new Date(),
          status: "actif",
          isPrimary: true,
          role: "admin"
        })
        addLog("✅ Document client créé avec succès")
      }
      
      // Créer les projets dans la structure clients/{clientId}/projets
      const projetsRef = collection(db, 'clients', CLIENT_UID, 'projets')
      const total = projetsData.length

      for (let i = 0; i < projetsData.length; i++) {
        const projetData = projetsData[i]
        
        try {
          const docRef = await addDoc(projetsRef, projetData)
          setGeneratedCount(i + 1)
          setProgress(((i + 1) / total) * 100)
          addLog(`✅ Projet ${i + 1}/${total} créé: ${projetData.prenom} ${projetData.nom} - ${docRef.id}`)
          
          // Petite pause pour éviter de surcharger Firebase
          await new Promise(resolve => setTimeout(resolve, 100))
        } catch (error) {
          addLog(`❌ Erreur projet ${i + 1}: ${error}`)
        }
      }

      addLog(`🎉 Génération terminée ! ${generatedCount} projets créés avec succès.`)
      addLog(`📊 Répartition: 15 projets en octobre, 17 projets en novembre 2024`)
      addLog(`👤 Tous les projets sont attribués à l'utilisateur: ${CLIENT_UID}`)

    } catch (error) {
      addLog(`💥 Erreur fatale: ${error}`)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>🏗️ Générateur de Projets - Couvreur</CardTitle>
          <CardDescription>
            Génération de 32 projets réalistes pour un couvreur (15 en octobre, 17 en novembre 2024)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                ID utilisateur cible: <code className="bg-muted px-2 py-1 rounded">{CLIENT_UID}</code>
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Total à générer: <strong>{projetsData.length} projets</strong>
              </p>
            </div>
            <Button 
              onClick={generateProjects} 
              disabled={isGenerating}
              size="lg"
            >
              {isGenerating ? "Génération en cours..." : "🚀 Générer les projets"}
            </Button>
          </div>

          {isGenerating && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progression</span>
                <Badge variant="secondary">{generatedCount}/{projetsData.length} projets</Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {logs.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">📋 Logs de génération</h3>
              <div className="bg-muted p-4 rounded-lg max-h-96 overflow-y-auto">
                <div className="space-y-1 font-mono text-sm">
                  {logs.map((log, index) => (
                    <div key={index} className="text-xs">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">ℹ️ Informations</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Les projets seront créés dans <code>clients/{CLIENT_UID}/projets</code></li>
              <li>• Chaque projet aura des données réalistes (nom, email, téléphone, motif)</li>
              <li>• Les motifs sont spécifiques aux métiers de couvreur</li>
              <li>• Les dates sont réparties sur octobre et novembre 2024</li>
              <li>• Tous les projets seront attribués à l'utilisateur spécifié</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
