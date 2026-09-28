# AGENTS.md — un-pain-d-avance

Guide de travail pour les agents de code (Claude Code, Codex, Copilot…) intervenant sur ce dépôt.
Lis ce fichier en entier avant toute modification.

---

## 1. Contexte du projet

Application web de **précommande de boulangerie** (au sens large : pains, viennoiseries, pâtisseries…) avec paiement en ligne.
Le boulanger fait une **tournée** dans des villages sans boulangerie. L'application centralise et encaisse les commandes à l'avance : le client choisit un **passage** (un lieu, une date, un créneau), compose sa commande, paie par carte via Stripe, puis **retire** sa commande sur place lors du passage. Il n'y a **pas de livraison à domicile**.

**Utilisateurs :**
- **Clients** : front-office public, commande **sans création de compte** (prénom, nom, e-mail, téléphone).
- **Boulanger / gestionnaire** : back-office Payload (`/admin`) pour gérer les produits en vente, les lieux de retrait, les passages et le suivi des commandes.

**Périmètre :** catalogue, panier, choix du passage, paiement, back-office produits / lieux / passages / commandes, e-mails de confirmation. **Le périmètre ne s'élargira pas beaucoup** : toute fonctionnalité hors de cette liste doit être signalée comme hors périmètre avant d'être envisagée.

**Stack :** Next.js 16 (App Router) + Payload CMS 3 + PostgreSQL 17 + Stripe Checkout + Tailwind CSS 4, en TypeScript. Tout tourne dans des containers **Podman**.

**Statut : initialisation / pré-production.** Les changements de schéma cassants sont autorisés. Conçois le schéma cible propre directement, sans migration ni couche de compatibilité (Payload pousse le schéma automatiquement en dev).

---

## 2. Règles métier à préserver

Respecte-les dans chaque évolution. Les points marqués *(à valider)* sont des recommandations techniques pas encore confirmées par le client : ne les considère pas comme acquis si une demande les contredit.

