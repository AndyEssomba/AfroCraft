# Document d'exigences — AfroCraft (MVP)

## Introduction

AfroCraft est un jeu de construction en blocs (voxel) en 3D, en vue à la première personne, jouable dans un navigateur web. Il s'inspire de Minecraft mais s'ancre dans un univers africain, à travers ses biomes, ses matériaux et son ambiance visuelle.

Cette première version (MVP) vise à offrir une boucle de jeu de base fonctionnelle et fluide : un joueur explore un monde de blocs généré procéduralement, s'y déplace en première personne avec gravité et collisions, casse et pose des blocs choisis dans une barre d'accès rapide, le tout sous un cycle jour/nuit.

### Périmètre de cette version

Dans le périmètre :
- Monde de blocs généré procéduralement, de 128×128 blocs à l'horizontale et 64 blocs de hauteur.
- Trois biomes : savane, désert, forêt tropicale.
- Déplacement en première personne (marche, saut, regard à la souris) avec gravité et collisions.
- Casser un bloc et poser un bloc, avec réticule et mise en surbrillance du bloc visé.
- Barre d'accès rapide (hotbar) de 9 cases pour sélectionner le bloc à poser.
- Neuf types de blocs : terre rouge, herbe de savane, herbe de forêt, sable, pierre, bois de baobab, feuilles, eau, argile.
- Blocs illimités (aucun inventaire).
- Cycle jour/nuit.

Hors périmètre dans cette version :
- Sauvegarde / chargement du monde.
- Inventaire et ramassage de blocs.
- Animaux et créatures.
- Système de fabrication (crafting).
- Multijoueur.
- Sons et musique.
- Menus avancés.
- Textures complexes.
- Écoulement de l'eau et physique des blocs (chute des blocs non soutenus).

### Contraintes
- Le jeu doit être jouable dans une version récente de Chrome ou Firefox.
- Le jeu vise 60 images par seconde et ne descend jamais sous 30 images par seconde sur un ordinateur portable équipé d'une carte graphique intégrée.

### Glossaire
- **Bloc** : unité cubique de base composant le monde.
- **Voxel** : cube élémentaire positionné sur une grille 3D régulière.
- **Biome** : région du monde avec une apparence et une composition de blocs caractéristiques.
- **Hotbar** : barre d'accès rapide affichant les emplacements de blocs sélectionnables.
- **Première personne** : point de vue à travers les yeux du joueur.
- **Réticule** : petit repère affiché au centre de l'écran indiquant la direction visée.
- **Portée d'interaction** : distance maximale, en blocs, à laquelle le joueur peut casser ou poser un bloc.
- **Capture de la souris** : état dans lequel le curseur est masqué et les mouvements de la souris orientent la caméra.

---

## Exigences

### Exigence 1 — Génération procédurale du monde

**User story :** En tant que joueur, je veux explorer un monde de blocs généré automatiquement, afin de découvrir un terrain varié à chaque partie sans qu'il soit construit à la main.

#### Critères d'acceptation

1. QUAND une nouvelle partie démarre, LE SYSTÈME DOIT générer un monde de blocs de manière procédurale.
2. LE SYSTÈME DOIT générer un monde d'exactement 128×128 blocs à l'horizontale et de 64 blocs de hauteur.
3. QUAND le monde est généré, LE SYSTÈME DOIT produire un relief (élévations et dépressions) plutôt qu'une surface totalement plate.
4. LE SYSTÈME DOIT composer le monde exclusivement à partir des neuf types de blocs définis dans l'exigence 5 et de la couche incassable définie au critère 1.6.
5. QUAND le joueur apparaît dans le monde, LE SYSTÈME DOIT le positionner sur une surface solide et non à l'intérieur d'un bloc plein ni dans le vide.
6. LE SYSTÈME DOIT constituer la couche la plus basse du monde (y = 0) de blocs incassables.
7. LE SYSTÈME NE DOIT JAMAIS permettre au joueur de tomber hors du monde par le bas.
8. QUAND le joueur atteint une limite horizontale du monde, LE SYSTÈME DOIT empêcher le joueur de sortir des limites du monde généré.
9. QUAND le monde est généré, LE SYSTÈME DOIT fixer le niveau de l'eau (niveau de la mer) à y = 20 et remplir d'eau chaque emplacement d'air situé à y ≤ 20 et sous la surface du terrain.
10. LE SYSTÈME NE DOIT JAMAIS positionner le point d'apparition du joueur dans l'eau.

