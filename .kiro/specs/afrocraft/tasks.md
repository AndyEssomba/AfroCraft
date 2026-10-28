# Implementation Plan: AfroCraft (MVP)

## Overview

Ce plan transforme la conception d'AfroCraft en une série d'étapes de codage incrémentales à l'aide de JavaScript (modules ES), Three.js pour le rendu, Vite pour le dev/build et fast-check pour les tests basés sur les propriétés. Aucun backend n'est requis : tout s'exécute dans le navigateur.

**Règle d'incrémentalité (obligatoire) :** après chaque tâche principale (jalon numéroté de premier niveau), le jeu DOIT se lancer avec `npm run dev` et montrer un progrès visible à l'écran. Chaque jalon se termine par un point de contrôle (checkpoint) de vérification manuelle.

**Premier jalon le plus tôt possible :** le jalon 1 produit un monde PLAT affiché avec une caméra qui bouge, AVANT toute génération procédurale, pour afficher quelque chose à l'écran au plus vite.

**Convention des sous-tâches de test :** les sous-tâches marquées d'un `*` sont des tests (unitaires, propriétés, intégration) ; elles sont optionnelles et peuvent être ignorées pour un MVP rapide. Les tests basés sur les propriétés (fast-check) sont des sous-tâches distinctes placées juste après le module qu'elles vérifient et référencent le numéro de Property de la conception.

## Tasks

- [ ] 1. Projet Vite + scène Three.js (monde plat affiché, caméra mobile)
  - **Progrès visible attendu après ce jalon :** `npm run dev` affiche un sol plat de blocs via Three.js, avec une caméra que l'on peut déplacer/orienter.
  - [x] 1.1 Initialiser le projet Vite et les dépendances
    - Créer `index.html`, `vite.config.js`, `package.json` avec les scripts `dev`/`build` et un script `test` lançant `vitest --run`
    - Ajouter les dépendances : `three` (runtime), `vite`, `fast-check` et `vitest` (dev)
    - Créer la structure de dossiers `src/` (`world/`, `generation/`, `rendering/`, `player/`, `interaction/`, `ui/`, `environment/`) conforme à la conception
    - _Requirements: 13.1_
  - [x] 1.2 Mettre en place la scène Three.js et la boucle de rendu dans `src/main.js`
    - Créer `WebGLRenderer`, `Scene`, `PerspectiveCamera`, redimensionnement sur `resize`
    - Lancer la boucle `requestAnimationFrame` qui appelle `renderer.render(scene, camera)`
    - Afficher un message d'erreur explicite si le contexte WebGL ne peut pas être créé
    - _Requirements: 3.1, 13.1_
  - [ ]* 1.3 Écrire le test unitaire de détection WebGL indisponible
    - Vérifier qu'un message d'erreur explicite est produit quand WebGL est absent (mock du contexte)
    - _Requirements: 13.1_
  - [x] 1.4 Afficher un sol plat temporaire et une caméra déplaçable
    - Générer une grille plate de cubes (ou un plan de blocs) et l'ajouter à la scène
    - Permettre un déplacement/rotation libre de la caméra (contrôle temporaire) pour valider le rendu
    - _Requirements: 1.1, 3.1_
  - [ ] 1.5 Checkpoint — Jalon 1 (VÉRIFICATION MANUELLE)
    - Point de contrôle manuel : tous les tests passent, et l'utilisateur lance `npm run dev` et confirme qu'un sol plat s'affiche et que la caméra bouge. Ce point est une porte de validation manuelle avant de continuer.

