// The TBS campus, laid out from the official 2025 campus map + floor plans
// (squashed so it's quick to run across). 1 unit ≈ 1.6 m.
// x = Beranger (west) → Havre (east), z = Arias (north) → Máximo Tajes (south, the main road).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const BOUNDS = { x0: -140, z0: -85, x1: 140, z1: 85 };
export const BELL = { x: 88, z: -2 };

export const FIELDS = [
  { key: 'r2', kind: 'rugby', x0: -132, z0: -78, x1: -84, z1: -18 },
  { key: 'f1', kind: 'football', x0: -132, z0: -10, x1: -84, z1: 46 },
  { key: 'r1', kind: 'rugby', x0: -62, z0: -70, x1: -18, z1: -24, track: true },
  { key: 'multi', kind: 'synthetic', x0: -66, z0: -4, x1: -8, z1: 42 },
  { key: 'h1', kind: 'hockey', x0: 16, z0: -78, x1: 78, z1: -42 },
  { key: 'f2', kind: 'football', x0: 16, z0: -34, x1: 78, z1: 2 },
  { key: 'tennis', kind: 'tennis', x0: -62, z0: 54, x1: -32, z1: 78 },
  { key: 'padel', kind: 'padel', x0: -76, z0: 56, x1: -66, z1: 76 },
];

// small pool right next to the Pavilion
export const POOL = {
  deck: { x0: 33, z0: 16, x1: 49, z1: 36 },
  water: [{ x0: 36, z0: 20, x1: 45, z1: 32 }],
};

