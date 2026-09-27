# AGENTS.md — un-pain-d-avance

Guide de travail pour les agents de code (Claude Code, Codex, Copilot…) intervenant sur ce dépôt.
Lis ce fichier en entier avant toute modification.

---

## 1. Contexte du projet

Application web de **précommande de boulangerie** (au sens large : pains, viennoiseries, pâtisseries…) avec paiement en ligne.
Le client compose sa commande, choisit un **jour de livraison** parmi ceux ouverts par la boulangerie, puis paie par carte via Stripe.

**Utilisateurs :**
- **Clients** : front-office public, commande **sans création de compte** (nom, e-mail, téléphone).
- **Boulanger / gestionnaire** : back-office Payload (`/admin`) pour gérer les produits en vente, les jours de livraison et le suivi des commandes.

**Périmètre :** catalogue, panier, choix du jour de livraison, paiement, back-office produits / jours de livraison / commandes, e-mails de confirmation. **Le périmètre ne s'élargira pas beaucoup** : toute fonctionnalité hors de cette liste doit être signalée comme hors périmètre avant d'être envisagée.

**Stack :** Next.js 16 (App Router) + Payload CMS 3 + PostgreSQL 17 + Stripe Checkout + Tailwind CSS 4, en TypeScript. Tout tourne dans des containers **Podman**.

**Statut : initialisation / pré-production.** Les changements de schéma cassants sont autorisés. Conçois le schéma cible propre directement, sans migration ni couche de compatibilité (Payload pousse le schéma automatiquement en dev).

---

## 2. Règles métier à préserver

Respecte-les dans chaque évolution. Les points marqués *(à valider)* sont des recommandations techniques pas encore confirmées par le client : ne les considère pas comme acquis si une demande les contredit.

1. **Jours de livraison gérés dans le back-office** : seuls les jours explicitement ouverts sont proposés au client. Chaque jour porte une date, une **date limite de commande**, une capacité éventuelle et un état ouvert / fermé.
2. **Date limite et capacité vérifiées côté serveur**, à la création de la commande **et** à la confirmation du paiement. Aucune confiance accordée au client (navigateur).
3. **Produits gérés dans le back-office** : seuls les produits actifs sont commandables. Un produit peut être indisponible certains jours ou limité en quantité par jour *(à valider)*.
4. **Montants recalculés côté serveur** à partir des prix en base ; le prix affiché dans le panier n'est jamais utilisé tel quel.
5. **Une commande n'est payée qu'à réception du webhook Stripe** `checkout.session.completed`, jamais sur la page de retour de Stripe Checkout. Le traitement du webhook est **idempotent** (un même événement reçu deux fois ne produit aucun effet supplémentaire).
6. **Encaissement immédiat à la commande** *(à valider)* : pas de pré-autorisation (elle expire après environ 7 jours chez Stripe). Une annulation donne lieu à un remboursement Stripe.
7. **Cycle de vie d'une commande** : `en_attente_paiement` → `payee` → `preparee` → `livree`, plus `annulee` / `remboursee`. Les transitions sont contrôlées côté serveur.
8. **Denrées périssables** : le droit de rétractation ne s'applique pas ; les CGV doivent le mentionner.

---

## 3. Méthode de travail

