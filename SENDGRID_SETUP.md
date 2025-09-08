# Configuration SendGrid pour les invitations utilisateur

## Variables d'environnement requises

Ajoutez ces variables à votre fichier `.env.local` :

```bash
# SendGrid Configuration
SENDGRID_API_KEY=your_sendgrid_api_key_here

# Firebase Configuration (déjà existantes)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
# ... autres variables Firebase
```

## Configuration SendGrid

### 1. Créer un compte SendGrid
1. Allez sur [SendGrid](https://sendgrid.com/)
2. Créez un compte ou connectez-vous
3. Vérifiez votre domaine `trouver-mon-chantier.fr`

### 2. Générer une clé API
1. Dans le dashboard SendGrid, allez dans **Settings** > **API Keys**
2. Cliquez sur **Create API Key**
3. Choisissez **Restricted Access**
4. Donnez les permissions suivantes :
   - **Mail Send** : Full Access
   - **Template Engine** : Read Access (optionnel)
5. Copiez la clé API générée

### 3. Vérifier l'expéditeur
1. Allez dans **Settings** > **Sender Authentication**
2. Vérifiez le domaine `trouver-mon-chantier.fr`
3. Ou ajoutez l'email `service@trouver-mon-chantier.fr` comme expéditeur vérifié

## Structure de la base de données

### Collection `pendingUsers`
```javascript
{
  email: string,
  nom: string,
  prenom: string,
  role: 'admin' | 'user' | 'viewer',
  clientId: string, // UID du client qui invite
  token: string, // Token unique pour la validation
  status: 'pending',
  tokenCreatedAt: Timestamp,
  dateCreation: Timestamp
}
```

### Collection `clients/{clientId}/users`
```javascript
{
  email: string,
  nom: string,
  prenom: string,
  role: 'admin' | 'user' | 'viewer',
  status: 'active' | 'pending' | 'inactive',
  uid: string, // UID Firebase Auth (ajouté après activation)
  isPrimary: boolean,
  dateCreation: Timestamp,
  dateActivation: Timestamp, // ajouté après activation
  permissions: object
}
```

## Fonctionnement du système

### 1. Invitation d'un utilisateur
1. L'admin remplit le formulaire d'ajout d'utilisateur
2. Si "Envoyer une invitation" est coché :
   - Un token unique est généré
   - L'utilisateur est sauvé dans `pendingUsers`
   - Un email d'invitation est envoyé via SendGrid
   - L'email contient un lien vers `/creation-mot-de-passe?token=...&email=...`

### 2. Création du mot de passe
1. L'utilisateur clique sur le lien dans l'email
2. La page valide le token via `/api/validate-token`
3. L'utilisateur crée son mot de passe
4. Un compte Firebase Auth est créé
5. L'utilisateur est déplacé de `pendingUsers` vers `clients/{clientId}/users`
6. Le statut passe à 'active'

### 3. Sécurité
- Les tokens expirent après 24 heures
- Les liens sont uniques et à usage unique
- Validation côté serveur pour tous les appels API
- Nettoyage automatique des utilisateurs pending expirés

## Template d'email

Le template d'email inclut :
- Design cohérent avec l'identité visuelle du projet
- Responsive design pour mobile et desktop
- Bouton CTA sécurisé
- Informations de sécurité
- Footer avec informations de contact

## API Endpoints

### POST `/api/send-invitation`
Envoie une invitation par email
```javascript
{
  email: string,
  nom: string,
  prenom: string,
  role: string,
  clientId: string
}
```

### POST `/api/validate-token`
Valide un token d'invitation
```javascript
{
  token: string,
  email: string
}
```

### POST `/api/activate-user`
Active un utilisateur après création du mot de passe
```javascript
{
  token: string,
  email: string,
  uid: string
}
```

## Déploiement

1. Configurez les variables d'environnement sur votre plateforme de déploiement
2. Assurez-vous que le domaine SendGrid est vérifié
3. Testez l'envoi d'emails en environnement de staging
4. Configurez `NEXT_PUBLIC_BASE_URL` avec votre domaine de production

## Dépannage

### Erreur "Unauthorized"
- Vérifiez que la clé API SendGrid est correcte
- Vérifiez les permissions de la clé API

### Emails non reçus
- Vérifiez les spams
- Vérifiez que l'expéditeur est vérifié dans SendGrid
- Consultez les logs SendGrid pour les erreurs de livraison

### Token invalide
- Vérifiez que le token n'a pas expiré (24h)
- Vérifiez que l'utilisateur n'a pas déjà été activé
