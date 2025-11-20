// Import des modules Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Configuration Firebase - utilise les variables d'environnement
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBvOKxlflO-bVuC0Z-DZFn9hqFzjlEqfUE",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "trouver-mon-chantier.firebaseapp.com", 
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "trouver-mon-chantier",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "trouver-mon-chantier.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1092492148832",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1092492148832:web:4a9c4b7a8b5c6d9e0f1g2h"
};

// Initialisation Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ID utilisateur fourni
const CLIENT_UID = "tRxySE0awOcnk3j4s6Fj";

// Données réalistes pour un couvreur
const NOMS_FRANCAIS = [
  "Martin", "Bernard", "Dubois", "Thomas", "Robert", "Petit", "Durand", "Leroy", "Moreau", "Simon",
  "Laurent", "Lefebvre", "Michel", "Garcia", "David", "Bertrand", "Roux", "Vincent", "Fournier", "Morel",
  "Girard", "Andre", "Lefevre", "Mercier", "Dupont", "Lambert", "Bonnet", "Francois", "Martinez", "Legrand"
];

const PRENOMS_FRANCAIS = [
  "Jean", "Pierre", "Michel", "Andre", "Philippe", "Alain", "Bernard", "Christian", "Daniel", "Patrick",
  "Marie", "Nathalie", "Isabelle", "Sylvie", "Catherine", "Francoise", "Monique", "Brigitte", "Christine", "Veronique",
  "Julien", "Nicolas", "Sebastien", "Christophe", "David", "Stephane", "Pascal", "Thierry", "Frederic", "Laurent"
];

const MOTIFS_COUVREUR = [
  "Réfection complète de toiture ardoise suite à tempête",
  "Remplacement tuiles cassées et nettoyage gouttières",
  "Isolation sous-toiture et pose de velux",
  "Réparation fuite toiture après dégât des eaux",
  "Démoussage et traitement hydrofuge de toiture",
  "Installation de panneaux solaires sur toiture",
  "Rénovation charpente et couverture maison ancienne",
  "Pose de gouttières zinc et descentes pluviales",
  "Étanchéité toit terrasse et membrane EPDM",
  "Changement de faîtage et arêtiers défaillants",
  "Réparation urgente suite à chute d'arbre sur toit",
  "Pose de chatières et aérateurs de toiture",
  "Réfection zinguerie et évacuation eaux pluviales",
  "Installation de crochets de sécurité pour déneigement",
  "Traitement anti-mousse et peinture toiture fibro-ciment",
  "Pose de bac acier isolé sur hangar agricole",
  "Réparation solins de cheminée et étanchéité",
  "Installation de pare-neige et garde-corps toiture",
  "Rénovation toiture tuiles mécaniques avec isolation",
  "Pose de membrane d'étanchéité sur toit plat",
  "Remplacement de la couverture en shingle",
  "Installation de lucarnes et fenêtres de toit",
  "Réparation de la charpente suite à insectes xylophages",
  "Pose de bardage métallique sur pignon",
  "Étanchéité de terrasse accessible avec dalles",
  "Installation de système de récupération d'eau de pluie",
  "Réfection complète toiture avec charpente traditionnelle",
  "Pose de brise-soleil orientable sur terrasse",
  "Traitement préventif charpente contre les parasites",
  "Installation de verrière sur toit d'atelier",
  "Réparation de noue et raccordement toitures",
  "Pose de couvertines aluminium sur muret"
];

const VILLES_FRANCAISES = [
  { nom: "Paris", cp: "75001" },
  { nom: "Lyon", cp: "69001" },
  { nom: "Marseille", cp: "13001" },
  { nom: "Toulouse", cp: "31000" },
  { nom: "Nice", cp: "06000" },
  { nom: "Nantes", cp: "44000" },
  { nom: "Montpellier", cp: "34000" },
  { nom: "Strasbourg", cp: "67000" },
  { nom: "Bordeaux", cp: "33000" },
  { nom: "Lille", cp: "59000" },
  { nom: "Rennes", cp: "35000" },
  { nom: "Reims", cp: "51100" },
  { nom: "Saint-Étienne", cp: "42000" },
  { nom: "Toulon", cp: "83000" },
  { nom: "Grenoble", cp: "38000" },
  { nom: "Dijon", cp: "21000" },
  { nom: "Angers", cp: "49000" },
  { nom: "Nîmes", cp: "30000" },
  { nom: "Villeurbanne", cp: "69100" },
  { nom: "Clermont-Ferrand", cp: "63000" }
];

