# 🚀 Guide rapide - Déploiement PWA

## Sur votre serveur (en 3 commandes)

### 1. Se connecter au serveur et aller dans le dossier frontend

```bash
ssh votre-user@votre-serveur
cd /chemin/vers/emb-app/frontend
```

### 2. Récupérer les mises à jour depuis Git

```bash
git pull origin main
```

### 3. Lancer le script de mise à jour PWA

```bash
./update-pwa.sh
```

**C'est tout !** 🎉

Le script va automatiquement :
- ✅ Vérifier tous les fichiers PWA
- ✅ Générer les icônes manquantes
- ✅ Rebuilder l'application
- ✅ Redémarrer le service
- ✅ Vérifier que tout fonctionne

---

## Alternative : Mise à jour manuelle pas à pas

Si vous préférez faire les étapes manuellement :

```bash
# 1. Récupérer le code
git pull origin main

# 2. Générer les icônes
npm run generate-icons

# 3. Installer les dépendances (si nécessaire)
npm install

# 4. Rebuild
npm run build

# 5. Redémarrer PM2
pm2 restart emb-frontend

# 6. Vérifier
pm2 status
pm2 logs emb-frontend --lines 20
```

---

## Vérification dans le navigateur

1. Ouvrir **https://emb-front.alicebot.me**
2. Appuyer sur **F12** (DevTools)
3. Onglet **Application**
4. Vérifier :
   - Service Workers → "Activated"
   - Manifest → Tous les champs présents
   - Storage → Caches créés

---

## Test PWA

### Installation
- Cliquer sur l'icône **"Installer"** dans la barre d'adresse Chrome
- L'app s'installe comme une application native

### Mode Offline
- DevTools → Network → Cocher **"Offline"**
- Naviguer → La page offline s'affiche
- Décocher "Offline" → Reconnexion automatique

### Validation PWABuilder
- Aller sur https://www.pwabuilder.com/
- Entrer l'URL : **https://emb-front.alicebot.me**
- Vérifier le score

---

## Dépannage

### Le Service Worker ne se charge pas

```bash
# Vider le cache du Service Worker
# Dans Chrome DevTools :
# Application → Service Workers → Unregister
# Application → Clear storage → Clear site data
# Recharger la page
```

### Les icônes ne s'affichent pas

```bash
# Régénérer les icônes
npm run generate-icons

# Rebuild
npm run build
pm2 restart emb-frontend
```

### L'app ne redémarre pas

```bash
# Voir les logs
pm2 logs emb-frontend

# Redémarrer en force
pm2 delete emb-frontend
pm2 start npm --name emb-frontend -- start
pm2 save
```

---

## Commandes utiles

```bash
# Voir les logs en temps réel
pm2 logs emb-frontend -f

# Redémarrer
pm2 restart emb-frontend

# Voir le statut
pm2 status

# Monitoring
pm2 monit

# Rebuild complet
npm run build && pm2 restart emb-frontend
```

---

**Temps total : ~2-5 minutes** ⏱️