- [ ] 2. Données du monde (World, Chunk, blocks)
  - **Progrès visible attendu après ce jalon :** le sol affiché est désormais construit à partir des données réelles de `World` (grille de blocs par chunks), toujours visible via `npm run dev`.
  - [x] 2.1 Définir les types de blocs et leurs métadonnées dans `src/world/blocks.js`
    - Déclarer `BLOCK` (9 types placables + `AIR` + `BEDROCK`) et la table `BLOCK_DATA` (couleur, solidité, opacité, placabilité)
    - Implémenter `isSolide`, `isOpaque`, `isCassable` ; l'eau est non solide, la bedrock incassable et distincte
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 1.6_
  - [ ]* 2.2 Écrire les tests unitaires de `blocks.js`
    - Vérifier `isSolide`/`isOpaque`/`isCassable` pour chaque type ; eau non solide ; bedrock incassable
    - _Requirements: 5.4, 5.5, 6.6, 6.7_
  - [x] 2.3 Implémenter `src/world/Chunk.js`
    - Conteneur `Uint8Array(16*16*64)`, indexation `[lx + lz*16 + ly*256]`, accesseurs `get`/`set`, drapeau `dirty`, référence `mesh`
    - _Requirements: 1.2, 13.5_
  - [x] 2.4 Implémenter `src/world/World.js`
    - Grille 128×64×128 en 8×8 chunks ; `getBlock`/`setBlock` par coordonnées monde ; `isInBounds` ; `isSolidAt`
    - `setBlock` marque le(s) chunk(s) `dirty` ; `markNeighborsDirty` pour les blocs en frontière ; `dirtyChunksSince`
    - Lecture hors limites : `AIR` sur les côtés/dessus, solide infranchissable pour y<0
    - _Requirements: 1.2, 1.4, 1.7, 1.8, 13.5, 6.1, 7.1_
  - [ ]* 2.5 Écrire les tests unitaires de `World`
    - `getBlock`/`setBlock`, `isInBounds`, `isSolidAt`, marquage dirty et dirty des voisins en frontière, lecture hors limites
    - _Requirements: 1.2, 1.4, 1.7, 1.8_
  - [ ]* 2.6 Écrire le test de propriété — cohérence de la grille
    - **Property 13 : Cohérence de la grille** — `∀` cellule, `setBlock(x,y,z,t)` puis `getBlock(x,y,z)` renvoie `t` (fast-check)
    - **Validates: Requirements 7.1, 6.1**
  - [ ]* 2.7 Écrire le test de propriété — dimensions du monde
    - **Property 1 : Dimensions du monde** — taille 128×128×64, soit exactement 8×8 chunks de 16×16×64 (fast-check)
    - **Validates: Requirements 1.2, 13.5**
  - [x] 2.8 Câbler `World` dans `main.js` pour alimenter l'affichage du sol plat
    - Remplir temporairement une grille plate via `setBlock` et dériver l'affichage de ces données
    - _Requirements: 1.1, 1.4_
  - [ ] 2.9 Checkpoint — Jalon 2 (VÉRIFICATION MANUELLE)
    - Point de contrôle manuel : tous les tests passent, et l'utilisateur lance `npm run dev` et confirme que le sol est bien construit à partir des données de `World`. Porte de validation manuelle.

- [ ] 3. Meshing d'un chunk (face-culling, un mesh par chunk)
  - **Progrès visible attendu après ce jalon :** le monde est rendu via 64 meshes de chunk avec face-culling ; l'eau apparaît en géométrie transparente. Visible via `npm run dev`.
  - [x] 3.1 Implémenter les matériaux par type dans `src/rendering/materials.js`
    - Un matériau/couleur distinct par type de bloc ; herbe de forêt plus foncée que savane ; bedrock distincte ; eau transparente
    - _Requirements: 5.2, 5.3, 5.6, 5.4_
  - [x] 3.2 Implémenter le meshing face-culling dans `src/rendering/ChunkRenderer.js`
    - `buildChunkMesh(chunk)` : n'émettre que les faces exposées (pas de face entre deux blocs opaques adjacents)
    - Faces d'eau émises uniquement vers l'air ; aucune face entre deux blocs d'eau adjacents ; géométrie d'eau transparente séparée
    - `buildAllChunks` (64 chunks) ; `rebuildDirtyChunks` (reconstruit seulement les chunks `dirty`)
    - _Requirements: 13.2, 13.3, 5.4, 1.9, 6.4, 7.6, 13.4_
  - [ ]* 3.3 Écrire les tests unitaires du meshing
    - Vérifier qu'aucune face n'est émise entre blocs opaques adjacents ; faces de bord dessinées en limite de monde
    - _Requirements: 13.2, 13.3_
  - [ ]* 3.4 Écrire le test de propriété — face-culling
    - **Property 9 : Face-culling** — `∀` paire de blocs opaques adjacents, aucune face n'est émise entre eux (fast-check)
    - **Validates: Requirements 13.2, 13.3**
  - [ ]* 3.5 Écrire le test de propriété — faces d'eau uniquement vers l'air
    - **Property 14 : Faces d'eau uniquement vers l'air** — aucune face entre deux blocs d'eau adjacents ; face d'eau dessinée seulement si voisin = AIR (fast-check)
    - **Validates: Requirements 1.9, 5.4**
  - [x] 3.6 Brancher le `ChunkRenderer` dans `main.js`
    - Remplacer l'affichage temporaire par `buildAllChunks` ; appeler `rebuildDirtyChunks` dans la boucle
    - _Requirements: 13.2, 13.3_
  - [ ] 3.7 Checkpoint — Jalon 3 (VÉRIFICATION MANUELLE)
    - Point de contrôle manuel : tous les tests passent, et l'utilisateur lance `npm run dev` et confirme le rendu par chunks avec faces visibles seulement. Porte de validation manuelle.

