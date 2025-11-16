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

# Vérifier si SSL existe
SSL_EXISTS=false
FIRST_DEPLOY=false

if [ -d "certbot/conf/live/$DOMAIN" ]; then
    echo -e "${GREEN}✓ Certificat SSL déjà présent${NC}"
    SSL_EXISTS=true
else
    echo -e "${YELLOW}⚠️  Première installation - SSL sera configuré${NC}"
    FIRST_DEPLOY=true

    # Config Nginx temporaire (HTTP seulement)
    cat > nginx/conf.d/emb_front.conf <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        proxy_pass http://emb-frontend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
fi

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
echo "🚀 Démarrage du frontend et Nginx..."
$DOCKER_COMPOSE up -d emb-frontend nginx

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erreur lors du démarrage${NC}"
    $DOCKER_COMPOSE logs
    exit 1
fi

echo -e "${GREEN}✓ Conteneurs démarrés${NC}"

# Attendre
echo "⏳ Attente du démarrage (15 secondes)..."
sleep 15

# Si première installation, obtenir SSL
if [ "$FIRST_DEPLOY" = true ]; then
    echo ""
    echo "🔒 Obtention du certificat SSL..."
    echo -e "${BLUE}   Domaine: $DOMAIN${NC}"
    echo -e "${BLUE}   Email: $EMAIL${NC}"

    $DOCKER_COMPOSE run --rm certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email $EMAIL \
        --agree-tos \
        --no-eff-email \
        -d $DOMAIN

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Certificat SSL obtenu !${NC}"
        SSL_EXISTS=true

        # Config Nginx avec SSL
        echo "🔧 Configuration de Nginx avec SSL..."
        cat > nginx/conf.d/emb_front.conf <<'EOFSSL'
# HTTP -> HTTPS
server {
    listen 80;
    server_name emb_front.alicebot.me;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS
server {
    listen 443 ssl http2;
    server_name emb_front.alicebot.me;

    ssl_certificate /etc/letsencrypt/live/emb_front.alicebot.me/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/emb_front.alicebot.me/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    add_header Strict-Transport-Security "max-age=31536000" always;

    access_log /var/log/nginx/emb_frontend_access.log;
    error_log /var/log/nginx/emb_frontend_error.log;

    location / {
        proxy_pass http://emb-frontend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOFSSL

        # Recharger Nginx
        echo "🔄 Rechargement de Nginx..."
        $DOCKER_COMPOSE exec nginx nginx -s reload

        # Démarrer Certbot
        $DOCKER_COMPOSE up -d certbot

        echo -e "${GREEN}✓ SSL configuré !${NC}"
    else
        echo -e "${YELLOW}⚠️  Impossible d'obtenir le certificat SSL${NC}"
        echo -e "${YELLOW}   L'application fonctionnera en HTTP${NC}"
        echo ""
        echo "Vérifiez que:"
        echo "  - Le domaine $DOMAIN pointe vers ce serveur"
        echo "  - Les ports 80 et 443 sont ouverts"
        SSL_EXISTS=false
    fi
else
    # Mise à jour : redémarrer Certbot
    echo "🔄 Redémarrage de Certbot..."
    $DOCKER_COMPOSE up -d certbot
fi

# Vérifier
echo ""
echo "🔍 Vérification..."
if docker ps | grep -q emb-frontend && docker ps | grep -q emb-frontend-nginx; then
    echo -e "${GREEN}✓ Tous les conteneurs fonctionnent${NC}"
else
    echo -e "${RED}❌ Certains conteneurs ne fonctionnent pas${NC}"
    $DOCKER_COMPOSE ps
    $DOCKER_COMPOSE logs --tail=50
    exit 1
fi

echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║                                                       ║"
echo "║            ✅ Déploiement réussi !                    ║"
echo "║                                                       ║"
echo "║  🌐 Frontend EMB disponible sur :                    ║"
if [ "$SSL_EXISTS" = true ]; then
echo "║     https://emb_front.alicebot.me                    ║"
echo "║     (HTTP redirigé vers HTTPS)                       ║"
else
echo "║     http://emb_front.alicebot.me                     ║"
fi
echo "║                                                       ║"
echo "║  📊 Commandes utiles :                               ║"
echo "║     $DOCKER_COMPOSE logs -f          ║"
echo "║     $DOCKER_COMPOSE ps               ║"
echo "║     $DOCKER_COMPOSE restart          ║"
echo "║     $DOCKER_COMPOSE down             ║"
echo "║                                                       ║"
echo "║  🧪 Tester :                                         ║"
if [ "$SSL_EXISTS" = true ]; then
echo "║     curl https://emb_front.alicebot.me               ║"
else
echo "║     curl http://emb_front.alicebot.me                ║"
fi
echo "║                                                       ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