---

### Exigence 2 — Biomes

**User story :** En tant que joueur, je veux parcourir différents biomes africains, afin de ressentir la diversité des paysages du monde.

#### Critères d'acceptation

1. LE SYSTÈME DOIT générer trois biomes distincts : savane, désert et forêt tropicale.
2. QUAND le biome savane est généré, LE SYSTÈME DOIT recouvrir sa surface principalement d'herbe de savane et y placer des baobabs (bois de baobab et feuilles).
3. QUAND le biome désert est généré, LE SYSTÈME DOIT recouvrir sa surface principalement de sable.
4. QUAND le biome forêt tropicale est généré, LE SYSTÈME DOIT recouvrir sa surface principalement d'herbe de forêt et d'une végétation dense (bois et feuilles) plus abondante que dans la savane.
5. LE SYSTÈME DOIT répartir les biomes en régions contiguës au sein du monde.
6. QUAND le joueur se déplace d'un biome à un autre, LE SYSTÈME DOIT présenter une transition cohérente entre les biomes sans discontinuité de terrain (pas de trou ni de mur vertical artificiel à la frontière).

---

### Exigence 3 — Déplacement en première personne

**User story :** En tant que joueur, je veux me déplacer et regarder autour de moi en vue première personne, afin d'explorer le monde de façon immersive.

#### Critères d'acceptation

1. LE SYSTÈME DOIT présenter le monde depuis un point de vue à la première personne.
2. QUAND le joueur appuie sur Z ou la flèche haut, LE SYSTÈME DOIT déplacer le joueur vers l'avant.
3. QUAND le joueur appuie sur S ou la flèche bas, LE SYSTÈME DOIT déplacer le joueur vers l'arrière.
4. QUAND le joueur appuie sur Q ou la flèche gauche, LE SYSTÈME DOIT déplacer le joueur vers la gauche.
5. QUAND le joueur appuie sur D ou la flèche droite, LE SYSTÈME DOIT déplacer le joueur vers la droite.
6. QUAND la souris est capturée et que le joueur la déplace, LE SYSTÈME DOIT faire pivoter la caméra horizontalement et verticalement en conséquence.
7. LE SYSTÈME DOIT limiter la rotation verticale de la caméra afin d'empêcher le retournement complet de la vue.
8. QUAND le joueur appuie sur Espace et qu'il se trouve sur une surface solide, LE SYSTÈME DOIT propulser le joueur vers le haut.
9. LE SYSTÈME DOIT appliquer une gravité constante au joueur lorsqu'il n'est pas soutenu par un bloc solide.
10. QUAND le joueur n'est plus soutenu par un bloc solide, LE SYSTÈME DOIT faire chuter le joueur jusqu'à ce qu'il atteigne une surface solide.

---

### Exigence 4 — Collisions avec les blocs

**User story :** En tant que joueur, je veux que mon personnage soit arrêté par les blocs pleins, afin de me tenir dessus et de ne pas traverser le monde.

#### Critères d'acceptation

1. QUAND le joueur se déplace vers un bloc plein, LE SYSTÈME DOIT empêcher le joueur de pénétrer à l'intérieur de ce bloc.
2. QUAND le joueur se tient sur un bloc plein, LE SYSTÈME DOIT soutenir le joueur et stopper sa chute.
3. QUAND le joueur saute contre un bloc plein situé au-dessus de lui, LE SYSTÈME DOIT stopper son ascension au contact du bloc.
4. LE SYSTÈME DOIT autoriser le joueur à traverser les blocs d'eau.
5. QUAND le joueur se trouve dans l'eau, LE SYSTÈME DOIT ralentir son déplacement horizontal et sa vitesse de chute.
6. QUAND le joueur se déplace le long d'une surface de blocs, LE SYSTÈME NE DOIT PAS laisser le joueur rester bloqué ni traverser accidentellement un bloc plein.
7. QUAND le joueur se trouve dans l'eau et maintient la touche Espace, LE SYSTÈME DOIT le faire remonter lentement.
8. LE SYSTÈME NE DOIT JAMAIS laisser le joueur rester bloqué au fond de l'eau.

---

### Exigence 5 — Types de blocs

**User story :** En tant que joueur, je veux disposer d'un ensemble de matériaux à thème africain, afin de reconnaître et d'utiliser différents types de blocs.