- [ ] 4. Joueur et collisions (caméra FPS, gravité, saut, AABB, capture de la souris)
  - **Progrès visible attendu après ce jalon :** on marche en première personne sur le sol avec gravité, saut et collisions ; on peut traverser l'eau ; cliquer capture la souris pour jouer et Échap la libère. Visible via `npm run dev`.
  - [x] 4.1 Implémenter la caméra première personne et les entrées dans `src/player/Player.js`
    - Position + orientation (yaw/pitch), déplacement ZQSD + flèches, rotation souris avec pitch borné (pas de retournement)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_
  - [x] 4.2 Implémenter la gravité, le saut et la chute dans `Player.js`
    - Gravité constante quand non soutenu ; saut si `onGround` ; chute jusqu'à une surface solide
    - _Requirements: 3.8, 3.9, 3.10_
  - [x] 4.3 Implémenter la résolution de collision AABB dans `src/player/Physics.js`
    - Déplacement axe par axe ; empêcher la pénétration ; soutien au sol ; stop au plafond ; pas de blocage ni traversée
    - Confiner le joueur dans les limites du monde (pas de sortie par le bas ni sur les côtés)
    - _Requirements: 4.1, 4.2, 4.3, 4.6, 1.7, 1.8_
  - [x] 4.4 Implémenter la traversée et le ralentissement dans l'eau, et la nage
    - Eau non solide traversable ; ralentissement horizontal et de la chute dans l'eau
    - Maintenir Espace dans l'eau produit une remontée lente ; jamais bloqué au fond (vitesse de nage nette positive)
    - _Requirements: 4.4, 4.5, 4.7, 4.8_
  - [x]* 4.5 Écrire les tests unitaires de `Physics`
    - Soutien, plafond, pas de traversée ni blocage ; ralentissement eau ; confinement aux limites
    - _Requirements: 4.1, 4.2, 4.3, 4.6, 4.5, 1.7, 1.8_
  - [x]* 4.6 Écrire le test de propriété — non-interpénétration
    - **Property 4 : Non-interpénétration** — `∀` frame, après résolution, l'AABB du joueur ne recouvre aucun bloc solide (fast-check)
    - **Validates: Requirements 4.1, 4.6**
  - [ ]* 4.7 Écrire le test de propriété — confinement du joueur
    - **Property 3 : Confinement du joueur** — `∀` frame, `isInBounds(player.position)` reste vrai (fast-check)
    - **Validates: Requirements 1.7, 1.8**
  - [x] 4.8 Implémenter la capture/libération dans `src/interaction/PointerLock.js`
    - `request()` sur clic dans la fenêtre ; `release()` sur Échap ; `isLocked` ; gérer la libération par le navigateur
    - _Requirements: 11.1, 11.2_
  - [x] 4.9 Neutraliser rotation/casse/pose hors capture et afficher l'invite
    - Rotation caméra et casser/poser conditionnés à `isLocked` ; invite « cliquer pour jouer » quand la souris est libre
    - _Requirements: 11.3, 11.4, 11.5_
  - [ ]* 4.10 Écrire le test de propriété — gate du pointer lock
    - **Property 12 : Gate du pointer lock** — si la souris est libre, aucune rotation ni casse/pose ne se produit (fast-check)
    - **Validates: Requirements 11.3, 11.4**
  - [x] 4.11 Câbler le pointer lock dans `main.js`
    - Brancher `PointerLock` sur la fenêtre et le passer à `Player`/`Interaction`
    - _Requirements: 11.1, 11.2_
  - [x] 4.12 Câbler le joueur dans `main.js`
    - Instancier `Player`, lire les entrées clavier/souris (en passant le `PointerLock` à `Player`/`Interaction`), appeler `player.update(dt, input)` chaque frame et suivre la caméra
    - _Requirements: 3.1, 3.9_
  - [ ] 4.13 Checkpoint — Jalon 4 (VÉRIFICATION MANUELLE)
    - Point de contrôle manuel : tous les tests passent, et l'utilisateur lance `npm run dev` et confirme marche/saut/gravité/collisions, traversée de l'eau et capture/libération de la souris. Porte de validation manuelle.

