# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Clients** : habitants de villages sans boulangerie, **tous âges**, dont des personnes âgées peu à l'aise avec le numérique. Ils commandent surtout sur téléphone, sans créer de compte, pour retirer leur pain lors du prochain passage du boulanger dans leur village.
- **Boulanger / gestionnaire** : gère produits, lieux, passages et commandes dans le back-office Payload (`/admin`), et prépare les commandes avant chaque tournée.

## Product Purpose

Centraliser et encaisser à l'avance les commandes de boulangerie (pains, viennoiseries, pâtisseries) d'une tournée dans des villages. Le client choisit un passage (lieu, date, créneau), compose sa commande, paie en ligne, puis retire sa commande sur place. Succès : le boulanger part en tournée avec des commandes déjà payées et sait exactement quoi préparer ; le client est sûr d'avoir son pain.

## Positioning

Pas une boutique en ligne générique : l'unité de choix est le **passage du camion dans le village**, avec une date limite de commande et des quantités limitées par passage. Retrait uniquement, pas de livraison à domicile.

## Operating Context

- Parcours client : choix du lieu et du passage → catalogue et quantités → coordonnées et acceptation des CGV → paiement (Stripe Checkout ; paiement simulé en développement) → page de suivi avec la référence à présenter au retrait.
- Contraintes métier visibles par le client : date limite de commande par passage, passage complet, quantités restantes par produit, allergènes affichés avant l'achat.
- Retrait sur place : le client présente sa référence courte (ex. `PA-7K3F9`) au boulanger.

## Capabilities and Constraints

- Voir `AGENTS.md` pour les règles métier et techniques (Next.js 16, Payload CMS 3, PostgreSQL, Stripe, Tailwind CSS 4, Podman).
- Commande sans compte client : prénom, nom, e-mail, téléphone.
- Interface et contenus en français.
- Paiement Stripe pas encore branché (pas de clés de test) ; parcours testable avec le paiement simulé.

## Brand Commitments

- Boulangerie : **La Mie Deininge**, boulangerie-pâtisserie artisanale, 24 rue de la République, 95650 Boissy-l'Aillerie, 01 34 66 54 53, lamiedeininge@gmail.com (source : https://www.lamiedeininge.fr/). Devise du site : « Des produits faits maison ».
- Nom affiché : **La Mie Deininge** (logo) en titre ; « Un pain d'avance » est le nom du service de précommande.
- Logo : capitales dessinées à la main, blanches à ombre portée sur le site (`docs/brand/logo-lamiedeininge.png`) ; version ardoise dérivée pour fond clair (`public/brand/logo-ardoise.png`, `scripts/recolor-logo.mjs`).
- Direction visuelle choisie explicitement : **le standard soigné de la vente en ligne** (pas d'univers thématique), sans site de référence particulier. Clarté et finition priment sur l'originalité.
- **Identité visuelle de la boulangerie (contraignante)**, d'après la photo de la devanture (`docs/brand/devanture.jpg`) :
  - vert d'eau de la devanture en bois peint (couleur de marque) ;
  - lettrage peint à empattements, gris-bleu ardoise, « Boulangerie · Pâtisserie » ;
  - ferronnerie vert sombre (garde-corps) ;
  - façade en pierre et crépi gris clair.
  - Le personnage de boulanger visible sur la photo est un autocollant d'annuaire en ligne, **pas** un élément de la marque. 

## Evidence on Hand

- **Aucune photo produit** pour l'instant : le site doit être complet et attrayant sans photo ; les photos pourront être ajoutées produit par produit dans l'admin et doivent alors s'intégrer.
- Aucun témoignage, avis client, chiffre ou logo : ne pas en inventer.

## Product Principles

1. **Le passage d'abord** : tout part de « où et quand je récupère mon pain ».
2. **Lisible par tous** : grands textes, contrastes forts, peu d'étapes, aucune ambiguïté sur ce qui est payé et où le retirer.
3. **Honnêteté des disponibilités** : date limite, stocks restants et passage complet sont dits clairement, avant le paiement.
4. **Rassurer après paiement** : référence, lieu, date et créneau toujours visibles et faciles à retrouver.

## Accessibility & Inclusion

RGAA 4.1 / WCAG 2.1 niveau AA sur tous les écrans client. Public incluant des personnes âgées : taille de texte généreuse, cibles tactiles larges, navigation clavier complète, information jamais portée par la couleur seule.