// Buildings: exterior rect, doors {side, at}, interior walls [xa,za,xb,zb,[doorAts]], rooms.
export const BUILDINGS = [
  {
    key: 'senior', x0: 112, z0: -55, x1: 132, z1: 22, h: 6.8, levels: 2,
    doors: [{ side: 'n', at: 122 }, { side: 's', at: 122 }, { side: 'w', at: -17 }],
    inner: [
      [120, -55, 120, 22, [-42, -12, 9]],
      [124, -55, 124, 22, [-40, -12, 11]],
      [112, -30, 120, -30], [112, -5, 120, -5],
      [124, -25, 132, -25], [124, 0, 132, 0],
    ],
    rooms: [
      { key: 'library', x0: 112, z0: -55, x1: 120, z1: -30, floor: '#b98b5e' },
      { key: 'lab', x0: 112, z0: -30, x1: 120, z1: -5, floor: '#d9dde0' },
      { key: 'office', x0: 112, z0: -5, x1: 120, z1: 22, floor: '#7b2d3a' },
      { key: 'corridor', x0: 120, z0: -55, x1: 124, z1: 22, floor: '#c9b48f' },
      { key: 'computer', x0: 124, z0: -55, x1: 132, z1: -25, floor: '#c4d3e0' },
      { key: 'class1', x0: 124, z0: -25, x1: 132, z1: 0, floor: '#cdbb98' },
      { key: 'staff', x0: 124, z0: 0, x1: 132, z1: 22, floor: '#a8b5a0' },
    ],
    sign: { side: 'w', at: -17 },
  },
  {
    key: 'auditorium', x0: 112, z0: -72, x1: 132, z1: -58, h: 5.5, wall: '#f4f1ea',
    doors: [{ side: 's', at: 122 }, { side: 'w', at: -65 }],
    rooms: [{ key: 'auditorium', x0: 112, z0: -72, x1: 132, z1: -58, floor: '#8a5a3c' }],
    sign: { side: 'w', at: -65 },
  },
  {  // EYC: the curved glass building at the west end of the Junior School, 3 levels
    key: 'early', x0: 52, z0: 12, x1: 70, z1: 42, h: 9.6, levels: 3, wall: '#fbeee0', curved: 'w',
    doors: [{ side: 'n', at: 61 }, { side: 'e', at: 30 }, { side: 's', at: 61 }],
    rooms: [{ key: 'early', x0: 52, z0: 12, x1: 70, z1: 42, floor: '#f6c9a9' }],
    sign: { side: 'n', at: 61 },
  },
  {  // Junior School main wing, along Máximo Tajes
    key: 'junior', x0: 70, z0: 44, x1: 126, z1: 68, h: 6.8, levels: 2,
    doors: [{ side: 'w', at: 56 }, { side: 'e', at: 56 }, { side: 'n', at: 77 }, { side: 'n', at: 105 }, { side: 'n', at: 122 }, { side: 's', at: 83 }],
    inner: [
      [70, 54, 126, 54, [77, 91, 105, 119]],
      [70, 58, 126, 58, [83, 104, 119]],
      [84, 44, 84, 54], [98, 44, 98, 54], [112, 44, 112, 54],
      [96, 58, 96, 68], [112, 58, 112, 68],
    ],
    rooms: [
      { key: 'classJ1', x0: 70, z0: 44, x1: 84, z1: 54, floor: '#cfe0c3' },
      { key: 'classJ2', x0: 84, z0: 44, x1: 98, z1: 54, floor: '#e3d4a8' },
      { key: 'class2', x0: 98, z0: 44, x1: 112, z1: 54, floor: '#cfe0c3' },
      { key: 'class3', x0: 112, z0: 44, x1: 126, z1: 54, floor: '#e3d4a8' },
      { key: 'jcorridor', x0: 70, z0: 54, x1: 126, z1: 58, floor: '#c9b48f' },
      { key: 'dining', x0: 70, z0: 58, x1: 96, z1: 68, floor: '#e0d5c0' },
      { key: 'art', x0: 96, z0: 58, x1: 112, z1: 68, floor: '#e8d9c4' },
      { key: 'music', x0: 112, z0: 58, x1: 126, z1: 68, floor: '#b9a2c9' },
    ],
    sign: { side: 'n', at: 91 },
  },
  {  // Junior School north wing (hall + staff room) round the palm courtyard
    key: 'junior2', x0: 92, z0: 12, x1: 108, z1: 40, h: 6.8, levels: 2,
    doors: [{ side: 'w', at: 21 }, { side: 'n', at: 100 }, { side: 's', at: 100 }],
    inner: [[92, 28, 108, 28, [100]]],
    rooms: [
      { key: 'hall', x0: 92, z0: 12, x1: 108, z1: 28, floor: '#c49a6c' },
      { key: 'jstaff', x0: 92, z0: 28, x1: 108, z1: 40, floor: '#a8b5a0' },
    ],
    sign: { side: 'n', at: 100 },
  },
  {
    key: 'pavilion', x0: 10, z0: 18, x1: 30, z1: 34, h: 3.4, wall: '#e9e4da',
    doors: [{ side: 'n', at: 16 }, { side: 's', at: 26 }],
    inner: [[22, 18, 22, 34, [26]]],
    rooms: [
      { key: 'pavilion', x0: 10, z0: 18, x1: 22, z1: 34, floor: '#b48a62' },
      { key: 'changing', x0: 22, z0: 18, x1: 30, z1: 34, floor: '#cfd8dc' },
    ],
    sign: { side: 'n', at: 16 },
  },
  {
    key: 'sportshouse', x0: 16, z0: 50, x1: 42, z1: 74, h: 6.8, levels: 2, wall: '#efe6d6',
    doors: [{ side: 'n', at: 24 }, { side: 'e', at: 62 }],
    inner: [[32, 50, 32, 74, [62]]],
    rooms: [
      { key: 'fitness', x0: 16, z0: 50, x1: 32, z1: 74, floor: '#9aa7b0' },
      { key: 'sportsoffice', x0: 32, z0: 50, x1: 42, z1: 74, floor: '#c4d3e0' },
    ],
    sign: { side: 'n', at: 24 },
  },
  {
    key: 'gym', x0: -24, z0: 50, x1: 10, z1: 78, h: 7, wall: '#f1efe9',
    doors: [{ side: 'n', at: -16 }, { side: 'n', at: 5 }, { side: 'e', at: 64 }],
    inner: [[-7, 50, -7, 78, [64]]],
    rooms: [
      { key: 'gymA', x0: -24, z0: 50, x1: -7, z1: 78, floor: '#d7a35f' },
      { key: 'gymB', x0: -7, z0: 50, x1: 10, z1: 78, floor: '#cf9a55' },
    ],
    sign: { side: 'n', at: -7 },
  },
  {
    key: 'club', x0: -112, z0: 52, x1: -86, z1: 70, h: 3.4, wall: '#efe6d6',
    doors: [{ side: 'n', at: -99 }, { side: 'e', at: 61 }],
    rooms: [{ key: 'club', x0: -112, z0: 52, x1: -86, z1: 70, floor: '#b48a62' }],
    sign: { side: 'n', at: -99 },
  },
  {  // the building on the Beranger / Máximo Tajes corner
    key: 'store', x0: -132, z0: 56, x1: -118, z1: 76, h: 3.4, wall: '#e9e4da',
    doors: [{ side: 'e', at: 66 }, { side: 'n', at: -125 }],
    rooms: [{ key: 'store', x0: -132, z0: 56, x1: -118, z1: 76, floor: '#9e9a92' }],
    sign: { side: 'e', at: 66 },
  },
];

