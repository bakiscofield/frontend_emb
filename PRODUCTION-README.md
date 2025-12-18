# Déploiement Production - Guide Ultra Simple

## Sur votre serveur VPS (srv460526.hstgr.cloud)

### 1. Installation (Une seule fois)

```bash
# Vous êtes déjà dans /home/frontend_emb
cd /home/frontend_emb

# Installer PM2
npm install -g pm2

# Arrêter les anciens process qui consomment 97% CPU
pm2 delete all 2>/dev/null || true
pkill -f "next-server" 2>/dev/null || true
pkill -f "npm start" 2>/dev/null || true

# Lancer le déploiement
chmod +x deploy-production.sh
./deploy-production.sh install
```

### 2. Vérifier que ça marche

```bash
# Voir le statut
pm2 status

# Voir CPU/RAM en temps réel
pm2 monit
```

Vous devriez voir:
- **emb-frontend**: ~10-20% CPU (au lieu de 97%)
- **emb-backend**: ~5-10% CPU

### 3. Commandes quotidiennes

```bash
# Après git pull (mise à jour code)
./deploy-production.sh rebuild

# Voir les logs
pm2 logs

# Redémarrer tout
pm2 restart all

# Voir le statut
pm2 status
```

## Structure sur le serveur

```
/home/
├── frontend_emb/          ← Vous êtes ici
│   ├── deploy-production.sh
│   ├── ecosystem.config.js
│   └── (code Next.js)
│
└── backend_emb/           ← Le backend est géré automatiquement
    └── server.js
```

## Résolution de problèmes

### CPU encore élevé?
```bash
pm2 restart all
```

### Voir quelle app consomme:
```bash
pm2 monit
```

### Tout redémarrer proprement:
```bash
pm2 delete all
./deploy-production.sh install
```

## Workflow de mise à jour

```bash
# 1. Pull le nouveau code
cd /home/frontend_emb
git pull

# 2. Rebuild et restart
./deploy-production.sh rebuild

# C'est tout!
```

## Commandes PM2 utiles

```bash
pm2 status              # Statut
pm2 logs                # Tous les logs
pm2 logs emb-frontend   # Logs frontend seulement
pm2 logs emb-backend    # Logs backend seulement
pm2 monit               # Monitoring interactif
pm2 restart all         # Redémarrer tout
pm2 stop all            # Arrêter tout
pm2 start ecosystem.config.js  # Démarrer tout
```

## Ce qui a changé

**Avant:**
- `npm run dev` → 97% CPU
- Mode développement en production
- Pas d'optimisation

**Maintenant:**
- `npm start` → ~10-20% CPU
- Mode production optimisé
- Compression + minification
- Restart automatique
- Logs centralisés

---

**Support**: Si problème, faites `pm2 logs` pour voir les erreurs
