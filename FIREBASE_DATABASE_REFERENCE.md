# Firebase Database Structure Reference

## Firebase Security Rules

### Required Firestore Rules
Add these rules to your Firebase Console > Firestore Database > Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to pendingUsers collection for invitation system
    match /pendingUsers/{document} {
      allow read, write: if true;
    }
    
    // Existing rules for other collections
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Current Database Structure

### 1. Collection: `onboarding`
Structure pour les données d'onboarding des clients.

```
onboarding/{clientId}/data
├── adresseEntreprise: string
├── anneeCreation: string
├── certification: string
├── chantiersImages: array<string> (URLs Firebase Storage)
├── codePostal: string
├── commentaire: string
├── dateCompletion: timestamp
├── descriptionEntreprise: string
├── email: string
├── employesImages: array<string> (URLs Firebase Storage)
├── formations: string
├── garanties: string
├── histoireCreateur: string
├── logoImage: string (URL Firebase Storage)
├── nom: string
├── nomEntreprise: string
├── nombreCollaborateurs: string
├── partenaire: string
├── prenom: string
├── prestation: string
├── prestationsDetaillees: string
├── raisonSociale: string
├── rayonIntervention: string
├── siteWebExistant: boolean
├── siteWebURL: string
├── statut: string ("completed")
├── telephone: string
└── ville: string
```

### 2. Collection: `clients`
Structure principale des données clients avec sous-collections.

**LOGIQUE D'ATTRIBUTION DES CLIENTS:**
Pour toute opération sur les clients (création, modification, lecture), suivre cette logique :
1. Rechercher dans `clients` le document où `uidclient` correspond à l'ID de l'utilisateur connecté
2. Si trouvé, utiliser ce document comme "client principal" 
3. Effectuer les opérations dans la sous-collection `clients` de ce document principal

