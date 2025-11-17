#!/bin/bash

echo "╔═══════════════════════════════════════════════════════╗"
echo "║                                                       ║"
echo "║   🚀 Déploiement Manuel EMB Frontend                 ║"
echo "║                                                       ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. Configuration .env
echo "📋 Étape 1: Configuration .env..."
if [ -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  .env.local existe déjà, sauvegarde en .env.local.backup${NC}"
    cp .env.local .env.local.backup
fi

cp .env.production .env.local
echo -e "${GREEN}✓ .env.local configuré${NC}"

# 2. Installer les dépendances
echo ""
echo "📋 Étape 2: Installation des dépendances..."
npm install --production
echo -e "${GREEN}✓ Dépendances installées${NC}"

# 3. Build Next.js
echo ""
echo "📋 Étape 3: Build de l'application Next.js..."
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erreur lors du build${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build réussi${NC}"

# 4. Installer PM2 globalement
echo ""
echo "📋 Étape 4: Installation de PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    echo -e "${GREEN}✓ PM2 installé${NC}"
else
    echo -e "${GREEN}✓ PM2 déjà installé${NC}"
fi

# 5. Arrêter l'ancien processus
echo ""
echo "📋 Étape 5: Arrêt des anciens processus..."
pm2 delete emb-frontend 2>/dev/null || true
echo -e "${GREEN}✓ Anciens processus arrêtés${NC}"

# 6. Démarrer avec PM2
echo ""
echo "📋 Étape 6: Démarrage du frontend avec PM2..."
pm2 start npm --name emb-frontend -- start

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erreur lors du démarrage${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Frontend démarré${NC}"

# 7. Sauvegarder la config PM2
echo ""
echo "📋 Étape 7: Sauvegarde de la configuration PM2..."
pm2 save
echo -e "${GREEN}✓ Configuration sauvegardée${NC}"

# 8. Vérifier le statut
echo ""
echo "📋 Étape 8: Vérification..."
sleep 3
pm2 status

echo ""
echo "Test frontend local..."
curl -s http://127.0.0.1:3000 > /dev/null && echo -e "${GREEN}✓ Frontend répond sur localhost:3000${NC}" || echo -e "${RED}❌ Frontend ne répond pas${NC}"

echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║                                                       ║"
echo "║            ✅ Déploiement terminé !                   ║"
echo "║                                                       ║"
echo "║  📦 Frontend : http://emb-front.alicebot.me          ║"
echo "║  📍 Port local : 3000                                ║"
echo "║  🔗 API Backend : https://emb-back.alicebot.me       ║"
echo "║                                                       ║"
echo "║  📊 Commandes PM2 :                                  ║"
echo "║     pm2 status                                       ║"
echo "║     pm2 logs emb-frontend                            ║"
echo "║     pm2 restart emb-frontend                         ║"
echo "║     pm2 stop emb-frontend                            ║"
echo "║                                                       ║"
echo "║  🔄 Pour rebuild après modifications :               ║"
echo "║     npm run build                                    ║"
echo "║     pm2 restart emb-frontend                         ║"
echo "║                                                       ║"
echo "║  ⚠️  IMPORTANT :                                      ║"
echo "║  Le Nginx système doit être configuré pour router   ║"
echo "║  emb-front.alicebot.me vers localhost:3000          ║"
echo "║  (déjà fait si deploy-manual.sh du backend lancé)   ║"
echo "║                                                       ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