- [ ] 5. Génération (relief, biomes, eau, bedrock)
  - **Progrès visible attendu après ce jalon :** le monde plat est remplacé par un terrain procédural avec relief, trois biomes, eau au niveau de la mer et socle incassable ; le joueur apparaît sur une surface solide hors de l'eau. Visible via `npm run dev`.
  - [x] 5.1 Implémenter le bruit seedé dans `src/generation/noise.js`
    - `makeNoise2D(seed)` déterministe renvoyant une valeur continue dans [-1, 1]
    - _Requirements: 1.1, 1.3_
  - [x] 5.2 Implémenter la carte des biomes dans `src/generation/biomes.js`
    - Trois biomes `SAVANE`/`DESERT`/`FORET` en régions contiguës via un second bruit basse fréquence ; transitions sans discontinuité
    - _Requirements: 2.1, 2.5, 2.6_
  - [x] 5.3 Implémenter le relief et la composition de surface dans `src/generation/WorldGenerator.js`
    - `heightAt` (relief non plat partagé) ; `surfaceColumn` par biome (herbe savane + baobabs ; sable ; herbe forêt + végétation dense) ; sous-sol
    - Poser la couche incassable `BEDROCK` en y=0 ; végétation statique (pas de physique)
    - _Requirements: 1.1, 1.3, 1.6, 2.2, 2.3, 2.4, 12.2_
  - [x] 5.4 Implémenter le remplissage d'eau au niveau de la mer dans `WorldGenerator.js`
    - `SEA_LEVEL = 20` ; `fillWater` remplace par `EAU` tout air à y ≤ 20 sous la surface ; eau immobile (aucune propagation)
    - _Requirements: 1.9, 5.4, 12.3_
  - [x] 5.5 Implémenter `spawnPoint` dans `WorldGenerator.js`
    - Point d'apparition sur une surface solide, jamais dans un bloc plein ni dans le vide, et jamais dans l'eau
    - _Requirements: 1.5, 1.10_
  - [ ]* 5.6 Écrire les tests unitaires de la génération
    - Déterminisme à seed fixe ; y=0 = bedrock ; relief non plat ; `spawnPoint` au-dessus d'une surface solide et hors de l'eau
    - _Requirements: 1.1, 1.3, 1.5, 1.6, 1.10_
  - [ ]* 5.7 Écrire les tests unitaires des biomes
    - Trois biomes produits ; régions contiguës ; continuité de hauteur à la frontière (pas de trou ni mur)
    - _Requirements: 2.1, 2.5, 2.6_
  - [ ]* 5.8 Écrire le test de propriété — couche incassable
    - **Property 2 : Couche incassable** — `∀ x,z`, `getBlock(x,0,z) = BEDROCK` et `isCassable(BEDROCK) = faux` (fast-check)
    - **Validates: Requirements 1.6, 6.7**
  - [x] 5.9 Câbler la génération dans `main.js`
    - Instancier `WorldGenerator(seed)`, appeler `generate(world)`, reconstruire les chunks, placer le joueur sur `spawnPoint`
    - _Requirements: 1.1, 1.5, 1.10_
  - [ ] 5.10 Checkpoint — Jalon 5 (VÉRIFICATION MANUELLE)
    - Point de contrôle manuel : tous les tests passent, et l'utilisateur lance `npm run dev` et confirme terrain avec relief, biomes, eau et apparition correcte hors de l'eau. Porte de validation manuelle.