```
clients/{mainClientId} (Client principal avec uidclient = user.uid)
├── DateConversionClient: timestamp
├── StatutClient: string ("Actif")
├── adresseEntreprise: string
├── anneeCreation: string
├── assuranceResponsabilite: boolean
├── certification: string
├── certificationQualite: boolean
├── certifications: string
├── chantiersImages: array<string>
├── codePostal: string
├── commentaire: string
├── dataProspectOriginal: {
│   ├── "Code postal": string
│   ├── Commentaire: string
│   ├── Date: timestamp
│   ├── Email: string
│   ├── Entreprise: string
│   ├── Etape: string
│   ├── Metier: string
│   ├── Nom: string
│   ├── Prenom: string
│   ├── RGPD: boolean
│   ├── Téléphone: string
│   └── id: string
│   }
├── dateConversionClient: timestamp
├── dateConversionProspect: timestamp
├── dateCreation: timestamp
├── dateCreationAbonnement: timestamp
├── dateOnboardingCompleted: timestamp
├── descriptionEntreprise: string
├── email: string
├── employesImages: array<string>
├── entreprise: string
├── etapeProspect: string
├── firebaseAuthUid: string|null
├── formations: string
├── garanties: string
├── histoireCreateur: string
├── logo: boolean
├── logoImage: string
├── metier: string
├── nom: string
├── nomEntreprise: string
├── nombreCollaborateurs: string
├── onboarding: boolean
├── onboardingCompleted: boolean
├── partenaire: string
├── partenaires: string
├── prenom: string
├── presenceReseauxSociaux: boolean
├── prestation: string
├── prestations: string
├── prestationsDetaillees: string
├── publiciteEnLigne: boolean
├── raisonSociale: string
├── rayonIntervention: string
├── rgpd: boolean
├── secteurActivite: string
├── siteInternetClient: string
├── sitePret: boolean
├── siteWebExistant: boolean
├── siteWebURL: string
├── status: string ("prospect_converti")
├── statut: string ("actif")
├── statutClient: string
├── telephone: string
├── typeAbonnement: string ("29€/mois")
├── typeSite: string ("99€")
├── uidclient: string (CLEF D'IDENTIFICATION - doit correspondre à l'ID utilisateur connecté)
├── ville: string
├── clients/ (SOUS-COLLECTION des clients gérés par ce client principal)
│   └── {clientId}
│       ├── typeClient: string ("particulier" | "entreprise")
│       ├── localisation: string ("france" | "international")
│       ├── genre: string ("madame" | "monsieur" | "non-specifie")
│       ├── nom: string (obligatoire si typeClient = "particulier")
│       ├── prenom: string
│       ├── nomEntreprise: string (obligatoire si typeClient = "entreprise")
│       ├── email: string
│       ├── telephone: string
│       ├── adresse: string
│       ├── complementAdresse: string
│       ├── codePostal: string
│       ├── ville: string
│       ├── commentaires: string
│       ├── dateCreation: timestamp
│       └── status: string ("actif")
├── users/ (SOUS-COLLECTION des utilisateurs avec droits d'accès)
│   └── {userId}
│       ├── email: string
│       ├── nom: string
│       ├── prenom: string
│       ├── role: string ("admin" | "user" | "viewer")
│       ├── dateCreation: timestamp
│       ├── dateInvitation: timestamp
│       ├── status: string ("active" | "inactive" | "pending")
│       ├── invitePar: string (userId de l'invitant)
│       ├── derniereConnexion: timestamp
│       └── permissions: {
│           ├── clients: {
│           │   ├── create: boolean
│           │   ├── read: boolean
│           │   ├── update: boolean
│           │   └── delete: boolean
│           │   }
│           ├── projects: {
│           │   ├── create: boolean
│           │   ├── read: boolean
│           │   ├── update: boolean
│           │   └── delete: boolean
│           │   }
│           ├── factures: {
│           │   ├── create: boolean
│           │   ├── read: boolean
│           │   ├── update: boolean
│           │   └── delete: boolean
│           │   }
│           ├── devis: {
│           │   ├── create: boolean
│           │   ├── read: boolean
│           │   ├── update: boolean
│           │   └── delete: boolean
│           │   }
│           └── settings: {
│               ├── company: boolean
│               ├── users: boolean
│               └── billing: boolean
│               }
│           }
└── companyInfo/ (INFORMATIONS ENTREPRISE - Document unique)
    ├── siret: string
    ├── formeJuridique: string ("SARL" | "SAS" | "EURL" | "Auto-entrepreneur" | "Autre")
    ├── codeAPE: string
    ├── capital: number
    ├── adresseSiege: {
    │   ├── adresse: string
    │   ├── complementAdresse: string
    │   ├── codePostal: string
    │   └── ville: string
    │   }
    ├── dateCreationEntreprise: timestamp
    ├── numeroTVA: string
    ├── rcs: string (Registre du Commerce et des Sociétés)
    ├── dirigeant: {
    │   ├── nom: string
    │   ├── prenom: string
    │   ├── fonction: string
    │   └── dateNaissance: timestamp
    │   }
    ├── comptabilite: {
    │   ├── exerciceComptable: {
    │   │   ├── debut: string ("01/01" format)
    │   │   └── fin: string ("31/12" format)
    │   │   }
    │   ├── expertComptable: {
    │   │   ├── nom: string
    │   │   ├── cabinet: string
    │   │   ├── email: string
    │   │   └── telephone: string
    │   │   }
    │   └── logicielComptable: string
    │   }
    ├── banque: {
    │   ├── nom: string
    │   ├── iban: string
    │   ├── bic: string
    │   └── titulaire: string
    │   }
    ├── assurances: {
    │   ├── responsabiliteCivile: {
    │   │   ├── compagnie: string
    │   │   ├── numeroPolice: string
    │   │   ├── dateExpiration: timestamp
    │   │   └── montantGarantie: number
    │   │   }
    │   └── decennale: {
    │       ├── compagnie: string
    │       ├── numeroPolice: string
    │       ├── dateExpiration: timestamp
    │       └── montantGarantie: number
    │       }
    │   }
    ├── logo: string (URL Firebase Storage)
    ├── dateModification: timestamp
    └── modifiePar: string (userId)
```

### 3. Collection: `projects` (Projets existants)
Structure basée sur la mémoire des projets existants.