#### Critères d'acceptation

1. LE SYSTÈME DOIT prendre en charge exactement neuf types de blocs posables : terre rouge, herbe de savane, herbe de forêt, sable, pierre, bois de baobab, feuilles, eau et argile.
2. LE SYSTÈME DOIT rendre chaque type de bloc visuellement distinct des autres.
3. LE SYSTÈME DOIT afficher l'herbe de forêt dans un vert plus foncé que l'herbe de savane.
4. LE SYSTÈME DOIT traiter l'eau comme un bloc non solide et immobile, qui ne s'écoule pas.
5. LE SYSTÈME DOIT traiter la terre rouge, l'herbe de savane, l'herbe de forêt, le sable, la pierre, le bois de baobab, les feuilles et l'argile comme des blocs solides.
6. LE SYSTÈME DOIT rendre la couche incassable du fond du monde visuellement distincte des neuf types de blocs posables.

---

### Exigence 6 — Casser un bloc

**User story :** En tant que joueur, je veux casser des blocs du monde, afin de modifier le terrain et de dégager des espaces.

#### Critères d'acceptation

1. QUAND le joueur vise un bloc situé à 5 blocs ou moins et fait un clic gauche, LE SYSTÈME DOIT retirer ce bloc du monde.
2. LE SYSTÈME DOIT cibler le bloc solide le plus proche se trouvant dans la ligne de visée du joueur, en ignorant l'eau, dans une portée d'interaction de 5 blocs.
3. QUAND aucun bloc solide n'est à portée dans la ligne de visée, LE SYSTÈME NE DOIT retirer aucun bloc.
4. QUAND un bloc est retiré, LE SYSTÈME DOIT afficher l'espace libéré en moins de 100 ms.
5. LE SYSTÈME NE DOIT PAS permettre au joueur de casser un bloc situé à plus de 5 blocs.
6. LE SYSTÈME NE DOIT PAS permettre au joueur de casser un bloc d'eau.
7. LE SYSTÈME NE DOIT PAS permettre au joueur de casser un bloc de la couche incassable (y = 0).
8. QUAND un bloc est retiré, LE SYSTÈME NE DOIT PAS l'ajouter à un quelconque inventaire.

---

### Exigence 7 — Poser un bloc

**User story :** En tant que joueur, je veux poser des blocs dans le monde, afin de construire des structures.

#### Critères d'acceptation

1. QUAND le joueur vise la face d'un bloc solide situé à 5 blocs ou moins et fait un clic droit, LE SYSTÈME DOIT placer un bloc du type actuellement sélectionné dans la hotbar contre la face visée.
2. LE SYSTÈME DOIT placer le nouveau bloc dans l'emplacement adjacent à la face du bloc visé.
3. LE SYSTÈME NE DOIT PAS placer un bloc dans un emplacement déjà occupé par un bloc solide.
4. QUAND l'emplacement cible est occupé par de l'eau, LE SYSTÈME DOIT remplacer l'eau par le nouveau bloc.
5. LE SYSTÈME NE DOIT PAS placer un bloc dans l'espace occupé par le joueur lui-même.
6. QUAND un bloc est posé, LE SYSTÈME DOIT afficher le nouveau bloc en moins de 100 ms.
7. QUAND aucune face de bloc solide n'est à portée dans la ligne de visée, LE SYSTÈME NE DOIT poser aucun bloc.
8. QUAND un bloc est posé, LE SYSTÈME NE DOIT consommer aucune ressource (blocs illimités).

---

### Exigence 8 — Barre d'accès rapide (hotbar)

**User story :** En tant que joueur, je veux choisir le type de bloc à poser dans une barre d'accès rapide, afin de changer facilement de matériau pendant la construction.

#### Critères d'acceptation

1. LE SYSTÈME DOIT afficher une barre d'accès rapide (hotbar) comportant 9 cases.
2. LE SYSTÈME DOIT assigner chacun des neuf types de blocs de l'exigence 5 à une case de la hotbar, chaque type apparaissant une seule fois.
3. LE SYSTÈME DOIT indiquer visuellement quelle case de la hotbar est actuellement sélectionnée.
4. QUAND le joueur appuie sur une touche de 1 à 9, LE SYSTÈME DOIT sélectionner la case correspondante.
5. QUAND le joueur fait tourner la molette de la souris, LE SYSTÈME DOIT sélectionner la case suivante ou précédente, en revenant à la première case après la dernière et inversement.
6. QUAND le joueur pose un bloc, LE SYSTÈME DOIT utiliser le type de bloc de la case actuellement sélectionnée.
7. À tout moment, LE SYSTÈME NE DOIT avoir qu'une seule case de la hotbar sélectionnée.

