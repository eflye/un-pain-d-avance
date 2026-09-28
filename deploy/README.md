# Déploiement serveur — aide-mémoire

Guide complet (prérequis, reverse proxy, premiers pas, passage au vrai site, dépannage) :
**[docs/INSTALLATION.md](../docs/INSTALLATION.md#3-serveur-test-ou-production)**.

Ce dossier contient les deux fichiers à copier sur le serveur :

- `docker-compose.yml` : Postgres + l'app (`ghcr.io/eflye/un-pain-d-avance`), écoute sur `127.0.0.1:3000` ;
- `.env.example` : à copier en `.env` et à renseigner.

```bash
# Installation
curl -fsSLO https://raw.githubusercontent.com/eflye/un-pain-d-avance/main/deploy/docker-compose.yml
curl -fsSL -o .env https://raw.githubusercontent.com/eflye/un-pain-d-avance/main/deploy/.env.example
# renseigner .env (POSTGRES_PASSWORD, PAYLOAD_SECRET, SERVER_URL, APP_VERSION…)
docker compose up -d
curl -s http://127.0.0.1:3000/api/health     # {"status":"ok"}

# Mise à jour : APP_VERSION=X.Y.Z dans .env, puis
docker compose pull app && docker compose up -d app

# Sauvegarde de la base
docker compose exec -T postgres pg_dump -U painavance painavance | gzip > "base-$(date +%F).sql.gz"
```
