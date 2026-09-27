# Un pain d'avance

Précommande de boulangerie en ligne : les clients choisissent leurs produits et un jour de livraison, puis paient via Stripe. Un back-office permet de gérer les produits en vente et les jours de livraison ouverts.

## 🏗️ Stack

- **App** : Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- **Back-office / API** : Payload CMS 3 (intégré à l'app Next.js, admin sur `/admin`)
- **Base de données** : PostgreSQL 17
- **Paiement** : Stripe Checkout (mode test en dev) + webhooks
- **Exécution** : tout tourne dans des containers Podman (rien à installer en local hormis Podman)

## 🚀 Démarrage

```bash
cp .env.example .env            # puis renseigner PAYLOAD_SECRET (openssl rand -hex 32) et les clés Stripe de test
podman compose up -d            # Postgres + app (npm install au premier lancement)
podman compose logs -f app
```

- Site : http://localhost:3000
- Back-office : http://localhost:3000/admin (le premier compte créé est l'admin)
- Postgres depuis l'hôte : `localhost:5435` (painavance / painavance)

### Stripe (mode test)

```bash
podman compose --profile stripe up -d   # Stripe CLI : relaie les webhooks vers /api/stripe/webhook
podman compose logs stripe              # copier le "webhook signing secret" (whsec_…) dans STRIPE_WEBHOOK_SECRET
podman compose restart app
```

Carte de test : `4242 4242 4242 4242`, date future, CVC quelconque.

## 🧰 Commandes courantes

Toutes les commandes s'exécutent dans le container `app` :

```bash
podman compose exec app npm run lint
podman compose exec app npx tsc --noEmit
podman compose exec app npm run test:int
podman compose exec app npm run generate:types      # après modification d'une collection
podman compose exec app npm run generate:importmap  # après ajout d'un composant admin custom
podman compose exec app npm install <paquet>
```

## 📦 Structure

```
src/
├── app/
│   ├── (frontend)/        # Site client (Tailwind)
│   ├── (payload)/         # Admin + API REST/GraphQL Payload (généré, ne pas modifier)
│   └── api/stripe/webhook # Webhook Stripe
├── collections/           # Collections Payload (Users, Media, …)
├── lib/stripe.ts          # Client Stripe serveur
├── payload.config.ts
└── payload-types.ts       # Généré (npm run generate:types)
```

## 🚢 Production

`Dockerfile.production` construit une image Next.js standalone :

```bash
podman build -f Dockerfile.production -t un-pain-d-avance .
```
