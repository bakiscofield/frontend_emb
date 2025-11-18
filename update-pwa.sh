#!/bin/bash

echo "╔═══════════════════════════════════════════════════════╗"
echo "║                                                       ║"
echo "║   📱 Mise à jour PWA - EMB Frontend                  ║"
echo "║                                                       ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# 1. Vérification des fichiers PWA essentiels
echo "📋 Étape 1: Vérification des fichiers PWA..."
echo ""

REQUIRED_FILES=(
    "public/manifest.json"
    "public/sw.js"
    "public/offline.html"
    "public/icon-192x192.png"
    "public/icon-512x512.png"
    "app/layout.tsx"
    "app/register-sw.tsx"
)

MISSING_FILES=0
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Fichier manquant: $file${NC}"
        MISSING_FILES=$((MISSING_FILES + 1))
    else
        echo -e "${GREEN}✓ $file${NC}"
    fi
done

if [ $MISSING_FILES -gt 0 ]; then
    echo -e "${RED}❌ $MISSING_FILES fichier(s) manquant(s)${NC}"
    echo -e "${YELLOW}⚠️  Récupération depuis Git...${NC}"
    git pull
fi

echo ""

# 2. Vérification des icônes PWA
echo "📋 Étape 2: Vérification des icônes PWA..."
echo ""

ICON_SIZES=(72 96 128 144 152 192 384 512)
MISSING_ICONS=0

for size in "${ICON_SIZES[@]}"; do
    icon="public/icon-${size}x${size}.png"
    if [ ! -f "$icon" ]; then
        echo -e "${YELLOW}⚠️  Icône manquante: ${size}x${size}${NC}"
        MISSING_ICONS=$((MISSING_ICONS + 1))
    else
        echo -e "${GREEN}✓ icon-${size}x${size}.png${NC}"
    fi
done

# 3. Générer les icônes si nécessaire
if [ $MISSING_ICONS -gt 0 ]; then
    echo ""
    echo "🎨 Étape 3: Génération des icônes manquantes..."

    if [ ! -f "scripts/generate-icons.js" ]; then
        echo -e "${RED}❌ Script generate-icons.js manquant${NC}"
        exit 1
    fi

    node scripts/generate-icons.js

    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Erreur lors de la génération des icônes${NC}"
        exit 1
    fi

    echo -e "${GREEN}✓ Icônes générées${NC}"
else
    echo -e "${GREEN}✓ Toutes les icônes sont présentes${NC}"
fi

echo ""

# 4. Vérifier le Service Worker dans layout.tsx
echo "📋 Étape 4: Vérification de l'activation du Service Worker..."

if grep -q "<RegisterServiceWorker" app/layout.tsx; then
    echo -e "${GREEN}✓ Service Worker activé dans layout.tsx${NC}"
else
    echo -e "${RED}❌ Service Worker non activé dans layout.tsx${NC}"
    echo -e "${YELLOW}⚠️  Vérifiez que <RegisterServiceWorker /> est bien présent${NC}"
fi

echo ""

# 5. Installer les dépendances si nécessaire
echo "📋 Étape 5: Vérification des dépendances..."

if [ ! -d "node_modules" ] || [ ! -d "node_modules/sharp" ]; then
    echo -e "${YELLOW}⚠️  Installation des dépendances...${NC}"
    npm install
    echo -e "${GREEN}✓ Dépendances installées${NC}"
else
    echo -e "${GREEN}✓ Dépendances OK${NC}"
fi

echo ""

# 6. Build Next.js
echo "📋 Étape 6: Build de l'application avec PWA..."
echo ""

# Générer les icônes avant le build (via prebuild)
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erreur lors du build${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build réussi${NC}"

echo ""

# 7. Vérifier PM2
echo "📋 Étape 7: Vérification de PM2..."

if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}❌ PM2 n'est pas installé${NC}"
    echo -e "${YELLOW}⚠️  Installation de PM2...${NC}"
    npm install -g pm2
fi

echo -e "${GREEN}✓ PM2 disponible${NC}"

echo ""

# 8. Redémarrer le frontend
echo "📋 Étape 8: Redémarrage du frontend..."

# Vérifier si le process existe
if pm2 list | grep -q "emb-frontend"; then
    echo "🔄 Redémarrage de emb-frontend..."
    pm2 restart emb-frontend

    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Erreur lors du redémarrage${NC}"
        exit 1
    fi

    echo -e "${GREEN}✓ Frontend redémarré${NC}"