export const ROOMS = BUILDINGS.flatMap(b => b.rooms);
const bRect = k => { const b = BUILDINGS.find(o => o.key === k); return { x0: b.x0, z0: b.z0, x1: b.x1, z1: b.z1 }; };
// Outdoor "areas" for orders / the map
export const AREAS = [
  ...FIELDS.map(f => ({ key: f.key, x0: f.x0, z0: f.z0, x1: f.x1, z1: f.z1 })),
  { key: 'pool', ...POOL.deck },
  { key: 'gym', ...bRect('gym') },
  { key: 'courtyard', x0: 70, z0: 12, x1: 92, z1: 44 },
  ...ROOMS,
];

export function roomAt(x, z) {
  for (const r of ROOMS) if (x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1) return r.key;
  if (x >= POOL.deck.x0 && x <= POOL.deck.x1 && z >= POOL.deck.z0 && z <= POOL.deck.z1) return 'pool';
  for (const f of FIELDS) if (x >= f.x0 && x <= f.x1 && z >= f.z0 && z <= f.z1) return f.key;
  if (x >= 70 && x <= 92 && z >= 12 && z <= 44) return 'courtyard';
  return 'outside';
}

// Sandy paths (also kept clear of trees) and car parks
export const PATHS = [
  [-138, 78, 138, 82], [-138, -82, 138, -78], [-138, -82, -134, 82], [134, -82, 138, 82],   // round the edge
  [-134, -14, 2, -10],       // between the rugby pitches and the football / multipurpose
  [-80, -78, -76, 50],       // Beranger side
  [2, -82, 8, 50],           // from the Arias gate down to the Gymnasium
  [2, 6, 112, 10],           // past Football 2 to the Senior School
  [-80, 46, 2, 50],          // in front of the Club and the courts
  [100, -78, 110, 10],       // in front of the Senior School
  [44, 36, 50, 85],          // Casales gate
  [8, 36, 44, 40], [8, 10, 12, 18], [30, 10, 34, 50],
  [110, -60, 134, -56],
];
export const PARKING = [[72, 71, 126, 77], [-112, 72, -84, 78]];
export const COURTYARD = { x0: 70, z0: 12, x1: 92, z1: 44 };

// Maintenance task stations
export const STATIONS = [
  { id: 'recycle', game: 'sort', set: 'recycle', x: 78, z: 41, icon: '♻️' },
  { id: 'books', game: 'sort', set: 'books', x: 113.4, z: -47, icon: '📚' },
  { id: 'lab', game: 'simon', set: 'lab', x: 113.5, z: -8, icon: '🧪' },
  { id: 'projector', game: 'wires', set: 'projector', x: 131, z: -6, icon: '📽️' },
  { id: 'stage', game: 'wires', set: 'stage', x: 122, z: -67.6, icon: '💡' },
  { id: 'skim', game: 'collect', set: 'leaves', x: 46.5, z: 33, icon: '🍂' },
  { id: 'chlorine', game: 'gauge', set: 'chlorine', x: 35, z: 18, icon: '🧴' },
  { id: 'pump', game: 'hold', set: 'pump', x: -21.5, z: 53, icon: '🏀' },
  { id: 'mats', game: 'sequence', set: 'mats', x: 7, z: 75.5, icon: '🤸' },
  { id: 'hockey', game: 'collect', set: 'hockey', x: 47, z: -60, icon: '🏑' },
  { id: 'rugby', game: 'sequence', set: 'rugby', x: -108, z: -75.5, icon: '🏉' },
  { id: 'tennis', game: 'sweep', set: 'clay', x: -47, z: 60, icon: '🎾' },
  { id: 'tables', game: 'sweep', set: 'table', x: 88, z: 63, icon: '🧽' },
  { id: 'fruit', game: 'sort', set: 'fruit', x: 94.2, z: 66, icon: '🍎' },
  { id: 'plants', game: 'hold', set: 'water', x: 103, z: 45.6, icon: '🪴' },
  { id: 'art', game: 'sort', set: 'art', x: 98.5, z: 66.5, icon: '🎨' },
  { id: 'computers', game: 'sequence', set: 'computers', x: 130.4, z: -40, icon: '💻' },
  { id: 'toys', game: 'collect', set: 'toys', x: 55, z: 15, icon: '🧸' },
  { id: 'wifi', game: 'wires', set: 'wifi', x: -130.4, z: 72, icon: '📶' },
  { id: 'mow', game: 'sweep', set: 'grass', x: -4, z: -40, icon: '🌱' },
  { id: 'piano', game: 'simon', set: 'piano', x: 118, z: 64.4, icon: '🎹' },
];

