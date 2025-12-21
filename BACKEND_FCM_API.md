# API Backend pour Firebase Cloud Messaging

Le frontend utilise maintenant **Firebase Cloud Messaging (FCM)** au lieu du Web Push natif. Voici les endpoints à créer dans votre backend.

## Endpoints requis

### 1. Sauvegarder un token FCM

**POST** `/api/fcm/save-token`

Sauvegarde le token FCM d'un utilisateur dans la base de données.

```javascript
// Route
router.post('/api/fcm/save-token', authenticateToken, async (req, res) => {
  try {
    const { fcmToken } = req.body;
    const userId = req.user.id;

    if (!fcmToken) {
      return res.status(400).json({ error: 'Token FCM manquant' });
    }

    // Sauvegarder ou mettre à jour le token dans la base de données
    await db.query(
      `INSERT INTO user_fcm_tokens (user_id, fcm_token, created_at, updated_at)
       VALUES (?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE fcm_token = ?, updated_at = NOW()`,
      [userId, fcmToken, fcmToken]
    );

    res.json({
      success: true,
      message: 'Token FCM sauvegardé avec succès'
    });
  } catch (error) {
    console.error('Erreur sauvegarde token FCM:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
```

**Structure de table suggérée:**
```sql
CREATE TABLE user_fcm_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  fcm_token TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_token (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

### 2. Supprimer un token FCM

**POST** `/api/fcm/delete-token`

Supprime le token FCM d'un utilisateur.

```javascript
router.post('/api/fcm/delete-token', authenticateToken, async (req, res) => {
  try {
    const { fcmToken } = req.body;
    const userId = req.user.id;

    await db.query(
      'DELETE FROM user_fcm_tokens WHERE user_id = ? AND fcm_token = ?',
      [userId, fcmToken]
    );

    res.json({
      success: true,
      message: 'Token FCM supprimé'
    });
  } catch (error) {
    console.error('Erreur suppression token FCM:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
```

---

### 3. Envoyer une notification de test

**POST** `/api/fcm/test-notification`

Envoie une notification de test à l'utilisateur.

```javascript
const admin = require('firebase-admin');

router.post('/api/fcm/test-notification', authenticateToken, async (req, res) => {
  try {
    const { fcmToken } = req.body;
    const userId = req.user.id;

    if (!fcmToken) {
      return res.status(400).json({ error: 'Token FCM manquant' });
    }

    // Message de notification
    const message = {
      notification: {
        title: 'EMB - Notification de test',
        body: 'Ceci est une notification de test Firebase Cloud Messaging',
        icon: '/icon-192x192.png'
      },
      data: {
        url: '/dashboard',
        type: 'test'
      },
      token: fcmToken
    };

    // Envoyer la notification
    const response = await admin.messaging().send(message);
    console.log('Notification de test envoyée:', response);

    res.json({
      success: true,
      message: 'Notification de test envoyée',
      messageId: response
    });
  } catch (error) {
    console.error('Erreur envoi notification de test:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi' });
  }
});
```

---

## Configuration Firebase Admin SDK

### 1. Installer Firebase Admin SDK

```bash
npm install firebase-admin
```

### 2. Initialiser Firebase Admin

Créez un fichier `config/firebase-admin.js`:

```javascript
const admin = require('firebase-admin');

// Téléchargez votre Service Account Key depuis Firebase Console
// Project Settings > Service Accounts > Generate new private key
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'notificationpush-1354a'
});

module.exports = admin;
```

### 3. Obtenir le Service Account Key

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet: **notificationpush-1354a**
3. **Project Settings** ⚙️ > **Service Accounts**
4. Cliquez sur **Generate new private key**
5. Téléchargez le fichier JSON
6. Placez-le dans `backend/config/firebase-service-account.json`
7. **IMPORTANT**: Ajoutez ce fichier dans `.gitignore`

```bash
# .gitignore
config/firebase-service-account.json
```

---

## Envoyer des notifications depuis le backend

### Notification à un utilisateur spécifique

```javascript
const admin = require('./config/firebase-admin');

async function sendNotificationToUser(userId, title, body, data = {}) {
  try {
    // Récupérer le token FCM de l'utilisateur
    const [rows] = await db.query(
      'SELECT fcm_token FROM user_fcm_tokens WHERE user_id = ?',
      [userId]
    );

    if (rows.length === 0) {
      console.log('Utilisateur sans token FCM:', userId);
      return null;
    }

    const fcmToken = rows[0].fcm_token;

    // Préparer le message
    const message = {
      notification: {
        title: title,
        body: body,
        icon: '/icon-192x192.png'
      },
      data: data,
      token: fcmToken
    };

    // Envoyer la notification
    const response = await admin.messaging().send(message);
    console.log('Notification envoyée:', response);

    return response;
  } catch (error) {
    console.error('Erreur envoi notification:', error);

    // Si le token est invalide, le supprimer
    if (error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered') {
      await db.query(
        'DELETE FROM user_fcm_tokens WHERE user_id = ?',
        [userId]
      );
      console.log('Token FCM invalide supprimé pour user:', userId);
    }

    throw error;
  }
}

// Exemple d'utilisation
module.exports = { sendNotificationToUser };
```

### Notification à tous les admins

```javascript
async function notifyAllAdmins(title, body, data = {}) {
  try {
    // Récupérer tous les tokens FCM des admins
    const [admins] = await db.query(
      `SELECT uft.fcm_token
       FROM user_fcm_tokens uft
       JOIN users u ON uft.user_id = u.id
       WHERE u.role = 'admin'`
    );

    if (admins.length === 0) {
      console.log('Aucun admin avec token FCM');
      return;
    }

    // Préparer le message
    const message = {
      notification: {
        title: title,
        body: body,
        icon: '/icon-192x192.png'
      },
      data: data,
      tokens: admins.map(a => a.fcm_token)
    };

    // Envoyer la notification (multicast)
    const response = await admin.messaging().sendEachForMulticast(message);

    console.log(`${response.successCount} notifications envoyées aux admins`);
    console.log(`${response.failureCount} échecs`);

    return response;
  } catch (error) {
    console.error('Erreur notification admins:', error);
    throw error;
  }
}

module.exports = { notifyAllAdmins };
```

---

## Exemples d'utilisation

### Nouvelle transaction

```javascript
router.post('/api/transactions', authenticateToken, async (req, res) => {
  try {
    // ... créer la transaction ...

    // Notifier les admins
    await notifyAllAdmins(
      'Nouvelle transaction',
      `Transaction de ${transaction.amount} ${transaction.currency} par ${req.user.name}`,
      {
        url: '/admin/transactions',
        transactionId: transaction.id.toString(),
        type: 'new_transaction'
      }
    );

    res.json({ success: true, transaction });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
```

### Transaction approuvée

```javascript
router.patch('/api/transactions/:id/approve', authenticateToken, async (req, res) => {
  try {
    const transactionId = req.params.id;

    // ... approuver la transaction ...

    // Notifier l'utilisateur
    await sendNotificationToUser(
      transaction.user_id,
      'Transaction approuvée',
      `Votre transaction de ${transaction.amount} ${transaction.currency} a été approuvée`,
      {
        url: '/dashboard?tab=history',
        transactionId: transactionId,
        type: 'transaction_approved'
      }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
```

---

## Notes importantes

1. **Gestion des erreurs**: Si un token FCM est invalide, supprimez-le de la base de données
2. **Rate limiting**: Firebase a des limites d'envoi, implémentez un rate limiting si nécessaire
3. **Batch sending**: Pour envoyer à plusieurs utilisateurs, utilisez `sendEachForMulticast()`
4. **Sécurité**: Protégez tous les endpoints avec votre middleware d'authentification
5. **Logs**: Loggez les envois pour le débogage

---

## Migration de l'ancien système

Si vous aviez un système Web Push natif, migrez les données:

```sql
-- Optionnel: garder l'ancienne table pour référence
RENAME TABLE push_subscriptions TO push_subscriptions_old;

-- Les nouveaux tokens seront stockés dans user_fcm_tokens
```

---

## Test depuis le backend

```javascript
// Script de test: test-fcm.js
const admin = require('./config/firebase-admin');

const testToken = 'VOTRE_TOKEN_FCM_DE_TEST';

const message = {
  notification: {
    title: 'Test Backend FCM',
    body: 'Si vous voyez ceci, FCM fonctionne!',
  },
  token: testToken
};

admin.messaging().send(message)
  .then((response) => {
    console.log('✅ Notification envoyée:', response);
  })
  .catch((error) => {
    console.error('❌ Erreur:', error);
  });
```

```bash
node test-fcm.js
```
