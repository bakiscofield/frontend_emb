# 📱 EMB Frontend

Application Next.js pour la gestion des transactions Tmoney → Flooz

## 🚀 Technologies

- Next.js 14
- TypeScript
- Tailwind CSS
- Zustand (state management)
- React Hot Toast
- PWA

## 🎯 Fonctionnalités

### Client
- Inscription et connexion sécurisées
- Création de transactions
- Calcul automatique des commissions
- Historique des transactions
- Interface responsive (mobile, tablette, desktop)
- PWA installable

### Admin
- Dashboard complet
- Validation/Rejet des transactions
- Statistiques en temps réel
- Gestion du taux de commission

## 📦 Installation locale

```bash
npm install
npm run dev
```

Ouvrir http://localhost:3000

## 🔐 Configuration

Créer un fichier `.env.local` :

```env
NEXT_PUBLIC_API_URL=https://emb_back.alicebot.me
```

## 🌐 Déploiement sur Vercel

### Option 1 : Via GitHub (Recommandé)

1. Pushez le code sur GitHub
2. Connectez-vous sur https://vercel.com
3. Cliquez sur "New Project"
4. Importez votre repository GitHub
5. Vercel détecte automatiquement Next.js
6. Ajoutez la variable d'environnement :
   - `NEXT_PUBLIC_API_URL` = `https://emb_back.alicebot.me`
7. Cliquez sur "Deploy"

### Option 2 : Via Vercel CLI

```bash
npm install -g vercel
vercel
```

## 📱 PWA

L'application est installable sur mobile et desktop :

- **Android/Chrome** : Menu → "Ajouter à l'écran d'accueil"
- **iOS/Safari** : Partager → "Sur l'écran d'accueil"

## 🔗 URLs

- **Production** : https://emb-frontend.vercel.app
- **Backend API** : https://emb_back.alicebot.me

## 🎨 Icônes

Les icônes PWA sont générées et disponibles dans `/public` :
- `icon-192x192.png` - 192x192
- `icon-512x512.png` - 512x512
- `apple-touch-icon.png` - iOS
- `favicon.svg` - Navigateurs modernes

## 📄 License

MIT
