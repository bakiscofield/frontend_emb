# 🚀 Déploiement Frontend EMB sur VPS

## 📋 Architecture

```
Frontend (Docker) → Port 3000
Backend Nginx → Reverse Proxy → emb_front.alicebot.me
```

Le frontend tourne dans Docker sur le port 3000, et le Nginx du backend fera le reverse proxy.

---

## 🐳 Déploiement sur VPS

### 1. Cloner le repository

```bash
# Sur votre VPS
cd /home
git clone https://github.com/bakiscofield/frontend_emb.git frontend
cd frontend
```

### 2. Déployer

```bash
chmod +x deploy.sh
./deploy.sh
```

Le script va :
- Construire l'image Docker
- Démarrer le conteneur
- Exposer le port 3000

### 3. Vérifier

```bash
# Tester localement
curl http://localhost:3000

# Voir les logs
docker compose logs -f
```

---

## 🔧 Configuration Nginx (sur le backend)

Ajoutez cette configuration au Nginx du backend pour router `emb_front.alicebot.me` vers le frontend :

```nginx
# /home/backend/nginx/conf.d/emb_front.conf

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

server {
    listen 443 ssl http2;
    server_name emb_front.alicebot.me;

    ssl_certificate /etc/letsencrypt/live/emb_front.alicebot.me/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/emb_front.alicebot.me/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://host.docker.internal:3000;
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
```

---

## 📡 DNS

Configurez le DNS :
```
Type: A
Nom: emb_front
Valeur: 82.180.162.157
```

---

## 🔐 SSL

Obtenir le certificat SSL depuis le backend :

```bash
cd /home/backend
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email admin@alicebot.me \
    --agree-tos \
    --no-eff-email \
    -d emb_front.alicebot.me
```

---

## 🔄 Mises à jour

```bash
cd /home/frontend
git pull origin main
./deploy.sh
```

---

## 📊 Commandes Docker

```bash
# Logs
docker compose logs -f

# Statut
docker compose ps

# Redémarrer
docker compose restart

# Arrêter
docker compose down

# Rebuilder
docker compose build --no-cache
docker compose up -d
```

---

## 🌐 URLs finales

- **Frontend** : https://emb_front.alicebot.me
- **Backend API** : https://emb_back.alicebot.me
