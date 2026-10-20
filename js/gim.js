// Gimkit-style round characters ("gims") wearing the green TBS uniform.
import * as THREE from 'three';

export const COLORS = [
  '#ffcf9e', '#f2b48a', '#d9965f', '#a8693f', '#7a4a2a', // skin-ish tones
  '#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#9775fa', '#f783ac',
];

// price in ⭐ (0 = unlocked from the start)
export const ITEMS = {
  hat: [
    { id: 'none', price: 0 }, { id: 'boater', price: 0 }, { id: 'cap', price: 0 }, { id: 'beanie', price: 0 },
    { id: 'bow', price: 15 }, { id: 'headphones', price: 25 }, { id: 'mortarboard', price: 40 }, { id: 'crown', price: 80 },
  ],
  hair: [
    { id: 'none', price: 0 }, { id: 'ponytail', price: 0 }, { id: 'bob', price: 0 }, { id: 'bun', price: 10 },
  ],
  outfit: [
    { id: 'jumper', price: 0 }, { id: 'blazer', price: 0 }, { id: 'hmblazer', price: 0 }, { id: 'pe', price: 0 },
    { id: 'hoodie', price: 20 }, { id: 'gown', price: 40 }, { id: 'lab', price: 30 },
  ],
  acc: [
    { id: 'none', price: 0 }, { id: 'glasses', price: 0 }, { id: 'earrings', price: 0 }, { id: 'backpack', price: 10 },
    { id: 'scarf', price: 15 }, { id: 'medal', price: 35 }, { id: 'flower', price: 10 },
  ],
  // the official uniforms (from the uniform guide) — worn as the outfit
  uniform: [
    { id: 'u_junior', price: 0 }, { id: 'u_juniorG', price: 0 }, { id: 'u_senior', price: 0 }, { id: 'u_seniorG', price: 0 },
    { id: 'u_y11', price: 0 }, { id: 'u_y11G', price: 0 }, { id: 'u_summer', price: 0 }, { id: 'u_jumper', price: 0 },
  ],
  // PE, house T-shirts and the sports kits — also worn as the outfit
  kit: [
    { id: 'k_pe', price: 0 }, { id: 'k_track', price: 0 },
    { id: 'k_houseBlue', price: 0 }, { id: 'k_houseRed', price: 0 }, { id: 'k_houseGreen', price: 0 },
    { id: 'k_rugby', price: 0 }, { id: 'k_rugby19', price: 0 }, { id: 'k_football', price: 0 }, { id: 'k_footballG', price: 0 },
    { id: 'k_volley', price: 0 }, { id: 'k_hockey', price: 0 }, { id: 'k_hockey18', price: 0 }, { id: 'k_basket', price: 0 }, { id: 'k_handball', price: 0 },
  ],
};

