// The TBS campus, measured off the official 2025 campus map (un-skewed to a top-down view)
// plus the floor plans. 1 unit ≈ 1.6 m.
// x = Beranger (west) → Havre (east), z = Arias (north) → Máximo Tajes (south, the main road).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const BOUNDS = { x0: -140, z0: -85, x1: 140, z1: 85 };
export const BELL = { x: 98, z: 12 };

export const FIELDS = [
  { key: 'r2', kind: 'rugby', x0: -121, z0: -72, x1: -78, z1: -24 },
  { key: 'f1', kind: 'football', x0: -124, z0: -4, x1: -80, z1: 52 },
  { key: 'r1', kind: 'rugby', x0: -54, z0: -66, x1: -10, z1: 0, track: true },
  { key: 'multi', kind: 'hockeyGrass', x0: -65, z0: 17, x1: -4, z1: 55 },
  { key: 'h1', kind: 'hockey', x0: 30, z0: -76, x1: 94, z1: -26 },
  { key: 'f2', kind: 'football', x0: 22, z0: -24, x1: 90, z1: 25 },
  { key: 'tennis', kind: 'tennis', x0: -62, z0: 60, x1: -42, z1: 78 },
  { key: 'padel', kind: 'padel', x0: -74, z0: 62, x1: -66, z1: 76 },
];

// the small pool beside the Pavilion
export const POOL = {
  deck: { x0: 16.5, z0: 36, x1: 24.5, z1: 48 },
  water: [{ x0: 19, z0: 38, x1: 23, z1: 46 }],
};

// Corridor block: a straight corridor with a row of rooms on each side, each room with a door onto it.
// axis 'z': the corridor runs north–south between x = c0..c1 (side A west, side B east); 'x': runs east–west
// between z = c0..c1 (side A north, side B south). Rooms are [key, from, to, {open: n doors}].
function corridorBlock(b, { axis, c0, c1, corridor, a = [], b: bSide = [], from, to }) {
  const X = axis === 'z';
  const s0 = from ?? (X ? b.z0 : b.x0), s1 = to ?? (X ? b.z1 : b.x1);
  const lo = X ? b.x0 : b.z0, hi = X ? b.x1 : b.z1;
  const rect = (p0, p1, q0, q1) => X ? { x0: q0, z0: p0, x1: q1, z1: p1 } : { x0: p0, z0: q0, x1: p1, z1: q1 };
  const wallAt = (q, p0, p1, doors) => X ? [q, p0, q, p1, doors] : [p0, q, p1, q, doors];
  const cross = (p, q0, q1, doors) => X ? [q0, p, q1, p, doors] : [p, q0, p, q1, doors];
  b.rooms = [...(b.rooms || []), { key: corridor, ...rect(s0, s1, c0, c1), floor: '#c9b48f' }];
  b.inner = b.inner || [];
  for (const [side, q0, q1, cw] of [[a, lo, c0, c0], [bSide, c1, hi, c1]]) {
    const doors = [];
    side.forEach(([key, p0, p1, o = {}], i) => {
      b.rooms.push({ key, ...rect(p0, p1, q0, q1), ...o });
      const n = o.open || 1;
      for (let k = 0; k < n; k++) doors.push(p0 + (p1 - p0) * (k + 0.5) / n);
      if (i > 0) b.inner.push(cross(p0, q0, q1));
    });
    b.inner.push(wallAt(cw, s0, s1, doors));
  }
  return b;
}

// Buildings: exterior rect, doors {side, at}, interior walls [xa,za,xb,zb,[doorAts]], rooms.
// Ground floors follow the 2025 floor plans (S1, J1, EYC1, P1, SH1, G1).
export const BUILDINGS = [
  corridorBlock({  // Senior School, ground floor (plan S1): classrooms along the Havre side, staff room, labs & library on the field side
    key: 'senior', x0: 112, z0: -55, x1: 132, z1: 22, h: 6.8, levels: 2,
    doors: [{ side: 'n', at: 122.5 }, { side: 's', at: 122.5 }, { side: 'w', at: -14 }, { side: 'w', at: -23 }, { side: 'e', at: -9.5 }],
    sign: { side: 'w', at: -14 },
  }, {
    axis: 'z', c0: 121, c1: 124, corridor: 'corridor',
    a: [['library', -55, -43], ['wc', -43, -40], ['computer', -40, -35], ['lab', -35, -29.5], ['atrium', -29.5, -17, { open: 2, floor: '#9cc27a' }],
      ['sfoyer', -17, -11], ['office', -11, -6, { floor: '#7b2d3a' }], ['wc', -6, -3], ['S1 09', -3, 0], ['staff', 0, 6.3],
      ['S1 05', 6.3, 10.6], ['S1 03', 10.6, 15], ['S1 01', 15, 22]],
    b: [['S1 25', -55, -49.8], ['S1 24', -49.8, -44.5], ['S1 23', -44.5, -39.3], ['S1 22', -39.3, -34], ['S1 21', -34, -28.8],
      ['S1 20', -28.8, -23.5], ['S1 19', -23.5, -18.3], ['class1', -18.3, -13], ['sentrance', -13, -6, { open: 2 }],
      ['S1 11', -6, 1.5], ['S1 10', 1.5, 5.5], ['S1 08', 5.5, 9.5], ['S1 06', 9.5, 13.5], ['S1 04', 13.5, 17.5], ['S1 02', 17.5, 22]],
  }),
  {
    key: 'auditorium', x0: 112, z0: -72, x1: 132, z1: -58, h: 5.5, wall: '#f4f1ea',
    doors: [{ side: 's', at: 122 }, { side: 'w', at: -65 }],
    rooms: [{ key: 'auditorium', x0: 112, z0: -72, x1: 132, z1: -58, floor: '#8a5a3c' }],
    sign: { side: 'w', at: -65 },
  },
  {  // EYC (plan EYC1, Kinder floor): classrooms at both ends of a central hall behind the curved glass, 3 levels
    key: 'early', x0: 27, z0: 31, x1: 41, z1: 55, h: 9.6, levels: 3, wall: '#fbeee0', curved: 'w',
    doors: [{ side: 'n', at: 30 }, { side: 'e', at: 40.5 }, { side: 'e', at: 46 }, { side: 's', at: 30 }],
    inner: [
      [27, 38, 41, 38, [30, 35.5, 39.5]], [33, 31, 33, 38], [38, 31, 38, 38], [38, 34.5, 41, 34.5, [39.5]],
      [27, 48, 41, 48, [30, 35.75, 39.75]], [33, 48, 33, 55], [38.5, 48, 38.5, 55],
    ],
    rooms: [
      { key: 'EYC1 04', x0: 27, z0: 31, x1: 33, z1: 38, floor: '#f6c9a9' }, { key: 'EYC1 03', x0: 33, z0: 31, x1: 38, z1: 38, floor: '#f7d9a0' },
      { key: 'wc', x0: 38, z0: 31, x1: 41, z1: 34.5, floor: '#dfe6e9' }, { key: 'EYC1 01', x0: 38, z0: 34.5, x1: 41, z1: 38, floor: '#e8d9c4' },
      { key: 'early', x0: 27, z0: 38, x1: 41, z1: 48, floor: '#f6c9a9' },
      { key: 'EYC1 05', x0: 27, z0: 48, x1: 33, z1: 55, floor: '#cfe6f2' }, { key: 'EYC1 06', x0: 33, z0: 48, x1: 38.5, z1: 55, floor: '#f7d9a0' },
      { key: 'EYC1 07', x0: 38.5, z0: 48, x1: 41, z1: 55, floor: '#e8d9c4' },
    ],
    sign: { side: 'n', at: 35.5 },
  },
  corridorBlock({  // Junior School north wing (plan J1, rooms J1 20–32) — joins the EYC and the east block
    key: 'junior2', x0: 41, z0: 30, x1: 65.7, z1: 43, h: 6.8, levels: 2,
    doors: [{ side: 'w', at: 40.5 }, { side: 'n', at: 44.4 }, { side: 'n', at: 60.6 }, { side: 'e', at: 37 }, { side: 's', at: 49.7 }],
    sign: { side: 'n', at: 52 },
  }, {
    axis: 'x', c0: 36, c1: 38, corridor: 'jcorridor',
    a: [['hall', 41, 47.9, { floor: '#c49a6c' }], ['music', 47.9, 51.5, { floor: '#b9a2c9' }], ['J1 25', 51.5, 55.3], ['J1 27', 55.3, 58.7], ['J1 29', 58.7, 62.5], ['wc', 62.5, 65.7]],
    b: [['J1 20', 41, 45.8], ['dining', 45.8, 53.6, { floor: '#e0d5c0' }], ['J1 26', 53.6, 56.9], ['J1 28', 56.9, 60.8], ['J1 30', 60.8, 63.4], ['firstaid', 63.4, 65.7]],
  }),
  corridorBlock({  // Junior School east block (plan J1, offices J1 11–19): reception, offices — the glass walkway leaves from here
    key: 'junior3', x0: 66, z0: 30, x1: 104, z1: 48, h: 6.8, levels: 2,
    doors: [{ side: 'w', at: 37 }, { side: 'w', at: 45 }, { side: 'e', at: 37 }, { side: 'n', at: 71 }, { side: 's', at: 69 }],
    sign: { side: 'n', at: 85 },
  }, {
    axis: 'x', c0: 36, c1: 38, corridor: 'jcorridor',
    a: [['jreception', 66, 76], ['J1 12', 76, 82], ['J1 13', 82, 90], ['J1 14', 90, 96], ['J1 19', 96, 104]],
    b: [['jwaiting', 66, 72], ['art', 72, 82, { floor: '#e8d9c4' }], ['J1 15', 82, 88], ['J1 16', 88, 94], ['J1 17', 94, 99], ['J1 18', 99, 104]],
  }),
  corridorBlock({  // Junior School main wing (plan J1, J1 01–10): staff room at the west end, classrooms both sides
    key: 'junior', x0: 34, z0: 56, x1: 76, z1: 71, h: 6.8, levels: 2,
    doors: [{ side: 'w', at: 63.75 }, { side: 'e', at: 63.75 }, { side: 'n', at: 45 }, { side: 's', at: 73 }],
    inner: [[41.7, 56, 41.7, 71, [63.75]]],
    rooms: [{ key: 'jstaff', x0: 34, z0: 56, x1: 41.7, z1: 71, floor: '#a8b5a0' }],
    sign: { side: 'n', at: 56 },
  }, {
    axis: 'x', c0: 62.5, c1: 65, corridor: 'jcorridor', from: 41.7,
    a: [['J1 03', 41.7, 48.6], ['J1 05', 48.6, 53.6], ['J1 07', 53.6, 59], ['wc', 59, 67.5], ['jstore', 67.5, 76]],
    b: [['classJ1', 41.7, 48.6], ['classJ2', 48.6, 53.6], ['class2', 53.6, 59], ['class3', 59, 64], ['J1 09', 64, 66.6], ['J1 10', 66.6, 70.2], ['jentrance', 70.2, 76]],
  }),
  {  // Pavilion (plan P1): changing rooms & toilets, the hall, and the tea room annex
    key: 'pavilion', x0: 6, z0: 31, x1: 14, z1: 48, h: 3.4, wall: '#e9e4da',
    doors: [{ side: 'n', at: 10 }, { side: 'e', at: 39 }, { side: 'w', at: 45 }],
    inner: [[6, 35.5, 14, 35.5, [10]], [6, 42, 14, 42, [10]]],
    rooms: [
      { key: 'changing', x0: 6, z0: 31, x1: 14, z1: 35.5, floor: '#cfd8dc' },
      { key: 'pavilion', x0: 6, z0: 35.5, x1: 14, z1: 42, floor: '#b48a62' },
      { key: 'tearoom', x0: 6, z0: 42, x1: 14, z1: 48, floor: '#c49a6c' },
    ],
    sign: { side: 'n', at: 10 },
  },
  {  // Sports House (plan SH1): open fitness hall + studio, changing rooms and office at the back
    key: 'sportshouse', x0: 6, z0: 57, x1: 28, z1: 70, h: 6.8, levels: 2, wall: '#efe6d6',
    doors: [{ side: 'n', at: 12 }, { side: 'e', at: 61 }, { side: 's', at: 23 }],
    inner: [[20, 57, 20, 64.5, [61]], [6, 64.5, 28, 64.5, [10, 16, 23]], [14, 64.5, 14, 70], [18, 64.5, 18, 70]],
    rooms: [
      { key: 'fitness', x0: 6, z0: 57, x1: 20, z1: 64.5, floor: '#9aa7b0' }, { key: 'studio', x0: 20, z0: 57, x1: 28, z1: 64.5, floor: '#c49a6c' },
      { key: 'changing', x0: 6, z0: 64.5, x1: 14, z1: 70, floor: '#cfd8dc' }, { key: 'wc', x0: 14, z0: 64.5, x1: 18, z1: 70, floor: '#dfe6e9' },
      { key: 'sportsoffice', x0: 18, z0: 64.5, x1: 28, z1: 70, floor: '#c4d3e0' },
    ],
    sign: { side: 'n', at: 12 },
  },
  {  // Gymnasium (plan G1): foyer on the west, the big hall (three courts, halls A & B), changing rooms on the east
    key: 'gym', x0: -30, z0: 58, x1: -2, z1: 77, h: 7, wall: '#f1efe9',
    doors: [{ side: 'n', at: -28.2 }, { side: 'w', at: 67.5 }, { side: 'n', at: -21 }, { side: 'n', at: -10 }, { side: 'e', at: 62.5 }],
    inner: [[-26.3, 58, -26.3, 77, [62, 72]], [-15.9, 58, -15.9, 77, [61, 67.5, 74]], [-5.5, 58, -5.5, 77, [62.5, 72]], [-5.5, 67.5, -2, 67.5]],
    rooms: [
      { key: 'gymlobby', x0: -30, z0: 58, x1: -26.3, z1: 77, floor: '#c9b48f' },
      { key: 'gymA', x0: -26.3, z0: 58, x1: -15.9, z1: 77, floor: '#d7a35f' },
      { key: 'gymB', x0: -15.9, z0: 58, x1: -5.5, z1: 77, floor: '#cf9a55' },
      { key: 'changing', x0: -5.5, z0: 58, x1: -2, z1: 67.5, floor: '#cfd8dc' }, { key: 'wc', x0: -5.5, z0: 67.5, x1: -2, z1: 77, floor: '#dfe6e9' },
    ],
    sign: { side: 'n', at: -16 },
  },
  {
    key: 'club', x0: -95, z0: 55, x1: -77, z1: 67, h: 3.4, wall: '#efe6d6',
    doors: [{ side: 'n', at: -88 }, { side: 'e', at: 63.5 }],
    inner: [[-81, 55, -81, 67, [57.5, 63.5]], [-81, 60, -77, 60]],
    rooms: [
      { key: 'club', x0: -95, z0: 55, x1: -81, z1: 67, floor: '#b48a62' },
      { key: 'wc', x0: -81, z0: 55, x1: -77, z1: 60, floor: '#dfe6e9' }, { key: 'clubkitchen', x0: -81, z0: 60, x1: -77, z1: 67, floor: '#e0d5c0' },
    ],
    sign: { side: 'n', at: -88 },
  },
  {  // the building on the Beranger / Máximo Tajes corner
    key: 'store', x0: -128, z0: 56, x1: -116, z1: 77, h: 3.4, wall: '#e9e4da',
    doors: [{ side: 'e', at: 66 }, { side: 'n', at: -122 }],
    rooms: [{ key: 'store', x0: -128, z0: 56, x1: -116, z1: 77, floor: '#9e9a92' }],
    sign: { side: 'e', at: 66 },
  },
];

