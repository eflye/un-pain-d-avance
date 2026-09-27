---
version: 1
slug: "src-app-frontend"
primary_target: "src/app/(frontend)"
related_targets: []
---

# Site client — parcours de précommande

Scope : accueil, page village (entrée par QR code), étapes de commande (passage → produits → coordonnées → paiement), page de suivi de commande, CGV. Mode : Operate.

Audience : habitants de villages, tous âges, sur téléphone, en plein jour. Tâche : réserver et payer son pain pour le prochain passage du camion, puis savoir quoi présenter au retrait.

Constraints : RGAA AA, grands textes, cibles tactiles ≥ 48 px, parcours par étapes séparées, pas de photo produit au départ, français.

## Direction contract

THESIS : le standard soigné de la vente en ligne, exécuté sans concession ; refuse la grille de cartes à photos et le panier flottant en pastille au profit d'une liste lisible et d'une barre de récapitulatif fixe.

OWN-WORLD : fond blanc, texte presque noir (stone), un seul accent brun blé foncé pour les actions et l'état sélectionné ; Atkinson Hyperlegible Next (conçue pour la basse vision) en 18 px minimum ; coins 12 px, filets fins, aucune ombre décorative ; états par texte + icône, jamais la couleur seule.

STORY : le visiteur voit son village et le prochain passage, choisit un créneau, ajoute ses produits en voyant prix, allergènes et stock restant, donne ses coordonnées, paie, puis garde une page avec sa référence, le lieu, le jour et l'heure.

FIRST VIEWPORT : page village sur téléphone — nom du village en titre 32 px, adresse, puis la liste des prochains passages : pour chacun, jour en gras 22 px, créneau, date limite, et bouton pleine largeur « Commander pour ce passage ». Aucun bandeau décoratif.

FORM : canon (standard de la catégorie), choisi par l'utilisateur ; seed 81bf6209.

FINISH : unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
