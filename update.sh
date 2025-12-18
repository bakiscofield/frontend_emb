#!/bin/bash

# Script de mise à jour automatique en production
# Usage: ./update.sh

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║                                                       ║"
echo "║       🚀 Mise à jour Production EMB                  ║"
echo "║                                                       ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# 1. Git Pull
echo -e "${BLUE}📥 Étape 1/3: Récupération du code...${NC}"
git pull
echo -e "${GREEN}✓ Code mis à jour${NC}"
echo ""

# 2. Build
echo -e "${BLUE}🔨 Étape 2/3: Build du frontend...${NC}"
npm run build
echo -e "${GREEN}✓ Build terminé${NC}"
echo ""

# 3. Restart
echo -e "${BLUE}🔄 Étape 3/3: Redémarrage...${NC}"
if pm2 list | grep -q "emb-frontend"; then
    pm2 restart emb-frontend
else
    pm2 start ecosystem.config.js
fi
pm2 save
echo -e "${GREEN}✓ Application redémarrée${NC}"
echo ""

# Statut final
echo "╔═══════════════════════════════════════════════════════╗"
echo "║                                                       ║"
echo "║              ✅ Mise à jour terminée !               ║"
echo "║                                                       ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

pm2 status
echo ""
echo -e "${YELLOW}💡 Pour voir les logs: pm2 logs${NC}"
echo ""