```
projects/{projectId}
├── id: string
├── nom: string
├── prenom: string
├── email: string
├── telephone: string
├── motif: string (description du projet)
├── status: string ("nouveau", "A contacter", "En cours", "En attente", "Terminé", "Annulé")
├── dateCreation: timestamp
├── source: string (ex: "popup")
├── rgpd: boolean
└── uid: string (client ID)
```

## Nouvelles Collections Proposées

### 4. Collection: `factures`
Gestion des factures clients.

```
factures/{factureId}
├── numeroFacture: string (auto-généré, ex: "FAC-2025-001")
├── clientId: string (référence vers clients/{clientId})
├── dateCreation: timestamp
├── dateEcheance: timestamp
├── dateReglement: timestamp|null
├── statut: string ("brouillon", "envoyee", "payee", "en_retard", "annulee")
├── montantHT: number
├── montantTTC: number
├── tauxTVA: number (ex: 20)
├── montantTVA: number
├── devise: string ("EUR")
├── conditions: {
│   ├── delaiPaiement: number (jours)
│   ├── penalitesRetard: number (%)
│   └── escompte: number (%)
│   }
├── adresseFacturation: {
│   ├── nom: string
│   ├── adresse: string
│   ├── codePostal: string
│   ├── ville: string
│   └── pays: string
│   }
├── lignes: array<{
│   ├── articleId: string|null
│   ├── designation: string
│   ├── quantite: number
│   ├── prixUnitaireHT: number
│   ├── remise: number (%)
│   ├── montantHT: number
│   └── tauxTVA: number
│   }>
├── notes: string
├── fichierPDF: string|null (URL Firebase Storage)
├── envoyee: boolean
├── dateEnvoi: timestamp|null
└── historique: array<{
    ├── date: timestamp
    ├── action: string
    ├── utilisateur: string
    └── details: string
    }>
```

### 5. Collection: `devis`
Gestion des devis clients.

```
devis/{devisId}
├── numeroDevis: string (auto-généré, ex: "DEV-2025-001")
├── clientId: string (référence vers clients/{clientId})
├── dateCreation: timestamp
├── dateValidite: timestamp
├── statut: string ("brouillon", "envoye", "accepte", "refuse", "expire", "facture")
├── factureId: string|null (si converti en facture)
├── montantHT: number
├── montantTTC: number
├── tauxTVA: number
├── montantTVA: number
├── devise: string ("EUR")
├── validiteDuree: number (jours, ex: 30)
├── adresseDevis: {
│   ├── nom: string
│   ├── adresse: string
│   ├── codePostal: string
│   ├── ville: string
│   └── pays: string
│   }
├── lignes: array<{
│   ├── articleId: string|null
│   ├── designation: string
│   ├── quantite: number
│   ├── prixUnitaireHT: number
│   ├── remise: number (%)
│   ├── montantHT: number
│   └── tauxTVA: number
│   }>
├── conditions: string
├── notes: string
├── fichierPDF: string|null
├── envoye: boolean
├── dateEnvoi: timestamp|null
├── dateAcceptation: timestamp|null
└── historique: array<{
    ├── date: timestamp
    ├── action: string
    ├── utilisateur: string
    └── details: string
    }>
```

### 6. Collection: `articles`
Catalogue d'articles/prestations pré-enregistrés.

```
articles/{articleId}
├── code: string (ex: "CHARP-001")
├── designation: string
├── description: string
├── categorie: string ("Charpente", "Couverture", "Isolation", etc.)
├── sousCategorie: string
├── unite: string ("m²", "ml", "forfait", "heure", etc.)
├── prixUnitaireHT: number
├── tauxTVA: number
├── actif: boolean
├── dateCreation: timestamp
├── dateModification: timestamp
├── fournisseur: string|null
├── reference: string|null
├── stock: {
│   ├── gestionStock: boolean
│   ├── quantiteStock: number
│   └── seuilAlerte: number
│   }
├── images: array<string> (URLs)
└── notes: string
```

### 7. Collection: `clientsFacturation`
Informations spécifiques à la facturation des clients.