- [ ] 6. Interaction (raycast, casser, poser, surbrillance, réticule)
  - **Progrès visible attendu après ce jalon :** on casse et pose des blocs au clic, le bloc visé est mis en surbrillance et un réticule est affiché au centre. Visible via `npm run dev`.
  - [x] 6.1 Implémenter le raycast voxel (DDA) dans `src/interaction/Interaction.js`
    - `raycast(origine, direction, portée=5)` sur la grille (pas sur les meshes) : premier bloc solide ≤ 5 blocs, ignore l'eau, renvoie coord + normale de face
    - _Requirements: 6.2, 6.5, 10.2_
  - [x]* 6.2 Écrire les tests unitaires du raycast
    - Premier bloc solide ≤ 5 ; eau ignorée ; normale de face correcte ; null si rien à portée
    - _Requirements: 6.2, 6.3, 10.2, 10.3_
  - [x]* 6.3 Écrire le test de propriété — raycast ignore l'eau
    - **Property 6 : Raycast ignore l'eau** — le bloc renvoyé est toujours solide (jamais AIR ni EAU), ou null (fast-check)
    - **Validates: Requirements 6.2, 6.6, 10.2**
  - [ ]* 6.4 Écrire le test de propriété — portée d'interaction
    - **Property 5 : Portée d'interaction** — `∀` casse/pose réussie, la distance du bloc visé est ≤ 5 blocs (fast-check)
    - **Validates: Requirements 6.5, 7.1**
  - [x] 6.5 Implémenter `breakBlock` dans `Interaction.js`
    - Clic gauche : retirer le bloc solide visé ≤ 5 ; interdire eau et bedrock ; rien si hors portée ; aucun inventaire
    - Casser le bois n'affecte pas les feuilles voisines (modification de la seule cellule visée)
    - _Requirements: 6.1, 6.3, 6.5, 6.6, 6.7, 6.8, 12.1_
  - [x] 6.6 Implémenter `placeBlock` dans `Interaction.js`
    - Clic droit : poser le type sélectionné dans l'emplacement adjacent à la face ; pas sur un solide existant ; remplace l'eau ; pas dans l'espace du joueur ; rien si hors portée ; illimité
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.7, 7.8_
  - [x] 6.7 Vérifier la reconstruction ciblée < 100 ms après casser/poser
    - S'assurer que `setBlock` ne reconstruit que le(s) chunk(s) affecté(s) (1 à 3) et que le changement est visible rapidement
    - _Requirements: 6.4, 7.6, 13.4_
  - [ ]* 6.8 Écrire le test de propriété — reconstruction ciblée
    - **Property 10 : Reconstruction ciblée** — une modification de bloc ne reconstruit que 1 à 3 chunks (le chunk affecté plus ses voisins en frontière), sans mesure de temps (fast-check)
    - **Validates: Requirements 6.4, 7.6**
  - [x] 6.9 Implémenter la surbrillance du bloc visé dans `src/rendering/highlight.js` et le réticule
    - `setHighlight(x,y,z|null)` : wireframe sur le bloc visé, retiré si rien à portée ; réticule HTML/overlay au centre de l'écran
    - `Interaction.update()` déplace la surbrillance chaque frame selon le raycast
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  - [x] 6.10 Câbler l'interaction dans `main.js`
    - Instancier `Interaction`, brancher clic gauche/droit, appeler `update()` chaque frame
    - _Requirements: 6.1, 7.1, 10.2_
  - [ ] 6.11 Checkpoint — Jalon 6 (VÉRIFICATION MANUELLE)
    - Point de contrôle manuel : tous les tests passent, et l'utilisateur lance `npm run dev` et confirme casser/poser, surbrillance et réticule. Porte de validation manuelle.

