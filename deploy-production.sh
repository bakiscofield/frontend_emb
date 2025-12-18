#!/bin/bash

# Script de déploiement production pour EMB App (Frontend)
# Usage: ./deploy-production.sh [install|restart|status|logs|stop]

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

check_pm2() {
    if ! command -v pm2 &> /dev/null; then
        error "PM2 n'est pas installé. Installation..."
        npm install -g pm2
    fi
}

install_production() {
    log "Installation en mode production..."

    # Frontend (dossier actuel)
    log "Installation des dépendances (avec devDependencies pour le build)..."
    npm ci

    log "Build du frontend..."
    npm run build

    log "Installation terminée!"
}

start_production() {
    log "Démarrage des applications en production..."

    check_pm2

    # Créer le dossier logs s'il n'existe pas
    mkdir -p logs

    # Arrêter les anciennes instances
    pm2 delete all 2>/dev/null || true

    # Démarrer avec PM2
    pm2 start ecosystem.config.js

    # Sauvegarder la configuration PM2
    pm2 save

    # Configurer PM2 pour démarrer au boot
    pm2 startup

    log "Applications démarrées avec succès!"
    log "Utilisez 'pm2 status' pour voir l'état"
}

restart_production() {
    log "Redémarrage des applications..."

    check_pm2
    pm2 restart ecosystem.config.js

    log "Applications redémarrées avec succès!"
}

stop_production() {
    log "Arrêt des applications..."

    check_pm2
    pm2 stop all

    log "Applications arrêtées!"
}

show_status() {
    check_pm2
    pm2 status
}

show_logs() {
    check_pm2
    if [ -n "$2" ]; then
        pm2 logs "$2"
    else
        pm2 logs
    fi
}

monitor() {
    check_pm2
    pm2 monit
}

rebuild() {
    log "Reconstruction du frontend..."
    npm run build
    log "Build terminé! Redémarrage du frontend..."
    pm2 restart emb-frontend
    log "Frontend redémarré!"
}

case "$1" in
    install)
        install_production
        start_production
        ;;
    start)
        start_production
        ;;
    restart)
        restart_production
        ;;
    stop)
        stop_production
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    monitor)
        monitor
        ;;
    rebuild)
        rebuild
        ;;
    *)
        echo "Usage: $0 {install|start|restart|stop|status|logs|monitor|rebuild}"
        echo ""
        echo "Commandes:"
        echo "  install  - Installer les dépendances et démarrer"
        echo "  start    - Démarrer les applications"
        echo "  restart  - Redémarrer les applications"
        echo "  stop     - Arrêter les applications"
        echo "  status   - Voir le statut des applications"
        echo "  logs     - Voir les logs en temps réel"
        echo "  monitor  - Ouvrir le moniteur interactif PM2"
        echo "  rebuild  - Rebuild le frontend et redémarrer"
        exit 1
        ;;
esac

exit 0