else
    echo -e "${YELLOW}⚠️  emb-frontend n'est pas en cours d'exécution${NC}"
    echo "🚀 Démarrage de emb-frontend..."

    pm2 start npm --name emb-frontend -- start

    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Erreur lors du démarrage${NC}"
        exit 1
    fi

    echo -e "${GREEN}✓ Frontend démarré${NC}"
fi

# Sauvegarder la config PM2
pm2 save

echo ""

# 9. Vérifications PWA
echo "📋 Étape 9: Vérifications PWA..."
echo ""

sleep 3

# Vérifier que le frontend répond
if curl -s http://127.0.0.1:3000 > /dev/null; then
    echo -e "${GREEN}✓ Frontend répond sur localhost:3000${NC}"
else
    echo -e "${RED}❌ Frontend ne répond pas${NC}"
    exit 1
fi

# Vérifier le manifest
if curl -s http://127.0.0.1:3000/manifest.json > /dev/null; then
    echo -e "${GREEN}✓ Manifest.json accessible${NC}"
else
    echo -e "${YELLOW}⚠️  Manifest.json non accessible${NC}"
fi

# Vérifier le Service Worker
if curl -s http://127.0.0.1:3000/sw.js > /dev/null; then
    echo -e "${GREEN}✓ Service Worker (sw.js) accessible${NC}"
else
    echo -e "${YELLOW}⚠️  Service Worker non accessible${NC}"
fi

# Vérifier la page offline
if curl -s http://127.0.0.1:3000/offline.html > /dev/null; then
    echo -e "${GREEN}✓ Page offline accessible${NC}"
else
    echo -e "${YELLOW}⚠️  Page offline non accessible${NC}"
fi

# Vérifier quelques icônes
for size in 192 512; do
    if curl -s http://127.0.0.1:3000/icon-${size}x${size}.png > /dev/null; then
        echo -e "${GREEN}✓ Icône ${size}x${size} accessible${NC}"
    else
        echo -e "${YELLOW}⚠️  Icône ${size}x${size} non accessible${NC}"
    fi
done

echo ""

# 10. Statut PM2
echo "📋 Étape 10: Statut du service..."
pm2 status

echo ""

# Afficher les logs récents
echo "📋 Derniers logs:"
echo -e "${BLUE}----------------------------------------${NC}"
pm2 logs emb-frontend --lines 10 --nostream
echo -e "${BLUE}----------------------------------------${NC}"

echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║                                                       ║"
echo "║            ✅ Mise à jour PWA terminée !              ║"
echo "║                                                       ║"
echo "║  📱 Fonctionnalités PWA activées :                   ║"
echo "║     ✓ Service Worker avec cache intelligent         ║"
echo "║     ✓ Support offline complet                       ║"
echo "║     ✓ Icônes PWA (72px à 512px)                     ║"
echo "║     ✓ Manifest avec app capabilities                ║"
echo "║     ✓ File handlers, Share target, etc.             ║"
echo "║                                                       ║"
echo "║  🌐 URL : https://emb-front.alicebot.me              ║"
echo "║  📍 Port local : 3000                                ║"
echo "║                                                       ║"
echo "║  🔍 Validation PWA :                                 ║"
echo "║                                                       ║"
echo "║  1️⃣  Ouvrir Chrome DevTools (F12)                    ║"
echo "║     → Application → Service Workers                  ║"
echo "║     → Application → Manifest                         ║"
echo "║                                                       ║"
echo "║  2️⃣  Tester l'installation :                         ║"
echo "║     → Cliquer sur l'icône 'Installer' (Chrome)      ║"
echo "║                                                       ║"
echo "║  3️⃣  Valider avec PWABuilder :                       ║"
echo "║     → https://www.pwabuilder.com/                    ║"
echo "║     → Entrer: https://emb-front.alicebot.me          ║"
echo "║                                                       ║"
echo "║  📊 Commandes utiles :                               ║"
echo "║     pm2 logs emb-frontend                            ║"
echo "║     pm2 restart emb-frontend                         ║"
echo "║     pm2 monit                                        ║"
echo "║                                                       ║"
echo "║  🔄 Pour forcer un rebuild :                         ║"
echo "║     npm run build                                    ║"
echo "║     pm2 restart emb-frontend                         ║"
echo "║                                                       ║"
echo "║  📚 Documentation PWA :                              ║"
echo "║     Voir PWA_README.md pour plus de détails         ║"
echo "║                                                       ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