```
clientsFacturation/{clientId}
├── numeroClient: string (auto-généré)
├── raisonSociale: string
├── siret: string|null
├── numeroTVA: string|null
├── adresseFacturation: {
│   ├── nom: string
│   ├── adresse: string
│   ├── codePostal: string
│   ├── ville: string
│   └── pays: string
│   }
├── adresseLivraison: {
│   ├── nom: string
│   ├── adresse: string
│   ├── codePostal: string
│   ├── ville: string
│   └── pays: string
│   }
├── contact: {
│   ├── nom: string
│   ├── prenom: string
│   ├── email: string
│   ├── telephone: string
│   └── fonction: string
│   }
├── conditionsCommerciales: {
│   ├── delaiPaiement: number (jours)
│   ├── remiseHabituelle: number (%)
│   ├── plafondCredit: number
│   └── bloque: boolean
│   }
├── statistiques: {
│   ├── chiffreAffaires: number
│   ├── nombreFactures: number
│   ├── dernierAchat: timestamp
│   └── moyennePaiement: number (jours)
│   }
└── notes: string
```

### 8. Collection: `paiements`
Suivi des paiements et remboursements.

```
paiements/{paiementId}
├── factureId: string (référence vers factures/{factureId})
├── clientId: string
├── type: string ("paiement", "remboursement", "avoir")
├── montant: number
├── devise: string ("EUR")
├── datePaiement: timestamp
├── methodePaiement: string ("virement", "cheque", "especes", "cb", "prelevement")
├── reference: string (numéro de chèque, référence virement, etc.)
├── statut: string ("en_attente", "valide", "rejete")
├── notes: string
└── justificatif: string|null (URL document)
```

### 9. Collection: `numerotation`
Gestion de la numérotation automatique.

```
numerotation/
├── factures: {
│   ├── annee: number (2025)
│   ├── dernier: number (dernière facture)
│   └── prefixe: string ("FAC")
│   }
├── devis: {
│   ├── annee: number
│   ├── dernier: number
│   └── prefixe: string ("DEV")
│   }
└── clients: {
    ├── dernier: number
    └── prefixe: string ("CLI")
    }
```

### 10. Collection: `parametres`
Configuration générale de l'application.

```
parametres/{clientId}
├── entreprise: {
│   ├── nom: string
│   ├── adresse: string
│   ├── codePostal: string
│   ├── ville: string
│   ├── telephone: string
│   ├── email: string
│   ├── siret: string
│   ├── numeroTVA: string
│   └── logo: string (URL)
│   }
├── facturation: {
│   ├── delaiPaiementDefaut: number (30)
│   ├── tauxTVADefaut: number (20)
│   ├── penalitesRetard: number (3)
│   ├── escompte: number (0)
│   ├── mentionsLegales: string
│   └── conditionsGenerales: string
│   }
├── notifications: {
│   ├── emailFacture: boolean
│   ├── emailDevis: boolean
│   ├── rappelEcheance: boolean
│   └── alerteRetard: boolean
│   }
└── personnalisation: {
    ├── couleurPrimaire: string
    ├── couleurSecondaire: string
    └── templateFacture: string
    }
```

## Logique d'Attribution et Opérations sur les Clients

### Algorithme de recherche du client principal:
```javascript
// 1. Rechercher le client principal
const mainClientsQuery = query(
  collection(db, 'clients'),
  where('uidclient', '==', user.uid)
)
const mainClientsSnapshot = await getDocs(mainClientsQuery)

if (mainClientsSnapshot.empty) {
  // Erreur: Aucun profil client trouvé pour cet utilisateur
  return
}

const mainClientDoc = mainClientsSnapshot.docs[0]
const mainClientId = mainClientDoc.id

// 2. Opérations dans la sous-collection
// CRÉATION: clients/{mainClientId}/clients/{newClientId}
// LECTURE: clients/{mainClientId}/clients/
// MODIFICATION: clients/{mainClientId}/clients/{clientId}
// SUPPRESSION: clients/{mainClientId}/clients/{clientId}
```

### Exemples d'opérations:

**Création d'un nouveau client:**
```javascript
const clientSubcollectionRef = collection(db, 'clients', mainClientId, 'clients')
const docRef = await addDoc(clientSubcollectionRef, newClientData)
```

