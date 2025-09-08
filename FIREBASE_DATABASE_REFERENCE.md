# Firebase Database Structure Reference

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
└── clients/ (SOUS-COLLECTION des clients gérés par ce client principal)
    └── {clientId}
        ├── typeClient: string ("particulier" | "entreprise")
        ├── localisation: string ("france" | "international")
        ├── genre: string ("madame" | "monsieur" | "non-specifie")
        ├── nom: string (obligatoire si typeClient = "particulier")
        ├── prenom: string
        ├── nomEntreprise: string (obligatoire si typeClient = "entreprise")
        ├── email: string
        ├── telephone: string
        ├── adresse: string
        ├── complementAdresse: string
        ├── codePostal: string
        ├── ville: string
        ├── commentaires: string
        ├── dateCreation: timestamp
        └── status: string ("actif")
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

## Sécurité Firebase Rules

```javascript
// Exemple de règles pour la collection factures
match /factures/{factureId} {
  allow read, write: if request.auth != null 
    && request.auth.uid == resource.data.clientId;
}

// Exemple de règles pour la collection articles
match /articles/{articleId} {
  allow read, write: if request.auth != null;
}
```

## Notes d'implémentation

1. **Numérotation automatique**: Utiliser les transactions Firebase pour éviter les doublons
2. **Génération PDF**: Intégrer avec une solution comme jsPDF ou un service externe
3. **Envoi d'emails**: Utiliser Firebase Functions avec un service comme SendGrid
4. **Sauvegarde**: Exporter régulièrement les données critiques
5. **Audit**: Maintenir un historique des modifications importantes
6. **Performance**: Paginer les listes de factures/devis pour les gros volumes
