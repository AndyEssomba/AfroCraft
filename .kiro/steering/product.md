# Produit — AfroCraft

AfroCraft est un jeu de construction en blocs (voxel) en 3D, en vue à la première personne, jouable directement dans un navigateur web. Il s'inspire de Minecraft mais s'ancre dans un univers africain à travers ses biomes, ses matériaux et son ambiance visuelle.

## Boucle de jeu

Le joueur explore un monde de blocs généré procéduralement, s'y déplace en première personne avec gravité et collisions, casse et pose des blocs choisis dans une barre d'accès rapide (hotbar), le tout sous un cycle jour/nuit.

## Périmètre MVP

Dans le périmètre :
- Monde généré procéduralement de 128×128 blocs à l'horizontale et 64 blocs de hauteur.
- Trois biomes africains : savane, désert, forêt tropicale.
- Déplacement première personne (marche, saut, regard souris) avec gravité et collisions, nage dans l'eau.
- Casser et poser des blocs, avec réticule et surbrillance du bloc visé.
- Hotbar de 9 cases.
- Neuf types de blocs : terre rouge, herbe de savane, herbe de forêt, sable, pierre, bois de baobab, feuilles, eau, argile (plus une couche de socle incassable).
- Blocs illimités (aucun inventaire).
- Cycle jour/nuit (10 min réelles par cycle).
- Niveau de la mer fixé à y = 20.

Hors périmètre : sauvegarde/chargement, inventaire, animaux, crafting, multijoueur, sons/musique, menus avancés, textures complexes, écoulement de l'eau et physique des blocs.

## Identité d'AfroCraft

AfroCraft n'est pas un clone de Minecraft : chaque ajout doit renforcer une identité inspirée de cultures africaines réelles, précises et nommées, jamais un « style africain » générique.

### Références des biomes

- **Savane — Sahel / Afrique de l'Ouest** : baobabs, acacias, termitières, architecture en banco inspirée de Djenné (Mali) et constructions en chaume.
- **Désert** : dunes, inselbergs et oasis avec palmiers.
- **Forêt tropicale — Afrique centrale** : fromagers géants, bambou, raphia, palmiers et motifs inspirés du ndop (Cameroun).

### Direction artistique

- **Palette signature** : ocre, latérite, terre de Sienne, indigo, or et vert profond, avec des couchers de soleil orangés et intenses.
- **Motifs décoratifs** : compositions géométriques inspirées du bogolan (Mali) et du ndop (Cameroun).
- **Priorité technique** : préserver en permanence un rendu lisible et une performance minimale de 60 FPS.

## Référence

Les exigences détaillées, la conception et le plan d'implémentation font foi et sont maintenus dans la spec `afrocraft` (`.kiro/specs/afrocraft/` : requirements.md, design.md, tasks.md). En cas de doute sur un comportement attendu, se référer à la spec.