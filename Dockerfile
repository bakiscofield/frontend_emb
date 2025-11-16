# Étape 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci

# Copier le code source
COPY . .

# Variables d'environnement pour le build
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build de l'application
RUN npm run build

# Étape 2: Production
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copier les fichiers nécessaires depuis le builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Exposer le port
EXPOSE 3000

ENV PORT 3000

# Démarrer l'application
CMD ["node", "server.js"]
