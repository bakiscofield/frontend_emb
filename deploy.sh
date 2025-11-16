#!/bin/bash

echo "╔═══════════════════════════════════════════════════════╗"
echo "║                                                       ║"
echo "║   🚀 Déploiement EMB Frontend (Docker + Nginx + SSL) ║"
echo "║                                                       ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
DOMAIN="emb_front.alicebot.me"
EMAIL="admin@alicebot.me"

# Détecter Docker Compose
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    echo -e "${RED}❌ Docker Compose n'est pas installé${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker Compose: $DOCKER_COMPOSE${NC}"

# Créer les dossiers nécessaires
mkdir -p nginx/conf.d certbot/conf certbot/www

# Le frontend tournera sur le port 3000
# Le Nginx du backend fera le reverse proxy vers emb_front.alicebot.me

echo ""
echo "🛑 Arrêt des anciens conteneurs..."
$DOCKER_COMPOSE down 2>/dev/null

# Arrêter Nginx système s'il existe
if systemctl is-active --quiet nginx 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Nginx système détecté, arrêt...${NC}"
    sudo systemctl stop nginx
fi

echo ""
echo "🔨 Construction de l'image frontend..."
$DOCKER_COMPOSE build emb-frontend

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erreur lors de la construction${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Image construite${NC}"

echo ""
echo "🚀 Démarrage du frontend..."
$DOCKER_COMPOSE up -d emb-frontend

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erreur lors du démarrage${NC}"
    $DOCKER_COMPOSE logs
    exit 1
fi

echo -e "${GREEN}✓ Conteneurs démarrés${NC}"

# Attendre
echo "⏳ Attente du démarrage (10 secondes)..."
sleep 10

# Vérifier
echo ""
echo "🔍 Vérification..."
if docker ps | grep -q emb-frontend; then
    echo -e "${GREEN}✓ Frontend démarré${NC}"
else
    echo -e "${RED}❌ Le frontend ne fonctionne pas${NC}"
    $DOCKER_COMPOSE ps
    $DOCKER_COMPOSE logs --tail=50
    exit 1
fi

echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║                                                       ║"
echo "║            ✅ Déploiement réussi !                    ║"
echo "║                                                       ║"
echo "║  🌐 Frontend disponible sur :                        ║"
echo "║     http://localhost:3000 (local)                    ║"
echo "║                                                       ║"
echo "║  ⚠️  PROCHAINE ÉTAPE :                                ║"
echo "║     Configurez le Nginx du backend pour router       ║"
echo "║     emb_front.alicebot.me vers le port 3000          ║"
echo "║                                                       ║"
echo "║  📊 Commandes utiles :                               ║"
echo "║     $DOCKER_COMPOSE logs -f          ║"
echo "║     $DOCKER_COMPOSE ps               ║"
echo "║     $DOCKER_COMPOSE restart          ║"
echo "║                                                       ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
