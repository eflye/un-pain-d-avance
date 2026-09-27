---
version: 1
slug: "src-app-frontend"
primary_target: "src/app/(frontend)"
related_targets: []
---

# Site client — parcours de précommande

Scope : accueil, page village (entrée par QR code), étapes de commande (passage → produits → coordonnées → paiement), page de suivi de commande, CGV. Mode : Operate.

Audience : habitants de villages, tous âges, sur téléphone, en plein jour. Tâche : réserver et payer son pain La Mie Deininge pour le prochain passage du camion, puis savoir quoi présenter au retrait.

Constraints : RGAA AA, grands textes (18 px minimum), cibles tactiles ≥ 48 px, parcours par étapes séparées, pas de photo produit au départ, français. Identité de la boulangerie contraignante (PRODUCT.md, docs/brand/).

## Direction contract

THESIS : le standard soigné de la vente en ligne, habillé de la devanture de La Mie Deininge ; refuse la grille de cartes à photos et le panier en pastille au profit d'une liste lisible et d'un récapitulatif collé en bas d'écran.

OWN-WORLD : bandeau vert d'eau de la boiserie (#a9d4c4) filé de vert ferronnerie (#2f5a48) portant le logo ardoise ; fond froid tiré du vert d'eau (#f4f8f6), cartes blanches à filet ; ferronnerie pour actions, sélection et focus ; titres de page en italique calligraphique ardoise (Alegreya italique, écho de l'enseigne peinte « Boulangerie · Pâtisserie »), texte en Atkinson Hyperlegible Next 18 px minimum ; coins 18 px pour les cartes, 13,5 px pour les contrôles ; aucune ombre décorative ; états par texte + icône.

STORY : le visiteur voit son village et le prochain passage, choisit un créneau, ajoute ses produits en voyant prix, allergènes et stock restant, donne ses coordonnées, paie, puis garde une page avec sa référence, le lieu, le jour et l'heure.

FIRST VIEWPORT : page village sur téléphone — bandeau de la boulangerie, barres d'étapes, nom du village en titre italique ardoise, adresse, puis la liste des prochains passages : pour chacun, jour en gras 22 px, créneau, date limite, et bouton pleine largeur écrit « Commander pour ce passage ».

FORM : canon (standard de la catégorie), choisi par l'utilisateur, habillé de l'identité fournie ; seed 81bf6209.

FINISH : unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
