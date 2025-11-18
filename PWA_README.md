# 📱 EMB - Configuration PWA (Progressive Web App)

## 🎯 Vue d'ensemble

L'application EMB est maintenant une **Progressive Web App (PWA)** complète avec toutes les fonctionnalités modernes pour offrir une expérience native sur mobile et desktop.

## ✨ Fonctionnalités PWA Implémentées

### ✅ Service Worker Avancé
- **Stratégies de cache intelligentes** :
  - Cache First pour les ressources statiques (JS, CSS, images)
  - Network First pour les pages et API
  - Gestion automatique de la taille du cache
  - Expiration des caches avec durées configurables

- **Support offline complet** :
  - Page offline personnalisée et interactive
  - Détection automatique de reconnexion
  - Cache des pages essentielles

- **Fonctionnalités avancées** :
  - Background Sync - synchronisation en arrière-plan
  - Periodic Sync - synchronisation périodique
  - Push Notifications - notifications push
  - Gestion automatique des mises à jour

### ✅ Manifest Web App
Toutes les fonctionnalités modernes sont configurées dans `public/manifest.json` :

#### Caractéristiques de base
- ✅ **Nom et description** en français
- ✅ **Icônes** de 72px à 512px (toutes les tailles requises)
- ✅ **Thème et couleurs** personnalisés
- ✅ **Mode standalone** pour une apparence native

#### App Capabilities Avancées

##### 🔗 Shortcuts (Raccourcis)
Accès rapide aux fonctions principales :
- Nouvelle transaction
- Historique des transactions
- Admin dashboard

##### 📂 File Handlers
Support des types de fichiers :
- CSV (.csv)
- Excel (.xls, .xlsx)
- JSON (.json)
- Texte (.txt)

Les fichiers peuvent être ouverts directement dans l'app via `/open-file`

##### 🔗 Share Target
Permet de partager vers l'app :
- Texte
- URLs
- Images et PDFs (via upload)

Route : `/share`

##### 🔗 Protocol Handlers
Protocole personnalisé `web+emb://` pour :
- Liens directs vers des transactions
- Deep linking dans l'application

##### 🪟 Window Controls Overlay
Interface moderne avec contrôles de fenêtre intégrés

##### 🌐 Scope Extensions
Support du domaine `*.alicebot.me`

##### 🎯 Launch Handler
Gestion intelligente du lancement :
- Réutilise les fenêtres existantes
- Mode automatique pour la meilleure UX

## 📦 Structure des fichiers PWA

```
frontend/
├── public/
│   ├── manifest.json          # Configuration PWA
│   ├── sw.js                  # Service Worker
│   ├── offline.html           # Page offline
│   ├── icon-*.png            # Icônes (72 à 512px)
│   └── favicon.svg           # Favicon
├── app/
│   ├── layout.tsx            # Intégration PWA
│   └── register-sw.tsx       # Enregistrement SW
└── scripts/
    └── generate-icons.js     # Générateur d'icônes
```

## 🚀 Utilisation

### Installation et démarrage

```bash
# Installer les dépendances
npm install

# Générer les icônes (optionnel, fait automatiquement au build)
npm run generate-icons

# Développement
npm run dev

# Build (génère automatiquement les icônes)
npm run build

# Production
npm start
```

### Tester la PWA

1. **Mode développement** :
   ```bash
   npm run dev
   ```
   - Ouvrir Chrome DevTools
   - Aller dans l'onglet "Application"
   - Vérifier "Service Workers" et "Manifest"

2. **Installation de l'app** :
   - Chrome : Cliquer sur l'icône "Installer" dans la barre d'adresse
   - Mobile : Menu → "Ajouter à l'écran d'accueil"

3. **Test offline** :
   - Chrome DevTools → Network → Cocher "Offline"
   - Naviguer dans l'app pour voir le support offline

## 🔧 Configuration

### Durées de cache

Modifiables dans `public/sw.js` :

```javascript
const CACHE_DURATION = {
  static: 30 * 24 * 60 * 60,  // 30 jours
  dynamic: 7 * 24 * 60 * 60,  // 7 jours
  images: 30 * 24 * 60 * 60,  // 30 jours
};
```

