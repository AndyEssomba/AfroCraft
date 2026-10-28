# Technologie — AfroCraft

## Pile technique

- **Langage** : JavaScript en modules ES (import/export natifs).
- **Rendu 3D** : Three.js (scène, caméra, meshes, lumières, pointer lock).
- **Outil de dev/build** : Vite (serveur de dev à modules ES, build de production optimisé).
- **Tests** : Vitest comme lanceur de tests, fast-check pour les tests basés sur les propriétés (property-based testing).
- **Backend** : aucun. Tout s'exécute côté client dans le navigateur. Pas de serveur, pas de persistance, pas de réseau.

## Compatibilité

Cible : versions récentes de Chrome et Firefox, avec WebGL. Objectif de performance : viser 60 ips et ne jamais descendre sous 30 ips sur un ordinateur portable à carte graphique intégrée.

## Commandes

- `npm run dev` — lance le serveur de développement Vite. Après chaque tâche principale, le jeu doit se lancer et montrer un progrès visible.
- `npm test` — exécute la suite de tests avec Vitest (`vitest --run`, exécution unique sans mode watch).
- `npm run build` — produit le build de production.

## Conventions

- Modules ES uniquement ; une responsabilité par module, API publique claire.
- Les tests basés sur les propriétés (fast-check) sont écrits avec Vitest et correspondent aux Correctness Properties de la conception.
- Pas de dépendance backend ni d'appel réseau sortant.