const GREEN = '#1f7a3f', GREEN_DARK = '#155c2e', GOLD = '#e0b13a', WHITE = '#ffffff';
const NAVY = '#1d2f5a', GREY = '#8d9196', RED = '#c0392b';
// top: shirt colour · pattern: [kind, colour] · bottom: trousers/shorts colour · skirt: colour or 'tartan'/'navyTartan'
// neck: 'tie' (white collar + tie [colour, stripe]) | 'polo' (collar colour) | 'crew'
export const KITS = {
  u_junior: { top: '#1a6b37', bottom: GREY, neck: 'tie', tie: ['#0e3f20'], badge: 1 },
  u_juniorG: { top: '#1a6b37', arms: '#ffffff', skirt: '#1a6b37', neck: 'tie', tie: ['#0e3f20'], pattern: ['belt', '#0e3f20'] },
  u_senior: { top: '#155c2e', bottom: GREY, neck: 'tie', tie: ['#0e3f20', RED], badge: 1, blazer: 1 },
  u_seniorG: { top: '#155c2e', skirt: '#155c2e', neck: 'tie', tie: ['#0e3f20', RED], badge: 1, blazer: 1 },
  u_y11: { top: NAVY, bottom: GREY, neck: 'tie', tie: [NAVY, RED], badge: 1, blazer: 1 },
  u_y11G: { top: NAVY, skirt: 'navyTartan', neck: 'tie', tie: [NAVY, RED], badge: 1, blazer: 1 },
  u_summer: { top: '#ffffff', bottom: GREY, neck: 'polo', collar: '#ffffff', badge: 1 },
  u_jumper: { top: '#1a6b37', bottom: GREY, neck: 'tie', tie: ['#0e3f20'], badge: 1, pattern: ['vneck', '#ffffff'] },
  k_pe: { top: '#ffffff', bottom: '#155c2e', neck: 'crew', badge: 1 },
  k_track: { top: '#155c2e', bottom: '#155c2e', neck: 'crew', badge: 1, pattern: ['zip', '#ffffff'] },
  k_houseBlue: { top: '#1d3f8f', bottom: '#155c2e', neck: 'crew', badge: 1 },
  k_houseRed: { top: '#d6332f', bottom: '#155c2e', neck: 'crew', badge: 1 },
  k_houseGreen: { top: '#1a7a3a', bottom: '#155c2e', neck: 'crew', badge: 1 },
  k_rugby: { top: '#155c2e', bottom: '#155c2e', neck: 'polo', collar: '#155c2e', badge: 1, pattern: ['panels', GOLD] },
  k_rugby19: { top: NAVY, bottom: NAVY, neck: 'polo', collar: NAVY, badge: 1, pattern: ['hoops', '#b5452a'] },
  k_football: { top: '#ffffff', bottom: '#155c2e', neck: 'crew', badge: 1, pattern: ['sash', '#155c2e'] },
  k_footballG: { top: '#155c2e', bottom: '#155c2e', neck: 'crew', badge: 1, pattern: ['sash', '#ffffff'] },
  k_volley: { top: '#ffffff', bottom: '#155c2e', neck: 'crew', badge: 1 },
  k_hockey: { top: '#155c2e', skirt: '#155c2e', neck: 'polo', collar: GOLD, badge: 1, pattern: ['panels', GOLD] },
  k_hockey18: { top: NAVY, skirt: NAVY, arms: 'skin', neck: 'crew', badge: 1, pattern: ['stripes', '#b5452a'] },
  k_basket: { top: '#155c2e', bottom: '#155c2e', arms: 'skin', neck: 'crew', badge: 1, pattern: ['yoke', GOLD] },
  k_handball: { top: '#155c2e', bottom: '#155c2e', neck: 'polo', collar: GOLD, badge: 1, pattern: ['panels', GOLD] },
};
// house names: Jones / Queens (blue), Blount / Kings (red), Cuff / Princes (green)

