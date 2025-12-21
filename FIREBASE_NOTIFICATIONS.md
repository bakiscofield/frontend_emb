# Configuration Firebase Cloud Messaging (FCM)

## Étapes d'installation et de configuration

### 1. Obtenir la clé VAPID depuis Firebase

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet: **notificationpush-1354a**
3. Allez dans **Project Settings** (⚙️) > **Cloud Messaging**
4. Dans la section **Web Push certificates**, cliquez sur **Generate key pair**
5. Copiez la clé VAPID générée

### 2. Configurer la clé VAPID

Modifiez le fichier `lib/firebase.ts` et remplacez:

```typescript
const vapidKey = 'VOTRE_CLE_VAPID_ICI';
```

Par votre vraie clé VAPID.

### 3. Utilisation dans votre application

#### Option A: Utiliser le composant NotificationButton

```tsx
import NotificationButton from '@/components/NotificationButton';

export default function Dashboard() {
  return (
    <div>
      <NotificationButton />
    </div>
  );
}
```

#### Option B: Utiliser le hook directement

```tsx
'use client';

import { useFirebaseNotifications } from '@/hooks/useFirebaseNotifications';

export default function MyComponent() {
  const { token, notificationPermission, requestNotificationPermission } = useFirebaseNotifications();

  const handleActivate = async () => {
    const fcmToken = await requestNotificationPermission();
    console.log('FCM Token:', fcmToken);
  };

  return (
    <div>
      <p>Permission: {notificationPermission}</p>
      <p>Token: {token}</p>
      <button onClick={handleActivate}>Activer les notifications</button>
    </div>
  );
}
```

### 4. Backend - Enregistrer le token FCM

Créez une route API dans votre backend pour sauvegarder le token:

```javascript
// backend/routes/fcm.js
router.post('/api/fcm/save-token', authenticateToken, async (req, res) => {
  try {
    const { fcmToken } = req.body;
    const userId = req.user.id;

    // Sauvegarder le token dans la base de données
    await db.query(
      'UPDATE users SET fcm_token = ? WHERE id = ?',
      [fcmToken, userId]
    );

    res.json({ success: true, message: 'Token FCM sauvegardé' });
  } catch (error) {
    console.error('Erreur sauvegarde token FCM:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
```

### 5. Backend - Envoyer des notifications

```javascript
const admin = require('firebase-admin');

// Initialiser Firebase Admin SDK
const serviceAccount = require('./path/to/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Fonction pour envoyer une notification
async function sendNotification(fcmToken, title, body, data = {}) {
  const message = {
    notification: {
      title: title,
      body: body,
      icon: '/icon-192x192.png'
    },
    data: data,
    token: fcmToken
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Notification envoyée:', response);
    return response;
  } catch (error) {
    console.error('Erreur envoi notification:', error);
    throw error;
  }
}

// Exemple d'utilisation
router.post('/api/transactions', authenticateToken, async (req, res) => {
  // ... créer la transaction ...

  // Envoyer une notification à l'admin
  const adminTokens = await getAdminFCMTokens();

  for (const adminToken of adminTokens) {
    await sendNotification(
      adminToken,
      'Nouvelle transaction',
      `Transaction de ${transaction.amount} ${transaction.currency}`,
      { url: '/admin/transactions', transactionId: transaction.id }
    );
  }

  res.json({ success: true });
});
```

### 6. Obtenir le Service Account Key

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. **Project Settings** > **Service accounts**
3. Cliquez sur **Generate new private key**
4. Téléchargez le fichier JSON
5. Placez-le dans votre backend (ex: `backend/config/firebase-admin.json`)
6. **IMPORTANT**: Ajoutez ce fichier dans `.gitignore`

### 7. Tester les notifications

#### Test depuis Firebase Console

1. Allez sur **Cloud Messaging** dans Firebase Console
2. Cliquez sur **Send your first message**
3. Remplissez le formulaire et envoyez

#### Test depuis le code

```javascript
// Dans votre backend
const testToken = 'TOKEN_FCM_UTILISATEUR';

await sendNotification(
  testToken,
  'Test de notification',
  'Ceci est un test',
  { url: '/dashboard' }
);
```

### 8. Variables d'environnement

Ajoutez dans `.env.local`:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBIq5UX5MTazEq1V2Pz4DenxeCD5QygmyY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=notificationpush-1354a.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=notificationpush-1354a
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=notificationpush-1354a.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1051304096718
NEXT_PUBLIC_FIREBASE_APP_ID=1:1051304096718:web:16a76bbb61ea0a7f1bf19f
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-8XJQL3TB1N
NEXT_PUBLIC_FIREBASE_VAPID_KEY=VOTRE_CLE_VAPID
```

## Structure des fichiers

```
frontend/
├── lib/
│   └── firebase.ts                    # Configuration Firebase
├── hooks/
│   └── useFirebaseNotifications.ts    # Hook React pour notifications
├── components/
│   └── NotificationButton.tsx         # Bouton d'activation
├── public/
│   └── firebase-messaging-sw.js       # Service Worker Firebase
└── FIREBASE_NOTIFICATIONS.md          # Cette documentation
```

## Débogage

### Vérifier si FCM est configuré

```javascript
// Dans la console du navigateur
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Service Workers:', regs);
});
```

### Vérifier le token

```javascript
// Dans votre composant
const { token } = useFirebaseNotifications();
console.log('FCM Token:', token);
```

### Logs Firebase

Tous les logs FCM sont préfixés par `[Firebase]` dans la console.

## Sécurité

- ⚠️ Ne jamais exposer votre Service Account Key
- ✅ Toujours valider les tokens côté backend
- ✅ Limiter les notifications par utilisateur (rate limiting)
- ✅ Sauvegarder les tokens de manière sécurisée

## Support navigateurs

- ✅ Chrome/Edge (Desktop & Mobile)
- ✅ Firefox (Desktop & Mobile)
- ✅ Safari (Desktop uniquement, iOS 16.4+)
- ❌ Safari iOS < 16.4