const STATUS_OPTIONS = ["nouveau", "A contacter", "En cours", "En attente", "Terminé", "Annulé"];
const SOURCES = ["popup", "formulaire_contact", "telephone", "recommandation", "site_web"];

// Fonction pour générer un email réaliste
function genererEmail(nom, prenom) {
  const domaines = ["gmail.com", "orange.fr", "free.fr", "hotmail.fr", "yahoo.fr", "outlook.fr", "wanadoo.fr"];
  const formats = [
    `${prenom.toLowerCase()}.${nom.toLowerCase()}`,
    `${prenom.toLowerCase()}${nom.toLowerCase()}`,
    `${prenom.toLowerCase()}_${nom.toLowerCase()}`,
    `${prenom.toLowerCase()}${Math.floor(Math.random() * 99)}`
  ];
  
  const format = formats[Math.floor(Math.random() * formats.length)];
  const domaine = domaines[Math.floor(Math.random() * domaines.length)];
  
  return `${format}@${domaine}`;
}

// Fonction pour générer un numéro de téléphone français
function genererTelephone() {
  const prefixes = ["01", "02", "03", "04", "05", "06", "07"];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  
  let numero = prefix;
  for (let i = 0; i < 4; i++) {
    numero += Math.floor(Math.random() * 100).toString().padStart(2, '0');
  }
  
  return numero.replace(/(.{2})/g, '$1 ').trim();
}

// Fonction pour générer une date aléatoire dans une période
function genererDateAleatoire(debutMois, finMois) {
  const debut = new Date(2024, debutMois, 1);
  const fin = new Date(2024, finMois + 1, 0);
  
  const timestamp = debut.getTime() + Math.random() * (fin.getTime() - debut.getTime());
  return new Date(timestamp);
}

// Fonction pour créer un projet
function creerProjet(mois) {
  const nom = NOMS_FRANCAIS[Math.floor(Math.random() * NOMS_FRANCAIS.length)];
  const prenom = PRENOMS_FRANCAIS[Math.floor(Math.random() * PRENOMS_FRANCAIS.length)];
  const ville = VILLES_FRANCAISES[Math.floor(Math.random() * VILLES_FRANCAISES.length)];
  
  return {
    nom: nom,
    prenom: prenom,
    email: genererEmail(nom, prenom),
    telephone: genererTelephone(),
    motif: MOTIFS_COUVREUR[Math.floor(Math.random() * MOTIFS_COUVREUR.length)],
    status: STATUS_OPTIONS[Math.floor(Math.random() * STATUS_OPTIONS.length)],
    dateCreation: genererDateAleatoire(mois, mois),
    source: SOURCES[Math.floor(Math.random() * SOURCES.length)],
    rgpd: true,
    uid: CLIENT_UID,
    ville: ville.nom,
    codePostal: ville.cp
  };
}

// Fonction principale pour générer tous les projets
async function genererTousLesProjets() {
  console.log("🚀 Début de la génération des projets pour le couvreur...");
  
  try {
    const projetsRef = collection(db, 'projects');
    let totalProjets = 0;

    // Premier mois (octobre 2024) - 15 projets
    console.log("📅 Génération des projets pour octobre 2024 (15 projets)...");
    for (let i = 0; i < 15; i++) {
      const projet = creerProjet(9); // Octobre = mois 9 (0-indexé)
      const docRef = await addDoc(projetsRef, projet);
      console.log(`✅ Projet ${i + 1}/15 créé: ${projet.prenom} ${projet.nom} - ${docRef.id}`);
      totalProjets++;
    }

    // Deuxième mois (novembre 2024) - 17 projets
    console.log("📅 Génération des projets pour novembre 2024 (17 projets)...");
    for (let i = 0; i < 17; i++) {
      const projet = creerProjet(10); // Novembre = mois 10 (0-indexé)
      const docRef = await addDoc(projetsRef, projet);
      console.log(`✅ Projet ${i + 1}/17 créé: ${projet.prenom} ${projet.nom} - ${docRef.id}`);
      totalProjets++;
    }

    console.log(`🎉 Génération terminée ! ${totalProjets} projets créés avec succès.`);
    console.log(`📊 Répartition: 15 projets en octobre, 17 projets en novembre`);
    console.log(`👤 Tous les projets sont attribués à l'utilisateur: ${CLIENT_UID}`);
    
  } catch (error) {
    console.error("❌ Erreur lors de la génération des projets:", error);
  }
}

// Exécution du script
genererTousLesProjets().then(() => {
  console.log("✨ Script terminé !");
  process.exit(0);
}).catch((error) => {
  console.error("💥 Erreur fatale:", error);
  process.exit(1);
});
