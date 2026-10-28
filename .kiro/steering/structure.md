# Structure du projet — AfroCraft

## Arborescence

```
index.html                 # page hôte, canvas de rendu
vite.config.js             # configuration Vite
package.json               # scripts dev/build/test, dépendances
src/
  main.js                  # point d'entrée : boucle de jeu, câblage des modules
  world/
    World.js               # grille de blocs (8×8 chunks), getBlock/setBlock, limites
    Chunk.js               # données d'un chunk 16×16×64 + état "dirty"
    blocks.js              # 9 types + AIR + BEDROCK, métadonnées, isSolide/isOpaque/isCassable
  generation/
    WorldGenerator.js      # relief, biomes, remplissage d'eau (SEA_LEVEL=20), bedrock, spawnPoint
    noise.js               # bruit seedé déterministe
    biomes.js              # carte des biomes (savane/désert/forêt), régions contiguës
  rendering/
    ChunkRenderer.js       # meshing face-culling, un mesh par chunk, reconstruction ciblée
    materials.js           # matériaux Three.js par type de bloc
    highlight.js           # surbrillance (wireframe) du bloc visé
  player/
    Player.js              # caméra FPS, entrées, gravité, saut, nage
    Physics.js             # résolution de collision AABB vs grille
  interaction/
    Interaction.js         # raycast DDA sur la grille, casser/poser, portée 5 blocs
    PointerLock.js         # capture de la souris (pointer lock)
  ui/
    Hotbar.js              # 9 cases, sélection (touches 1-9, molette), type sélectionné
  environment/
    DayNightCycle.js       # cycle de 10 min, lumière ambiante + couleur du ciel
```

## Rôle de chaque module

- **world/** : source de vérité des données du monde. `World` masque la découpe en chunks derrière un accès par coordonnées monde ; `Chunk` stocke les blocs en `Uint8Array` et porte le drapeau `dirty` ; `blocks` définit les types et leurs propriétés.
- **generation/** : remplit la grille au démarrage. Terrain par bruit seedé, biomes contigus avec transitions lisses, eau jusqu'au niveau de la mer (y=20), socle incassable en y=0, point d'apparition valide hors de l'eau.
- **rendering/** : transforme les données en géométrie Three.js. Un seul mesh par chunk, seules les faces visibles sont émises (aucune face entre deux blocs pleins opaques ; faces d'eau uniquement vers l'air) ; seul le chunk modifié est reconstruit.
- **player/** : caméra première personne, intégration du mouvement, gravité/saut/nage, et collisions AABB contre la grille (déplacement axe par axe).
- **interaction/** : visée par raycast DDA sur la grille de blocs (pas sur les meshes), casser/poser dans une portée de 5 blocs, et capture de la souris.
- **ui/** : hotbar en overlay, sélection du type de bloc à poser.
- **environment/** : cycle jour/nuit continu pilotant lumières et couleur du ciel.

## Flux

`main.js` orchestre tout : il crée le monde, lance la génération, construit les meshes, instancie joueur/interaction/hotbar/cycle, puis exécute la boucle `requestAnimationFrame` (entrées → joueur/physique → interaction/raycast → cycle jour/nuit → rendu).