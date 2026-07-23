// Level layout, editable as ASCII art. One character = one 16px tile.
//
//   .  grass
//   #  dirt path
//   T  big tree      (blocks movement)
//   P  pine tree     (blocks movement)
//   R  rock          (blocks movement)
//   A  shop building A (blocks movement)
//   B  shop building B (blocks movement)
//   1..9  document spawn points (see DOCUMENTS below)
//   @  player start
//
// Trees/rocks/buildings occupy the tile they're placed on (art overflows freely).

export const MAP = [
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  'T......................................T',
  'T..T....P......T...........P.......T...T',
  'T.......................R..............T',
  'T....A.......A.......B........B........T',
  'T....#.......#.......#........#........T',
  'T....#.......#.......#........#........T',
  'T....############################......T',
  'T........#..............#.....R........T',
  'T..R.....#....1.........#..............T',
  'T........#..............#.........P....T',
  'T..T.....#......@.......#..............T',
  'T........#..............#....2.........T',
  'T....P...#..............#..............T',
  'T........############...#........T.....T',
  'T...................#...#..............T',
  'T......3............#...#....R.........T',
  'T...................#...#..............T',
  'T..T....B...........#...#......A.......T',
  'T.......#...........#...#......#.......T',
  'T.......#############...########.......T',
  'T......................................T',
  'T...P........R..........P..........T...T',
  'T......................................T',
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
];

// The documents to collect in this level, keyed by their map digit.
export const DOCUMENTS = {
  1: { id: 'passport', name: 'Reisepass', icon: '🛂' },
  2: { id: 'anmeldung', name: 'Anmeldung', icon: '📄' },
  3: { id: 'contract', name: 'Mietvertrag', icon: '📑' },
};

export const BACKPACK_SLOTS = 5;
