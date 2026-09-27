---
name: La Mie Deininge · Un pain d'avance
description: Précommande de pain au passage du camion, habillée de la devanture vert d'eau de la boulangerie.
colors:
  accent: "#2f5a48"
  accent-strong: "#234436"
  accent-soft: "#e8f3ee"
  shopfront: "#a9d4c4"
  lettering: "#3d4d58"
  ink: "#1c1917"
  muted: "#57534e"
  line: "#e2e0da"
  control-border: "#78716c"
  surface: "#f4f8f6"
  card: "#ffffff"
  success: "#166534"
  success-soft: "#f0fdf4"
  warning: "#92400e"
  warning-soft: "#fffbeb"
  danger: "#b91c1c"
  danger-soft: "#fef2f2"
typography:
  display:
    fontFamily: "Alegreya, ui-serif, Georgia, serif"
    fontSize: "1.875rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0"
  display-lg:
    fontFamily: "Alegreya, ui-serif, Georgia, serif"
    fontSize: "2.25rem"
    fontWeight: 500
    lineHeight: 1.1111
    letterSpacing: "0"
  tagline:
    fontFamily: "Alegreya, ui-serif, Georgia, serif"
    fontSize: "1.125rem"
    fontWeight: 500
    lineHeight: 1.5556
  headline:
    fontFamily: "Atkinson Hyperlegible Next, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.3333
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Atkinson Hyperlegible Next, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  title-sm:
    fontFamily: "Atkinson Hyperlegible Next, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.5556
  body:
    fontFamily: "Atkinson Hyperlegible Next, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Atkinson Hyperlegible Next, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.5
  reference:
    fontFamily: "Atkinson Hyperlegible Next, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.1111
    letterSpacing: "0.05em"
rounded:
  pill: "9999px"
  control: "0.75rem"
  card: "1rem"
spacing:
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "1.25rem"
  xl: "2rem"
  2xl: "2.5rem"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.card}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0.75rem 1.5rem"
    height: "3.25rem"
  button-primary-hover:
    backgroundColor: "{colors.accent-strong}"
    textColor: "{colors.card}"
  button-primary-disabled:
    backgroundColor: "{colors.line}"
    textColor: "{colors.muted}"
  button-secondary:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0.75rem 1.5rem"
    height: "3.25rem"
  button-secondary-hover:
    backgroundColor: "{colors.surface}"
  quantity-button:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    size: "3rem"
  field-input:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0.625rem 0.875rem"
    height: "3.25rem"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "1rem"
  list-row-selected:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.ink}"
    padding: "1rem"
  notice-info:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "1rem"
  notice-success:
    backgroundColor: "{colors.success-soft}"
    textColor: "{colors.success}"
    rounded: "{rounded.card}"
    padding: "1rem"
  notice-warning:
    backgroundColor: "{colors.warning-soft}"
    textColor: "{colors.warning}"
    rounded: "{rounded.card}"
    padding: "1rem"
  notice-danger:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.danger}"
    rounded: "{rounded.card}"
    padding: "1rem"
  shop-header:
    backgroundColor: "{colors.shopfront}"
    textColor: "{colors.lettering}"
    padding: "1rem"
  summary-bar:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    padding: "0.75rem 1rem"
---

# Design System: La Mie Deininge · Un pain d'avance

## Overview

**Creative North Star : « La devanture au bout du doigt »**

Le site client est le standard soigné de la vente en ligne, habillé de la devanture de La Mie Deininge : la boiserie vert d'eau devient le bandeau d'en-tête, la ferronnerie vert sombre porte toutes les actions, la sélection et le focus, et le lettrage peint ardoise revient en italique calligraphique sur les titres de page. Tout le reste est neutre, froid et clair : un fond tiré du vert d'eau, des cartes blanches à filet, un texte presque noir.

La densité est volontairement basse. La racine est à 18 px (`font-size: 112.5%`), si bien que toute l'échelle Tailwind en `rem` grandit avec elle : textes, marges et cibles tactiles. Le public compte des personnes âgées qui commandent sur téléphone en plein jour ; la lisibilité et la clarté priment sur l'originalité. Une seule colonne de 42 rem au plus, des listes plutôt que des grilles de cartes à photos, un récapitulatif collé en bas d'écran plutôt qu'une pastille de panier.

Le site doit être complet sans aucune photo produit ; une photo ajoutée plus tard s'insère en vignette carrée de 80 px à coins arrondis dans la ligne du produit, sans changer la mise en page.

**Key Characteristics :**
- Racine à 18 px, tout en `rem` ; cibles tactiles de 48 px au minimum (54 à 58,5 px livrés).
- Un seul accent, le vert ferronnerie, pour agir, sélectionner et signaler le focus.
- Titres de page en Alegreya italique ardoise ; tout le reste en Atkinson Hyperlegible Next.
- Surfaces plates à filet ; une seule ombre, structurelle, sous la barre récapitulative collante.
- Tout état est dit par un texte, doublé d'une icône quand il y a une icône, jamais par la couleur seule.

