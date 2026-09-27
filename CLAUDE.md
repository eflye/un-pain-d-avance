# CLAUDE.md

## Projet

Application de précommande de boulangerie : catalogue de produits, panier, choix d'un jour de livraison, paiement Stripe Checkout. Back-office (Payload admin) pour gérer les produits, les jours de livraison (date, date limite de commande, capacité, ouvert/fermé) et les commandes. Le périmètre reste volontairement réduit à cela.

Stack : Next.js 16 (App Router) + Payload CMS 3 + PostgreSQL 17 + Stripe + Tailwind CSS 4, en TypeScript.

## Environnement : Podman uniquement

- Tout tourne dans des containers Podman (`podman compose`). **Ne jamais installer ni lancer Node/npm/npx sur l'hôte.**
- Démarrer : `podman compose up -d` ; logs : `podman compose logs -f app`.
- Toute commande Node passe par `podman compose exec app <cmd>` (ex. `podman compose exec app npm install stripe`).
- `node_modules` et `.next` vivent dans des volumes nommés, pas sur l'hôte.
- Postgres : service `postgres` dans le réseau compose, `localhost:5435` depuis l'hôte.
- Stripe CLI (webhooks en local) : `podman compose --profile stripe up -d`.

## Vérifications avant de considérer une tâche terminée

```bash
podman compose exec app npx tsc --noEmit
podman compose exec app npm run lint
podman compose exec app npm run test:int
```

## Conventions

- Après toute modification d'une collection/d'un champ Payload : `podman compose exec app npm run generate:types`. Après ajout d'un composant admin custom : `npm run generate:importmap`.
- En dev, Payload pousse le schéma automatiquement dans Postgres. Avant la mise en production, passer aux migrations (`npm run payload migrate:create`).
- `src/app/(payload)/` est généré par Payload : ne pas modifier.
- Site client dans `src/app/(frontend)/`, stylé en Tailwind. Interface et contenus en français.
- Paiement :
  - Une commande n'est confirmée (`payée`) **qu'à réception du webhook** `checkout.session.completed` (`src/app/api/stripe/webhook/route.ts`), jamais sur la page de retour.
  - On encaisse à la commande (pas de pré-autorisation : elle expire après environ 7 jours).
  - Les montants sont toujours recalculés côté serveur à partir des produits en base.
- Valider côté serveur la date limite de commande et la capacité du jour de livraison.
- Clés Stripe de **test** uniquement en dev (`sk_test_` / `pk_test_`). Ne jamais committer `.env`.

## Payload

Le skill Payload est installé dans `.claude/skills/payload/`. Commencer par `.claude/skills/payload/SKILL.md`, puis `.claude/skills/payload/reference/` pour le détail (collections, hooks, access control, requêtes).