export const ROOMS = BUILDINGS.flatMap(b => b.rooms);
export const COURTYARD = { x0: 41, z0: 43, x1: 66, z1: 56 };
const bRect = k => { const b = BUILDINGS.find(o => o.key === k); return { x0: b.x0, z0: b.z0, x1: b.x1, z1: b.z1 }; };
// Outdoor "areas" for orders / the map
export const AREAS = [
  ...FIELDS.map(f => ({ key: f.key, x0: f.x0, z0: f.z0, x1: f.x1, z1: f.z1 })),
  { key: 'pool', ...POOL.deck },
  { key: 'gym', ...bRect('gym') },
  { key: 'courtyard', ...COURTYARD },
  ...ROOMS,
];

const inR = (x, z, r) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;
export function roomAt(x, z) {
  for (const r of ROOMS) if (inR(x, z, r)) return r.key;
  if (inR(x, z, POOL.deck)) return 'pool';
  for (const f of FIELDS) if (inR(x, z, f)) return f.key;
  if (inR(x, z, COURTYARD)) return 'courtyard';
  return 'outside';
}

// Paved paths (also kept clear of trees) and car parks, as on the campus map
export const PATHS = [
  [-138, 78, 138, 82], [-138, -82, 138, -78], [-138, -82, -134, 82], [134, -82, 138, 82],   // round the edge
  [0, -82, 4, 58],           // the long path from the Arias gate to the Gymnasium
  [4, 26, 110, 29],          // under Football 2, to the Junior and Senior Schools
  [104, -78, 110, 29],       // beside the Senior School
  [-76, 56, 0, 59],          // in front of the courts and the Club
  [4, 50, 40, 53], [20, 70, 26, 85],   // past the Pavilion; Casales gate
  [76, 48, 80, 56], [110, -60, 134, -56],
];
export const PARKING = [[78, 64, 100, 76], [-114, 69, -77, 77], [-30, -84, -14, -77]];

// Maintenance task stations
export const STATIONS = [
  { id: 'recycle', game: 'sort', set: 'recycle', x: 52, z: 54.3, icon: '♻️' },
  { id: 'books', game: 'sort', set: 'books', x: 113.2, z: -49, icon: '📚' },
  { id: 'lab', game: 'simon', set: 'lab', x: 113.2, z: -32.2, icon: '🧪' },
  { id: 'projector', game: 'wires', set: 'projector', x: 131.2, z: -15.6, icon: '📽️' },
  { id: 'stage', game: 'wires', set: 'stage', x: 122, z: -67.6, icon: '💡' },
  { id: 'skim', game: 'collect', set: 'leaves', x: 23.6, z: 37, icon: '🍂' },
  { id: 'chlorine', game: 'gauge', set: 'chlorine', x: 8.6, z: 33.6, icon: '🧴' },
  { id: 'pump', game: 'hold', set: 'pump', x: -25, z: 60, icon: '🏀' },
  { id: 'mats', game: 'sequence', set: 'mats', x: -7, z: 75.6, icon: '🤸' },
  { id: 'hockey', game: 'collect', set: 'hockey', x: 62, z: -50, icon: '🏑' },
  { id: 'rugby', game: 'sequence', set: 'rugby', x: -99.5, z: -69.5, icon: '🏉' },
  { id: 'tennis', game: 'sweep', set: 'clay', x: -56, z: 64, icon: '🎾' },
  { id: 'tables', game: 'sweep', set: 'table', x: 47.3, z: 41.6, icon: '🧽' },
  { id: 'fruit', game: 'sort', set: 'fruit', x: 52.6, z: 41.9, icon: '🍎' },
  { id: 'plants', game: 'hold', set: 'water', x: 56.3, z: 70.4, icon: '🪴' },
  { id: 'art', game: 'sort', set: 'art', x: 73, z: 47.3, icon: '🎨' },
  { id: 'computers', game: 'sequence', set: 'computers', x: 113.2, z: -37.5, icon: '💻' },
  { id: 'toys', game: 'collect', set: 'toys', x: 28.4, z: 32.4, icon: '🧸' },
  { id: 'wifi', game: 'wires', set: 'wifi', x: -126.6, z: 74, icon: '📶' },
  { id: 'mow', game: 'sweep', set: 'grass', x: 12, z: -10, icon: '🌱' },
  { id: 'piano', game: 'simon', set: 'piano', x: 49.7, z: 30.8, icon: '🎹' },
];

export const SPECIAL = {
  fuse: { x: 13.3, z: 33.4 },
  fireA: { x: -2.9, z: 64 },
  fireB: { x: 121.9, z: -46 },
  office: { x: 116.5, z: -8.5 },
};

export const STAFF_DOORS = [
  { x: 112.8, z: 5.6, room: 'staff' },
  { x: 131, z: -67.2, room: 'auditorium' },
  { x: -25.4, z: 76.2, room: 'gymA' },
  { x: -117.2, z: 75.5, room: 'store' },
  { x: -94.2, z: 56, room: 'club' },
  { x: 81.2, z: 47.2, room: 'art' },
];

export const GATE = { x0: 19, x1: 27 };

/* ------------------------------------------------------------------ */
/* Geometry batching: thousands of static boxes → a handful of meshes. */

class Batch {
  constructor() { this.groups = new Map(); }
  add(geo, mat, matrix) {
    let g = this.groups.get(mat);
    if (!g) this.groups.set(mat, g = []);
    const c = geo.clone(); c.applyMatrix4(matrix); g.push(c);
  }
  build(scene) {
    for (const [mat, list] of this.groups) {
      const m = new THREE.Mesh(mergeGeometries(list, false), mat);
      m.matrixAutoUpdate = false;
      scene.add(m);
      list.forEach(g => g.dispose());
    }
  }
}

const nonIndexed = g => { const n = g.toNonIndexed(); n.deleteAttribute('uv'); return n; };
const GEO = {
  box: nonIndexed(new THREE.BoxGeometry(1, 1, 1)),
  cyl: nonIndexed(new THREE.CylinderGeometry(0.5, 0.5, 1, 12)),
  cyl6: nonIndexed(new THREE.CylinderGeometry(0.5, 0.5, 1, 6)),
  cone4: nonIndexed(new THREE.ConeGeometry(0.72, 1, 4)),
  sphere: nonIndexed(new THREE.SphereGeometry(0.5, 12, 8)),
};

/* ------------------------------------------------------------------ */
/* Collision                                                          */

class Collision {
  constructor() { this.boxes = []; this.circles = []; this.grid = new Map(); this.cell = 8; }
  key(i, j) { return i * 10007 + j; }
  addBox(x0, z0, x1, z1) {
    const b = { x0: Math.min(x0, x1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), z1: Math.max(z0, z1) };
    this.insert(b, b.x0, b.z0, b.x1, b.z1);
  }
  addCircle(x, z, r) { const c = { x, z, r, c: true }; this.insert(c, x - r, z - r, x + r, z + r); }
  insert(o, x0, z0, x1, z1) {
    const s = this.cell;
    for (let i = Math.floor(x0 / s); i <= Math.floor(x1 / s); i++)
      for (let j = Math.floor(z0 / s); j <= Math.floor(z1 / s); j++) {
        const k = this.key(i, j); let a = this.grid.get(k); if (!a) this.grid.set(k, a = []); a.push(o);
      }
  }
  near(x, z) {
    const a = this.grid.get(this.key(Math.floor(x / this.cell), Math.floor(z / this.cell)));
    return a || [];
  }
  // pushes p ({x,z}) out of obstacles
  resolve(p, r) {
    for (let it = 0; it < 2; it++) {
      const seen = new Set();
      for (const dx of [-r, r]) for (const dz of [-r, r]) for (const o of this.near(p.x + dx, p.z + dz)) {
        if (seen.has(o)) continue; seen.add(o);
        if (o.c) {
          const ddx = p.x - o.x, ddz = p.z - o.z, d = Math.hypot(ddx, ddz), m = o.r + r;
          if (d < m && d > 1e-6) { p.x = o.x + ddx / d * m; p.z = o.z + ddz / d * m; }
        } else {
          const cx = Math.max(o.x0, Math.min(p.x, o.x1)), cz = Math.max(o.z0, Math.min(p.z, o.z1));
          const ddx = p.x - cx, ddz = p.z - cz, d2 = ddx * ddx + ddz * ddz;
          if (d2 < r * r) {
            if (d2 > 1e-10) { const d = Math.sqrt(d2); p.x = cx + ddx / d * r; p.z = cz + ddz / d * r; }
            else {
              const l = p.x - o.x0, rr = o.x1 - p.x, t = p.z - o.z0, bb = o.z1 - p.z, m = Math.min(l, rr, t, bb);
              if (m === l) p.x = o.x0 - r; else if (m === rr) p.x = o.x1 + r; else if (m === t) p.z = o.z0 - r; else p.z = o.z1 + r;
            }
          }
        }
      }
    }
    p.x = Math.max(BOUNDS.x0 + r, Math.min(BOUNDS.x1 - r, p.x));
    p.z = Math.max(BOUNDS.z0 + r, Math.min(BOUNDS.z1 - r, p.z));
  }
  blocked(x, z, r = 0) {
    for (const o of this.near(x, z)) {
      if (o.c) { if (Math.hypot(x - o.x, z - o.z) < o.r + r) return true; }
      else if (x > o.x0 - r && x < o.x1 + r && z > o.z0 - r && z < o.z1 + r) return true;
    }
    return x < BOUNDS.x0 || x > BOUNDS.x1 || z < BOUNDS.z0 || z > BOUNDS.z1;
  }
  // line of sight between two points (only walls/boxes block)
  los(ax, az, bx, bz, r = 0) {
    const d = Math.hypot(bx - ax, bz - az), n = Math.ceil(d / 0.5);
    for (let i = 1; i < n; i++) {
      const x = ax + (bx - ax) * i / n, z = az + (bz - az) * i / n;
      for (const o of this.near(x, z)) if (!o.c && x > o.x0 - r && x < o.x1 + r && z > o.z0 - r && z < o.z1 + r) return false;
    }
    return true;
  }
}

