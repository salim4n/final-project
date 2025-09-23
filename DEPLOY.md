# 🚀 Guide de Déploiement Docker

Ce guide te permet de déployer l'agent nutrition n'importe où avec Docker.

## 📦 Prérequis

- Docker et Docker Compose installés
- Clés API (OpenAI, LangSmith optionnel)

## 🏃 Déploiement Local

### 1. Configuration

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer avec tes clés
nano .env
```

### 2. Build et Run

```bash
# Avec Docker Compose (recommandé)
docker-compose up -d

# Ou avec Docker seul
docker build -t agent-nutrition .
docker run -p 3000:3000 --env-file .env agent-nutrition
```

### 3. Vérifier

```bash
curl http://localhost:3000/health
```

## ☁️ Déploiement Cloud

### 🐳 **Docker Hub + n'importe quel cloud**

```bash
# 1. Build et tag
docker build -t ton-username/agent-nutrition:latest .

# 2. Push sur Docker Hub
docker login
docker push ton-username/agent-nutrition:latest

# 3. Pull et run sur ton serveur
docker pull ton-username/agent-nutrition:latest
docker run -d -p 3000:3000 \
  -e OPENAI_API_KEY=sk-xxx \
  -e LANGSMITH_API_KEY=lsv2_xxx \
  ton-username/agent-nutrition:latest
```

### 🚂 **Railway.app**

```bash
# 1. Installer Railway CLI
npm i -g @railway/cli

# 2. Login
railway login

# 3. Créer un nouveau projet
railway init

# 4. Ajouter les variables d'env dans le dashboard Railway
# https://railway.app/dashboard

# 5. Déployer (détecte automatiquement le Dockerfile)
railway up
```

### 🎨 **Render.com**

1. Connecte ton repo GitHub à Render
2. Sélectionne "Docker" comme environnement
3. Ajoute les variables d'env dans le dashboard
4. Deploy automatique à chaque push

### 🪰 **Fly.io**

```bash
# 1. Installer Fly CLI
curl -L https://fly.io/install.sh | sh

# 2. Login
fly auth login

# 3. Lancer l'app (génère fly.toml)
fly launch

# 4. Ajouter les secrets
fly secrets set OPENAI_API_KEY=sk-xxx
fly secrets set LANGSMITH_API_KEY=lsv2_xxx

# 5. Déployer
fly deploy
```

### 🌊 **DigitalOcean App Platform**

1. Connecte ton repo GitHub
2. Sélectionne "Dockerfile"
3. Configure les variables d'env
4. Deploy

### ☁️ **AWS ECS / Google Cloud Run / Azure Container Instances**

Tous supportent les containers Docker. Utilise leur CLI respective :

```bash
# AWS ECS
aws ecs create-service --cluster my-cluster ...

# Google Cloud Run
gcloud run deploy agent-nutrition --image gcr.io/project/agent-nutrition

# Azure
az container create --resource-group mygroup --name agent-nutrition ...
```

## 🔧 Commandes Utiles

```bash
# Logs
docker-compose logs -f

# Restart
docker-compose restart

# Stop
docker-compose down

# Rebuild après changements
docker-compose up -d --build

# Shell dans le container
docker-compose exec agent-nutrition sh
```

## 📊 Monitoring

Le Dockerfile inclut un health check automatique sur `/health`.

```bash
# Vérifier le status
docker ps

# Voir les health checks
docker inspect agent-nutrition | grep -A 10 Health
```

## 🎯 Optimisations

### Multi-stage build
- ✅ Image finale légère (~150MB)
- ✅ Seulement les deps de prod
- ✅ Build cache optimisé

### Health checks
- ✅ Restart automatique si crash
- ✅ Compatible avec tous les orchestrateurs

### .dockerignore
- ✅ Build rapide
- ✅ Image plus petite

## 🆘 Troubleshooting

### Port déjà utilisé
```bash
# Changer le port dans docker-compose.yml
ports:
  - "8080:3000"  # Utilise 8080 au lieu de 3000
```

### Variables d'env non chargées
```bash
# Vérifier qu'elles sont bien passées
docker-compose exec agent-nutrition env | grep OPENAI
```

### Build échoue
```bash
# Clean rebuild
docker-compose down
docker system prune -a
docker-compose up --build
```

## 📝 Notes

- Le container tourne en mode production
- Les logs sont envoyés à stdout (visible avec `docker logs`)
- Le port 3000 est exposé par défaut
- Health check toutes les 30s sur `/health`