- [ ] 7. Hotbar (barre d'accès rapide)
  - **Progrès visible attendu après ce jalon :** une barre de 9 cases s'affiche en overlay, une seule sélectionnée ; touches 1–9 et molette changent le type posé. Visible via `npm run dev`.
  - [x] 7.1 Implémenter la hotbar dans `src/ui/Hotbar.js`
    - Overlay de 9 cases ; mapping fixe des 9 types placables (bedrock exclue) ; indication visuelle de la case sélectionnée ; `render()`
    - _Requirements: 8.1, 8.2, 8.3_
  - [x] 7.2 Implémenter la sélection (touches 1–9, molette) et `selectedType`
    - `select(index)` sur touches 1–9 ; `scroll(delta)` molette avec bouclage circulaire ; une seule case sélectionnée ; `selectedType` exposé
    - _Requirements: 8.4, 8.5, 8.6, 8.7_
  - [ ]* 7.3 Écrire les tests unitaires de la hotbar
    - Mapping des 9 types ; touches 1–9 ; molette avec bouclage (dernière→première et inverse) ; sélection unique
    - _Requirements: 8.2, 8.4, 8.5, 8.7_
  - [ ]* 7.4 Écrire le test de propriété — mapping de la hotbar
    - **Property 7 : Mapping de la hotbar** — les 9 cases contiennent exactement les 9 types placables, chacun une seule fois ; bedrock jamais présente (fast-check)
    - **Validates: Requirements 8.2**
  - [ ]* 7.5 Écrire le test de propriété — sélection unique
    - **Property 8 : Sélection unique** — `∀` instant, une et une seule case est sélectionnée après toute séquence de sélections (fast-check)
    - **Validates: Requirements 8.7**
  - [x] 7.6 Câbler la hotbar dans `main.js` et la relier à `placeBlock`
    - Instancier `Hotbar`, brancher touches/molette, faire consommer `selectedType` par `Interaction.placeBlock`
    - _Requirements: 8.6_
  - [ ] 7.7 Checkpoint — Jalon 7 (VÉRIFICATION MANUELLE)
    - Point de contrôle manuel : tous les tests passent, et l'utilisateur lance `npm run dev` et confirme affichage/sélection de la hotbar et pose du bon type. Porte de validation manuelle.

- [ ] 8. Cycle jour/nuit
  - **Progrès visible attendu après ce jalon :** l'éclairage et la couleur du ciel évoluent continûment entre jour et nuit, en boucle, sans jamais devenir illisible. Visible via `npm run dev`.
  - [x] 8.1 Implémenter `src/environment/DayNightCycle.js`
    - `update(dt)` : temps modulo `cycleSeconds = 600` (10 min) ; interpolation continue de l'intensité ambiante, de la lumière directionnelle et de la couleur du ciel ; bouclage continu
    - Plancher d'intensité nocturne pour garder les blocs proches distinguables
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  - [ ]* 8.2 Écrire les tests unitaires du cycle jour/nuit
    - Période de 600 s ; bouclage ; plancher d'intensité respecté
    - _Requirements: 9.3, 9.4, 9.5_
  - [ ]* 8.3 Écrire le test de propriété — boucle du cycle jour/nuit
    - **Property 11 : Boucle du cycle jour/nuit** — `phase` continue et périodique (période 10 min) et `intensity ≥ plancher nocturne` à tout instant (fast-check)
    - **Validates: Requirements 9.3, 9.4, 9.5**
  - [x] 8.4 Câbler le cycle jour/nuit dans `main.js`
    - Créer lumière ambiante + directionnelle, instancier `DayNightCycle`, appeler `update(dt)` chaque frame
    - _Requirements: 9.1, 9.2_
  - [ ] 8.5 Checkpoint — Jalon 8 (VÉRIFICATION MANUELLE)
    - Point de contrôle manuel : tous les tests passent, et l'utilisateur lance `npm run dev` et confirme le cycle jour/nuit continu et lisible. Porte de validation manuelle.

- [ ] 9. Mesures de performance
  - **Progrès visible attendu après ce jalon :** un compteur d'images (FPS) et une mesure du temps de reconstruction sont visibles en overlay, confirmant les cibles de performance. Visible via `npm run dev`.
  - [x] 9.1 Implémenter un compteur d'images (FPS) en overlay dans `main.js`
    - Afficher les ips courantes pour viser 60 et ne jamais descendre sous 30 sur GPU intégré
    - _Requirements: 13.2, 13.3_
  - [x] 9.2 Instrumenter et afficher le temps de reconstruction après casser/poser
    - Mesurer le temps de `rebuildDirtyChunks` et vérifier qu'il reste < 100 ms ; afficher la mesure en overlay
    - _Requirements: 13.4, 6.4, 7.6_
  - [ ]* 9.3 Écrire les tests unitaires des mesures de performance
    - Vérifier le calcul des ips et la mesure du temps de reconstruction (seuil < 100 ms)
    - _Requirements: 13.2, 13.3, 13.4_
  - [ ] 9.4 Checkpoint — Jalon 9 (VÉRIFICATION MANUELLE)
    - Point de contrôle manuel : tous les tests passent, et l'utilisateur lance `npm run dev` dans Chrome et Firefox récents et confirme la fluidité (viser 60, jamais < 30) et la reconstruction < 100 ms. Porte de validation manuelle finale.

## Notes

- Les sous-tâches marquées d'un `*` sont optionnelles (tests unitaires, propriétés, intégration) et peuvent être ignorées pour un MVP rapide.
- Chaque tâche de codage référence les critères d'exigence précis qu'elle implémente, et chaque test de propriété référence à la fois l'exigence et le numéro de Property de la conception.
- Après chaque jalon principal (1 à 9), le jeu doit se lancer avec `npm run dev` et montrer un progrès visible ; chaque jalon se termine par un point de contrôle de vérification manuelle.
- Les tests basés sur les propriétés utilisent `fast-check` (conformément à la stratégie de test de la conception).
- Couverture des exigences : Exigences 1 à 13 (y compris 1.9, 1.10, 4.7, 4.8) sont couvertes par au moins une tâche de codage. L'Exigence 12 (absence de physique des blocs) est satisfaite par conception et vérifiée via 5.3 (végétation statique, 12.2), 5.4 (eau immobile, 12.3) et 6.5 (casser le bois n'affecte pas les feuilles, 12.1).

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1", "2.3"] },
    { "id": 2, "tasks": ["1.3", "1.4", "2.2", "2.4", "3.1"] },
    { "id": 3, "tasks": ["2.5", "2.6", "2.7", "2.8", "3.2"] },
    { "id": 4, "tasks": ["3.3", "3.4", "3.5", "3.6", "4.1", "5.1"] },
    { "id": 5, "tasks": ["4.2", "4.3", "4.8", "4.9", "5.2"] },
    { "id": 6, "tasks": ["4.4", "4.5", "4.6", "4.7", "4.10", "4.11", "5.3"] },
    { "id": 7, "tasks": ["4.12", "5.4", "5.5"] },
    { "id": 8, "tasks": ["5.6", "5.7", "5.8", "5.9", "6.1"] },
    { "id": 9, "tasks": ["6.2", "6.3", "6.4", "6.5"] },
    { "id": 10, "tasks": ["6.6", "6.7", "6.9", "7.1"] },
    { "id": 11, "tasks": ["6.8", "6.10", "7.2"] },
    { "id": 12, "tasks": ["7.3", "7.4", "7.5", "7.6", "8.1"] },
    { "id": 13, "tasks": ["8.2", "8.3", "8.4"] },
    { "id": 14, "tasks": ["9.1"] },
    { "id": 15, "tasks": ["9.2"] },
    { "id": 16, "tasks": ["9.3"] }
  ]
}
```