## Colors

Une palette froide et sobre tirée de la devanture, avec un seul accent sombre et des couleurs d'état réservées aux messages.

### Primary
- **Vert ferronnerie** (accent) : boutons principaux, liens d'action (« Changer de passage », « Modifier »), icônes de repère (lieu, date, horloge, panier), barres d'étapes accomplies, filet sous le bandeau, anneau de focus, `accent-color` des cases et `::selection`. Blanc dessus : 7,84:1. Sur blanc : 7,84:1 ; sur le fond : 7,32:1.
- **Ferronnerie foncée** (accent-strong) : survol du bouton principal (blanc dessus : 10,76:1).
- **Vert d'eau pâle** (accent-soft) : fond d'une ligne de catalogue dont le produit est dans le panier. Vert ferronnerie dessus : 6,91:1 ; encre : 15,39:1 ; texte secondaire : 6,72:1.

### Secondary
- **Vert d'eau de la boiserie** (shopfront) : fond du bandeau d'en-tête, et seulement lui. Ardoise dessus : 5,37:1.
- **Ardoise du lettrage** (lettering) : logo dérivé (`public/brand/logo-ardoise.png`), devise du bandeau, titres de page. Sur le fond : 8,17:1.

### Neutral
- **Encre** (ink) : texte courant, bordure des boutons secondaires, des boutons de quantité et de l'encart de référence. Sur le fond : 16,33:1 ; sur blanc : 17,49:1.
- **Pierre** (muted) : texte secondaire (adresses, dates limites, allergènes, « Étape n sur 4 », pied de page). Sur le fond : 7,12:1 ; sur blanc : 7,63:1 ; sur le gris de filet (bouton désactivé) : 5,78:1.
- **Filet** (line) : bordures de cartes, séparateurs de listes et de tableaux, barres d'étapes à venir, fond du bouton désactivé. Décoratif (1,32:1 sur blanc) : il ne porte jamais seul une information.
- **Bordure de contrôle** (control-border) : contour 2 px des champs de saisie, 4,80:1 sur blanc, au-dessus des 3:1 exigés.
- **Fond froid** (surface) : fond de page et survol des lignes de liste ; tiré du vert d'eau, pas de crème.
- **Blanc carte** (card) : cartes, listes, champs, pied de page, barre récapitulative.

### État
- **Succès** (success sur success-soft, 6,81:1), **Avertissement** (warning, 7,09:1 sur blanc, 6,84:1 sur son fond pâle), **Danger** (danger, 6,47:1 sur blanc, 5,91:1 sur son fond pâle). Réservés aux messages, aux erreurs de formulaire et aux mentions de stock ou de complet ; un fond pâle ne sert qu'aux encarts de message, avec une bordure de la couleur à 30 %.

### Named Rules
**La règle de la ferronnerie.** Le vert ferronnerie est la seule couleur qui dit « agissez ici » ou « c'est choisi ». Aucune autre teinte ne porte un bouton, une sélection ou le focus.

**La règle du bandeau.** Le vert d'eau de la boiserie ne quitte pas l'en-tête. Les surfaces de contenu restent blanches sur fond froid.

**La règle du texte d'abord.** Complet, épuisé, stock restant, dans le panier, étape terminée : chaque état est écrit en toutes lettres. La couleur et l'icône le renforcent, elles ne le remplacent jamais.

## Typography

**Display Font :** Alegreya italique 500 (avec ui-serif, Georgia, serif)
**Body Font :** Atkinson Hyperlegible Next 400 et 700 (avec ui-sans-serif, system-ui, sans-serif)

**Character :** une italique calligraphique à empattements, écho de l'enseigne peinte « Boulangerie · Pâtisserie », posée au-dessus d'une linéale conçue pour la basse vision, aux lettres bien différenciées. L'enseigne signe la page ; la linéale fait tout le travail.