/* ------------------------------------------------------------------ */
/* Text textures                                                      */

export function textTexture(text, { w = 512, h = 96, bg = '#14285a', fg = '#ffffff', font = 'Fredoka', size = 54, border = '#d4a52c' } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  if (bg) {
    g.fillStyle = bg; roundRect(g, 0, 0, w, h, 18); g.fill();
    if (border) { g.lineWidth = 8; g.strokeStyle = border; roundRect(g, 4, 4, w - 8, h - 8, 14); g.stroke(); }
  }
  g.fillStyle = fg; g.font = `600 ${size}px ${font}, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, w / 2, h / 2 + 3);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
function roundRect(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

/* ------------------------------------------------------------------ */
/* Ground texture: grass, pitches, paths, roads                        */

function groundTexture() {
  const S = 8, X0 = -170, Z0 = -110, W = 340, H = 220;
  const c = document.createElement('canvas'); c.width = W * S; c.height = H * S;
  const g = c.getContext('2d');
  const px = x => (x - X0) * S, pz = z => (z - Z0) * S;
  const R = (x0, z0, x1, z1, col) => { g.fillStyle = col; g.fillRect(px(x0), pz(z0), (x1 - x0) * S, (z1 - z0) * S); };
  const L = (x0, z0, x1, z1, col = '#ffffff', w = 0.35) => {
    g.strokeStyle = col; g.lineWidth = w * S; g.beginPath(); g.moveTo(px(x0), pz(z0)); g.lineTo(px(x1), pz(z1)); g.stroke();
  };
  const rnd = mulberry(7);

  // neighbourhood + roads
  R(X0, Z0, X0 + W, Z0 + H, '#86a35f');
  R(X0, 88, 170, 97, '#5d6166'); R(X0, 87, 170, 88, '#c9c2b2'); R(X0, 97, 170, 98, '#c9c2b2');
  R(146, Z0, 155, 110, '#5d6166'); R(-155, Z0, -146, 110, '#5d6166');
  R(X0, -97, 170, -89, '#5d6166');
  g.setLineDash([3 * S, 3 * S]);
  L(X0, 92.5, 170, 92.5, '#e8d36a', 0.3); L(150.5, Z0, 150.5, 110, '#e8d36a', 0.3);
  g.setLineDash([]);

  // campus lawn with speckle
  R(-140, -85, 140, 85, '#5f9c44');
  for (let i = 0; i < 9000; i++) {
    const x = -140 + rnd() * 280, z = -85 + rnd() * 170, s = 0.6 + rnd() * 1.6;
    g.fillStyle = rnd() < 0.5 ? 'rgba(40,90,30,0.22)' : 'rgba(150,190,90,0.18)';
    g.fillRect(px(x), pz(z), s * S, s * S);
  }
  // sandy paths (Carrasco soil)
  const sand = '#cfcac0';
  for (const p of PATHS) R(...p, sand);
  // parking (by the Junior School and by the OBC/OGC Club)
  const parking = (x0, z0, x1, z1) => {
    R(x0, z0, x1, z1, '#a7a6a0');
    for (let x = x0 + 2.5; x < x1; x += 2.5) L(x, z0, x, z0 + (z1 - z0) * 0.42, '#f4f4f4', 0.15);
    for (let x = x0 + 2.5; x < x1; x += 2.5) L(x, z1 - (z1 - z0) * 0.42, x, z1, '#f4f4f4', 0.15);
  };
  for (const p of PARKING) parking(...p);
  // Junior palm courtyard paving + the glass walkway to the Senior School
  R(COURTYARD.x0, COURTYARD.z0, COURTYARD.x1, COURTYARD.z1, '#cdbf9d');
  for (let x = COURTYARD.x0 + 2; x < COURTYARD.x1; x += 4) L(x, COURTYARD.z0, x, COURTYARD.z1, 'rgba(120,100,70,0.25)', 0.12);
  R(120, 22, 125, 39, '#cdbf9d'); R(104, 35, 125, 39, '#cdbf9d');
  // running track round Rugby 1
  for (const f of FIELDS) if (f.track) {
    const x0 = f.x0 - 7, z0 = f.z0 - 9, x1 = f.x1 + 7, z1 = f.z1 + 9, r = (x1 - x0) / 2;
    g.strokeStyle = '#4c8a3a'; g.lineWidth = 5 * S;
    g.beginPath(); g.roundRect(px(x0 + 2.5), pz(z0 + 2.5), (x1 - x0 - 5) * S, (z1 - z0 - 5) * S, (r - 2.5) * S); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 0.2 * S;
    for (const o of [0.2, 2.5, 4.8]) { g.beginPath(); g.roundRect(px(x0 + o), pz(z0 + o), (x1 - x0 - 2 * o) * S, (z1 - z0 - 2 * o) * S, (r - o) * S); g.stroke(); }
  }
  // aprons around buildings
  for (const b of BUILDINGS) R(b.x0 - 1.5, b.z0 - 1.5, b.x1 + 1.5, b.z1 + 1.5, '#c8c0ac');

  // pitches
  for (const f of FIELDS) {
    const lx = f.x1 - f.x0 > f.z1 - f.z0;
    const len = lx ? f.x1 - f.x0 : f.z1 - f.z0;
    if (f.kind === 'rugby' || f.kind === 'football' || f.kind === 'hockeyGrass') {
      // mow stripes
      const n = Math.round(len / 5);
      for (let i = 0; i < n; i++) {
        const a = i / n, b = (i + 1) / n;
        g.fillStyle = i % 2 ? '#5aa143' : '#68ad4c';
        if (lx) g.fillRect(px(f.x0 + a * len), pz(f.z0), (len / n) * S + 1, (f.z1 - f.z0) * S);
        else g.fillRect(px(f.x0), pz(f.z0 + a * len), (f.x1 - f.x0) * S, (len / n) * S + 1);
      }
      g.strokeStyle = '#fff'; g.lineWidth = 0.35 * S;
      g.strokeRect(px(f.x0 + 1), pz(f.z0 + 1), (f.x1 - f.x0 - 2) * S, (f.z1 - f.z0 - 2) * S);
      const cx = (f.x0 + f.x1) / 2, cz = (f.z0 + f.z1) / 2;
      if (lx) L(cx, f.z0 + 1, cx, f.z1 - 1); else L(f.x0 + 1, cz, f.x1 - 1, cz);
      if (f.kind === 'hockeyGrass') {
        g.beginPath(); g.arc(px(f.x0 + 1), pz(cz), 9 * S, -Math.PI / 2, Math.PI / 2); g.stroke();
        g.beginPath(); g.arc(px(f.x1 - 1), pz(cz), 9 * S, Math.PI / 2, Math.PI * 1.5); g.stroke();
      } else if (f.kind === 'football') {
        g.beginPath(); g.arc(px(cx), pz(cz), 5 * S, 0, Math.PI * 2); g.stroke();
        const bw = Math.min(20, (lx ? f.z1 - f.z0 : f.x1 - f.x0) * 0.55);
        if (lx) { g.strokeRect(px(f.x0 + 1), pz(cz - bw / 2), 9 * S, bw * S); g.strokeRect(px(f.x1 - 10), pz(cz - bw / 2), 9 * S, bw * S); }
        else { g.strokeRect(px(cx - bw / 2), pz(f.z0 + 1), bw * S, 9 * S); g.strokeRect(px(cx - bw / 2), pz(f.z1 - 10), bw * S, 9 * S); }
      } else {
        for (const t of [0.22, 0.78]) {
          if (lx) L(f.x0 + len * t, f.z0 + 1, f.x0 + len * t, f.z1 - 1); else L(f.x0 + 1, f.z0 + len * t, f.x1 - 1, f.z0 + len * t);
        }
        g.setLineDash([1.5 * S, 1.5 * S]);
        for (const t of [0.4, 0.6]) {
          if (lx) L(f.x0 + len * t, f.z0 + 1, f.x0 + len * t, f.z1 - 1); else L(f.x0 + 1, f.z0 + len * t, f.x1 - 1, f.z0 + len * t);
        }
        g.setLineDash([]);
      }
    } else if (f.kind === 'hockey' || f.kind === 'synthetic') {
      R(f.x0, f.z0, f.x1, f.z1, f.kind === 'hockey' ? '#3d8a6a' : '#46a85a');
      for (let i = 0; i < 1600; i++) {
        g.fillStyle = 'rgba(255,255,255,0.03)';
        g.fillRect(px(f.x0 + rnd() * (f.x1 - f.x0)), pz(f.z0 + rnd() * (f.z1 - f.z0)), 2, 2);
      }
      g.strokeStyle = '#fff'; g.lineWidth = 0.3 * S;
      g.strokeRect(px(f.x0 + 1), pz(f.z0 + 1), (f.x1 - f.x0 - 2) * S, (f.z1 - f.z0 - 2) * S);
      const cx = (f.x0 + f.x1) / 2, cz = (f.z0 + f.z1) / 2;
      if (lx) L(cx, f.z0 + 1, cx, f.z1 - 1); else L(f.x0 + 1, cz, f.x1 - 1, cz);
      if (f.kind === 'hockey') {
        g.beginPath(); g.arc(px(f.x0 + 1), pz(cz), 9 * S, -Math.PI / 2, Math.PI / 2); g.stroke();
        g.beginPath(); g.arc(px(f.x1 - 1), pz(cz), 9 * S, Math.PI / 2, Math.PI * 1.5); g.stroke();
        g.strokeStyle = '#e8d24a'; L(f.x0 + 15, f.z0 + 1, f.x0 + 15, f.z1 - 1, '#e8d24a'); L(f.x1 - 15, f.z0 + 1, f.x1 - 15, f.z1 - 1, '#e8d24a');
      } else { // F2: synthetic football pitch
        g.beginPath(); g.arc(px(cx), pz(cz), 4 * S, 0, Math.PI * 2); g.stroke();
        const bw = (f.z1 - f.z0) * 0.5;
        g.strokeRect(px(f.x0 + 1), pz(cz - bw / 2), 7 * S, bw * S); g.strokeRect(px(f.x1 - 8), pz(cz - bw / 2), 7 * S, bw * S);
      }
    } else if (f.kind === 'tennis') {
      R(f.x0, f.z0, f.x1, f.z1, '#c4693c');
      const cw = (f.x1 - f.x0) / 2;
      for (let k = 0; k < 2; k++) {
        const x0 = f.x0 + k * cw + 2, x1 = f.x0 + (k + 1) * cw - 2;
        g.strokeStyle = '#fff'; g.lineWidth = 0.25 * S;
        g.strokeRect(px(x0), pz(f.z0 + 2), (x1 - x0) * S, (f.z1 - f.z0 - 4) * S);
        const mz = (f.z0 + f.z1) / 2;
        L(x0 + 1.5, f.z0 + 2, x0 + 1.5, f.z1 - 2, '#fff', 0.2); L(x1 - 1.5, f.z0 + 2, x1 - 1.5, f.z1 - 2, '#fff', 0.2);
        L(x0 + 1.5, mz - 5.5, x1 - 1.5, mz - 5.5, '#fff', 0.2); L(x0 + 1.5, mz + 5.5, x1 - 1.5, mz + 5.5, '#fff', 0.2);
        L((x0 + x1) / 2, mz - 5.5, (x0 + x1) / 2, mz + 5.5, '#fff', 0.2);
      }
    } else if (f.kind === 'padel') {
      R(f.x0 - 1, f.z0 - 1, f.x1 + 1, f.z1 + 1, '#3a3f47');
      R(f.x0, f.z0, f.x1, f.z1, '#2f6fb8');
      g.strokeStyle = '#fff'; g.lineWidth = 0.15 * S;
      g.strokeRect(px(f.x0), pz(f.z0), (f.x1 - f.x0) * S, (f.z1 - f.z0) * S);
      const cx = (f.x0 + f.x1) / 2, cz = (f.z0 + f.z1) / 2, sv = (f.z1 - f.z0) * 0.35;
      L(f.x0, cz - sv, f.x1, cz - sv, '#fff', 0.15); L(f.x0, cz + sv, f.x1, cz + sv, '#fff', 0.15);
      L(cx, cz - sv, cx, cz + sv, '#fff', 0.15);
    }
  }
  // pool deck
  R(POOL.deck.x0, POOL.deck.z0, POOL.deck.x1, POOL.deck.z1, '#e9e5dc');
  // assembly circle around the bell
  g.fillStyle = '#cdbf9d'; g.beginPath(); g.arc(px(BELL.x), pz(BELL.z), 7 * S, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#b1372f'; g.lineWidth = 0.4 * S; g.beginPath(); g.arc(px(BELL.x), pz(BELL.z), 6 * S, 0, Math.PI * 2); g.stroke();

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return { tex: t, W, H, canvas: c };
}

function mulberry(a) {
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

/* ------------------------------------------------------------------ */
/* Build the scene                                                    */

export function buildWorld(scene) {
  const B = new Batch();
  const col = new Collision();
  const mats = new Map();
  const M = (color) => {
    let m = mats.get(color);
    if (!m) mats.set(color, m = new THREE.MeshLambertMaterial({ color }));
    return m;
  };
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
  const put = (geo, color, x, y, z, sx, sy, sz, ry = 0, rx = 0, rz = 0) => {
    _e.set(rx, ry, rz); _q.setFromEuler(_e); _p.set(x, y, z); _s.set(sx, sy, sz);
    _m.compose(_p, _q, _s); B.add(geo, M(color), _m);
  };
  // box with bottom at y0
  const box = (x, y0, z, sx, sy, sz, color, solid = false, ry = 0) => {
    put(GEO.box, color, x, y0 + sy / 2, z, sx, sy, sz, ry);
    if (solid) {
      const rot = Math.abs(Math.sin(ry)) > 0.7;
      const hx = (rot ? sz : sx) / 2, hz = (rot ? sx : sz) / 2;
      col.addBox(x - hx, z - hz, x + hx, z + hz);
    }
  };
  const cyl = (x, y0, z, r, h, color, solid = false) => {
    put(GEO.cyl, color, x, y0 + h / 2, z, r * 2, h, r * 2);
    if (solid) col.addCircle(x, z, r);
  };
  const dynamic = { water: [], bell: null, signs: [] };

  // ground
  const gt = groundTexture();
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(gt.W, gt.H), new THREE.MeshLambertMaterial({ map: gt.tex }));
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);
  const far = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), M('#7c9a58'));
  far.rotation.x = -Math.PI / 2; far.position.y = -0.05; scene.add(far);

  // ---------- signs (separate meshes, each with its own texture)
  const sign = (text, x, y, z, ry, w = 6, h = 1.1, opts) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: textTexture(text, opts), transparent: true }));
    m.position.set(x, y, z); m.rotation.y = ry; scene.add(m); dynamic.signs.push(m);
    return m;
  };

  // ---------- walls
  const WALL_T = 0.3;
  const rnd2 = mulberry(99);
  const lampMat = new THREE.MeshLambertMaterial({ color: '#ffffff', emissive: '#fff6dc', emissiveIntensity: 0.9 });
  const wall = (xa, za, xb, zb, h, color, doors = [], exterior = false) => {
    const alongX = za === zb;
    const a = alongX ? Math.min(xa, xb) : Math.min(za, zb), b = alongX ? Math.max(xa, xb) : Math.max(za, zb);
    const fixed = alongX ? za : xa;
    const DW = 2.6, DH = 2.7;
    const gaps = doors.map(d => [d - DW / 2, d + DW / 2]).sort((p, q) => p[0] - q[0]);
    const pieces = []; let cur = a;
    for (const [g0, g1] of gaps) { if (g0 > cur) pieces.push([cur, g0]); cur = Math.max(cur, g1); }
    if (cur < b) pieces.push([cur, b]);
    const seg = (s0, s1, y0, hh, c, thick = WALL_T) => {
      const mid = (s0 + s1) / 2, len = s1 - s0;
      if (alongX) box(mid, y0, fixed, len, hh, thick, c); else box(fixed, y0, mid, thick, hh, len, c);
    };
    for (const [s0, s1] of pieces) {
      seg(s0, s1, 0, h, color);
      if (!exterior) {
        seg(s0, s1, 0, 1.0, '#cfe3cc', WALL_T + 0.04);   // pale green dado
        seg(s0, s1, 1.0, 0.08, '#1f7a3f', WALL_T + 0.06); // green rail
        for (let p = s0 + 1.5; p < s1 - 1.5; p += 4.5) {     // posters & notice boards
          if (rnd2() < 0.45) continue;
          const c = ['#c62f35', '#2e5aa8', '#e0b13a', '#7b2d3a', '#2fa35a', '#f08c00'][Math.floor(rnd2() * 6)];
          const w = 0.7 + rnd2() * 0.6;
          if (alongX) box(p, 1.35, fixed, w, 0.9, WALL_T + 0.05, c); else box(fixed, 1.35, p, WALL_T + 0.05, 0.9, w, c);
          if (alongX) box(p, 1.45, fixed, w * 0.7, 0.12, WALL_T + 0.07, '#ffffff'); else box(fixed, 1.45, p, WALL_T + 0.07, 0.12, w * 0.7, '#ffffff');
        }
      }
      if (alongX) col.addBox(s0, fixed - WALL_T / 2, s1, fixed + WALL_T / 2);
      else col.addBox(fixed - WALL_T / 2, s0, fixed + WALL_T / 2, s1);
      if (exterior) {
        seg(s0, s1, 0, 0.55, '#a0453a', WALL_T + 0.08); // brick skirting
        const len = s1 - s0, n = Math.floor((len - 1) / 3.6);
        for (let i = 0; i < n; i++) {
          const c = s0 + (len - (n - 1) * 3.6) / 2 + i * 3.6;
          if (alongX) { box(c, 1.05, fixed, 2.2, 1.35, WALL_T + 0.1, '#f7f7f7'); box(c, 1.15, fixed, 1.9, 1.15, WALL_T + 0.14, '#6d9ec4'); }
          else { box(fixed, 1.05, c, WALL_T + 0.1, 1.35, 2.2, '#f7f7f7'); box(fixed, 1.15, c, WALL_T + 0.14, 1.15, 1.9, '#6d9ec4'); }
        }
      }
    }
    for (const [g0, g1] of gaps) {
      if (h > DH) seg(g0, g1, DH, h - DH, color);
      if (exterior) { // navy door frame
        seg(g0 - 0.15, g0, 0, DH, '#14285a', WALL_T + 0.12); seg(g1, g1 + 0.15, 0, DH, '#14285a', WALL_T + 0.12);
      }
    }
  };

  for (const b of BUILDINGS) {
    const h = b.h || 3.4, wc = b.wall || '#f3ecdc';
    for (const r of b.rooms) box((r.x0 + r.x1) / 2, 0, (r.z0 + r.z1) / 2, r.x1 - r.x0, 0.06, r.z1 - r.z0, r.floor || '#d8cbb0');
    const d = s => (b.doors || []).filter(o => o.side === s).map(o => o.at);
    wall(b.x0, b.z0, b.x1, b.z0, h, wc, d('n'), true);
    wall(b.x0, b.z1, b.x1, b.z1, h, wc, d('s'), true);
    wall(b.x0, b.z0, b.x0, b.z1, h, wc, d('w'), true);
    wall(b.x1, b.z0, b.x1, b.z1, h, wc, d('e'), true);
    for (const iw of b.inner || []) wall(iw[0], iw[1], iw[2], iw[3], h, '#fbf7ee', iw[4] || []);
    const cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2, w = b.x1 - b.x0, dd = b.z1 - b.z0;
    box(cx, h, cz, w + 0.6, 0.3, dd + 0.6, '#f4f2ec');           // roof / ceiling
    const lvH = b.levels ? h / b.levels : h, ch = lvH;          // ground-floor ceiling
    if (b.levels) {
      box(cx, ch, cz, w - 0.3, 0.25, dd - 0.3, '#f4f2ec');
      for (let lv = 1; lv < b.levels; lv++) {                    // upper floors: band + windows
        const y = lv * lvH;
        box(cx, y - 0.1, b.z0, w + 0.1, 0.25, WALL_T + 0.12, '#b1372f'); box(cx, y - 0.1, b.z1, w + 0.1, 0.25, WALL_T + 0.12, '#b1372f');
        box(b.x0, y - 0.1, cz, WALL_T + 0.12, 0.25, dd + 0.1, '#b1372f'); box(b.x1, y - 0.1, cz, WALL_T + 0.12, 0.25, dd + 0.1, '#b1372f');
        for (let x = b.x0 + 2; x < b.x1 - 1; x += 3.6) { box(x, y + 1.0, b.z0, 2.2, 1.4, WALL_T + 0.1, '#f7f7f7'); box(x, y + 1.1, b.z0, 1.9, 1.2, WALL_T + 0.14, '#6d9ec4'); box(x, y + 1.0, b.z1, 2.2, 1.4, WALL_T + 0.1, '#f7f7f7'); box(x, y + 1.1, b.z1, 1.9, 1.2, WALL_T + 0.14, '#6d9ec4'); }
        for (let z = b.z0 + 2; z < b.z1 - 1; z += 3.6) { box(b.x0, y + 1.0, z, WALL_T + 0.1, 1.4, 2.2, '#f7f7f7'); box(b.x0, y + 1.1, z, WALL_T + 0.14, 1.2, 1.9, '#6d9ec4'); box(b.x1, y + 1.0, z, WALL_T + 0.1, 1.4, 2.2, '#f7f7f7'); box(b.x1, y + 1.1, z, WALL_T + 0.14, 1.2, 1.9, '#6d9ec4'); }
      }
    }
    for (const r of b.rooms) {                                   // ceiling lights
      for (let x = r.x0 + 3; x < r.x1 - 1.5; x += 5) for (let z = r.z0 + 3; z < r.z1 - 1.5; z += 5) {
        _e.set(0, 0, 0); _q.setFromEuler(_e); _p.set(x, ch - 0.14, z); _s.set(1.4, 0.08, 0.5); _m.compose(_p, _q, _s); B.add(GEO.box, lampMat, _m);
      }
    }
    box(cx, h + 0.3, b.z0 - 0.15, w + 0.6, 0.45, 0.3, '#b1372f');    // red parapet band
    box(cx, h + 0.3, b.z1 + 0.15, w + 0.6, 0.45, 0.3, '#b1372f');
    box(b.x0 - 0.15, h + 0.3, cz, 0.3, 0.45, dd + 0.6, '#b1372f');
    box(b.x1 + 0.15, h + 0.3, cz, 0.3, 0.45, dd + 0.6, '#b1372f');
    // door canopies (navy)
    for (const o of b.doors || []) {
      const y = 2.75;
      if (o.side === 'n') box(o.at, y, b.z0 - 0.6, 3.4, 0.18, 1.2, '#14285a');
      if (o.side === 's') box(o.at, y, b.z1 + 0.6, 3.4, 0.18, 1.2, '#14285a');
      if (o.side === 'w') box(b.x0 - 0.6, y, o.at, 1.2, 0.18, 3.4, '#14285a');
      if (o.side === 'e') box(b.x1 + 0.6, y, o.at, 1.2, 0.18, 3.4, '#14285a');
    }
  }

  // ---------- furniture helpers
  const desk = (x, z, ry = 0) => {
    box(x, 0.72, z, 1.2, 0.06, 0.7, '#c49a6c', false, ry);
    for (const [a, c] of [[-0.55, -0.3], [0.55, -0.3], [-0.55, 0.3], [0.55, 0.3]]) {
      const cs = Math.cos(ry), sn = Math.sin(ry);
      box(x + a * cs + c * sn, 0, z - a * sn + c * cs, 0.06, 0.72, 0.06, '#555');
    }
    col.addBox(x - 0.6, z - 0.4, x + 0.6, z + 0.4);
    box(x, 0.42, z + 0.6, 0.45, 0.05, 0.42, '#1f3d7a'); // chair seat
    box(x, 0.45, z + 0.82, 0.45, 0.45, 0.05, '#1f3d7a');
  };
  const shelf = (x, z, len, alongX, rnd) => {
    const sx = alongX ? len : 0.5, sz = alongX ? 0.5 : len;
    box(x, 0, z, sx, 2.1, sz, '#7a4b2a', true);
    const colors = ['#c0392b', '#2e5aa8', '#2e8b57', '#d4a52c', '#8e44ad', '#e67e22'];
    for (let row = 0; row < 3; row++) {
      let s = -len / 2 + 0.1;
      while (s < len / 2 - 0.3) {
        const w = 0.12 + rnd() * 0.12, hh = 0.38 + rnd() * 0.18;
        const c = colors[Math.floor(rnd() * colors.length)];
        if (alongX) box(x + s + w / 2, 0.2 + row * 0.62, z, w, hh, 0.56, c);
        else box(x, 0.2 + row * 0.62, z + s + w / 2, 0.56, hh, w, c);
        s += w + 0.02;
      }
    }
  };
  const table = (x, z, w, d, color = '#e6e1d8', h = 0.75) => {
    box(x, h - 0.05, z, w, 0.06, d, color);
    box(x, 0, z, 0.12, h - 0.05, 0.12, '#666');
    col.addBox(x - w / 2, z - d / 2, x + w / 2, z + d / 2);
  };
  const bench = (x, z, len, alongX = true, color = '#8a5a3c') => {
    if (alongX) box(x, 0.4, z, len, 0.08, 0.4, color); else box(x, 0.4, z, 0.4, 0.08, len, color);
    box(x, 0, z, 0.15, 0.4, 0.15, '#555');
    if (alongX) col.addBox(x - len / 2, z - 0.2, x + len / 2, z + 0.2); else col.addBox(x - 0.2, z - len / 2, x + 0.2, z + len / 2);
  };
  const rnd = mulberry(42);

  const R90 = Math.PI / 2;
  // ---------- Room furniture, from each room's type (keeps doorways and task spots clear)
  const doorPts = [];
  for (const b of BUILDINGS) {
    for (const o of b.doors || []) doorPts.push(o.side === 'n' ? [o.at, b.z0] : o.side === 's' ? [o.at, b.z1] : o.side === 'w' ? [b.x0, o.at] : [b.x1, o.at]);
    for (const w of b.inner || []) for (const at of w[4] || []) doorPts.push(w[1] === w[3] ? [at, w[1]] : [w[0], at]);
  }
  const keepClear = [...STATIONS, ...Object.values(SPECIAL), ...STAFF_DOORS];
  const clear = (x, z, pad = 0.6) => !doorPts.some(([dx, dz]) => Math.hypot(dx - x, dz - z) < 1.9 + pad) && !keepClear.some(s => Math.hypot(s.x - x, s.z - z) < 1.5 + pad);
  const TYPE = {
    library: 'library', lab: 'lab', computer: 'computer', office: 'hmoffice', staff: 'staff', jstaff: 'staff', atrium: 'atrium',
    sfoyer: 'foyer', sentrance: 'foyer', jentrance: 'foyer', jreception: 'reception', jwaiting: 'foyer', gymlobby: 'foyer',
    wc: 'wc', changing: 'changing', hall: 'hall', dining: 'dining', music: 'music', art: 'art', early: 'early',
    firstaid: 'firstaid', jstore: 'store', store: 'store', pavilion: 'pavilion', tearoom: 'cafe', clubkitchen: 'cafe', club: 'club',
    fitness: 'fitness', studio: 'studio', sportsoffice: 'office', gymA: 'court', gymB: 'court', auditorium: 'none', corridor: 'none', jcorridor: 'none',
  };
  const typeOf = r => TYPE[r.key] || (r.key.startsWith('EYC') ? ((r.x1 - r.x0) * (r.z1 - r.z0) > 25 ? 'kinder' : 'office')
    : (r.x1 - r.x0) * (r.z1 - r.z0) >= 20 ? 'class' : 'office');
  const along = (r, fn, step, m = 1.2) => {   // spots along the longer middle line
    const lx = r.x1 - r.x0 >= r.z1 - r.z0;
    for (let s = (lx ? r.x0 : r.z0) + m; s <= (lx ? r.x1 : r.z1) - m + 0.01; s += step) fn(lx ? s : (r.x0 + r.x1) / 2, lx ? (r.z0 + r.z1) / 2 : s, lx);
  };
  const KID = ['#e74c3c', '#f1c40f', '#3498db', '#2ecc71', '#e67e22', '#9b59b6'];
  for (const b of BUILDINGS) for (const r of b.rooms) {
    const w = r.x1 - r.x0, d = r.z1 - r.z0, cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2;
    const T = typeOf(r);
    if (T === 'class') {   // rows of desks facing a whiteboard on the north wall
      for (let z = r.z0 + 2.4; z < r.z1 - 1.3; z += 2.8) for (let x = r.x0 + 1.5; x < r.x1 - 1.1; x += 2.6) if (clear(x, z)) desk(x, z, 0);
      if (clear(cx, r.z0 + 0.3, -0.6)) box(cx, 1.0, r.z0 + 0.14, Math.min(4.5, w - 1.6), 1.4, 0.08, '#ffffff');
    } else if (T === 'office') {
      const x = cx, z = cz;
      if (w > 2.4 && d > 2.4 && clear(x, z)) { table(x, z, Math.min(1.6, w - 1.4), 0.8, '#8a5a3c'); box(x, 0, z + 0.9, 0.5, 0.9, 0.5, '#1f3d7a'); }
      if (clear(r.x0 + 0.4, cz)) box(r.x0 + 0.35, 0, cz, 0.45, 1.8, Math.min(2.2, d - 1), '#7a4b2a', true);
    } else if (T === 'wc') {   // cubicles along the long wall + sinks opposite
      const lx = w >= d;
      for (let s = (lx ? r.x0 : r.z0) + 1.2; s < (lx ? r.x1 : r.z1) - 0.6; s += 1.3) {
        if (lx) { if (clear(s, r.z0 + 0.8, -0.8)) box(s, 0, r.z0 + 0.65, 0.06, 1.8, 1.3, '#9fb3c8'); }
        else if (clear(r.x0 + 0.8, s, -0.8)) box(r.x0 + 0.65, 0, s, 1.3, 1.8, 0.06, '#9fb3c8');
      }
      if (lx && clear(cx, r.z1 - 0.4, -0.5)) box(cx, 0, r.z1 - 0.35, Math.min(3, w - 1.5), 0.85, 0.5, '#f4f4f4');
      if (!lx && clear(r.x1 - 0.4, cz, -0.5)) box(r.x1 - 0.35, 0, cz, 0.5, 0.85, Math.min(3, d - 1.5), '#f4f4f4');
    } else if (T === 'library') {
      for (let z = r.z0 + 1.5; z < r.z1 - 1; z += 2.6) if (clear(r.x0 + 2.2, z)) shelf(r.x0 + 2.2, z, 3, true, rnd);
      if (clear(r.x1 - 2.4, cz)) { table(r.x1 - 2.4, cz - 1.5, 1.3, 2.4, '#c49a6c'); table(r.x1 - 2.4, cz + 1.8, 1.3, 2.4, '#c49a6c'); }
    } else if (T === 'lab') {
      box(cx + 1, 0, cz, 1.2, 0.9, d - 2.4, '#2b2f36', true); box(cx + 1, 0.9, cz, 1.25, 0.06, d - 2.4, '#e8ecef');
    } else if (T === 'computer') {
      for (let z = r.z0 + 1.4; z < r.z1 - 0.8; z += 1.8) if (clear(r.x1 - 0.8, z)) { table(r.x1 - 0.7, z, 1.0, 1.4, '#e8e4dc'); box(r.x1 - 0.5, 0.75, z, 0.1, 0.55, 0.8, '#222'); }
    } else if (T === 'hmoffice') {   // the Headmistress's office
      box(cx, 0.02, cz, w - 2, 0.04, d - 2, '#b1372f');
      table(r.x0 + 3, cz, 1.4, 2.6, '#5b3418', 0.82); box(r.x0 + 1.6, 0, cz, 0.8, 1.5, 0.9, '#7b2d3a');
      const banner = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.2), new THREE.MeshLambertMaterial({ color: '#155c2e' }));
      banner.position.set(r.x0 + 0.34, 1.9, cz); banner.rotation.y = R90; scene.add(banner);
      const ct = new THREE.TextureLoader().load('assets/badge.svg'); ct.colorSpace = THREE.SRGBColorSpace;
      const crest = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.2), new THREE.MeshBasicMaterial({ map: ct, transparent: true }));
      crest.position.set(r.x0 + 0.37, 2.05, cz); crest.rotation.y = R90; scene.add(crest);
      sign('HEADMISTRESS', r.x1 + 0.2, 3.0, cz, R90, 3.2, 0.5);
    } else if (T === 'staff') {
      if (clear(cx, r.z1 - 0.9)) box(cx, 0, r.z1 - 0.9, Math.min(4, w - 2), 0.8, 1.2, '#7b2d3a', true);
      if (clear(cx, cz)) table(cx, cz, 1.8, 1, '#5b3418', 0.45);
      if (clear(r.x0 + 0.5, cz)) box(r.x0 + 0.45, 0, cz, 0.7, 0.95, Math.min(4, d - 2), '#dfe6e9', true);
    } else if (T === 'foyer' || T === 'reception' || T === 'atrium') {
      if (T === 'atrium') { cyl(cx, 0, cz, 2.2, 0.5, '#a0453a', true); put(GEO.sphere, '#3f8a3a', cx, 1.2, cz, 3.2, 1.6, 3.2); }
      if (T === 'reception' && clear(cx, r.z0 + 1.6)) box(cx, 0, r.z0 + 1.6, 4, 1.1, 0.9, '#c49a6c', true);
      for (const [x, z] of [[r.x0 + 0.8, r.z0 + 0.8], [r.x1 - 0.8, r.z1 - 0.8]]) if (clear(x, z, -0.4)) { cyl(x, 0, z, 0.3, 0.5, '#a0453a', true); put(GEO.sphere, '#3a8f3a', x, 0.85, z, 0.8, 0.8, 0.8); }
      if (T !== 'atrium' && clear(cx, r.z1 - 0.6)) bench(cx, r.z1 - 0.6, Math.min(3, w - 2), true, '#14285a');
    } else if (T === 'changing') {
      along(r, (x, z, lx) => { if (lx ? clear(x, r.z0 + 0.4, -0.4) : clear(r.x0 + 0.4, z, -0.4)) lx ? box(x, 0, r.z0 + 0.4, 1.1, 2, 0.7, '#2e5aa8', true) : box(r.x0 + 0.4, 0, z, 0.7, 2, 1.1, '#2e5aa8', true); }, 1.25, 0.8);
      if (w >= d ? clear(cx, cz + 0.6) : clear(cx + 0.6, cz)) w >= d ? bench(cx, cz + 0.6, Math.min(4, w - 2)) : bench(cx + 0.6, cz, Math.min(4, d - 2), false);
    } else if (T === 'hall') {
      box(cx, 0, r.z0 + 1, w - 2, 0.6, 1.6, '#6e4128', true);
      for (let z = r.z0 + 3; z < r.z1 - 0.8; z += 1.6) if (clear(cx, z)) bench(cx, z, w - 3, true, '#14285a');
      sign('HALL', cx, 3.0, r.z1 - 0.2, Math.PI, 2.2, 0.5);
    } else if (T === 'dining') {
      for (let x = r.x0 + 2.2; x < r.x1 - 1.5; x += 3.4) if (clear(x, cz + 0.3)) { table(x, cz + 0.3, 1.1, 2.6, '#e8e4dc'); bench(x - 0.95, cz + 0.3, 2.6, false, '#2e5aa8'); bench(x + 0.95, cz + 0.3, 2.6, false, '#2e5aa8'); }
      sign('DINING HALL', cx, 3.0, r.z1 - 0.2, Math.PI, 3.6, 0.6);
    } else if (T === 'music') {
      for (let i = 0; i < 4; i++) { const x = r.x0 + 1 + (i % 2) * 1.6, z = r.z1 - 1.8 + Math.floor(i / 2) * 0.9; if (clear(x, z, -0.4)) box(x, 0, z, 0.5, 0.45, 0.5, '#2e5aa8'); }
    } else if (T === 'art') {
      if (clear(cx, cz)) table(cx, cz - 0.5, 3.4, 1.6, '#f0e1c8');
      for (let x = r.x0 + 1.2; x < r.x1 - 1; x += 2.2) if (clear(x, r.z0 + 0.5, -0.5)) box(x, 0, r.z0 + 0.4, 1.1, 1.6, 0.2, '#c49a6c');
    } else if (T === 'kinder' || T === 'early') {
      for (let i = 0; i < 4; i++) { const x = r.x0 + 1.6 + (i % 2) * 2.6, z = r.z0 + 1.6 + Math.floor(i / 2) * 2.6; if (x < r.x1 - 1 && z < r.z1 - 1) box(x, 0.02, z, 2.2, 0.05, 2.2, KID[(i + r.x0) % 6 | 0]); }
      if (T === 'kinder' && clear(r.x1 - 1.4, r.z1 - 1.4)) table(r.x1 - 1.4, r.z1 - 1.4, 1.4, 0.9, '#f5d76e', 0.5);
      if (T === 'early') { box(r.x0 + 1.2, 0, cz, 1.6, 0.9, 6, '#e8dcc4', true); box(r.x0 + 1.2, 0.9, cz, 1.7, 0.08, 6.1, '#2fa35a'); }   // the ramp
    } else if (T === 'firstaid') {
      if (clear(cx, r.z0 + 1.2)) box(cx, 0, r.z0 + 1.2, 1.0, 0.7, 2.0, '#f4f4f4', true);
      sign('+', cx, 2.6, r.z1 - 0.2, Math.PI, 0.7, 0.7, { w: 96, h: 96, size: 80, bg: '#c62f35', border: '#fff' });
    } else if (T === 'store') {
      if (clear(cx, r.z1 - 0.7)) box(cx, 0, r.z1 - 0.7, Math.min(8, w - 3), 0.95, 1, '#6b4f36', true);
      if (w > 6 && clear(r.x1 - 2, r.z0 + 3)) box(r.x1 - 2, 0, r.z0 + 3, 2.2, 1.0, 1.4, '#c0392b', true);   // ride-on mower
      if (d > 8) shelf(r.x0 + 0.6, r.z0 + 4, 5, false, rnd);
    } else if (T === 'pavilion') {
      for (let i = 0; i < 2; i++) if (clear(r.x0 + 0.6, r.z0 + 1.6 + i * 2.2)) box(r.x0 + 0.6, 0, r.z0 + 1.6 + i * 2.2, 0.6, 2, 2, '#d4a52c', true);
      if (clear(cx + 0.5, cz)) bench(cx + 0.5, cz, 3, false);
    } else if (T === 'cafe') {
      if (clear(r.x1 - 0.7, cz)) box(r.x1 - 0.7, 0, cz, 1.0, 1.0, Math.min(4, d - 2), '#5b3418', true);
      if (w > 5 && clear(cx - 1, cz)) table(cx - 1, cz, 1.4, 1.4, '#c49a6c');
    } else if (T === 'club') {
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) if (clear(r.x0 + 4 + i * 5, r.z0 + 3.5 + j * 5)) table(r.x0 + 4 + i * 5, r.z0 + 3.5 + j * 5, 2, 2, '#c49a6c');
      for (let i = 0; i < 3; i++) if (clear(r.x0 + 0.6, r.z0 + 2 + i * 2.6)) box(r.x0 + 0.6, 0, r.z0 + 2 + i * 2.6, 0.6, 2, 2, '#d4a52c', true);
      bench(cx, r.z1 - 0.6, 6, true, '#14285a');
    } else if (T === 'fitness') {
      for (let x = r.x0 + 2; x < r.x1 - 1.5; x += 3.2) {
        if (clear(x, r.z0 + 1.4)) { box(x, 0, r.z0 + 1.4, 1.0, 1.2, 2.2, '#2b2f36', true); box(x, 1.2, r.z0 + 2.2, 0.8, 0.5, 0.1, '#4dabf7'); }   // treadmills
        if (clear(x, r.z1 - 1.4)) { box(x, 0, r.z1 - 1.4, 1.8, 0.45, 0.6, '#b1372f', true); box(x, 0.45, r.z1 - 1.4, 2.4, 0.06, 0.06, '#888'); }   // benches + bars
      }
    } else if (T === 'studio') {
      box(r.x1 - 0.2, 0, cz, 0.1, 2.2, d - 2, '#dfe6e9');   // mirror wall
      for (let i = 0; i < 3; i++) if (clear(cx - 1.6 + i * 1.6, cz)) box(cx - 1.6 + i * 1.6, 0.02, cz, 1.2, 0.04, 2.6, ['#2e5aa8', '#b1372f', '#2fa35a'][i]);
    } else if (T === 'court') {   // basketball hoops at both ends + court lines
      for (const z of [r.z0 + 0.5, r.z1 - 0.5]) { box(cx, 2.8, z + (z < cz ? 0.0 : -0.1), 1.8, 1.1, 0.08, '#fff'); box(cx, 2.6, z + (z < cz ? 0.5 : -0.5), 0.5, 0.05, 0.5, '#e67e22'); }
      box(cx, 0.07, cz, w - 1.2, 0.01, 0.1, '#ffffff'); cyl(cx, 0.065, cz, 1.6, 0.01, '#e9c48a');
      sign(r.key === 'gymA' ? 'A' : 'B', cx, 5.2, r.z0 + 0.25, 0, 1.4, 1.4, { w: 128, h: 128, size: 90 });
      if (r.key === 'gymA') { for (let i = 0; i < 8; i++) box(r.x0 + 0.3, 0, r.z0 + 4 + i * 1.6, 0.1, 3.2, 0.1, '#c49a6c'); for (let i = 0; i < 8; i++) box(r.x0 + 0.35, 0.3 + i * 0.38, r.z0 + 9.6, 0.1, 0.05, 11.2, '#c49a6c'); }
    }
  }
  sign('LIBRARY', 120.8, 3.0, -49, R90, 2.6, 0.5); sign('SCIENCE LAB', 120.8, 3.0, -32.2, R90, 3.2, 0.5);
  sign('COMPUTERS', 120.8, 3.0, -37.5, R90, 3, 0.5); sign('STAFF ROOM', 120.8, 3.0, 3.2, R90, 3.2, 0.5);
  for (const r of ROOMS) if (/^(S1|J1|EYC1) /.test(r.key) || r.key === 'class1') {   // room-number plates by the doors
    const cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2, label = r.key === 'class1' ? 'S1 18' : r.key, o = { w: 256, h: 96, size: 56 };
    if (r.x0 === 124) sign(label, 123.8, 2.6, cz, -R90, 1.4, 0.5, o);
    else if (r.x1 === 121) sign(label, 121.2, 2.6, cz, R90, 1.4, 0.5, o);
    else if (r.z1 === 36 || r.z1 === 62.5) sign(label, cx, 2.6, r.z1 + 0.2, 0, 1.4, 0.5, o);
    else if (r.z0 === 38 || r.z0 === 65) sign(label, cx, 2.6, r.z0 - 0.2, Math.PI, 1.4, 0.5, o);
  }

  // ---------- Auditorium (north end of the Senior School)
  box(122, 0, -70, 18, 0.9, 3.5, '#6e4128', true);            // stage
  box(122, 0.9, -71.75, 18, 4.2, 0.2, '#8e1b2a');             // curtain
  for (let r = 0; r < 4; r++) for (const cx of [117.25, 126.75]) {
    box(cx, 0, -66.5 + r * 1.7, 7.5, 0.55, 0.7, '#b1372f', true);
    box(cx, 0.55, -66.2 + r * 1.7, 7.5, 0.5, 0.12, '#8e1b2a');
  }
  box(122, 4.8, -67, 18, 0.3, 0.3, '#222');                   // lighting rig
  for (let i = 0; i < 6; i++) box(114 + i * 3.2, 4.4, -67, 0.4, 0.4, 0.4, '#333');

  {  // EYC: curved glass bulge in front of the west wall
    const glass = new THREE.MeshLambertMaterial({ color: '#bfe3f5', transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false });
    const cx = 28.2, cz = 43, rx = 2.2, rz = 14.3, a0 = -Math.PI * 0.82, a1 = -Math.PI * 0.18;
    const arc = new THREE.Mesh(new THREE.CylinderGeometry(rz, rz, 9.4, 32, 1, true, a0, a1 - a0), glass);
    arc.position.set(cx, 4.7, cz); arc.scale.set(rx / rz, 1, 1); scene.add(arc);
    for (let a = a0; a <= a1 + 0.01; a += (a1 - a0) / 10) {
      const x = cx + Math.sin(a) * rx, z = cz + Math.cos(a) * rz;
      box(x, 0, z, 0.2, 9.4, 0.2, '#e9eef2'); col.addCircle(x, z, 0.3);
    }
  }
  // palm courtyard with a little playground
  const palm = (x, z) => {
    for (let i = 0; i < 6; i++) put(GEO.cyl, '#8a6a45', x + i * 0.08, 0.5 + i, z, 0.45 - i * 0.03, 1.02, 0.45 - i * 0.03);
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; put(GEO.box, '#3f8f3a', x + 0.5 + Math.cos(a) * 1.3, 6.1, z + Math.sin(a) * 1.3, 2.8, 0.12, 0.7, -a, 0, -0.35); }
    col.addCircle(x, z, 0.35);
  };
  palm(45, 47); palm(55, 51); palm(61, 46);
  box(50, 0, 46.5, 1.4, 2.2, 1.4, '#e74c3c', true); put(GEO.box, '#f1c40f', 52.2, 1.2, 46.5, 4.4, 0.12, 1.0, 0, 0, 0.5);   // slide
  for (const x of [57, 60]) box(x, 0, 53, 0.15, 2.4, 0.15, '#2e5aa8');
  box(58.5, 2.4, 53, 3.4, 0.15, 0.15, '#2e5aa8'); box(58.5, 0.6, 53, 0.8, 0.08, 0.4, '#f1c40f');           // swing
  {  // glass walkway from the Junior School east block to the Senior School
    const glass = new THREE.MeshLambertMaterial({ color: '#bfe3f5', transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false });
    box(122.5, 2.9, 29.5, 5, 0.18, 15, '#e9eef2'); box(113, 2.9, 37, 19, 0.18, 4, '#e9eef2');
    for (let z = 23; z < 37; z += 4) for (const x of [120.1, 124.9]) cyl(x, 0, z, 0.1, 2.9, '#e9eef2', true);
    for (let x = 106; x < 120; x += 4) for (const z of [35.1, 38.9]) cyl(x, 0, z, 0.1, 2.9, '#e9eef2', true);
    for (const x of [120.1, 124.9]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(13, 1.6), glass); m.position.set(x, 2, 29.5); m.rotation.y = Math.PI / 2; scene.add(m); }
  }

  // ---------- Pool
  for (const wr of POOL.water) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(wr.x1 - wr.x0, wr.z1 - wr.z0),
      new THREE.MeshLambertMaterial({ color: '#29a8dd', emissive: '#0b4f73', emissiveIntensity: 0.35 }));
    m.rotation.x = -Math.PI / 2; m.position.set((wr.x0 + wr.x1) / 2, 0.06, (wr.z0 + wr.z1) / 2);
    scene.add(m); dynamic.water.push(m);
    col.addBox(wr.x0, wr.z0, wr.x1, wr.z1);
    // coping
    box((wr.x0 + wr.x1) / 2, 0, wr.z0 - 0.25, wr.x1 - wr.x0 + 1, 0.12, 0.5, '#ffffff');
    box((wr.x0 + wr.x1) / 2, 0, wr.z1 + 0.25, wr.x1 - wr.x0 + 1, 0.12, 0.5, '#ffffff');
    box(wr.x0 - 0.25, 0, (wr.z0 + wr.z1) / 2, 0.5, 0.12, wr.z1 - wr.z0 + 1, '#ffffff');
    box(wr.x1 + 0.25, 0, (wr.z0 + wr.z1) / 2, 0.5, 0.12, wr.z1 - wr.z0 + 1, '#ffffff');
  }
  box(21, 0.08, 42, 0.12, 0.12, 7, '#b1372f');
  // pool fence with gates
  const fenceLine = (xa, za, xb, zb, gapsAt = []) => {
    const alongX = za === zb, a = alongX ? xa : za, b = alongX ? xb : zb, fixed = alongX ? za : xa;
    let cur = a; const gaps = gapsAt.map(g => [g - 1.5, g + 1.5]);
    const pieces = [];
    for (const [g0, g1] of gaps) { pieces.push([cur, g0]); cur = g1; } pieces.push([cur, b]);
    for (const [s0, s1] of pieces) {
      const mid = (s0 + s1) / 2, len = s1 - s0;
      if (alongX) { box(mid, 1.1, fixed, len, 0.08, 0.08, '#1d3b2a'); box(mid, 0.1, fixed, len, 0.08, 0.08, '#1d3b2a'); col.addBox(s0, fixed - 0.1, s1, fixed + 0.1); }
      else { box(fixed, 1.1, mid, 0.08, 0.08, len, '#1d3b2a'); box(fixed, 0.1, mid, 0.08, 0.08, len, '#1d3b2a'); col.addBox(fixed - 0.1, s0, fixed + 0.1, s1); }
      for (let s = s0; s <= s1; s += 0.6) { if (alongX) box(s, 0, fixed, 0.04, 1.15, 0.04, '#1d3b2a'); else box(fixed, 0, s, 0.04, 1.15, 0.04, '#1d3b2a'); }
    }
  };
  fenceLine(16.5, 36, 24.5, 36, [20.5]); fenceLine(16.5, 48, 24.5, 48, [20.5]); fenceLine(24.5, 36, 24.5, 48); fenceLine(16.5, 36, 16.5, 48, [39]);

  // ---------- Pitches: posts & goals
  const H = (x, z, alongX) => {   // rugby H posts
    for (const o of [-2.8, 2.8]) {
      const px_ = alongX ? x : x + o, pz_ = alongX ? z + o : z;
      cyl(px_, 0, pz_, 0.1, 7, '#ffffff', true);
      box(px_, 0, pz_, 0.5, 1.6, 0.5, '#b1372f');  // post padding
    }
    if (alongX) box(x, 3, z, 0.12, 0.12, 5.6, '#fff'); else box(x, 3, z, 5.6, 0.12, 0.12, '#fff');
  };
  const goal = (x, z, w, h, alongX, facing) => { // football / hockey goal
    for (const o of [-w / 2, w / 2]) {
      const px_ = alongX ? x : x + o, pz_ = alongX ? z + o : z;
      cyl(px_, 0, pz_, 0.07, h, '#ffffff', true);
    }
    if (alongX) { box(x, h, z, 0.12, 0.12, w, '#fff'); box(x + facing * 1, 0, z, 0.05, h, w, '#e6e6e6'); }
    else { box(x, h, z, w, 0.12, 0.12, '#fff'); box(x, 0, z + facing * 1, w, h, 0.05, '#e6e6e6'); }
  };
  for (const f of FIELDS) {
    const lx = f.x1 - f.x0 > f.z1 - f.z0, cx = (f.x0 + f.x1) / 2, cz = (f.z0 + f.z1) / 2;
    if (f.kind === 'rugby') { if (lx) { H(f.x0 + 1, cz, true); H(f.x1 - 1, cz, true); } else { H(cx, f.z0 + 1, false); H(cx, f.z1 - 1, false); } }
    if (f.kind === 'football') { if (lx) { goal(f.x0 + 1, cz, 7, 2.4, true, -1); goal(f.x1 - 1, cz, 7, 2.4, true, 1); } else { goal(cx, f.z0 + 1, 7, 2.4, false, -1); goal(cx, f.z1 - 1, 7, 2.4, false, 1); } }
    if (f.kind === 'hockey' || f.kind === 'hockeyGrass') { goal(f.x0 + 1, cz, 3.6, 2.1, true, -1); goal(f.x1 - 1, cz, 3.6, 2.1, true, 1); }
    if (f.kind === 'synthetic') { goal(f.x0 + 1, cz, 5, 2, true, -1); goal(f.x1 - 1, cz, 5, 2, true, 1); }
    if (f.kind === 'tennis') {
      const cw = (f.x1 - f.x0) / 2, mz = cz;
      for (let k = 0; k < 2; k++) { const nx = f.x0 + k * cw + cw / 2; box(nx, 0, mz, cw - 3, 0.95, 0.05, '#222'); box(nx, 0.9, mz, cw - 3, 0.07, 0.07, '#fff'); }
      fenceLine(f.x0, f.z0, f.x1, f.z0, [(f.x0 + f.x1) / 2]); fenceLine(f.x0, f.z1, f.x1, f.z1);
    }
    if (f.kind === 'padel') {  // glass back walls + mesh sides, net across the middle
      const glass = new THREE.MeshLambertMaterial({ color: '#bfe3f5', transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false });
      const W = f.x1 - f.x0, Dz = f.z1 - f.z0;
      for (const z of [f.z0, f.z1]) {
        const g = new THREE.Mesh(new THREE.PlaneGeometry(W, 3), glass); g.position.set(cx, 1.5, z); scene.add(g);
        col.addBox(f.x0, z - 0.1, f.x1, z + 0.1);
      }
      for (const x of [f.x0, f.x1]) {
        const g = new THREE.Mesh(new THREE.PlaneGeometry(Dz, 3), glass); g.position.set(x, 1.5, cz); g.rotation.y = Math.PI / 2; scene.add(g);
        col.addBox(x - 0.1, f.z0, x + 0.1, cz - 2); col.addBox(x - 0.1, cz + 2, x + 0.1, f.z1);  // gaps to walk in by the net
      }
      for (const [x, z] of [[f.x0, f.z0], [f.x1, f.z0], [f.x0, f.z1], [f.x1, f.z1], [f.x0, cz - 2], [f.x1, cz - 2], [f.x0, cz + 2], [f.x1, cz + 2]]) box(x, 0, z, 0.15, 3.2, 0.15, '#2b2f36');
      box(cx, 0, cz, W, 0.9, 0.05, '#222'); box(cx, 0.88, cz, W, 0.07, 0.07, '#fff');
    }
  }
  // benches & bleachers along pitches
  for (let i = 0; i < 4; i++) bench(30 + i * 14, 25.6, 4, true, '#14285a');
  for (let i = 0; i < 3; i++) bench(-52 + i * 14, 15, 4, true, '#14285a');
  for (let i = 0; i < 3; i++) bench(-115 + i * 12, -20.5, 4, true, '#14285a');

  // ---------- Perimeter fence, gate & TBS sign
  const per = BOUNDS;
  const fenceSide = (xa, za, xb, zb) => {
    const alongX = za === zb, len = alongX ? xb - xa : zb - za;
    const mx = (xa + xb) / 2, mz = (za + zb) / 2;
    if (alongX) { box(mx, 1.9, za, len, 0.08, 0.08, '#1d3b2a'); box(mx, 0.15, za, len, 0.08, 0.08, '#1d3b2a'); }
    else { box(xa, 1.9, mz, 0.08, 0.08, len, '#1d3b2a'); box(xa, 0.15, mz, 0.08, 0.08, len, '#1d3b2a'); }
    for (let s = 0; s <= len; s += 2.5) { if (alongX) box(xa + s, 0, za, 0.08, 2, 0.08, '#1d3b2a'); else box(xa, 0, za + s, 0.08, 2, 0.08, '#1d3b2a'); }
    const m = new THREE.Mesh(new THREE.PlaneGeometry(len, 1.9), new THREE.MeshLambertMaterial({ color: '#244a33', transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false }));
    m.position.set(mx, 0.95, mz); if (!alongX) m.rotation.y = Math.PI / 2; scene.add(m);
  };
  const gx0 = GATE.x0, gx1 = GATE.x1, gcx = (gx0 + gx1) / 2;
  fenceSide(per.x0, per.z0, per.x1, per.z0); fenceSide(per.x0, per.z1, gx0 - 1, per.z1); fenceSide(gx1 + 1, per.z1, per.x1, per.z1);
  fenceSide(per.x0, per.z0, per.x0, per.z1); fenceSide(per.x1, per.z0, per.x1, per.z1);
  // main entrance on General Máximo Tajes (closed gate): brick pillars + TBS sign
  box(gx0 - 0.6, 0, 85, 1.2, 3.2, 1.2, '#a0453a', true); box(gx1 + 0.6, 0, 85, 1.2, 3.2, 1.2, '#a0453a', true);
  for (let s = gx0; s < gx1; s += 0.5) box(s, 0, 85, 0.08, 2.2, 0.08, '#14285a');
  box(gcx, 2.1, 85, gx1 - gx0, 0.12, 0.12, '#14285a'); col.addBox(gx0 - 1.2, 84.8, gx1 + 1.2, 85.2);
  sign('TBS', gcx, 4.2, 85.4, 0, 6, 1.8, { w: 384, h: 112, size: 80 });
  sign('TBS', gcx, 4.2, 84.6, Math.PI, 6, 1.8, { w: 384, h: 112, size: 80 });
  // parked cars
  const cr = mulberry(21);
  const car = (x, z, ry) => {
    const c = ['#c62f35', '#f4f4f4', '#2e5aa8', '#2b2f36', '#9aa3ad', '#e0b13a'][Math.floor(cr() * 6)];
    put(GEO.box, c, x, 0.55, z, 1.8, 0.7, 3.8, ry); put(GEO.box, '#2b3a4a', x, 1.15, z, 1.6, 0.55, 2.0, ry);
    col.addBox(x - 1, z - 2, x + 1, z + 2);
  };
  for (const [x0, z0, x1, z1] of PARKING) for (let x = x0 + 1.3; x < x1 - 1; x += 2.5) { if (cr() < 0.5) car(x, z0 + 2, 0); if (cr() < 0.45) car(x, z1 - 2, 0); }

  // building name signs
  const SIGN_TEXT = { senior: 'SENIOR SCHOOL', auditorium: 'AUDITORIUM', early: 'EARLY YEARS CENTRE', junior: 'JUNIOR SCHOOL', junior2: 'JUNIOR SCHOOL', junior3: 'JUNIOR SCHOOL', pavilion: 'PAVILION', gym: 'GYMNASIUM', club: 'OB & OG CLUB', sportshouse: 'SPORTS HOUSE', store: 'MAINTENANCE' };
  for (const b of BUILDINGS) {
    const s = b.sign; if (!s) continue; const y = 3.3, t = SIGN_TEXT[b.key];
    if (s.side === 'n') sign(t, s.at, y, b.z0 - 0.75, Math.PI);
    if (s.side === 's') sign(t, s.at, y, b.z1 + 0.75, 0);
    if (s.side === 'w') sign(t, b.x0 - 0.75, y, s.at, -Math.PI / 2);
    if (s.side === 'e') sign(t, b.x1 + 0.75, y, s.at, Math.PI / 2);
  }

  // ---------- Assembly bell
  const bell = new THREE.Group();
  bell.position.set(BELL.x, 0, BELL.z);
  const bellPost = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 3.2, 8), M('#5b3418')); bellPost.position.set(-0.9, 1.6, 0);
  const bellPost2 = bellPost.clone(); bellPost2.position.x = 0.9;
  const bellBeam = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.2, 0.25), M('#5b3418')); bellBeam.position.y = 3.2;
  const bellRoof = new THREE.Mesh(new THREE.ConeGeometry(1.7, 0.8, 4), M('#b1372f')); bellRoof.position.y = 3.7; bellRoof.rotation.y = Math.PI / 4;
  const swing = new THREE.Group(); swing.position.y = 3.1;
  const bellMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.5, 0.7, 14, 1, true), new THREE.MeshLambertMaterial({ color: '#d4a52c', side: THREE.DoubleSide, emissive: '#5a3d00', emissiveIntensity: 0.3 }));
  bellMesh.position.y = -0.4; swing.add(bellMesh);
  bell.add(bellPost, bellPost2, bellBeam, bellRoof, swing); scene.add(bell);
  col.addCircle(BELL.x - 0.9, BELL.z, 0.25); col.addCircle(BELL.x + 0.9, BELL.z, 0.25);
  dynamic.bell = swing;

  // ---------- Station props
  for (const s of STATIONS) {
    const { x, z } = s;
    switch (s.id) {
      case 'recycle':
        box(x - 1.2, 0, z, 0.9, 1.1, 0.9, '#f1c40f', true); box(x, 0, z, 0.9, 1.1, 0.9, '#2e6fd0', true); box(x + 1.2, 0, z, 0.9, 1.1, 0.9, '#8c939a', true);
        sign('RECYCLE', x, 1.7, z - 0.5, Math.PI, 2.4, 0.45, { bg: '#2e8b57', border: '#fff' }); break;
      case 'chlorine': cyl(x - 1.2, 0, z, 0.4, 1.2, '#dfe6e9', true); cyl(x + 0.0, 0, z - 1.4, 0.3, 1.0, '#3fb7e0', true); break;
      case 'hockey': cyl(x, 0, z, 0.4, 0.6, '#2b2f36', true); break;
      case 'tennis': box(x + 1.4, 0, z - 0.8, 0.1, 1.4, 0.1, '#7a4b2a'); break;
      case 'skim': box(x + 2, 0, z, 0.06, 1.8, 0.06, '#d4a52c'); break;
      case 'stage': box(x + 2, 0, z, 0.8, 1.6, 0.3, '#2b2f36', true); break;
      case 'mow': box(x + 1.5, 0, z, 1.6, 0.9, 1.0, '#c0392b', true); break;
      case 'piano': box(x, 0, z - 0.6, 1.6, 1.1, 0.7, '#1a1a1a', true); box(x, 1.1, z - 0.4, 1.5, 0.05, 0.25, '#f2f2f2'); break;
      case 'books': shelf(x - 0.6, z, 2.6, false, rnd); break;
      case 'lab': box(x - 0.55, 0, z, 0.9, 1.0, 3, '#dfe6e9', true); cyl(x - 0.55, 1.0, z, 0.25, 0.3, '#9fb3c8'); break;
      case 'computers': table(x - 0.5, z, 1.0, 1.4, '#e8e4dc'); box(x - 0.75, 0.75, z, 0.1, 0.55, 0.8, '#222'); break;
      case 'projector': box(x + 0.6, 1.0, z, 0.08, 1.6, 3.2, '#ffffff'); break;
      case 'pump': box(x - 0.8, 0, z - 1.0, 1.6, 1.2, 1.0, '#555', true);
        for (let i = 0; i < 6; i++) put(GEO.sphere, '#e67e22', x - 1.3 + (i % 3) * 0.5, 1.35, z - 1.2 + Math.floor(i / 3) * 0.4, 0.36, 0.36, 0.36); break;
      case 'mats': for (let i = 0; i < 4; i++) box(x + 1.6, i * 0.18, z, 2.4, 0.16, 1.6, i % 2 ? '#2e5aa8' : '#b1372f', i === 0); break;
      case 'art': box(x - 1.2, 0, z + 0.3, 1.6, 0.9, 0.6, '#f0e1c8', true); break;
      case 'plants': for (let i = 0; i < 3; i++) { cyl(x - 1.2 + i * 1.2, 0, z + 0.2, 0.18, 0.5, '#a0453a'); put(GEO.sphere, '#3a8f3a', x - 1.2 + i * 1.2, 0.75, z + 0.2, 0.5, 0.5, 0.5); } break;
      case 'fruit': box(x + 0.4, 0, z, 1.0, 1.0, 1.6, '#c8ccd0', true); break;
      case 'toys': for (let i = 0; i < 3; i++) box(x + 1.2 + i * 1.1, 0, z - 0.6, 0.9, 0.7, 0.8, KID[i], true); break;
      case 'wifi': box(x - 0.8, 0, z, 0.6, 1.5, 0.9, '#2b2f36'); break;
    }
  }
  // fuse box & fire panels (wall-mounted)
  box(SPECIAL.fuse.x + 0.6, 1.1, SPECIAL.fuse.z, 0.2, 0.9, 0.7, '#7f8c8d');
  box(SPECIAL.fireA.x + 0.9, 1.2, SPECIAL.fireA.z, 0.15, 0.6, 0.5, '#c0392b');
  box(SPECIAL.fireB.x - 0.75, 1.2, SPECIAL.fireB.z, 0.15, 0.6, 0.5, '#c0392b');
  // staff doors (the teacher's secret shortcuts): look like plain cupboards
  for (const d of STAFF_DOORS) box(d.x, 0, d.z, 0.9, 2.1, 0.9, '#6b4f36', false);

  // ---------- Trees (Carrasco: pines, eucalyptus & plane trees)
  const avoid = [
    ...FIELDS.map(f => f.track ? [f.x0 - 8, f.z0 - 9, f.x1 + 8, f.z1 + 9] : [f.x0 - 2, f.z0 - 2, f.x1 + 2, f.z1 + 2]),
    ...BUILDINGS.map(b => [b.x0 - (b.curved ? 7 : 3), b.z0 - 3, b.x1 + 3, b.z1 + 3]),
    [POOL.deck.x0 - 2, POOL.deck.z0 - 2, POOL.deck.x1 + 2, POOL.deck.z1 + 2],
    [BELL.x - 8, BELL.z - 8, BELL.x + 8, BELL.z + 8],
    ...PATHS.map(([x0, z0, x1, z1]) => [x0 - 1, z0 - 1, x1 + 1, z1 + 1]),
    ...PARKING.map(([x0, z0, x1, z1]) => [x0 - 2, z0 - 2, x1 + 2, z1 + 2]),
    [COURTYARD.x0, COURTYARD.z0, COURTYARD.x1, COURTYARD.z1], [102, 20, 126, 41], [-11, -85, -3, -77],
    [GATE.x0 - 3, 76, GATE.x1 + 3, 90],
  ];
  const free = (x, z) => !avoid.some(a => x > a[0] && x < a[2] && z > a[1] && z < a[3]) &&
    !STATIONS.some(s => Math.hypot(s.x - x, s.z - z) < 4);
  const trees = [];
  const tr = mulberry(3);
  const tryTree = (x, z, type) => { if (free(x, z) && !trees.some(t => Math.hypot(t.x - x, t.z - z) < 2.6)) trees.push({ x, z, type, s: 0.8 + tr() * 0.6 }); };
  for (let x = -136; x <= 136; x += 4.5) { tryTree(x + tr() * 1.5, -83.5 + tr(), tr() < 0.5 ? 1 : 0); tryTree(x + tr() * 1.5, 83.5 - tr(), tr() < 0.4 ? 1 : 0); }
  for (let z = -80; z <= 80; z += 4.5) { tryTree(-137.5 + tr(), z, 1); tryTree(137.5 - tr(), z, tr() < 0.5 ? 1 : 2); }
  // tree lines between pitches (as on the campus map)
  for (let z = -76; z < 54; z += 5) { tryTree(-73 + tr() * 2, z, 0); tryTree(-68 + tr(), z, 1); tryTree(6 + tr(), z, 0); tryTree(-2 - tr(), z, 2); }
  for (let x = -125; x < -78; x += 5) tryTree(x + tr() * 2, -14 + tr() * 3, 0);
  for (let z = -75; z < 24; z += 4) { tryTree(96 + tr() * 3, z, 0); tryTree(101 + tr(), z, 2); }
  for (let x = 78; x < 134; x += 5) tryTree(x + tr() * 2, 52 + tr() * 3, 0);
  for (let i = 0; i < 900 && trees.length < 420; i++) tryTree(-136 + tr() * 272, -82 + tr() * 164, Math.floor(tr() * 3));
  const trunkGeo = new THREE.CylinderGeometry(0.18, 0.28, 1, 6);
  const crownGeo = new THREE.IcosahedronGeometry(1, 1);
  const pineGeo = new THREE.ConeGeometry(1, 1, 8);
  const trunk = new THREE.InstancedMesh(trunkGeo, M('#6b4a2f'), trees.length);
  const crowns = new THREE.InstancedMesh(crownGeo, new THREE.MeshLambertMaterial({ color: '#ffffff', flatShading: true }), trees.length * 2);
  const pines = new THREE.InstancedMesh(pineGeo, new THREE.MeshLambertMaterial({ color: '#ffffff', flatShading: true }), trees.length * 2);
  let ci = 0, pi = 0; const cc = new THREE.Color();
  trees.forEach((t, i) => {
    const th = t.type === 1 ? 5 * t.s : t.type === 2 ? 4.5 * t.s : 2.4 * t.s;
    _m.compose(_p.set(t.x, th / 2, t.z), _q.identity(), _s.set(t.s, th, t.s)); trunk.setMatrixAt(i, _m);
    col.addCircle(t.x, t.z, 0.35 * t.s);
    if (t.type === 1) { // pine
      for (let k = 0; k < 2; k++) {
        _m.compose(_p.set(t.x, th + k * 1.5 * t.s, t.z), _q.identity(), _s.set((2.2 - k * 0.7) * t.s, 3 * t.s, (2.2 - k * 0.7) * t.s));
        pines.setMatrixAt(pi, _m); pines.setColorAt(pi++, cc.set(tr() < 0.5 ? '#2f5d32' : '#3a6b38'));
      }
    } else { // broadleaf / eucalyptus
      const tall = t.type === 2;
      _m.compose(_p.set(t.x, th + (tall ? 1.6 : 1.4) * t.s, t.z), _q.setFromEuler(_e.set(0, tr() * 6, 0)), _s.set((tall ? 1.8 : 2.4) * t.s, (tall ? 2.6 : 2.0) * t.s, (tall ? 1.8 : 2.4) * t.s));
      crowns.setMatrixAt(ci, _m); crowns.setColorAt(ci++, cc.set(tall ? (tr() < 0.5 ? '#6f8f5a' : '#7f9c66') : (tr() < 0.5 ? '#3f8a3a' : '#4f9b40')));
      _m.compose(_p.set(t.x + 0.8 * t.s, th + 0.8 * t.s, t.z + 0.4 * t.s), _q.identity(), _s.set(1.5 * t.s, 1.3 * t.s, 1.5 * t.s));
      crowns.setMatrixAt(ci, _m); crowns.setColorAt(ci++, cc.set(tall ? '#87a46e' : '#56a346'));
    }
  });
  crowns.count = ci; pines.count = pi;
  scene.add(trunk, crowns, pines);

  // ---------- Neighbourhood houses (Carrasco: white houses, terracotta roofs)
  const hr = mulberry(11);
  const house = (x, z) => {
    const w = 6 + hr() * 5, d = 6 + hr() * 4, h = 3 + (hr() < 0.4 ? 3 : 0);
    box(x, 0, z, w, h, d, hr() < 0.7 ? '#f2efe8' : '#e8dcc4');
    put(GEO.cone4, hr() < 0.6 ? '#b5543a' : '#8d4a3a', x, h + 1.2, z, w, 2.4, d, Math.PI / 4);
  };
  for (let x = -165; x < 165; x += 13) { if (x < 0 || x > 50) house(x + hr() * 3, 106 + hr() * 6); house(x + hr() * 3, -106 - hr() * 6); }
  for (let z = -80; z < 85; z += 13) { house(162 + hr() * 4, z); house(-163 - hr() * 4, z); }

  // Innovation Hub, across Máximo Tajes (not part of the game area)
  box(25, 0, 108, 16, 6.6, 18, '#c8664a'); box(25, 6.6, 108, 16.6, 0.4, 18.6, '#efe6d6');
  for (let x = 19; x < 32; x += 3.6) { box(x, 1.2, 98.9, 2.2, 1.3, 0.2, '#6d9ec4'); box(x, 4.2, 98.9, 2.2, 1.3, 0.2, '#6d9ec4'); }
  sign('INNOVATION HUB', 25, 7.6, 98.6, 0, 7, 1.2);
  // Arias toilets by the Arias gate
  box(-7, 0, -81, 6, 3, 5, '#c8664a', true); box(-7, 3, -81, 6.6, 0.3, 5.6, '#3a3f47');
  sign('ARIAS WC', -7, 2.2, -78.4, 0, 2.6, 0.5);

  B.build(scene);

  return {
    col,
    dynamic,
    collide: (p, r) => col.resolve(p, r),
    update(t) {
      for (const w of dynamic.water) w.material.emissiveIntensity = 0.3 + Math.sin(t * 1.5) * 0.08;
    },
    ringBell(t) { dynamic.bell.userData.ring = t; },
    animateBell(t) {
      const r = dynamic.bell.userData.ring;
      dynamic.bell.rotation.z = r && t - r < 3 ? Math.sin((t - r) * 14) * 0.5 * (1 - (t - r) / 3) : 0;
    },
    mapCanvas: gt.canvas,
  };
}