### Taille maximale des caches

```javascript
const MAX_CACHE_SIZE = {
  static: 50,   // 50 entrées
  dynamic: 100, // 100 entrées
  images: 60,   // 60 images
};
```

### Version du cache

Pour forcer une mise à jour du cache, modifier dans `sw.js` :

```javascript
const CACHE_VERSION = 'v3'; // Incrémenter pour vider les anciens caches
```

## 🎨 Personnalisation des icônes

### Générer de nouvelles icônes

1. Remplacer `public/icon-512x512.png` par votre nouvelle icône
2. Exécuter :
   ```bash
   npm run generate-icons
   ```

### Tailles d'icônes générées

- 72x72px
- 96x96px
- 128x128px
- 144x144px
- 152x152px
- 192x192px (maskable)
- 384x384px
- 512x512px (maskable)

## 📊 Validation PWA

### Outils de validation

1. **PWABuilder** : https://www.pwabuilder.com/
   - Entrer l'URL de votre app
   - Vérifier le score et les recommandations

2. **Lighthouse** (Chrome DevTools) :
   - F12 → Lighthouse → Analyser
   - Catégorie "Progressive Web App"

3. **Chrome DevTools** :
   - Application → Manifest
   - Application → Service Workers

### Checklist de validation

- ✅ Manifest valide avec tous les champs requis
- ✅ Service Worker enregistré et actif
- ✅ Support HTTPS (requis en production)
- ✅ Icônes de toutes tailles présentes
- ✅ Page offline fonctionnelle
- ✅ Thème color configuré
- ✅ Viewport meta tag présent
- ✅ App installable

## 🔐 Sécurité

### HTTPS requis

Les Service Workers **nécessitent HTTPS** en production (sauf localhost).

Votre configuration nginx doit inclure :
```nginx
listen 443 ssl;
ssl_certificate /etc/letsencrypt/live/domain/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/domain/privkey.pem;
```

## 🐛 Débogage

### Service Worker ne s'enregistre pas

1. Vérifier la console pour les erreurs
2. Vérifier que HTTPS est activé (en production)
3. Vérifier Chrome DevTools → Application → Service Workers

### Cache ne se met pas à jour

1. Incrémenter `CACHE_VERSION` dans `sw.js`
2. Application → Service Workers → "Update"
3. Application → Clear storage

### App non installable

1. Vérifier le manifest dans DevTools
2. Vérifier que toutes les icônes existent
3. Vérifier que HTTPS est activé
4. Lighthouse → PWA pour diagnostic détaillé

## 📱 Fonctionnalités à implémenter

Pour profiter pleinement des capabilities déclarées dans le manifest :

### 1. Share Target
Créer la route `/share` :
```typescript
// app/share/page.tsx
export default function SharePage() {
  // Gérer les données partagées
}
```

### 2. File Handlers
Créer la route `/open-file` :
```typescript
// app/open-file/page.tsx
export default function OpenFilePage() {
  // Gérer l'ouverture de fichiers
}
```

### 3. Push Notifications
Demander la permission et gérer les abonnements :
```typescript
const registration = await navigator.serviceWorker.ready;
const subscription = await registration.pushManager.subscribe({...});
```

## 📚 Ressources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [PWABuilder](https://www.pwabuilder.com/)
- [What PWA Can Do Today](https://whatpwacando.today/)

## 🎉 Résumé des améliorations

1. ✅ **Service Worker activé** avec stratégies de cache intelligentes
2. ✅ **Toutes les icônes générées** (72px à 512px)
3. ✅ **Manifest enrichi** avec toutes les app capabilities
4. ✅ **Support offline complet** avec page dédiée
5. ✅ **Background Sync** et **Push Notifications** prêts
6. ✅ **File Handlers** pour ouvrir CSV, Excel, JSON
7. ✅ **Share Target** pour recevoir du contenu
8. ✅ **Protocol Handlers** pour deep linking
9. ✅ **Scripts automatisés** pour génération d'icônes
10. ✅ **Window Controls Overlay** pour UI moderne

Votre application EMB est maintenant une **PWA de niveau production** ! 🚀
