// Script simplifié pour générer des projets de couvreur
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

// Configuration Firebase directe
const firebaseConfig = {
  apiKey: "AIzaSyBvOKxlflO-bVuC0Z-DZFn9hqFzjlEqfUE",
  authDomain: "trouver-mon-chantier.firebaseapp.com",
  projectId: "trouver-mon-chantier",
  storageBucket: "trouver-mon-chantier.firebasestorage.app",
  messagingSenderId: "1092492148832",
  appId: "1:1092492148832:web:4a9c4b7a8b5c6d9e0f1g2h"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ID utilisateur fourni
const CLIENT_UID = "tRxySE0awOcnk3j4s6Fj";

// Données pour générer des projets réalistes
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
];

// Fonction principale
async function genererProjets() {
  console.log("🚀 Début de la génération des projets pour le couvreur...");
  
  try {
    const projetsRef = collection(db, 'projects');
    let compteur = 0;

    for (const projetData of projetsData) {
      const docRef = await addDoc(projetsRef, projetData);
      compteur++;
      console.log(`✅ Projet ${compteur}/${projetsData.length} créé: ${projetData.prenom} ${projetData.nom} - ${docRef.id}`);
    }

    console.log(`🎉 Génération terminée ! ${compteur} projets créés avec succès.`);
    console.log(`📊 Répartition: 15 projets en octobre, 17 projets en novembre 2024`);
    console.log(`👤 Tous les projets sont attribués à l'utilisateur: ${CLIENT_UID}`);
    
  } catch (error) {
    console.error("❌ Erreur lors de la génération des projets:", error);
  }
}

// Exécution
genererProjets().then(() => {
  console.log("✨ Script terminé !");
  process.exit(0);
}).catch((error) => {
  console.error("💥 Erreur fatale:", error);
  process.exit(1);
});