**Modification d'un client existant:**
```javascript
const clientRef = doc(db, 'clients', mainClientId, 'clients', editingClientId)
await updateDoc(clientRef, updatedData)
```

**Lecture des clients:**
```javascript
const clientsRef = collection(db, 'clients', mainClientId, 'clients')
const clientsSnapshot = await getDocs(clientsRef)
```

## Relations entre Collections

### Flux de données principal:
1. **Client Principal** (`clients/{mainClientId}`) → **Clients gérés** (`clients/{mainClientId}/clients/{clientId}`)
2. **Client Principal** (`clients/{mainClientId}`) ↔ **Facturation Client** (`clientsFacturation/{mainClientId}`)
3. **Devis** (`devis/{devisId}`) → **Facture** (`factures/{factureId}`) via `factureId`
4. **Articles** (`articles/{articleId}`) → **Lignes de devis/factures** via `articleId`
5. **Factures** (`factures/{factureId}`) → **Paiements** (`paiements/{paiementId}`) via `factureId`
6. **Projets** (`projects/{projectId}`) → **Devis** via `clientId` (même client)

### Index recommandés:
- `clients`: `uidclient` (CRITIQUE pour la logique d'attribution)
- `factures`: `clientId`, `statut`, `dateCreation`, `dateEcheance`
- `devis`: `clientId`, `statut`, `dateCreation`, `dateValidite`
- `paiements`: `factureId`, `clientId`, `datePaiement`
- `articles`: `categorie`, `actif`, `code`
- `projects`: `uid`, `status`, `dateCreation`

## Système de Droits d'Accès et Rôles

### Rôles Utilisateurs

**ADMIN** (Propriétaire de l'entreprise)
- Accès complet à toutes les fonctionnalités
- Gestion des utilisateurs (ajout, suppression, modification des rôles)
- Modification des informations entreprise
- Accès aux paramètres de facturation et configuration
- Permissions: ALL (create, read, update, delete sur toutes les collections)

**USER** (Employé avec droits étendus)
- Gestion complète des clients et projets
- Création et modification des devis/factures
- Lecture des informations entreprise (sans modification)
- Pas d'accès à la gestion des utilisateurs
- Permissions: CRUD sur clients, projects, factures, devis | READ sur company settings

**VIEWER** (Consultation uniquement)
- Lecture seule des clients et projets
- Consultation des devis/factures existants
- Aucun droit de création ou modification
- Permissions: READ ONLY sur clients, projects, factures, devis

### Logique de Vérification des Permissions

```javascript
// Fonction utilitaire pour vérifier les permissions
async function checkUserPermission(userId, mainClientId, action, resource) {
  const userRef = doc(db, 'clients', mainClientId, 'users', userId)
  const userDoc = await getDoc(userRef)
  
  if (!userDoc.exists()) {
    return false // Utilisateur non trouvé
  }
  
  const userData = userDoc.data()
  if (userData.status !== 'active') {
    return false // Utilisateur inactif
  }
  
  const permissions = userData.permissions[resource]
  return permissions && permissions[action] === true
}

// Exemple d'utilisation
const canCreateClient = await checkUserPermission(
  user.uid, 
  mainClientId, 
  'create', 
  'clients'
)
```

### Règles de Sécurité Firebase

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Fonction pour vérifier si l'utilisateur appartient au client principal
    function isAuthorizedUser(mainClientId) {
      return request.auth != null && 
        exists(/databases/$(database)/documents/clients/$(mainClientId)/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/clients/$(mainClientId)/users/$(request.auth.uid)).data.status == 'active';
    }
    
    // Fonction pour vérifier les permissions spécifiques
    function hasPermission(mainClientId, resource, action) {
      let userDoc = get(/databases/$(database)/documents/clients/$(mainClientId)/users/$(request.auth.uid));
      return userDoc.data.permissions[resource][action] == true;
    }
    
    // Collection clients principale
    match /clients/{mainClientId} {
      allow read: if isAuthorizedUser(mainClientId);
      allow write: if isAuthorizedUser(mainClientId) && 
        hasPermission(mainClientId, 'settings', 'company');
      
      // Sous-collection clients
      match /clients/{clientId} {
        allow read: if isAuthorizedUser(mainClientId) && 
          hasPermission(mainClientId, 'clients', 'read');
        allow create: if isAuthorizedUser(mainClientId) && 
          hasPermission(mainClientId, 'clients', 'create');
        allow update: if isAuthorizedUser(mainClientId) && 
          hasPermission(mainClientId, 'clients', 'update');
        allow delete: if isAuthorizedUser(mainClientId) && 
          hasPermission(mainClientId, 'clients', 'delete');
      }
      
      // Sous-collection users (gestion des utilisateurs)
      match /users/{userId} {
        allow read: if isAuthorizedUser(mainClientId);
        allow write: if isAuthorizedUser(mainClientId) && 
          hasPermission(mainClientId, 'settings', 'users');
      }
      
      // Informations entreprise
      match /companyInfo {
        allow read: if isAuthorizedUser(mainClientId);
        allow write: if isAuthorizedUser(mainClientId) && 
          hasPermission(mainClientId, 'settings', 'company');
      }
    }
    
    // Collection projects
    match /projects/{projectId} {
      allow read: if request.auth != null && 
        request.auth.uid == resource.data.uid &&
        hasPermission(resource.data.uid, 'projects', 'read');
      allow create: if request.auth != null && 
        hasPermission(request.auth.uid, 'projects', 'create');
      allow update: if request.auth != null && 
        request.auth.uid == resource.data.uid &&
        hasPermission(resource.data.uid, 'projects', 'update');
      allow delete: if request.auth != null && 
        request.auth.uid == resource.data.uid &&
        hasPermission(resource.data.uid, 'projects', 'delete');
    }
    
    // Collection factures
    match /factures/{factureId} {
      allow read: if request.auth != null && 
        hasPermission(request.auth.uid, 'factures', 'read');
      allow create: if request.auth != null && 
        hasPermission(request.auth.uid, 'factures', 'create');
      allow update: if request.auth != null && 
        hasPermission(request.auth.uid, 'factures', 'update');
      allow delete: if request.auth != null && 
        hasPermission(request.auth.uid, 'factures', 'delete');
    }
    
    // Collection devis
    match /devis/{devisId} {
      allow read: if request.auth != null && 
        hasPermission(request.auth.uid, 'devis', 'read');
      allow create: if request.auth != null && 
        hasPermission(request.auth.uid, 'devis', 'create');
      allow update: if request.auth != null && 
        hasPermission(request.auth.uid, 'devis', 'update');
      allow delete: if request.auth != null && 
        hasPermission(request.auth.uid, 'devis', 'delete');
    }
  }
}
```

### Workflow de Gestion des Utilisateurs

**Ajout d'un nouvel utilisateur:**
1. Admin invite un utilisateur par email
2. Création du document dans `clients/{mainClientId}/users/{userId}` avec status "pending"
3. Envoi d'email d'invitation avec lien d'activation
4. L'utilisateur clique sur le lien et crée son compte Firebase Auth
5. Status passe à "active" et l'utilisateur peut accéder à l'application

**Modification des permissions:**
1. Seuls les ADMIN peuvent modifier les rôles et permissions
2. Mise à jour du document utilisateur avec nouvelles permissions
3. Les changements prennent effet immédiatement

**Suppression d'un utilisateur:**
1. Status passe à "inactive" (soft delete)
2. L'utilisateur perd immédiatement l'accès
3. Possibilité de réactiver plus tard si nécessaire

## Notes d'implémentation

1. **Numérotation automatique**: Utiliser les transactions Firebase pour éviter les doublons
2. **Génération PDF**: Intégrer avec une solution comme jsPDF ou un service externe
3. **Envoi d'emails**: Utiliser Firebase Functions avec un service comme SendGrid
4. **Sauvegarde**: Exporter régulièrement les données critiques
5. **Audit**: Maintenir un historique des modifications importantes
6. **Performance**: Paginer les listes de factures/devis pour les gros volumes
