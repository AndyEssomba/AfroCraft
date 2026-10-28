// Types de blocs et métadonnées — AfroCraft.

export const BLOCK = Object.freeze({
  AIR: 0,
  TERRE_ROUGE: 1,
  HERBE_SAVANE: 2,
  HERBE_FORET: 3,
  SABLE: 4,
  PIERRE: 5,
  BOIS_BAOBAB: 6,
  FEUILLES: 7,
  EAU: 8,
  ARGILE: 9,
  BEDROCK: 10,
  BANCO: 11,
  CHAUME: 12,
  BAMBOU: 13,
  RAPHIA: 14,
  PIERRE_LATERITIQUE: 15,
  BOIS_SOMBRE: 16,
  BOGOLAN: 17,
  NDOP: 18,
  SABLE_DORE: 19,
  TUILE_ARGILE_CUITE: 20,
});

export const BLOCK_DATA = Object.freeze({
  [BLOCK.TERRE_ROUGE]: { nom: 'Terre rouge', solide: true, opaque: true, couleur: 0x9c3b1b, placable: true },
  [BLOCK.HERBE_SAVANE]: { nom: 'Herbe de savane', solide: true, opaque: true, couleur: 0x9bbd4e, placable: true },
  [BLOCK.HERBE_FORET]: { nom: 'Herbe de forêt', solide: true, opaque: true, couleur: 0x2f7d32, placable: true },
  [BLOCK.SABLE]: { nom: 'Sable', solide: true, opaque: true, couleur: 0xe4d6a7, placable: true },
  [BLOCK.PIERRE]: { nom: 'Pierre', solide: true, opaque: true, couleur: 0x7d7d7d, placable: true },
  [BLOCK.BOIS_BAOBAB]: { nom: 'Bois de baobab', solide: true, opaque: true, couleur: 0x6b4a2b, placable: true },
  [BLOCK.FEUILLES]: { nom: 'Feuilles', solide: true, opaque: true, couleur: 0x4e8a3a, placable: true },
  [BLOCK.EAU]: { nom: 'Eau', solide: false, opaque: false, couleur: 0x2a6fdb, placable: true, transparence: 0.6 },
  [BLOCK.ARGILE]: { nom: 'Argile', solide: true, opaque: true, couleur: 0xb08968, placable: true },
  [BLOCK.BEDROCK]: { nom: 'Socle incassable', solide: true, opaque: true, couleur: 0x1e1e24, placable: false, cassable: false },
  [BLOCK.BANCO]: { nom: 'Banco', solide: true, opaque: true, couleur: 0xc58a48, placable: true },
  [BLOCK.CHAUME]: { nom: 'Chaume', solide: true, opaque: true, couleur: 0xd6ad45, placable: true },
  [BLOCK.BAMBOU]: { nom: 'Bambou', solide: true, opaque: true, couleur: 0x4f8a3f, placable: true },
  [BLOCK.RAPHIA]: { nom: 'Raphia', solide: true, opaque: true, couleur: 0xc8aa75, placable: true },
  [BLOCK.PIERRE_LATERITIQUE]: { nom: 'Pierre latéritique', solide: true, opaque: true, couleur: 0x762f26, placable: true },
  [BLOCK.BOIS_SOMBRE]: { nom: 'Bois sombre', solide: true, opaque: true, couleur: 0x3b2519, placable: true },
  [BLOCK.BOGOLAN]: { nom: 'Bogolan', solide: true, opaque: true, couleur: 0x65402b, placable: true },
  [BLOCK.NDOP]: { nom: 'Ndop', solide: true, opaque: true, couleur: 0x263a83, placable: true },
  [BLOCK.SABLE_DORE]: { nom: 'Sable doré', solide: true, opaque: true, couleur: 0xd7aa45, placable: true },
  [BLOCK.TUILE_ARGILE_CUITE]: { nom: "Tuile d'argile cuite", solide: true, opaque: true, couleur: 0xb65332, placable: true },
});

// Affectation initiale des neuf cases ; le sélecteur peut ensuite les remplacer.
export const PLACABLES = Object.freeze([
  BLOCK.TERRE_ROUGE,
  BLOCK.HERBE_SAVANE,
  BLOCK.HERBE_FORET,
  BLOCK.SABLE,
  BLOCK.PIERRE,
  BLOCK.BOIS_BAOBAB,
  BLOCK.FEUILLES,
  BLOCK.EAU,
  BLOCK.ARGILE,
]);

export const BLOCK_CATEGORIES = Object.freeze([
  Object.freeze({
    nom: 'Terrain',
    types: Object.freeze([
      BLOCK.TERRE_ROUGE,
      BLOCK.HERBE_SAVANE,
      BLOCK.HERBE_FORET,
      BLOCK.SABLE,
      BLOCK.SABLE_DORE,
      BLOCK.PIERRE,
      BLOCK.PIERRE_LATERITIQUE,
      BLOCK.ARGILE,
      BLOCK.EAU,
    ]),
  }),
  Object.freeze({
    nom: 'Végétal',
    types: Object.freeze([
      BLOCK.BOIS_BAOBAB,
      BLOCK.BOIS_SOMBRE,
      BLOCK.FEUILLES,
      BLOCK.BAMBOU,
      BLOCK.RAPHIA,
    ]),
  }),
  Object.freeze({
    nom: 'Construction',
    types: Object.freeze([
      BLOCK.BANCO,
      BLOCK.CHAUME,
      BLOCK.TUILE_ARGILE_CUITE,
    ]),
  }),
  Object.freeze({
    nom: 'Décoration',
    types: Object.freeze([
      BLOCK.BOGOLAN,
      BLOCK.NDOP,
    ]),
  }),
]);

export const ALL_PLACEABLES = Object.freeze(
  BLOCK_CATEGORIES.flatMap((category) => category.types),
);

export const isSolide = (type) => BLOCK_DATA[type]?.solide === true;
export const isOpaque = (type) => BLOCK_DATA[type]?.opaque === true;
export const isCassable = (type) =>
  type !== BLOCK.AIR && type !== BLOCK.EAU && type !== BLOCK.BEDROCK;
