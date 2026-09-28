# Déployer Un pain d'avance sur un serveur

L'image est publiée sur `ghcr.io/eflye/un-pain-d-avance` à chaque release GitHub
(tags `X.Y.Z`, `X.Y` et `latest`). Ce dossier contient tout ce qu'il faut sur le serveur :
Postgres + l'app, derrière ton reverse proxy existant.

## Prérequis

- Docker (ou Podman) avec le plugin compose.
- Un reverse proxy qui gère le HTTPS et le nom de domaine (nginx, Traefik, Caddy…).

## Première installation

```bash
# Sur le serveur, dans un dossier dédié (ex. /opt/un-pain-d-avance)
curl -fsSLO https://raw.githubusercontent.com/eflye/un-pain-d-avance/main/deploy/docker-compose.yml
curl -fsSL -o .env https://raw.githubusercontent.com/eflye/un-pain-d-avance/main/deploy/.env.example
```

Renseigner `.env` :

| Variable | Valeur |
|---|---|
| `POSTGRES_PASSWORD` | `openssl rand -hex 24` |
| `PAYLOAD_SECRET` | `openssl rand -hex 32` (ne plus le changer : il signe les sessions et les liens de suivi de commande) |
| `SERVER_URL` | l'URL publique, ex. `https://precommande.exemple.fr` |
| `APP_VERSION` | la version à déployer, ex. `0.1.0` (ou `latest`) |
| `PAYMENT_PROVIDER` / `ALLOW_SIMULATED_PAYMENT_IN_PRODUCTION` | `simulated` / `true` sur un **serveur de test** ; `stripe` / `false` sur le site réel |

Puis :

```bash
docker compose up -d
docker compose logs -f app      # attendre « Ready » ; les migrations s'appliquent au premier démarrage
curl -s http://127.0.0.1:3000/api/health   # {"status":"ok"}
```

Ouvrir ensuite `https://<ton-domaine>/admin` : **le premier compte créé devient gestionnaire**.
Crée-le tout de suite après le déploiement. Renseigne ensuite, dans le back-office :
réglages boutique (contact, CGV), catégories, produits, lieux et passages.

## Reverse proxy

L'app écoute sur `127.0.0.1:3000` (modifiable avec `APP_BIND` / `APP_PORT`). Le proxy doit
transmettre l'hôte d'origine et le protocole : sans eux, Next.js refuse les formulaires
(« Server Actions ») envoyés depuis le navigateur.

**nginx**

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    client_max_body_size 20m;   # envoi de photos produits dans l'admin
}
```

**Caddy** : `reverse_proxy 127.0.0.1:3000` (les en-têtes sont transmis par défaut).

**Traefik / proxy en container** : décommenter le bloc `networks` du `docker-compose.yml`
pour que l'app rejoigne le réseau du proxy, puis router vers `app:3000`.

## Mettre à jour

```bash
# Modifier APP_VERSION dans .env (ex. 0.2.0), puis :
docker compose pull app
docker compose up -d app       # les nouvelles migrations s'appliquent au démarrage
```

## Sauvegardes

À planifier (cron), au minimum la base et les photos :

```bash
docker compose exec -T postgres pg_dump -U painavance painavance | gzip > "sauvegarde-$(date +%F).sql.gz"
docker run --rm -v un-pain-d-avance_media:/media -v "$PWD":/backup alpine \
  tar czf "/backup/media-$(date +%F).tgz" -C /media .
```

Restauration de la base : `gunzip -c sauvegarde-AAAA-MM-JJ.sql.gz | docker compose exec -T postgres psql -U painavance painavance`.

## Dépôt public, image publique

Le dépôt et l'image sont publics : aucun identifiant n'est nécessaire pour `docker compose pull`.
Les secrets vivent uniquement dans `.env` sur le serveur.