const patternTex = new Map();
function kitPattern(base, [kind, c]) {
  const key = base + kind + c; if (patternTex.has(key)) return patternTex.get(key);
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128;
  const g = cv.getContext('2d'); g.fillStyle = base; g.fillRect(0, 0, 256, 128); g.fillStyle = c;
  // u = 0.25 is the front of the gim, 0 / 0.5 are the sides
  if (kind === 'hoops') for (let y = 8; y < 128; y += 30) g.fillRect(0, y, 256, 15);
  if (kind === 'stripes') for (let x = 0; x < 256; x += 28) g.fillRect(x, 0, 12, 128);
  if (kind === 'panels') { g.fillRect(0, 0, 14, 128); g.fillRect(242, 0, 14, 128); g.fillRect(114, 0, 28, 128); }
  if (kind === 'sash') { g.beginPath(); g.moveTo(30, 0); g.lineTo(52, 0); g.lineTo(100, 128); g.lineTo(78, 128); g.fill(); }
  if (kind === 'yoke') g.fillRect(0, 0, 256, 26);
  if (kind === 'belt') g.fillRect(0, 78, 256, 9);
  if (kind === 'zip') g.fillRect(63, 0, 2, 128);
  if (kind === 'vneck') { g.beginPath(); g.moveTo(48, 0); g.lineTo(80, 0); g.lineTo(64, 40); g.fill(); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; patternTex.set(key, t); return t;
}

// Headmistress Pauli (from pauligur's portrait): light-brown low ponytail, green blazer with gold piping,
// white shirt, tartan bow and skirt, pearl earrings.
export const PAULI = { color: '#f4cfab', hat: 'none', hair: 'ponytail', outfit: 'hmblazer', acc: 'earrings' };

export const PRESETS = [
  { id: 'headmistress', look: PAULI },
  { id: 'classic', look: { color: '#ffcf9e', hat: 'boater', hair: 'none', outfit: 'jumper', acc: 'none' } },
  { id: 'sporty', look: { color: '#ffd43b', hat: 'cap', hair: 'ponytail', outfit: 'pe', acc: 'medal' } },
  { id: 'scientist', look: { color: '#4dabf7', hat: 'none', hair: 'bun', outfit: 'lab', acc: 'glasses' } },
  { id: 'winter', look: { color: '#f783ac', hat: 'beanie', hair: 'bob', outfit: 'hoodie', acc: 'scarf' } },
  { id: 'royal', look: { color: '#9775fa', hat: 'crown', hair: 'none', outfit: 'blazer', acc: 'flower' } },
];


let gradMap;
function grad() {
  if (gradMap) return gradMap;
  gradMap = new THREE.DataTexture(new Uint8Array([110, 190, 255]), 3, 1, THREE.RedFormat);
  gradMap.minFilter = gradMap.magFilter = THREE.NearestFilter; gradMap.needsUpdate = true;
  return gradMap;
}
const G = {
  sphere: new THREE.SphereGeometry(0.5, 28, 20),
  lower: new THREE.SphereGeometry(0.5, 28, 14, 0, Math.PI * 2, Math.PI * 0.56, Math.PI * 0.44),
  band: new THREE.SphereGeometry(0.5, 28, 8, 0, Math.PI * 2, Math.PI * 0.56, Math.PI * 0.2),
  skirt: new THREE.SphereGeometry(0.5, 28, 8, 0, Math.PI * 2, Math.PI * 0.74, Math.PI * 0.26),
  hairTop: new THREE.SphereGeometry(0.5, 28, 10, 0, Math.PI * 2, 0, Math.PI * 0.3),
  hairBack: new THREE.SphereGeometry(0.5, 28, 14, Math.PI, Math.PI, 0, Math.PI * 0.52),
  hairBob: new THREE.SphereGeometry(0.5, 28, 14, Math.PI, Math.PI, 0, Math.PI * 0.62),
  cap: new THREE.SphereGeometry(0.5, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2),
  cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 20),
  box: new THREE.BoxGeometry(1, 1, 1),
  cone: new THREE.ConeGeometry(0.5, 1, 4),
  torus: new THREE.TorusGeometry(0.5, 0.12, 8, 20),
  smile: new THREE.TorusGeometry(0.05, 0.014, 6, 14, Math.PI),
};

const tartanTex = {};
function tartan(navy = false) {
  if (tartanTex[navy]) return tartanTex[navy];
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = navy ? '#1b2f6b' : '#17331f'; g.fillRect(0, 0, 64, 64);
  if (navy) { g.fillStyle = 'rgba(192,57,43,0.9)'; g.fillRect(0, 30, 64, 2); g.fillRect(30, 0, 2, 64); }
  g.fillStyle = 'rgba(27,47,107,0.85)'; g.fillRect(0, 20, 64, 18); g.fillRect(20, 0, 18, 64);
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, 44, 64, 6); g.fillRect(44, 0, 6, 64);
  g.fillStyle = 'rgba(255,255,255,0.4)'; g.fillRect(0, 10, 64, 1.5); g.fillRect(10, 0, 1.5, 64);
  g.fillStyle = 'rgba(224,177,58,0.55)'; g.fillRect(0, 56, 64, 1); g.fillRect(56, 0, 1, 64);
  const t = tartanTex[navy] = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(5, 2); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter;
  return t;
}

export function makeBadgeTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  g.beginPath(); g.moveTo(14, 18); g.lineTo(114, 18); g.lineTo(114, 64); g.quadraticCurveTo(114, 108, 64, 124); g.quadraticCurveTo(14, 108, 14, 64); g.closePath();
  g.fillStyle = GOLD; g.fill();
  g.save(); g.clip();
  g.fillStyle = '#c62f35'; g.fillRect(20, 24, 44, 100); g.fillStyle = '#1b2f6b'; g.fillRect(64, 24, 44, 100);
  g.restore();
  g.fillStyle = WHITE; g.font = 'bold 34px sans-serif'; g.textAlign = 'center'; g.fillText('TBS', 64, 80);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
let badgeTex;

