#!/bin/bash
set -e

echo "=== Mise à jour Frontend EMB ==="

cd "$(dirname "$0")"

echo ">> Git pull..."
git pull origin main

echo ">> Installation des dépendances..."
npm install

echo ">> Build du projet..."
npm run build

echo ">> Redémarrage PM2 (emb-frontend)..."
pm2 restart emb-frontend

echo "=== Frontend mis à jour avec succès ==="
