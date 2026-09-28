# Installation — Un pain d'avance

Guide complet pour installer le projet, sur un poste de développement puis sur un serveur.

- [1. Vue d'ensemble](#1-vue-densemble)
- [2. Poste de développement (Mac)](#2-poste-de-développement-mac)
- [3. Serveur (test ou production)](#3-serveur-test-ou-production)
- [4. Passer du serveur de test au vrai site](#4-passer-du-serveur-de-test-au-vrai-site)
- [5. Mettre à jour](#5-mettre-à-jour)
- [6. Sauvegarder et restaurer](#6-sauvegarder-et-restaurer)
- [7. Dépannage](#7-dépannage)
- [Annexe : variables d'environnement](#annexe--variables-denvironnement)

---

## 1. Vue d'ensemble

| | Poste de développement | Serveur |
|---|---|---|
| Machine | Mac Apple Silicon (M1…) | Linux x86_64 (amd64) |
| Outil | Podman + `podman compose` | Docker (ou Podman) + compose |
| Fichiers | `docker-compose.yml` à la racine | `deploy/docker-compose.yml` |
| Application | code monté, serveur de dev Next.js | image `ghcr.io/eflye/un-pain-d-avance` |
| Base | Postgres 17 (container) | Postgres 17 (container) |
| Schéma de base | poussé automatiquement par Payload | migrations appliquées au démarrage |
| E-mails | capturés par Mailpit | SMTP du prestataire, ou logs |

L'image du serveur est construite par GitHub Actions à chaque release publiée
(voir [5. Mettre à jour](#5-mettre-à-jour)) : le serveur ne compile rien, il télécharge l'image.

---

## 2. Poste de développement (Mac)

Tout tourne dans des containers : **aucun Node, npm ou npx n'est installé sur le Mac**.

### 2.1 Prérequis

- [Podman](https://podman.io/) (installeur officiel ou Homebrew) et un fournisseur compose
  (`brew install docker-compose`, utilisé par `podman compose`).
- Git et, pour publier, le client GitHub `gh`.

Machine virtuelle Podman : prévoir **au moins 2 processeurs et 4 Go** (4 processeurs conseillés).
Avec un seul processeur, tout fonctionne mais les compilations sont lentes.

```bash
podman machine init --cpus 4 --memory 6144   # première fois seulement
podman machine start
```

Pour agrandir une machine existante : `podman machine stop`, puis
`podman machine set --cpus 4 --memory 6144`, puis `podman machine start`.

### 2.2 Récupérer le projet et le configurer

```bash
git clone git@github.com:eflye/un-pain-d-avance.git
cd un-pain-d-avance
cp .env.example .env
```

Dans `.env`, renseigner au minimum :

- `PAYLOAD_SECRET` : `openssl rand -hex 32`
- `PAYMENT_PROVIDER=simulated` tant qu'il n'y a pas de clés Stripe de test

### 2.3 Démarrer

```bash
podman compose up -d
podman compose logs -f app    # attendre « Ready » (le premier lancement installe les dépendances)
```

| Service | Adresse |
|---|---|
| Site client | http://localhost:3000 |
| Back-office | http://localhost:3000/admin |
| E-mails de dev (Mailpit) | http://localhost:8026 |
| Postgres (client SQL) | `localhost:5435`, identifiant et mot de passe `painavance` |

Au premier accès à `/admin`, **créer le compte gestionnaire** : le premier compte créé est administrateur.

### 2.4 Données de démonstration

Catalogue fictif, deux villages et leurs passages des quatre prochaines semaines :

```bash
podman compose exec app npm run seed:demo
```

Puis : http://localhost:3000/village/montgeroult.
Le script ne recrée rien de ce qui existe ; on peut le relancer sans risque.

### 2.5 Vérifier

```bash
podman compose exec app npm run typecheck
podman compose exec app npm run lint
podman compose exec app npm run test:int                 # tests d'intégration (Vitest)
podman compose --profile e2e run --rm e2e                # tests de bout en bout + accessibilité (Playwright)
```

Le premier lancement des tests de bout en bout télécharge l'image Playwright (plus de 1 Go).

### 2.6 Arrêter

```bash
podman compose down        # arrête les containers, garde les données
podman compose down -v     # arrête ET efface la base de dev (irréversible)
```

---

## 3. Serveur (test ou production)

### 3.1 Prérequis

- Un serveur Linux **x86_64** (VPS Debian ou Ubuntu par exemple), accès SSH, 2 Go de RAM minimum.
- Docker Engine avec le plugin compose. Sur Debian ou Ubuntu : `curl -fsSL https://get.docker.com | sh`,
  puis `docker compose version` pour vérifier.
- Un **nom de domaine** pointant vers le serveur, et un **reverse proxy** qui gère le HTTPS
  (nginx, Caddy, Traefik…).

### 3.2 Installer

```bash
sudo mkdir -p /opt/un-pain-d-avance && sudo chown "$USER" /opt/un-pain-d-avance
cd /opt/un-pain-d-avance
curl -fsSLO https://raw.githubusercontent.com/eflye/un-pain-d-avance/main/deploy/docker-compose.yml
curl -fsSL -o .env https://raw.githubusercontent.com/eflye/un-pain-d-avance/main/deploy/.env.example
chmod 600 .env
```

### 3.3 Configurer `.env`

| Variable | Valeur |
|---|---|
| `APP_VERSION` | version à déployer, ex. `0.1.0` (éviter `latest` : une mise à jour doit être un choix) |
| `POSTGRES_PASSWORD` | `openssl rand -hex 24` |
| `PAYLOAD_SECRET` | `openssl rand -hex 32`. **Ne plus jamais le changer** : il signe les sessions et les liens de suivi envoyés aux clients |
| `SERVER_URL` | URL publique, ex. `https://precommande.exemple.fr` (sans `/` final) |
| `PAYMENT_PROVIDER` | `simulated` sur un serveur de test ; `stripe` sur le vrai site |
| `ALLOW_SIMULATED_PAYMENT_IN_PRODUCTION` | `true` sur un serveur de test (bandeau « Site de test » affiché) ; `false` sur le vrai site |
| `SMTP_*`, `EMAIL_FROM*` | SMTP du prestataire d'e-mails ; laisser `SMTP_HOST` vide pour écrire les e-mails dans les logs |

Détail de toutes les variables : [Annexe](#annexe--variables-denvironnement).

### 3.4 Démarrer

```bash
docker compose up -d
docker compose logs -f app
```

Au premier démarrage, les logs doivent montrer la migration puis le serveur prêt :

```text
Migrating: 20260927_200804_initial
Migrated:  20260927_200804_initial
```

Vérifier :

```bash
curl -s http://127.0.0.1:3000/api/health      # {"status":"ok"}
docker compose ps                              # app « healthy »
```

### 3.5 Reverse proxy

L'app écoute sur `127.0.0.1:3000` (modifiable avec `APP_BIND` et `APP_PORT` dans `.env`).
Le proxy **doit transmettre l'hôte d'origine et le protocole** : sans ces en-têtes, Next.js refuse
les formulaires du site (commande, paiement).

**nginx**

```nginx
server {
    server_name precommande.exemple.fr;
    # … certificats (certbot) …
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        client_max_body_size 20m;   # photos produits envoyées depuis l'admin
    }
}
```

**Caddy**

```caddy
precommande.exemple.fr {
    reverse_proxy 127.0.0.1:3000
}
```

**Traefik ou tout proxy lui-même en container** : dans `docker-compose.yml`, décommenter le bloc
`networks` (service `app` et fin de fichier), indiquer le nom du réseau du proxy, puis router vers
`app:3000` avec les labels ou la configuration habituels du proxy.

### 3.6 Premiers pas dans le back-office

1. Ouvrir `https://<domaine>/admin` **tout de suite** et créer le compte gestionnaire.
   Tant qu'aucun compte n'existe, n'importe qui peut créer le premier.
2. *Réglages › Réglages boutique* : nom, téléphone, e-mail (affichés en pied de page),
   date limite de commande par défaut, **CGV** (avec la mention sur l'absence de droit de rétractation).
3. *Catalogue* : catégories, puis produits (prix, allergènes, photo facultative).
4. *Tournée* : lieux de retrait, puis passages (bouton « Générer des passages récurrents »).
5. Tester une commande de bout en bout depuis `https://<domaine>/village/<identifiant-du-lieu>`.

L'identifiant d'un lieu (ex. `montgeroult`) est visible dans sa fiche : c'est l'adresse à mettre
dans les QR codes affichés au camion.

### 3.7 Liste de contrôle

- [ ] `curl -s http://127.0.0.1:3000/api/health` renvoie `{"status":"ok"}`
- [ ] le site s'affiche en HTTPS sur le domaine
- [ ] le compte gestionnaire est créé
- [ ] une commande de test passe jusqu'à la page « Commande confirmée »
- [ ] l'e-mail de confirmation arrive (ou apparaît dans `docker compose logs app` si `SMTP_HOST` est vide)
- [ ] une photo produit envoyée dans l'admin s'affiche sur le site
- [ ] les sauvegardes sont planifiées ([6.](#6-sauvegarder-et-restaurer))

---

## 4. Passer du serveur de test au vrai site

1. **Stripe** (compte Stripe activé) :
   - `PAYMENT_PROVIDER=stripe` et `ALLOW_SIMULATED_PAYMENT_IN_PRODUCTION=false` ;
   - `STRIPE_SECRET_KEY` et `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` : clés **live** du tableau de bord Stripe ;
   - dans Stripe, créer un webhook vers `https://<domaine>/api/stripe/webhook` (événement
     `checkout.session.completed`), puis copier son secret dans `STRIPE_WEBHOOK_SECRET`.
2. **E-mails** : renseigner `SMTP_*` et une adresse `EMAIL_FROM` autorisée chez le prestataire
   (domaine vérifié : SPF/DKIM).
3. **Données de test** : supprimer ou désactiver les produits, lieux et passages de test dans l'admin.
4. `docker compose up -d` pour appliquer. Le bandeau « Site de test » doit avoir disparu.

> Le paiement Stripe réel sera branché dans une prochaine version. Tant que ce n'est pas le cas,
> seul le mode simulé permet de commander.

---

## 5. Mettre à jour

### Publier une version (depuis le poste de développement)

```bash
# version alignée dans package.json, commits poussés sur main, CI au vert
gh release create vX.Y.Z --generate-notes
```

GitHub Actions relance typecheck, lint et tests, puis publie `ghcr.io/eflye/un-pain-d-avance:X.Y.Z`
(ainsi que `X.Y` et `latest`). Suivi : onglet *Actions* du dépôt.

### Déployer une version (sur le serveur)

```bash
cd /opt/un-pain-d-avance
# 1. sauvegarder (voir 6.)
# 2. dans .env : APP_VERSION=X.Y.Z
docker compose pull app
docker compose up -d app
docker compose logs -f app       # les nouvelles migrations s'appliquent au démarrage
```

Revenir en arrière : remettre l'ancienne `APP_VERSION`, puis `docker compose up -d app`.
Si la version abandonnée a appliqué une migration, restaurer aussi la sauvegarde de la base prise avant la mise à jour.

---

## 6. Sauvegarder et restaurer

À planifier (cron quotidien), au minimum la base et les photos :

```bash
cd /opt/un-pain-d-avance
docker compose exec -T postgres pg_dump -U painavance painavance | gzip > "sauvegardes/base-$(date +%F).sql.gz"
docker run --rm -v un-pain-d-avance_media:/media -v "$PWD/sauvegardes":/backup alpine \
  tar czf "/backup/media-$(date +%F).tgz" -C /media .
```

(Créer le dossier `sauvegardes` au préalable, et le copier régulièrement **hors du serveur**.)

Restaurer la base (application arrêtée) :

```bash
docker compose stop app
docker compose exec -T postgres dropdb -U painavance painavance
docker compose exec -T postgres createdb -U painavance painavance
gunzip -c sauvegardes/base-AAAA-MM-JJ.sql.gz | docker compose exec -T postgres psql -U painavance painavance
docker compose start app
```

Restaurer les photos :

```bash
docker run --rm -v un-pain-d-avance_media:/media -v "$PWD/sauvegardes":/backup alpine \
  sh -c "rm -rf /media/* && tar xzf /backup/media-AAAA-MM-JJ.tgz -C /media"
```

---

## 7. Dépannage

| Symptôme | Cause probable | Solution |
|---|---|---|
| `docker compose up` : « POSTGRES_PASSWORD manquant » | `.env` absent ou incomplet | Vérifier que `.env` est à côté de `docker-compose.yml` et renseigné |
| `/api/health` renvoie `{"status":"error"}` (503) | base injoignable | `docker compose ps` et `docker compose logs postgres` |
| Le formulaire de commande ne s'envoie pas derrière le proxy | en-têtes `Host` / `X-Forwarded-*` non transmis | Configuration du proxy : voir [3.5](#35-reverse-proxy) |
| Page « Paiement en ligne pas encore disponible » | `PAYMENT_PROVIDER=stripe` sans Stripe branché | Sur un serveur de test : `simulated` + `ALLOW_SIMULATED_PAYMENT_IN_PRODUCTION=true` |
| Échec de l'envoi d'une photo | taille refusée par le proxy | `client_max_body_size 20m;` (nginx) |
| Liens des e-mails vers `localhost` | `SERVER_URL` non renseigné | Renseigner `SERVER_URL`, puis `docker compose up -d app` |
| Mot de passe gestionnaire oublié | — | « Mot de passe oublié ? » sur `/admin/login` ; sans SMTP, le lien de réinitialisation apparaît dans `docker compose logs app` |
| En dev : « Module not found » après ajout d'un fichier | cache du serveur de dev | `podman compose restart app` |
| En dev : `/api/…` ou une page ne reflète pas la modification | surveillance des fichiers ratée sur le volume monté | `podman compose restart app` |
| En dev : port 8025 déjà utilisé | un autre projet utilise Mailpit | ce projet utilise 8026 : http://localhost:8026 |

---

## Annexe : variables d'environnement

| Variable | Dev (`.env`) | Serveur (`deploy/.env`) | Rôle |
|---|---|---|---|
| `DATABASE_URL` | fournie par compose | construite par compose | connexion Postgres |
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | — | oui | base du serveur |
| `PAYLOAD_SECRET` | oui | oui | signature des sessions et des liens de suivi |
| `SERVER_URL` | `http://localhost:3000` | URL publique | liens des e-mails, redirections de paiement |
| `APP_VERSION`, `APP_BIND`, `APP_PORT` | — | oui | version de l'image, adresse et port d'écoute |
| `PAYMENT_PROVIDER` | `simulated` ou `stripe` | idem | prestataire de paiement |
| `ALLOW_SIMULATED_PAYMENT_IN_PRODUCTION` | — | `true` sur un serveur de test uniquement | autorise la simulation en production (bandeau affiché) |
| `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` | clés de test | clés live | Stripe |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD` | forcées vers Mailpit | prestataire d'e-mails | envoi des e-mails |
| `EMAIL_FROM`, `EMAIL_FROM_NAME` | facultatif | oui | expéditeur des e-mails |
| `MEDIA_DIR` | — | fixée dans l'image (`/app/media`) | dossier des photos produits (volume) |