export const SPECIAL = {
  fuse: { x: 29.3, z: 31 },
  fireA: { x: 9.1, z: 72 },
  fireB: { x: 121, z: -20 },
  office: { x: 117, z: 4 },
};

export const STAFF_DOORS = [
  { x: 125, z: 20.8, room: 'staff' },
  { x: 131, z: -67.2, room: 'auditorium' },
  { x: -22.5, z: 76.5, room: 'gymA' },
  { x: -119.2, z: 74.5, room: 'store' },
  { x: -110.6, z: 53.6, room: 'club' },
  { x: 110.6, z: 66.6, room: 'art' },
];

export const GATE = { x0: 43, x1: 51 };

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
  const sand = '#d8c694';
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
  R(119, 22, 125, 44, '#cdbf9d');
  // running track round Rugby 1
  for (const f of FIELDS) if (f.track) {
    const x0 = f.x0 - 6, z0 = f.z0 - 7, x1 = f.x1 + 6, z1 = f.z1 + 7, r = (x1 - x0) / 2;
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
  // ---------- Senior School (the long building on the east)
  // Library
  for (let i = 0; i < 4; i++) shelf(112.5, -52 + i * 3.4, 2.8, false, rnd);
  shelf(116, -54.6, 6, true, rnd);
  table(116.5, -38, 2.6, 1.3, '#c49a6c'); table(116.5, -34, 2.6, 1.3, '#c49a6c');
  sign('LIBRARY', 120.2, 3.0, -42, R90, 2.6, 0.5);
  // Science lab
  box(116, 0, -23, 1.2, 0.9, 6, '#2b2f36', true); box(116, 0.9, -23, 1.25, 0.06, 6, '#e8ecef');
  box(116, 0, -10.5, 1.2, 0.9, 4, '#2b2f36', true); box(116, 0.9, -10.5, 1.25, 0.06, 4, '#e8ecef');
  box(112.6, 0, -25, 1.0, 1.0, 6, '#dfe6e9', true);          // sink counter
  sign('SCIENCE LAB', 120.2, 3.0, -12, R90, 3.2, 0.5);
  // Headmistress's office
  box(116, 0.02, 12, 6, 0.04, 6, '#b1372f');                  // rug
  table(115, 13, 1.4, 3.4, '#5b3418', 0.82);                  // big desk
  box(113.5, 0, 13, 0.8, 1.5, 0.9, '#7b2d3a');                // leather chair
  shelf(116, 21.6, 6, true, rnd);
  shelf(112.5, 3, 5, false, rnd);
  sign('HEADMISTRESS', 120.2, 3.0, 9, R90, 3.2, 0.5);
  {  // green banner with the TBS crest behind her desk
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.4), new THREE.MeshLambertMaterial({ color: '#155c2e' }));
    banner.position.set(112.34, 1.9, 13); banner.rotation.y = R90; scene.add(banner);
    const ct = new THREE.TextureLoader().load('assets/badge.svg'); ct.colorSpace = THREE.SRGBColorSpace;
    const crest = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.32), new THREE.MeshBasicMaterial({ map: ct, transparent: true }));
    crest.position.set(112.37, 2.05, 13); crest.rotation.y = R90; scene.add(crest);
  }
  // Computer room
  for (let i = 0; i < 4; i++) { table(130.4, -52 + i * 3.5, 1.6, 1.0, '#e8e4dc'); box(130.6, 0.75, -52 + i * 3.5, 0.1, 0.55, 0.8, '#222'); }
  for (let i = 0; i < 3; i++) { table(126.2, -50 + i * 4, 1.6, 1.0, '#e8e4dc'); box(126.0, 0.75, -50 + i * 4, 0.1, 0.55, 0.8, '#222'); }
  sign('COMPUTERS', 123.8, 3.0, -40, -R90, 3, 0.5);
  // Classroom 1
  for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) desk(126.5 + c * 3, -21 + r * 5, -R90);
  box(131.8, 1.0, -9, 0.08, 1.6, 5, '#ffffff');               // whiteboard
  sign('CLASSROOM 1', 123.8, 3.0, -12, -R90, 3.2, 0.5);
  // Staff room
  box(128, 0, 19, 4, 0.8, 1.4, '#7b2d3a', true);              // sofa
  table(128, 16, 2, 1, '#5b3418', 0.45);
  box(131.4, 0, 6, 0.8, 0.95, 5, '#dfe6e9', true);            // kitchenette
  box(131.4, 0, 2.2, 0.8, 1.9, 0.8, '#c8ccd0', true);         // fridge
  sign('STAFF ROOM', 123.8, 3.0, 11, -R90, 3.2, 0.5);

  // ---------- Auditorium (north end of the Senior School)
  box(122, 0, -70, 18, 0.9, 3.5, '#6e4128', true);            // stage
  box(122, 0.9, -71.75, 18, 4.2, 0.2, '#8e1b2a');             // curtain
  for (let r = 0; r < 4; r++) for (const cx of [117.25, 126.75]) {
    box(cx, 0, -66.5 + r * 1.7, 7.5, 0.55, 0.7, '#b1372f', true);
    box(cx, 0.55, -66.2 + r * 1.7, 7.5, 0.5, 0.12, '#8e1b2a');
  }
  box(122, 4.8, -67, 18, 0.3, 0.3, '#222');                   // lighting rig
  for (let i = 0; i < 6; i++) box(114 + i * 3.2, 4.4, -67, 0.4, 0.4, 0.4, '#333');

  // ---------- Early Years Centre (curved glass front on the west)
  for (let i = 0; i < 5; i++) box(55 + i * 3.2, 0, 13.2, 1.4, 0.7, 0.8, ['#e74c3c', '#f1c40f', '#3498db', '#2ecc71', '#9b59b6'][i], true);
  for (let i = 0; i < 6; i++) box(56 + (i % 3) * 3, 0.02, 22 + Math.floor(i / 3) * 3, 2.6, 0.05, 2.6, ['#f1c40f', '#e74c3c', '#3498db', '#2ecc71', '#e67e22', '#9b59b6'][i]);
  for (let i = 0; i < 4; i++) table(66, 16 + i * 5, 1.4, 0.9, '#f5d76e', 0.5);
  box(53, 0, 36, 0.6, 1.2, 6, '#c49a6c', true);               // cubbies
  {  // glass bulge in front of the west wall (looks like the curved EYC façade)
    const glass = new THREE.MeshLambertMaterial({ color: '#bfe3f5', transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false });
    const cx = 54.75, cz = 27, rx = 5.1, rz = 17, a0 = -Math.PI * 0.82, a1 = -Math.PI * 0.18;
    const arc = new THREE.Mesh(new THREE.CylinderGeometry(rz, rz, 9.4, 32, 1, true, a0, a1 - a0), glass);
    arc.position.set(cx, 4.7, cz); arc.scale.set(rx / rz, 1, 1); scene.add(arc);
    for (let a = a0; a <= a1 + 0.01; a += (a1 - a0) / 10) {      // mullions + collision along the curve
      const x = cx + Math.sin(a) * rx, z = cz + Math.cos(a) * rz;
      box(x, 0, z, 0.2, 9.4, 0.2, '#e9eef2'); col.addCircle(x, z, 0.3);
    }
  }

  // ---------- Junior School: classrooms, dining hall, art, music
  for (const [x0, rot] of [[70, 0], [84, 0], [98, 0], [112, 0]]) {
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) desk(x0 + 3 + c * 4, 47.2 + r * 2.8, rot);
    box(x0 + 7, 1.0, 44.2, 6, 1.6, 0.08, '#ffffff');           // whiteboard
  }
  for (let i = 0; i < 3; i++) { cyl(101.5 + i * 1.2, 0, 44.6, 0.18, 0.5, '#a0453a'); put(GEO.sphere, '#3a8f3a', 101.5 + i * 1.2, 0.75, 44.6, 0.5, 0.5, 0.5); }
  sign('JUNIOR A', 77, 3.0, 53.8, Math.PI, 2.4, 0.5); sign('JUNIOR B', 91, 3.0, 53.8, Math.PI, 2.4, 0.5);
  sign('CLASSROOM 2', 105, 3.0, 53.8, Math.PI, 3.2, 0.5); sign('CLASSROOM 3', 119, 3.0, 53.8, Math.PI, 3.2, 0.5);
  // Dining hall
  for (const x of [76, 83]) for (const z of [61.5, 65]) { table(x, z, 5, 1.1, '#e8e4dc'); bench(x, z - 1, 5, true, '#2e5aa8'); bench(x, z + 1, 5, true, '#2e5aa8'); }
  box(95.3, 0, 61.5, 1.0, 1.0, 3, '#c8ccd0', true);            // serving counter
  sign('DINING HALL', 83, 3.0, 58.2, 0, 3.6, 0.6);
  // Art room
  for (let i = 0; i < 2; i++) table(102 + i * 5.5, 63, 3.4, 1.6, '#f0e1c8');
  for (let i = 0; i < 3; i++) box(100 + i * 3.5, 0, 67.3, 1.1, 1.6, 0.2, '#c49a6c');   // easels
  sign('ART', 104, 3.0, 58.2, 0, 1.8, 0.5);
  // Music room
  box(118, 0, 66.6, 1.6, 1.1, 0.8, '#1a1a1a', true);           // piano
  box(118, 1.1, 66.4, 1.5, 0.05, 0.25, '#f2f2f2');
  for (let i = 0; i < 6; i++) box(114 + (i % 3) * 2.5, 0, 60.5 + Math.floor(i / 3) * 2.5, 0.5, 0.45, 0.5, '#2e5aa8');
  sign('MUSIC', 119, 3.0, 58.2, 0, 2.2, 0.5);
  // North wing: hall + staff room
  box(100, 0, 13.4, 10, 0.6, 2.4, '#6e4128', true);            // little stage
  for (let r = 0; r < 4; r++) bench(100, 18 + r * 2.4, 8, true, '#14285a');
  sign('HALL', 100, 3.0, 27.8, Math.PI, 2.2, 0.5);
  box(104, 0, 38.6, 5, 0.8, 1.4, '#7b2d3a', true);             // sofa
  table(104, 35.5, 2, 1, '#5b3418', 0.45);
  box(92.6, 0, 33, 0.8, 0.95, 5, '#dfe6e9', true);             // kitchenette
  sign('STAFF ROOM', 100, 3.0, 28.2, 0, 3.2, 0.5);
  // palm courtyard with a little playground
  const palm = (x, z) => {
    for (let i = 0; i < 6; i++) put(GEO.cyl, '#8a6a45', x + i * 0.08, 0.5 + i, z, 0.45 - i * 0.03, 1.02, 0.45 - i * 0.03);
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; put(GEO.box, '#3f8f3a', x + 0.5 + Math.cos(a) * 1.3, 6.1, z + Math.sin(a) * 1.3, 2.8, 0.12, 0.7, -a, 0, -0.35); }
    col.addCircle(x, z, 0.35);
  };
  palm(76, 20); palm(86, 31); palm(77, 37); palm(88, 16);
  box(82, 0, 22, 1.4, 2.2, 1.4, '#e74c3c', true); put(GEO.box, '#f1c40f', 82, 1.2, 25, 1.0, 0.12, 4.4, 0, -0.5);   // slide
  for (const x of [72, 75]) { box(x, 0, 27, 0.15, 2.4, 0.15, '#2e5aa8'); }
  box(73.5, 2.4, 27, 3.4, 0.15, 0.15, '#2e5aa8'); box(73.5, 0.6, 27, 0.8, 0.08, 0.4, '#f1c40f');           // swing
  // glass walkway from the Junior School to the Senior School
  {
    const glass = new THREE.MeshLambertMaterial({ color: '#bfe3f5', transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false });
    box(122, 2.9, 33, 5, 0.18, 22, '#e9eef2');
    for (let z = 23; z < 44; z += 4) for (const x of [119.6, 124.4]) cyl(x, 0, z, 0.1, 2.9, '#e9eef2', true);
    for (const x of [119.6, 124.4]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(22, 1.6), glass); m.position.set(x, 2, 33); m.rotation.y = Math.PI / 2; scene.add(m); }
  }

  // ---------- Pavilion (hall + changing rooms)
  for (let i = 0; i < 3; i++) box(10.6, 0, 22 + i * 2.2, 0.6, 2, 2, '#d4a52c', true);   // trophy cases
  box(16, 0, 32.8, 6, 1.0, 1.0, '#5b3418', true);              // tea bar
  bench(16, 26, 6);
  for (let i = 0; i < 8; i++) box(23.2 + (i % 4) * 1.8, 0, i < 4 ? 18.6 : 33.4, 1.1, 2.0, 0.7, i % 2 ? '#b1372f' : '#2e5aa8', true);
  bench(26, 22.5, 4, false); 
  sign('CHANGING ROOMS', 22.2, 3.0, 22, R90, 3.6, 0.5);

  // ---------- Sports House (fitness room + sports office)
  for (let i = 0; i < 3; i++) { box(19 + i * 4, 0, 72, 1.0, 1.2, 2.2, '#2b2f36', true); box(19 + i * 4, 1.2, 71.2, 0.8, 0.5, 0.1, '#4dabf7'); }   // treadmills
  for (let i = 0; i < 3; i++) { box(19 + i * 4, 0, 56, 1.8, 0.45, 0.6, '#b1372f', true); box(19 + i * 4, 0.45, 56, 2.4, 0.06, 0.06, '#888'); }   // benches + bars
  box(16.6, 0, 64, 0.6, 2.2, 8, '#dfe6e9');                    // mirror wall
  for (let i = 0; i < 4; i++) box(24 + i * 1.6, 0.02, 64, 1.2, 0.04, 2.6, ['#2e5aa8', '#b1372f', '#2fa35a', '#d4a52c'][i]);   // yoga mats
  table(37, 56, 3, 1.4, '#5b3418'); box(37, 0, 54.8, 0.8, 1.3, 0.8, '#14285a');
  shelf(41.5, 66, 6, false, rnd);
  sign('SPORTS OFFICE', 32.2, 3.0, 56, R90, 3.4, 0.5);

  // ---------- Gymnasium (three basketball courts, halls A & B)
  for (const x of [-15.5, 1.5]) for (const z of [50.5, 77.5]) { box(x, 2.8, z + (z < 60 ? 0.4 : -0.4), 1.8, 1.1, 0.08, '#fff'); box(x, 2.6, z + (z < 60 ? 0.9 : -0.9), 0.5, 0.05, 0.5, '#e67e22'); }
  for (let i = 0; i < 4; i++) box(7, i * 0.18, 75.8, 2.4, 0.16, 1.6, i % 2 ? '#2e5aa8' : '#b1372f', i === 0);
  box(-22, 0, 51.4, 1.6, 1.2, 1.0, '#555', true);              // ball cage
  for (let i = 0; i < 6; i++) put(GEO.sphere, '#e67e22', -22.5 + (i % 3) * 0.5, 1.35, 51.2 + Math.floor(i / 3) * 0.4, 0.36, 0.36, 0.36);
  for (let i = 0; i < 10; i++) box(-23.7, 0, 56 + i * 1.6, 0.1, 3.2, 0.1, '#c49a6c');   // wall bars
  for (let i = 0; i < 8; i++) box(-23.6, 0.3 + i * 0.38, 63.2, 0.1, 0.05, 14.4, '#c49a6c');
  sign('A', -15.5, 5.2, 50.2, 0, 1.4, 1.4, { w: 128, h: 128, size: 90 }); sign('B', 1.5, 5.2, 50.2, 0, 1.4, 1.4, { w: 128, h: 128, size: 90 });

  // ---------- OBC / OGC Club
  box(-87.4, 0, 61, 1.2, 1.1, 8, '#5b3418', true);             // bar counter
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) table(-106 + i * 6, 57 + j * 7, 2, 2, '#c49a6c');
  for (let i = 0; i < 3; i++) box(-111.4, 0, 56 + i * 2.6, 0.6, 2, 2, '#d4a52c', true); // trophy cases
  bench(-100, 69.4, 8, true, '#14285a');
  // ---------- Maintenance store (corner building)
  box(-125, 0, 75.3, 8, 0.95, 1, '#6b4f36', true);             // workbench
  box(-121, 0, 60, 2.2, 1.0, 1.4, '#c0392b', true);            // ride-on mower
  box(-131.2, 0, 72, 0.6, 1.5, 0.9, '#2b2f36');                // network cabinet
  shelf(-131.4, 62, 6, false, rnd);

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
  for (let i = 1; i < 3; i++) box(36 + i * 3, 0.08, 26, 0.12, 0.12, 12, i % 2 ? '#b1372f' : '#ffffff');
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
  fenceLine(33, 16, 49, 16, [40]); fenceLine(33, 36, 49, 36, [40]); fenceLine(49, 16, 49, 36); fenceLine(33, 16, 33, 36, [26]);

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
  for (let i = 0; i < 4; i++) bench(28 + i * 12, 4.2, 4, true, '#14285a');
  for (let i = 0; i < 3; i++) bench(-52 + i * 12, 44.5, 4, true, '#14285a');
  for (let i = 0; i < 3; i++) bench(-120 + i * 12, -15.8, 4, true, '#14285a');

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
  const SIGN_TEXT = { senior: 'SENIOR SCHOOL', auditorium: 'AUDITORIUM', early: 'EARLY YEARS CENTRE', junior: 'JUNIOR SCHOOL', junior2: 'JUNIOR SCHOOL', pavilion: 'PAVILION', gym: 'GYMNASIUM', club: 'OB & OG CLUB', sportshouse: 'SPORTS HOUSE', store: 'MAINTENANCE' };
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
    [COURTYARD.x0, COURTYARD.z0, COURTYARD.x1, COURTYARD.z1], [118, 20, 126, 46], [-6, -80, 2, -70],
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
  for (let z = -76; z < 46; z += 5) { tryTree(-81.5 + tr(), z, 1); tryTree(-74 + tr(), z, 0); tryTree(10.5 + tr(), z, 0); tryTree(-0.5 - tr(), z, 2); }
  for (let x = -130; x < 0; x += 5) tryTree(x + tr() * 2, -8 + tr(), 0);
  for (let x = 16; x < 80; x += 5) tryTree(x + tr() * 2, -38 + tr(), 2);
  for (let z = -75; z < 10; z += 4) { tryTree(82 + tr() * 2, z, 0); tryTree(111 + tr(), z, 2); }
  for (let x = -78; x < 0; x += 6) tryTree(x + tr() * 2, 52 + tr() * 2, 0);
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
  for (let x = -165; x < 165; x += 13) { if (x < 52 || x > 98) house(x + hr() * 3, 106 + hr() * 6); house(x + hr() * 3, -106 - hr() * 6); }
  for (let z = -80; z < 85; z += 13) { house(162 + hr() * 4, z); house(-163 - hr() * 4, z); }

  // Innovation Hub, across Máximo Tajes (not part of the game area)
  box(75, 0, 110, 22, 6.6, 16, '#c8664a'); box(75, 6.6, 110, 22.6, 0.4, 16.6, '#efe6d6');
  for (let x = 66; x < 85; x += 3.6) { box(x, 1.2, 101.9, 2.2, 1.3, 0.2, '#6d9ec4'); box(x, 4.2, 101.9, 2.2, 1.3, 0.2, '#6d9ec4'); }
  sign('INNOVATION HUB', 75, 7.6, 101.6, 0, 7, 1.2);
  // Arias toilets by the Arias gate
  box(-2, 0, -75, 4, 3, 6, '#c8664a', true); box(-2, 3, -75, 4.6, 0.3, 6.6, '#3a3f47');
  sign('ARIAS WC', 0.2, 2.2, -75, Math.PI / 2, 2.6, 0.5);

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
