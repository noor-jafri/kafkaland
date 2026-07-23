// Level 1 layout, editable as ASCII art. One character = one 16px tile.
//
//   .  grass
//   #  dirt path (cosmetic, walkable)
//   T  big tree      (blocks; also PUNCHABLE for venting)
//   P  pine tree     (blocks; also punchable)
//   R  rock          (blocks)
//   @  player start (train platform, far left)
//   1  passport pickup      2  SIM pickup
//   H  Hostel building     (NPC: flavor / respawn)
//   M  Apartment building  (NPC: grants Mietvertrag + Wohnungsgeberbestätigung)
//   G  Bürgeramt building  (NPC: delivery point / level goal)
//   s  Slime spawn         (hazard: bureaucratic friction)
//
// Buildings render 3x scale and block a small footprint; the player interacts
// by standing near them (radius-based), so exact tiles around them stay clear.

export const MAP = [
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  'T......................................T',
  'T...H..................................T',
  'T............P.....................R...T',
  'T..1.......................T...........T',
  'T.@.......#############################T',
  'T..2......#............................T',
  'T.........#................M...........T',
  'T.........#................#...........T',
  'T....T....#....s...........#.......G...T',
  'T.........#................#.......#...T',
  'T.........#................#.......#...T',
  'T.........#########s########.......#...T',
  'T.................................##...T',
  'T......P............R..................T',
  'T..R...........T............P..........T',
  'T......................................T',
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
];

// Pickable documents on the map, keyed by their map digit.
export const DOCUMENTS = {
  1: { id: 'passport', name: 'Reisepass', icon: '🛂', fact: 'passport' },
  2: { id: 'sim', name: 'Prepaid-SIM', icon: '📶', fact: 'sim', optional: true },
};

// Building roles, keyed by their map letter.
export const BUILDINGS = {
  H: { id: 'hostel', dialogue: 'hostel' },
  M: { id: 'apartment', dialogue: 'apartment' },
  G: { id: 'buergeramt', goal: true },
};

export const BACKPACK_SLOTS = 5;

// Documents required (delivered at the Bürgeramt) to clear Level 1.
export const REQUIRED_FOR_ANMELDUNG = ['passport', 'mietvertrag', 'wohnungsgeberbestaetigung'];