---

### Exigence 9 — Cycle jour/nuit

**User story :** En tant que joueur, je veux vivre un cycle jour/nuit, afin de ressentir le passage du temps dans le monde.

#### Critères d'acceptation

1. LE SYSTÈME DOIT faire évoluer en continu l'éclairage du monde entre le jour et la nuit.
2. QUAND le temps progresse, LE SYSTÈME DOIT faire varier la luminosité ambiante et la couleur du ciel entre une phase diurne et une phase nocturne.
3. LE SYSTÈME DOIT accomplir un cycle jour/nuit complet en 10 minutes réelles.
4. LE SYSTÈME DOIT boucler le cycle jour/nuit de manière continue sans interruption.
5. LE SYSTÈME NE DOIT PAS plonger la scène dans une obscurité empêchant le joueur de distinguer les blocs proches pendant la nuit.

---

### Exigence 10 — Visée et réticule

**User story :** En tant que joueur, je veux voir précisément quel bloc je vise, afin de casser et poser des blocs sans erreur.

#### Critères d'acceptation

1. PENDANT que la souris est capturée, LE SYSTÈME DOIT afficher un réticule au centre de l'écran.
2. QUAND un bloc solide se trouve dans la ligne de visée à 5 blocs ou moins, LE SYSTÈME DOIT mettre ce bloc en surbrillance.
3. QUAND aucun bloc solide n'est à portée dans la ligne de visée, LE SYSTÈME NE DOIT mettre aucun bloc en surbrillance.
4. QUAND le bloc visé change, LE SYSTÈME DOIT déplacer la surbrillance sur le nouveau bloc visé.

---

### Exigence 11 — Capture de la souris

**User story :** En tant que joueur, je veux que la souris contrôle la caméra uniquement quand je joue, afin de pouvoir quitter le jeu ou utiliser le navigateur à tout moment.

#### Critères d'acceptation

1. QUAND le joueur clique dans la fenêtre du jeu alors que la souris est libre, LE SYSTÈME DOIT capturer la souris.
2. QUAND le joueur appuie sur Échap alors que la souris est capturée, LE SYSTÈME DOIT libérer la souris.
3. PENDANT que la souris est libre, LE SYSTÈME NE DOIT PAS faire pivoter la caméra.
4. PENDANT que la souris est libre, LE SYSTÈME NE DOIT casser ni poser aucun bloc.
5. PENDANT que la souris est libre, LE SYSTÈME DOIT afficher une indication invitant le joueur à cliquer pour jouer.

---

### Exigence 12 — Absence de physique des blocs

**User story :** En tant que joueur, je veux que les blocs restent à leur place, afin que mes constructions et le terrain soient stables et prévisibles.

#### Critères d'acceptation

1. QUAND le joueur casse un bloc de bois de baobab, LE SYSTÈME NE DOIT PAS retirer ni déplacer les blocs de feuilles voisins.
2. QUAND un bloc n'est plus soutenu par un autre bloc, LE SYSTÈME DOIT le laisser à sa position.
3. LE SYSTÈME NE DOIT PAS faire s'écouler l'eau vers les emplacements libres voisins.

---

### Exigence 13 — Performance et compatibilité

**User story :** En tant que joueur, je veux que le jeu reste fluide sur un ordinateur portable standard, afin de jouer confortablement sans ralentissements.

#### Critères d'acceptation

1. LE SYSTÈME DOIT fonctionner dans une version récente de Chrome et de Firefox.
2. PENDANT l'exploration du monde, LE SYSTÈME DOIT viser une fréquence de 60 images par seconde sur un ordinateur portable équipé d'une carte graphique intégrée.
3. PENDANT l'exploration du monde, LE SYSTÈME NE DOIT JAMAIS descendre sous 30 images par seconde sur un ordinateur portable équipé d'une carte graphique intégrée.
4. QUAND le joueur casse ou pose un bloc, LE SYSTÈME DOIT afficher le changement en moins de 100 ms.
5. LE SYSTÈME DOIT limiter la taille du monde à 128×128×64 blocs afin de préserver la fluidité.
