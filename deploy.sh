#!/bin/bash

echo "╔═══════════════════════════════════════════════════════╗"
echo "║                                                       ║"
echo "║        🚀 Déploiement EMB Frontend (Docker)          ║"
echo "║                                                       ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

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
echo ""

# Arrêter les conteneurs existants
echo "🛑 Arrêt des anciens conteneurs..."
$DOCKER_COMPOSE down 2>/dev/null

# Construire l'image
echo ""
echo "🔨 Construction de l'image frontend..."
$DOCKER_COMPOSE build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erreur lors de la construction${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Image construite${NC}"

# Démarrer le conteneur
echo ""
echo "🚀 Démarrage du frontend..."
$DOCKER_COMPOSE up -d

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erreur lors du démarrage${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Frontend démarré${NC}"

# Attendre
echo "⏳ Attente du démarrage (10 secondes)..."
sleep 10

# Vérifier
if docker ps | grep -q emb-frontend; then
    echo -e "${GREEN}✓ Conteneur emb-frontend en cours d'exécution${NC}"
else
    echo -e "${RED}❌ Le conteneur ne fonctionne pas${NC}"
    $DOCKER_COMPOSE logs
    exit 1
fi

echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║                                                       ║"
echo "║            ✅ Déploiement réussi !                    ║"
echo "║                                                       ║"
echo "║  🌐 Frontend disponible sur :                        ║"
echo "║     http://localhost:3000                            ║"
echo "║                                                       ║"
echo "║  📊 Commandes utiles :                               ║"
echo "║     $DOCKER_COMPOSE logs -f      # Voir les logs     ║"
echo "║     $DOCKER_COMPOSE ps           # Statut            ║"
echo "║     $DOCKER_COMPOSE restart      # Redémarrer        ║"
echo "║     $DOCKER_COMPOSE down         # Arrêter           ║"
echo "║                                                       ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