### 3.1 Schéma d'abord, puis point d'arrêt
Pour toute fonctionnalité qui touche aux données :
1. Propose le schéma (collections Payload, champs, types, relations, index, contraintes, règles d'accès) et les impacts sur les écrans existants.
2. **Arrête-toi et attends la validation explicite** avant d'écrire le code d'implémentation.
3. Implémente ensuite par petites étapes.

### 3.2 Périmètre
- Reformule le besoin et liste ce qui sera livré avant de commencer.
- Signale toute ambiguïté fonctionnelle sous forme de question fermée, avec ta recommandation.
- Limite les modifications au périmètre validé ; note les améliorations annexes dans une section « Pistes » du compte rendu.

### 3.3 Commits atomiques
- Un commit = une unité cohérente (schéma, logique métier, back-office, front client, paiement, tests, docs).
- Chaque commit laisse l'application fonctionnelle et les tests au vert.
- Messages au format Conventional Commits, en français :
  `feat(commandes): refuser une commande après la date limite du jour de livraison`
  Types : `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `a11y`.

### 3.4 Versions
- Versionnement sémantique (`vX.Y.Z`) via des tags git.
- Mets à jour `version` dans `package.json` quand la tâche le demande.

---

## 4. Conventions techniques

### 4.1 Environnement : Podman uniquement
- **Ne jamais installer ni lancer Node / npm / npx sur l'hôte.** Toute commande passe par `podman compose exec app <cmd>`.
- `node_modules` et `.next` vivent dans des volumes nommés, pas sur l'hôte.
- Postgres : service `postgres` dans le réseau compose, `localhost:5435` depuis l'hôte.

### 4.2 Données (Payload / PostgreSQL)
- Collections dans `src/collections/`, une par fichier. Slugs en anglais et en kebab-case (`products`, `delivery-days`, `orders`), **libellés et contenus admin en français**.
- Après toute modification d'une collection ou d'un champ : `npm run generate:types`, et commit de `src/payload-types.ts`.
- Montants stockés en **centimes** (entier), cohérent avec Stripe. Jamais de flottants pour de l'argent.
- Un jour de livraison est une **date civile** (`Europe/Paris`) : pas de conversion de fuseau implicite qui pourrait décaler le jour. Horodatages techniques en UTC, affichés en `Europe/Paris`.
- Règles d'accès (`access`) explicites sur chaque collection : lecture publique limitée aux produits actifs et aux jours ouverts ; commandes et clients accessibles au seul back-office.
- Opérations multi-documents (commande + décrément de stock) dans une **transaction** (`req` transmis à l'API locale).
- Avant la mise en production : passage aux migrations (`npm run payload migrate:create`).

### 4.3 Next.js / TypeScript
- TypeScript strict ; pas de `any` sans justification.
- Côté serveur, utilise l'**API locale Payload** (`getPayload`) plutôt que des appels HTTP à sa propre API.
- Logique métier (calcul du total, vérification de date limite et de capacité, transitions de statut) dans des fonctions pures testables, hors des composants et des routes.
- Mutations côté client via Server Actions ou route handlers, avec validation des entrées côté serveur.
- `src/app/(payload)/` est généré par Payload : ne pas modifier.

### 4.4 Paiement (Stripe)
- Stripe Checkout uniquement : aucune donnée de carte ne transite par l'application ni n'est stockée.
- **Clés de test** (`sk_test_` / `pk_test_`) en dev ; aucune clé dans le code ni dans git.
- Métadonnées de la Checkout Session : identifiant de commande, pour rattacher le webhook à la commande.
- Signature de chaque webhook vérifiée (`STRIPE_WEBHOOK_SECRET`) ; en local, relais par la Stripe CLI (`podman compose --profile stripe up -d`).

### 4.5 Front-end
- Site client dans `src/app/(frontend)/`, stylé en Tailwind CSS 4. Interface et contenus en français.
- **Mobile d'abord** : la majorité des commandes se fera sur téléphone.
- Server Components par défaut ; `'use client'` seulement là où l'interactivité l'exige (panier, sélection du jour).

---

## 5. Accessibilité — exigence de base

Chaque écran client créé ou modifié respecte le **RGAA 4.1 / WCAG 2.1 niveau AA** :
- Structure sémantique : titres hiérarchisés, landmarks, listes, tableaux avec `<th scope>` et `<caption>`.
- Formulaires : chaque champ a un `<label>` associé ; erreurs annoncées (`aria-live` / `aria-describedby`) et reliées au champ.
- Navigation complète au clavier, ordre de focus logique, focus visible.
- Contrastes AA minimum (4,5:1 texte courant, 3:1 éléments d'interface).
- Information transmise par le texte en plus de la couleur (disponibilité des jours de livraison, stock notamment).
- Composants interactifs custom (sélecteur de jour, quantités) : rôles et états ARIA corrects.
- Vérification automatisée via `@axe-core/playwright` dans les tests de chaque écran touché.

---

## 6. Tests

- **Vitest** (`tests/int/`) pour la logique métier : calcul des montants, date limite, capacité, transitions de statut, idempotence du webhook.
- **Playwright** (`tests/e2e/`) accompagne chaque fonctionnalité : parcours nominal, cas d'erreur (jour complet, date limite dépassée, produit désactivé) et **contrôle des droits** (un visiteur tente de lire les commandes ou d'accéder à l'admin → refus attendu).
- Un test d'accessibilité axe par écran client modifié.
- Données de test créées et nettoyées par les tests eux-mêmes (fixtures dédiées).
- Lance la suite complète avant de proposer un commit.

---

## 7. Données personnelles et sécurité

- Collecte minimale : nom, e-mail, téléphone et adresse de livraison si nécessaire, rien de plus.
- Toute donnée personnelle est couverte par une **durée de conservation** définie et une procédure de purge / export (RGPD) *(à mettre en place)*.
- Journaux et messages d'erreur exempts de données personnelles et de secrets.
- Back-office protégé par l'authentification Payload ; rôles limités au strict nécessaire.
- Secrets uniquement dans `.env` (jamais commité) ; `.env.example` tenu à jour à chaque nouvelle variable.

---

## 8. E-mails

- Adaptateur e-mail Payload *(à configurer : Resend ou Brevo)* ; en dev, les e-mails sont écrits dans les logs du container.
- Notifications prévues : confirmation de commande payée, rappel avant livraison *(à valider)*, annulation / remboursement.
- Contenus en français, sans données sensibles inutiles.

---

## 9. Commandes utiles

```bash
# Environnement
podman compose up -d
podman compose logs -f app
podman compose down

# Stripe CLI (webhooks en mode test)
podman compose --profile stripe up -d
podman compose logs stripe            # récupérer le whsec_… pour STRIPE_WEBHOOK_SECRET

# Qualité
podman compose exec app npx tsc --noEmit
podman compose exec app npm run lint

# Tests
podman compose exec app npm run test:int
podman compose exec app npm run test:e2e

# Payload
podman compose exec app npm run generate:types
podman compose exec app npm run generate:importmap
```

---

## 10. Définition de « terminé »

Une tâche est terminée quand :
- [ ] le périmètre validé est entièrement livré ;
- [ ] le schéma a été validé avant implémentation (si concerné) ;
- [ ] les règles métier de la section 2 sont respectées ;
- [ ] les écrans touchés passent les contrôles RGAA et axe ;
- [ ] les tests couvrent le nominal, les erreurs et les droits, et passent ;
- [ ] `tsc --noEmit` et le lint sont au vert ;
- [ ] les types Payload sont régénérés si le schéma a changé ;
- [ ] les commits sont atomiques et bien nommés ;
- [ ] un compte rendu final liste : ce qui a été fait, les choix techniques, les points à vérifier manuellement, les pistes.

---

## 11. Glossaire

| Terme | Sens |
|---|---|
| Précommande | Commande passée et payée à l'avance pour un jour de livraison futur |
| Jour de livraison | Date ouverte par la boulangerie dans le back-office, sur laquelle le client cale sa commande |
| Date limite de commande | Instant au-delà duquel un jour de livraison n'accepte plus de commande |
| Capacité | Nombre maximal de commandes (ou d'unités d'un produit) acceptées pour un jour donné |
| Back-office | Interface d'administration Payload (`/admin`) |
| Checkout Session | Session de paiement hébergée par Stripe, créée par l'app pour une commande |
| Webhook | Notification serveur-à-serveur de Stripe confirmant un paiement |