export function makeGim(look = {}) {
  const { color = '#ffcf9e', hat = 'boater', hair = 'none', outfit = 'jumper', acc = 'none', hairColor = '#8a5a32' } = look;
  const mats = [];
  const toon = (c, extra = {}) => { const m = new THREE.MeshToonMaterial({ color: c, gradientMap: grad(), ...extra }); mats.push(m); return m; };
  const basic = (c, extra = {}) => { const m = new THREE.MeshBasicMaterial({ color: c, ...extra }); mats.push(m); return m; };
  const outline = basic('#1a1a2e', { side: THREE.BackSide });
  const mesh = (geo, mat, parent, x = 0, y = 0, z = 0, sx = 1, sy = sx, sz = sx) => {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); parent.add(m); return m;
  };

  const root = new THREE.Group();
  const body = new THREE.Group(); root.add(body);
  const CY = 0.72, RX = 0.5, RY = 0.575, RZ = 0.425;  // torso ellipsoid
  const torso = mesh(G.sphere, toon(color), body, 0, CY, 0, 1, 1.15, 0.85);
  mesh(G.sphere, outline, body, 0, CY, 0, 1.07, 1.22, 0.92);

  // --- outfit (covers the lower half of the gim)
  const kit = KITS[outfit];
  const clothes = kit ? kit.top : { jumper: GREEN, blazer: GREEN_DARK, hmblazer: GREEN_DARK, pe: '#f4f4f4', hoodie: GREEN, gown: '#1c1c28', lab: '#f7f7f7', suit: '#6b4f36', suitNavy: '#1d2f5a', suitGrey: '#5d6470' }[outfit] || GREEN;
  mesh(outfit === 'hmblazer' ? G.band : G.lower, toon(kit?.pattern ? '#ffffff' : clothes, kit?.pattern ? { map: kitPattern(clothes, kit.pattern) } : {}), body, 0, CY, 0, 1.035, 1.17, 0.885);
  if (outfit === 'pe') { // green stripe
    mesh(G.cyl, toon(GREEN), body, 0, 0.52, 0, 1.0, 0.07, 0.86);
  }
  const front = (y) => RZ * Math.sqrt(Math.max(0, 1 - ((y - CY) / RY) ** 2)) + 0.03;
  if (outfit === 'hmblazer') {
    // tartan skirt, gold piping, lapels, buttons, white shirt + tartan bow
    mesh(G.skirt, toon('#ffffff', { map: tartan() }), body, 0, CY, 0, 1.07, 1.17, 0.92);
    const ring = mesh(G.torus, toon(GOLD), body, 0, 0.27, 0, 0.73, 0.62, 0.12); ring.rotation.x = Math.PI / 2;
    for (const sx of [-1, 1]) {
      const l = mesh(G.box, toon(GOLD), body, sx * 0.1, 0.5, front(0.5) - 0.005, 0.025, 0.3, 0.02); l.rotation.z = sx * 0.55; l.rotation.x = 0.3;
    }
    for (const y of [0.42, 0.34]) mesh(G.sphere, toon(GOLD), body, 0.05, y, front(y) - 0.01, 0.045);
    const neck = new THREE.Group(); neck.position.set(0, 0.56, front(0.56)); neck.rotation.x = 0.38; body.add(neck);
    mesh(G.box, toon(WHITE), neck, 0, 0.0, -0.012, 0.17, 0.2, 0.02);
    const tm = toon('#ffffff', { map: tartan() });
    for (const sx of [-1, 1]) { const c = mesh(G.cone, tm, neck, sx * 0.08, 0.05, 0.01, 0.13, 0.16, 0.06); c.rotation.z = sx * Math.PI / 2; }
    mesh(G.sphere, tm, neck, 0, 0.05, 0.02, 0.07);
    for (const sx of [-1, 1]) { const tl = mesh(G.box, tm, neck, sx * 0.035, -0.05, 0.015, 0.05, 0.17, 0.02); tl.rotation.z = sx * 0.3; }
    badgeTex = badgeTex || makeBadgeTexture();
    const bm = new THREE.MeshBasicMaterial({ map: badgeTex, transparent: true }); mats.push(bm);
    const bdg = mesh(new THREE.PlaneGeometry(0.13, 0.13), bm, body, 0.23, 0.47, front(0.47) - 0.03); bdg.rotation.y = 0.5; bdg.rotation.x = 0.3;
  }
  if (kit) {
    if (kit.bottom) mesh(G.skirt, toon(kit.bottom), body, 0, CY, 0, 1.045, 1.175, 0.895);
    if (kit.skirt) mesh(G.skirt, kit.skirt.includes('artan') ? toon('#ffffff', { map: tartan(kit.skirt === 'navyTartan') }) : toon(kit.skirt), body, 0, CY, 0, 1.08, 1.17, 0.93);
    if (kit.neck === 'tie') {
      const cz = front(0.6);
      for (const s of [-1, 1]) { const k = mesh(G.box, toon(WHITE), body, s * 0.075, 0.605, cz, 0.13, 0.05, 0.03); k.rotation.z = s * -0.6; }
      const tie = new THREE.Group(); tie.position.set(0, 0.5, front(0.5)); tie.rotation.x = 0.38; body.add(tie);
      mesh(G.box, toon(WHITE), tie, 0, 0.0, -0.012, 0.16, 0.22, 0.02);
      mesh(G.box, toon(kit.tie[0]), tie, 0, 0.08, 0, 0.07, 0.05, 0.03);
      mesh(G.box, toon(kit.tie[0]), tie, 0, -0.04, 0, 0.075, 0.2, 0.025);
      if (kit.tie[1]) for (let i = 0; i < 3; i++) { const st = mesh(G.box, toon(kit.tie[1]), tie, 0, 0.02 - i * 0.06, 0.01, 0.078, 0.014, 0.02); st.rotation.z = 0.5; }
    }
    if (kit.neck === 'polo') {
      for (const s of [-1, 1]) { const k = mesh(G.box, toon(kit.collar), body, s * 0.08, 0.6, front(0.6) - 0.01, 0.15, 0.06, 0.04); k.rotation.z = s * -0.5; }
      for (const y of [0.53, 0.47]) mesh(G.sphere, toon('#e9e4da'), body, 0, y, front(y) - 0.01, 0.03);
    }
    if (kit.blazer) for (const sx of [-1, 1]) {   // lapels
      const l = mesh(G.box, toon(kit.top), body, sx * 0.12, 0.5, front(0.5) + 0.005, 0.05, 0.28, 0.02); l.rotation.z = sx * 0.5; l.rotation.x = 0.3;
    }
    if (kit.badge) {
      badgeTex = badgeTex || makeBadgeTexture();
      const bm = new THREE.MeshBasicMaterial({ map: badgeTex, transparent: true }); mats.push(bm);
      const b = mesh(new THREE.PlaneGeometry(0.13, 0.13), bm, body, 0.21, 0.5, front(0.5) - 0.03); b.rotation.y = 0.45; b.rotation.x = 0.3;
    }
  }
  if (['jumper', 'blazer', 'gown', 'lab', 'suit', 'suitNavy', 'suitGrey'].includes(outfit)) {
    // white shirt collar (V) + tie
    const cz = front(0.6);
    for (const s of [-1, 1]) { const k = mesh(G.box, toon(WHITE), body, s * 0.075, 0.605, cz, 0.13, 0.05, 0.03); k.rotation.z = s * -0.6; }
    const tie = new THREE.Group(); tie.position.set(0, 0.5, front(0.5)); tie.rotation.x = 0.38; body.add(tie);
    mesh(G.box, toon(WHITE), tie, 0, 0.0, -0.012, 0.16, 0.22, 0.02);   // shirt V
    mesh(G.box, toon('#0e3f20'), tie, 0, 0.08, 0, 0.07, 0.05, 0.03);
    mesh(G.box, toon('#0e3f20'), tie, 0, -0.04, 0, 0.075, 0.2, 0.025);
    for (let i = 0; i < 3; i++) { const st = mesh(G.box, toon(GOLD), tie, 0, 0.02 - i * 0.06, 0.01, 0.078, 0.014, 0.02); st.rotation.z = 0.5; }
  }
  if (outfit === 'blazer' || outfit === 'jumper') { // the adapted TBS badge on the chest
    badgeTex = badgeTex || makeBadgeTexture();
    const bm = new THREE.MeshBasicMaterial({ map: badgeTex, transparent: true }); mats.push(bm);
    const b = mesh(new THREE.PlaneGeometry(0.13, 0.13), bm, body, 0.21, 0.5, front(0.5) - 0.03);
    b.rotation.y = 0.45; b.rotation.x = 0.3;
  }
  if (outfit === 'blazer') { // gold piping
    mesh(G.torus, toon(GOLD), body, 0, CY - 0.02, 0, 1.035, 0.885, 0.2).rotation.x = Math.PI / 2;
  }
  if (outfit === 'hoodie') {
    mesh(G.torus, toon(GREEN_DARK), body, 0, 0.98, -0.12, 0.5, 0.5, 0.6).rotation.x = Math.PI / 2.4;
    mesh(G.box, toon(GREEN_DARK), body, 0, 0.42, front(0.42) - 0.02, 0.32, 0.12, 0.05);
  }
  if (outfit === 'gown') { // academic gown with green trim
    const gown = mesh(new THREE.CylinderGeometry(0.47, 0.62, 0.8, 24, 1, true), toon('#1c1c28', { side: THREE.DoubleSide }), body, 0, 0.42, 0);
    mesh(new THREE.CylinderGeometry(0.63, 0.63, 0.06, 24, 1, true), toon(GREEN), body, 0, 0.05, 0);
  }
  if (outfit === 'lab') {
    for (const s of [-1, 1]) mesh(G.box, toon('#dfe6e9'), body, s * 0.12, 0.45, front(0.45), 0.02, 0.3, 0.02);
  }

  // --- face
  const eyes = new THREE.Group(); body.add(eyes);
  for (const s of [-1, 1]) {
    const e = new THREE.Group(); e.position.set(s * 0.165, 0.92, 0.385); eyes.add(e);
    mesh(G.sphere, toon(WHITE), e, 0, 0, 0, 0.16, 0.2, 0.12);
    mesh(G.sphere, basic('#1a1a2e'), e, 0, -0.01, 0.035, 0.1, 0.13, 0.06);
    mesh(G.sphere, basic(WHITE), e, 0.02, 0.03, 0.065, 0.035, 0.035, 0.02);
  }
  if (look.brows) { // grumpy teacher eyebrows + frown
    for (const s of [-1, 1]) { const b = mesh(G.box, basic('#3b2a1a'), eyes, s * 0.165, 1.06, 0.4, 0.17, 0.04, 0.04); b.rotation.z = s * 0.45; }
  }
  const mouth = mesh(G.smile, basic('#1a1a2e'), body, 0, 0.78, front(0.78) - 0.02); mouth.rotation.z = look.brows ? 0 : Math.PI;
  for (const s of [-1, 1]) mesh(G.sphere, basic('#ff8fa3', { transparent: true, opacity: 0.6 }), body, s * 0.3, 0.8, 0.31, 0.1, 0.06, 0.03);

  // --- arms & feet
  const arms = [], feet = [];
  for (const s of [-1, 1]) {
    arms.push(mesh(G.sphere, toon(outfit === 'pe' || kit?.arms === 'skin' ? color : kit?.arms || clothes), body, s * 0.52, 0.55, 0.02, 0.16, 0.24, 0.16));
    feet.push(mesh(G.sphere, toon('#2b2b3a'), root, s * 0.17, 0.07, 0.05, 0.22, 0.12, 0.3));
  }

  // --- hair
  if (hair !== 'none') {
    const hm = toon(hairColor);
    const HS = [1.045, 1.18, 0.9];
    mesh(G.hairTop, hm, body, 0, CY, 0, ...HS);
    mesh(hair === 'bob' ? G.hairBob : G.hairBack, hm, body, 0, CY, 0, HS[0] + 0.01, HS[1], HS[2] + 0.01);
    const f1 = mesh(G.sphere, hm, body, -0.13, 1.12, 0.27, 0.38, 0.16, 0.14); f1.rotation.z = 0.35;   // side-parted fringe
    const f2 = mesh(G.sphere, hm, body, 0.17, 1.1, 0.26, 0.3, 0.14, 0.13); f2.rotation.z = -0.4;
    const sw = hair === 'bob' ? [0.17, 0.42, 0.2] : [0.13, 0.36, 0.13];
    for (const sx of [-1, 1]) { const st = mesh(G.sphere, hm, body, sx * 0.42, 0.92, 0.1, ...sw); st.rotation.z = sx * 0.15; }  // strands framing the face
    if (hair === 'ponytail') {
      mesh(G.sphere, toon('#2b2b3a'), body, 0, 0.98, -0.44, 0.12, 0.1, 0.08);
      const tail = mesh(G.sphere, hm, body, 0, 0.72, -0.5, 0.2, 0.46, 0.18); tail.rotation.x = 0.25;
    }
    if (hair === 'bun') mesh(G.sphere, hm, body, 0, 1.3, -0.16, 0.34);
  }

  // --- hats
  const TOP = CY + RY;
  const hg = new THREE.Group(); hg.position.y = TOP; body.add(hg);
  if (hat === 'boater') {
    mesh(G.cyl, toon('#e8cf8a'), hg, 0, -0.06, 0, 0.92, 0.04, 0.92);
    mesh(G.cyl, toon('#e8cf8a'), hg, 0, 0.02, 0, 0.54, 0.14, 0.54);
    mesh(G.cyl, toon(GREEN), hg, 0, -0.01, 0, 0.555, 0.05, 0.555);
  } else if (hat === 'cap') {
    mesh(G.cap, toon(GREEN), hg, 0, -0.12, 0, 0.62, 0.5, 0.62);
    mesh(G.box, toon(GREEN), hg, 0, -0.1, 0.3, 0.38, 0.03, 0.3);
    mesh(G.sphere, toon(GOLD), hg, 0, 0.13, 0, 0.06);
  } else if (hat === 'beanie') {
    mesh(G.cap, toon('#c62f35'), hg, 0, -0.16, 0, 0.66, 0.62, 0.62);
    mesh(G.cyl, toon('#f4f4f4'), hg, 0, -0.14, 0, 0.68, 0.07, 0.64);
    mesh(G.sphere, toon('#f4f4f4'), hg, 0, 0.22, 0, 0.14);
  } else if (hat === 'bow') {
    for (const s of [-1, 1]) { const c = mesh(G.cone, toon('#f06595'), hg, 0.2 + s * 0.09, -0.04, 0, 0.16, 0.18, 0.08); c.rotation.z = s * Math.PI / 2; }
    mesh(G.sphere, toon('#d6336c'), hg, 0.2, -0.04, 0, 0.07);
  } else if (hat === 'headphones') {
    const band = mesh(G.torus, toon('#343a40'), hg, 0, -0.18, 0, 0.5, 0.5, 0.5); band.scale.set(0.5, 0.5, 0.3);
    for (const s of [-1, 1]) mesh(G.cyl, toon('#4dabf7'), hg, s * 0.27, -0.3, 0, 0.14, 0.08, 0.14).rotation.z = Math.PI / 2;
  } else if (hat === 'mortarboard') {
    mesh(G.cyl, toon('#1c1c28'), hg, 0, -0.04, 0, 0.42, 0.14, 0.42);
    const top = mesh(G.box, toon('#1c1c28'), hg, 0, 0.04, 0, 0.62, 0.04, 0.62); top.rotation.y = Math.PI / 4;
    mesh(G.box, toon(GOLD), hg, 0.2, -0.06, 0.2, 0.02, 0.2, 0.02);
    mesh(G.sphere, toon(GOLD), hg, 0.2, -0.17, 0.2, 0.05);
  } else if (hat === 'crown') {
    mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.14, 10, 1, true), toon(GOLD, { side: THREE.DoubleSide }), hg, 0, -0.01, 0);
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; mesh(G.cone, toon(GOLD), hg, Math.sin(a) * 0.19, 0.1, Math.cos(a) * 0.19, 0.08, 0.12, 0.08); }
    mesh(G.sphere, basic('#e03131'), hg, 0, 0.0, 0.205, 0.05);
  }

  // --- accessories
  if (acc === 'whistle') {
    mesh(G.torus, toon('#c62f35'), body, 0, 0.62, 0, 0.9, 0.78, 0.1).rotation.x = Math.PI / 2 - 0.25;
    mesh(G.cyl, toon('#c0c6cc'), body, 0.06, 0.4, front(0.4) + 0.03, 0.07, 0.12, 0.07).rotation.z = Math.PI / 2;
  } else if (acc === 'earrings') {
    for (const sx of [-1, 1]) mesh(G.sphere, toon('#fffaf0'), body, sx * 0.5, 0.82, 0.05, 0.07);
  } else if (acc === 'glasses') {
    for (const s of [-1, 1]) mesh(G.torus, basic('#1a1a2e'), eyes, s * 0.165, 0.92, 0.445, 0.2, 0.2, 0.2);
    mesh(G.box, basic('#1a1a2e'), eyes, 0, 0.93, 0.45, 0.07, 0.015, 0.015);
  } else if (acc === 'backpack') {
    mesh(G.box, toon('#c62f35'), body, 0, 0.62, -0.47, 0.5, 0.48, 0.2);
    mesh(G.box, toon('#a61e2a'), body, 0, 0.5, -0.58, 0.36, 0.18, 0.06);
  } else if (acc === 'scarf') {
    mesh(G.torus, toon(GREEN), body, 0, 0.62, 0, 0.92, 0.92, 0.8).rotation.x = Math.PI / 2;
    mesh(G.box, toon(GREEN), body, 0.18, 0.5, front(0.5), 0.1, 0.24, 0.04);
    mesh(G.box, toon(WHITE), body, 0.18, 0.44, front(0.44) + 0.005, 0.105, 0.04, 0.04);
  } else if (acc === 'medal') {
    mesh(G.cyl, toon(GOLD), body, 0, 0.47, front(0.47) + 0.01, 0.12, 0.025, 0.12).rotation.x = Math.PI / 2 - 0.35;
    for (const s of [-1, 1]) { const r = mesh(G.box, toon('#c62f35'), body, s * 0.07, 0.56, front(0.56), 0.03, 0.2, 0.02); r.rotation.z = s * 0.35; r.rotation.x = 0.35; }
  } else if (acc === 'flower') {
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; mesh(G.sphere, toon('#ffd43b'), hg, -0.24 + Math.cos(a) * 0.05, -0.08 + Math.sin(a) * 0.05, 0.18, 0.06); }
    mesh(G.sphere, toon('#e8590c'), hg, -0.24, -0.08, 0.2, 0.05);
  }

  root.userData = { body, eyes, arms, feet, mats, t: Math.random() * 10, blink: 1 + Math.random() * 3, look: { color, hat, outfit, acc } };
  return root;
}