### Hierarchy
- **Display** (Alegreya italique 500, 1,875 rem soit 33,75 px, 1,2 ; 2,25 rem soit 40,5 px à partir de 640 px sur l'accueil et la page village) : titre de page `h1`, en ardoise, un par page.
- **Tagline** (Alegreya italique 500, 1,125 rem soit 20,25 px) : devise sous le logo dans le bandeau, seule autre apparition de la police d'enseigne.
- **Headline** (Atkinson 700, 1,5 rem soit 27 px, -0,01 em) : noms de catégories du catalogue.
- **Title** (Atkinson 700, 1,25 rem soit 22,5 px, -0,01 em) : titres de section (`h2`, légendes de formulaire), jour d'un passage, total de la barre récapitulative, quantité affichée.
- **Title-sm** (Atkinson 700, 1,125 rem soit 20,25 px) : nom de produit, prix, nom de village, totaux de tableau.
- **Body** (Atkinson 400, 1 rem soit 18 px, 1,5) : tout le texte courant ; jamais plus petit que 18 px.
- **Label** (Atkinson 700, 18 px) : libellés de champs, boutons, mentions d'état.
- **Reference** (Atkinson 700, 2,25 rem, espacement 0,05 em) : la référence de commande à présenter au retrait, seule.

### Named Rules
**La règle des 18 px.** Aucun texte sous 1 rem (18 px). Les chiffres (prix, totaux, quantités) sont en chiffres tabulaires.

**La règle de l'enseigne.** Alegreya italique est réservée aux titres de page et à la devise du bandeau. Jamais dans un bouton, une liste, un formulaire ou un paragraphe.

## Layout

Une seule colonne centrée de 42 rem au plus (`max-w-2xl`), marges latérales de 1 rem, identique pour le bandeau, le contenu et le pied de page. Le contenu commence à 1,5 rem sous le bandeau et se termine 3 rem au-dessus du pied de page, qui colle en bas de l'écran même quand la page est courte.

Le rythme suit le pas de 0,25 rem de Tailwind, soit 4,5 px à cette racine. Espacements récurrents : 1 rem de marge interne pour cartes et lignes (1,25 rem pour l'encart de référence et les cartes à partir de 640 px), 0,75 rem entre icône et texte et entre cartes d'une liste, 2 à 2,5 rem entre sections, 2,5 rem entre catégories du catalogue.

Mobile d'abord : les boutons principaux prennent toute la largeur dans les cartes de passage et sur la page de suivi ; les libellés des étapes n'apparaissent qu'à partir de 640 px, remplacés sur téléphone par « Étape n sur 4 ». Une ligne de catalogue empile infos et quantités sur téléphone et les aligne à partir de 640 px. La mise en page tient à 200 % de zoom texte : les libellés passent à la ligne proprement (chevron dans le même flux que le texte).

Le parcours est découpé en pages séparées (passage, produits, coordonnées, paiement), chacune ouverte par la barre d'étapes. Le panier ne vit que dans la barre récapitulative collée en bas d'écran.

## Elevation & Depth

Le système est plat. La profondeur vient du contraste de surfaces (cartes blanches sur fond froid), des filets de 1 px et, pour les éléments à saisir, de bordures de 2 px. Aucune ombre décorative sur les cartes, boutons ou champs.

### Shadow Vocabulary
- **Ombre de barre collante** (`box-shadow: 0 -4px 16px rgb(28 25 23 / 0.08)`) : uniquement sous la barre récapitulative collée en bas d'écran, pour la détacher du contenu qui défile derrière elle, avec un fond blanc à 95 % et un léger flou.

### Named Rules
**La règle du filet.** Une surface se détache par un filet, pas par une ombre. L'ombre n'existe que là où du contenu passe réellement dessous.

## Shapes

Deux rayons seulement, qui grandissent avec la racine : 1 rem (18 px) pour tout ce qui contient (cartes, listes, encarts de message, encart de référence, haut de la barre récapitulative à partir de 640 px) et 0,75 rem (13,5 px) pour tout ce qui se manipule (boutons, champs, boutons de quantité, vignettes produit). Les barres d'étapes sont des pilules de 0,5 rem de haut. Le bandeau et le pied de page sont à angles vifs, pleine largeur.

Épaisseurs : 1 px pour les filets de conteneur, 2 px pour les contrôles et pour les cartes cliquables (la bordure passe au vert ferronnerie au survol), 4 px de vert ferronnerie sous le bandeau.

## Components

### Buttons
Francs, larges, faciles à atteindre du pouce.
- **Shape :** coins doux (0,75 rem), hauteur minimale 3,25 rem (58,5 px), icône facultative à 0,5 rem du libellé.
- **Primary :** vert ferronnerie, texte blanc gras, marge interne 0,75 × 1,5 rem. Un seul par étape, pour l'action qui fait avancer le parcours.
- **Hover / Active :** ferronnerie foncée au survol ; enfoncement de 1 px à l'appui ; transitions de 150 ms en `cubic-bezier(0.16, 1, 0.3, 1)`, neutralisées sous `prefers-reduced-motion`.
- **Disabled :** fond gris de filet, texte pierre, curseur interdit ; un lien inactif passe par `aria-disabled="true"`.
- **Secondary :** blanc, bordure d'encre de 2 px, texte d'encre gras ; fond froid au survol. Pour revenir en arrière (« Modifier mes produits »).
- **Focus :** anneau de 3 px en vert ferronnerie, décalé de 3 px, sur tout élément focalisable.

### Quantity Stepper
Deux boutons carrés de 3 rem (54 px), bordure d'encre de 2 px, coins de 0,75 rem, icônes moins et plus ; la quantité en titre gras entre eux, annoncée (`aria-live`) et chaque bouton nommé avec le produit. À zéro ou au maximum, le bouton concerné passe en bordure de filet et icône pierre.

### Cards / Containers
- **Corner Style :** 1 rem.
- **Background :** blanc sur fond froid.
- **Shadow Strategy :** aucune (voir Elevation & Depth).
- **Border :** filet de 1 px ; 2 px pour une carte entièrement cliquable (passage), qui vire au vert ferronnerie au survol ; 2 px d'encre pour l'encart de la référence de commande.
- **Internal Padding :** 1 rem (1,25 rem à partir de 640 px pour le rappel du passage).
- **Listes :** les lignes d'une liste (villages, produits) partagent une seule carte, séparées par des filets ; une ligne de produit présent dans le panier prend le vert d'eau pâle et affiche « Dans votre panier : n » avec une coche.

### Inputs / Fields
- **Style :** blanc, bordure de 2 px en gris de contrôle (4,80:1), coins de 0,75 rem, hauteur minimale 3,25 rem, marge interne 0,625 × 0,875 rem ; libellé gras au-dessus, aide en pierre entre libellé et champ.
- **Focus :** la bordure passe au vert ferronnerie et l'anneau de 3 px se place à 1 px du champ.
- **Error :** bordure rouge danger, message gras en danger sous le champ relié par `aria-describedby`, et résumé des erreurs en tête de formulaire avec liens vers les champs.
- **Case à cocher :** 1,75 rem (31,5 px), teinte ferronnerie via `accent-color`.

### Notice
Encart de message : coins de 1 rem, bordure de 1 px, marge interne 1 rem, icône de 1,5 rem à gauche, titre gras puis texte d'encre. Quatre tons : info (blanc, filet, icône « i »), succès (coche cerclée), avertissement (triangle), danger (croix cerclée) ; fond pâle et bordure à 30 % de la couleur d'état.

### Navigation
- **Bandeau :** vert d'eau de la boiserie, filet ferronnerie de 4 px en bas ; logo ardoise de 2,25 rem de haut (2,75 rem à partir de 640 px) et devise en Alegreya italique ; le tout est un seul lien vers l'accueil. Lien d'évitement « Aller au contenu » visible au focus.
- **Barre d'étapes :** quatre pilules en grille, ferronnerie pour les étapes faites et courante, filet pour les suivantes ; étape courante en gras avec `aria-current="step"`, étapes faites avec une coche et « (terminée) » pour les lecteurs d'écran.
- **Liens :** soulignés (1 px, décalage 0,2 em) ; les liens d'action sont gras en ferronnerie.
- **Pied de page :** blanc, filet en haut, texte pierre ; nom de la boutique en gras d'encre, téléphone, e-mail et CGV soulignés.

### Summary Bar
Signature du parcours : barre blanche collée en bas de l'écran sur la page produits, pleine largeur sur téléphone et à coins supérieurs de 1 rem à partir de 640 px. À gauche, l'icône panier en ferronnerie, le nombre d'articles en pierre et le total en titre gras (annoncés en `aria-live`) ; à droite, le bouton principal de l'étape.

## Do's and Don'ts

### Do:
- **Do** garder la racine à 18 px et exprimer tailles, marges et cibles en `rem`.
- **Do** donner à toute cible tactile au moins 48 px (3 rem livrés au plus petit, 3,25 rem pour boutons et champs).
- **Do** écrire chaque état en texte, avec l'icône Lucide correspondante masquée aux lecteurs d'écran (`aria-hidden`), et la couleur d'état en renfort.
- **Do** laisser l'anneau de focus de 3 px en vert ferronnerie, décalé de 3 px, sur tout élément focalisable.
- **Do** poser le contenu en cartes blanches à filet de 1 px et coins de 1 rem sur le fond froid.
- **Do** vérifier chaque nouvelle paire texte-fond : 4,5:1 pour le texte, 3:1 pour les bordures de contrôle.

### Don't:
- **Don't** utiliser le vert d'eau de la boiserie hors du bandeau, ni une autre couleur que le vert ferronnerie pour une action, une sélection ou le focus.
- **Don't** porter une information par la couleur seule, ni par le seul filet gris (1,32:1).
- **Don't** composer le catalogue en grille de cartes à photos ni afficher le panier en pastille : liste lisible et barre récapitulative en bas d'écran.
- **Don't** ajouter d'ombre décorative ; la seule ombre est celle de la barre collante.
- **Don't** employer Alegreya italique ailleurs que dans les titres de page et la devise du bandeau.
- **Don't** reprendre le personnage de boulanger visible sur la photo de la devanture : c'est un autocollant d'annuaire, pas la marque.