1. **Lieux et passages gérés dans le back-office** : un passage est un couple **lieu + date** (unique) avec un créneau horaire, une **date limite de commande**, un état ouvert / fermé et des limites de capacité optionnelles. Seuls les passages ouverts dont la date limite n'est pas dépassée sont proposés au client. Plusieurs lieux peuvent avoir un passage le même jour.
2. **Date limite par défaut paramétrable** dans les réglages boutique (N jours avant le passage, à HH:mm, heure de Paris), pré-remplie à la création d'un passage et modifiable passage par passage.
3. **Passages récurrents** : le back-office permet de générer en une fois les passages d'un lieu (jour de la semaine, créneau, période) ; les passages existants ne sont pas dupliqués.
4. **Capacité optionnelle, à deux niveaux** : nombre maximal de commandes par passage et quantité maximale par produit et par passage. Sont comptées les commandes `payee`, `preparee`, `retiree`, `non_retiree` et les commandes `en_attente_paiement` **non expirées** (réservation pendant la session Stripe).
5. **Date limite et capacité vérifiées côté serveur**, à la création de la commande (sous verrou du passage). À la confirmation du paiement, la place est garantie tant que la réservation court ; un paiement arrivé après expiration est revérifié et peut être refusé (puis remboursé). Aucune confiance accordée au client (navigateur).
6. **Produits gérés dans le back-office** : seuls les produits actifs sont commandables. Prix saisis en euros dans l'admin, stockés en centimes. **Allergènes** renseignés et affichés avant l'achat (obligation INCO en vente à distance).
7. **Montants recalculés côté serveur** à partir des prix en base ; le prix affiché dans le panier n'est jamais utilisé tel quel. Nom et prix unitaire sont copiés dans la commande (instantané).
8. **Une commande n'est payée qu'à réception du webhook Stripe** `checkout.session.completed`, jamais sur la page de retour de Stripe Checkout. Le traitement du webhook est **idempotent** : seule une commande `en_attente_paiement` peut passer à `payee`.
9. **Encaissement immédiat à la commande** : pas de pré-autorisation (elle expire après environ 7 jours chez Stripe). Une annulation donne lieu à un remboursement Stripe.
10. **Cycle de vie d'une commande** : `en_attente_paiement` → `payee` → `preparee` → `retiree`, plus `non_retiree` (client absent, sans remboursement automatique), `annulee` et `remboursee`. Les transitions sont contrôlées côté serveur.
11. **Denrées périssables** : le droit de rétractation ne s'applique pas ; les CGV doivent le mentionner.

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
  `feat(commandes): refuser une commande après la date limite du passage`
  Types : `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `a11y`.

### 3.4 Versions et releases
- Versionnement sémantique (`vX.Y.Z`) via des tags git ; `version` de `package.json` alignée sur le tag.
- Une release GitHub publiée (`gh release create vX.Y.Z --generate-notes`) déclenche les vérifications puis la publication de l'image `ghcr.io/eflye/un-pain-d-avance:X.Y.Z` (`.github/workflows/release.yml`).
- Déploiement serveur : `deploy/` (compose, `.env.example`, mode d'emploi).

---

## 4. Conventions techniques

### 4.1 Environnement : Podman uniquement
- **Ne jamais installer ni lancer Node / npm / npx sur l'hôte.** Toute commande passe par `podman compose exec app <cmd>`.
- `node_modules` et `.next` vivent dans des volumes nommés, pas sur l'hôte.
- Postgres : service `postgres` dans le réseau compose, `localhost:5435` depuis l'hôte.

### 4.2 Données (Payload / PostgreSQL)
- Collections dans `src/collections/`, une par fichier ; globals dans `src/globals/`. Slugs en anglais et en kebab-case (`categories`, `products`, `locations`, `pickup-slots`, `orders`), **libellés et contenus admin en français**.
- Après toute modification d'une collection ou d'un champ : `npm run generate:types`, et commit de `src/payload-types.ts`.
- Après tout ajout ou modification d'un composant admin (`admin.components`) ou d'un champ `richText` : `npm run generate:importmap`, vérifier que `src/app/(payload)/admin/importMap.js` référence bien les nouveaux composants, et le committer avec le changement. Une import map périmée casse l'admin sans erreur de build.
- Après ajout de fichiers dans `src/`, si le serveur de dev signale « Module not found » : `podman compose restart app` (cache Turbopack sur le volume monté).
- Montants stockés en **centimes** (entier), cohérent avec Stripe. Jamais de flottants pour de l'argent.
- La date d'un passage est une **date civile** (`Europe/Paris`), stockée à midi UTC : pas de conversion de fuseau implicite qui pourrait décaler le jour. Créneaux en `HH:mm`. Horodatages techniques en UTC, affichés en `Europe/Paris`.
- Règles d'accès (`access`) explicites sur chaque collection : lecture publique limitée aux produits actifs, lieux actifs et passages ouverts ; commandes accessibles au seul back-office.
- Opérations multi-documents (commande + décrément de stock) dans une **transaction** (`req` transmis à l'API locale).
- **Migrations** : en dev, Payload pousse le schéma ; en production, les migrations de `src/migrations/` s'appliquent au démarrage. Tout changement de schéma livré s'accompagne d'une migration : `podman compose exec app npx payload migrate:create <nom>`, committée avec le changement.

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
- Toute confirmation de paiement passe par `confirmOrderPayment` (`src/services/orders.ts`), quel que soit le prestataire.
- Sans clés Stripe, `PAYMENT_PROVIDER=simulated` remplace Stripe par une page de test locale (`/paiement-simule/…`). Refusé en production, **sauf serveur de test déclaré** par `ALLOW_SIMULATED_PAYMENT_IN_PRODUCTION=true` (le site affiche alors un bandeau « Site de test »). Jamais sur le site réel.

### 4.5 Front-end
- Site client dans `src/app/(frontend)/`, stylé en Tailwind CSS 4. Interface et contenus en français.
- **Mobile d'abord** : la majorité des commandes se fera sur téléphone.
- Server Components par défaut ; `'use client'` seulement là où l'interactivité l'exige (panier, sélection du passage).

---

## 5. Accessibilité — exigence de base

Chaque écran client créé ou modifié respecte le **RGAA 4.1 / WCAG 2.1 niveau AA** :
- Structure sémantique : titres hiérarchisés, landmarks, listes, tableaux avec `<th scope>` et `<caption>`.
- Formulaires : chaque champ a un `<label>` associé ; erreurs annoncées (`aria-live` / `aria-describedby`) et reliées au champ.
- Navigation complète au clavier, ordre de focus logique, focus visible.
- Contrastes AA minimum (4,5:1 texte courant, 3:1 éléments d'interface).
- Information transmise par le texte en plus de la couleur (disponibilité des passages, stock notamment).
- Composants interactifs custom (sélecteur de passage, quantités) : rôles et états ARIA corrects.
- Vérification automatisée via `@axe-core/playwright` dans les tests de chaque écran touché.

---

## 6. Tests

- **Vitest** (`tests/int/`) pour la logique métier : calcul des montants, date limite, capacité, transitions de statut, idempotence du webhook.
- **Playwright** (`tests/e2e/`, container `e2e` : l'image Alpine de l'app ne fait pas tourner Chromium) accompagne chaque fonctionnalité : parcours nominal, cas d'erreur (passage complet, plafond produit atteint, date limite dépassée, produit désactivé) et **contrôle des droits** (un visiteur tente de lire les commandes ou d'accéder à l'admin → refus attendu).
- Un test d'accessibilité axe par écran client modifié.
- Données de test créées et nettoyées par les tests eux-mêmes (fixtures dédiées).
- Lance la suite complète avant de proposer un commit.

---

## 7. Données personnelles et sécurité

- Collecte minimale : prénom, nom, e-mail, téléphone, rien de plus (pas d'adresse : retrait uniquement).
- Toute donnée personnelle est couverte par une **durée de conservation** définie et une procédure de purge / export (RGPD) *(à mettre en place)*.
- Journaux et messages d'erreur exempts de données personnelles et de secrets.
- Back-office protégé par l'authentification Payload ; rôles limités au strict nécessaire.
- Secrets uniquement dans `.env` (jamais commité) ; `.env.example` tenu à jour à chaque nouvelle variable.

---

## 8. E-mails

- Adaptateur e-mail Payload *(à configurer : Resend ou Brevo)* ; en dev, les e-mails sont écrits dans les logs du container.
- Notifications prévues : confirmation de commande payée (avec lieu, adresse, date et créneau de retrait), rappel avant le passage *(à valider)*, annulation / remboursement.
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

# Données de démonstration (catalogue, 2 villages, passages des 4 prochaines semaines)
podman compose exec app npm run seed:demo

# Tests
podman compose exec app npm run test:int
podman compose --profile e2e run --rm e2e          # Playwright + axe, mobile et bureau
CAPTURE=1 podman compose --profile e2e run --rm e2e npx playwright test capture   # captures → .impeccable/review/

# E-mails de développement : http://localhost:8026 (Mailpit)

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
- [ ] les types Payload et l'import map sont régénérés si le schéma ou les composants admin ont changé ;
- [ ] les commits sont atomiques et bien nommés ;
- [ ] un compte rendu final liste : ce qui a été fait, les choix techniques, les points à vérifier manuellement, les pistes.

---

## 11. Glossaire

| Terme | Sens |
|---|---|
| Précommande | Commande passée et payée à l'avance, retirée lors d'un passage |
| Tournée | Déplacement du boulanger dans des villages sans boulangerie |
| Lieu de retrait | Village et emplacement où le boulanger s'arrête (ex. place de l'église) |
| Passage | Arrêt du boulanger dans un lieu, à une date et un créneau donnés ; le client choisit un passage |
| Retrait | Remise de la commande au client lors du passage |
| Date limite de commande | Instant au-delà duquel un passage n'accepte plus de commande |
| Capacité | Nombre maximal de commandes, ou d'unités d'un produit, acceptées pour un passage |
| Réglages boutique | Global Payload : nom, contact, CGV, date limite par défaut |
| Back-office | Interface d'administration Payload (`/admin`) |
| Checkout Session | Session de paiement hébergée par Stripe, créée par l'app pour une commande |
| Webhook | Notification serveur-à-serveur de Stripe confirmant un paiement |