export function animateGim(g, dt, moving) {
  const u = g.userData; u.t += dt;
  const t = u.t;
  if (moving) {
    u.body.position.y = Math.abs(Math.sin(t * 11)) * 0.07;
    u.body.rotation.z = Math.sin(t * 11) * 0.06;
    u.feet[0].position.z = 0.05 + Math.sin(t * 11) * 0.14; u.feet[1].position.z = 0.05 - Math.sin(t * 11) * 0.14;
    u.arms[0].position.z = 0.02 - Math.sin(t * 11) * 0.1; u.arms[1].position.z = 0.02 + Math.sin(t * 11) * 0.1;
  } else {
    u.body.position.y = 0; u.body.rotation.z = 0;
    u.body.scale.y = 1 + Math.sin(t * 2.4) * 0.018;
    u.feet[0].position.z = u.feet[1].position.z = 0.05;
  }
  u.blink -= dt;
  const closed = u.blink < 0 && u.blink > -0.12;
  for (const e of u.eyes.children) if (e.isGroup) e.scale.y = closed ? 0.1 : 1;
  if (u.blink < -0.12) u.blink = 2 + Math.random() * 3.5;
}

export function setGhost(g, on) {
  for (const m of g.userData.mats) {
    m.userData.base ??= { t: m.transparent, o: m.opacity };
    m.transparent = on || m.userData.base.t;
    m.opacity = on ? 0.35 * m.userData.base.o : m.userData.base.o;
    m.depthWrite = !on;
    m.needsUpdate = true;
  }
}

export function disposeGim(g) {
  g.traverse(o => { if (o.geometry && !Object.values(G).includes(o.geometry)) o.geometry.dispose(); });
  for (const m of g.userData.mats) m.dispose();
}

// Name tag sprite
export function nameTag(text, color = '#ffffff') {
  const c = document.createElement('canvas'); c.width = 512; c.height = 64;
  const g = c.getContext('2d');
  g.font = '600 34px Fredoka, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 7; g.strokeStyle = 'rgba(10,15,40,0.85)'; g.strokeText(text, 256, 34);
  g.fillStyle = color; g.fillText(text, 256, 34);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthWrite: false }));
  s.scale.set(2.4, 0.3, 1);
  return s;
}
