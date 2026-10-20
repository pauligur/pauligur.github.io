// Local game simulation: solo shift + practice matches with bots.
// (Online play will later move this logic onto the room host.)
import { STATIONS, SPECIAL, BELL, STAFF_DOORS, BUILDINGS, FIELDS, AREAS, roomAt } from './world.js';
import { COLORS, ITEMS, PAULI } from './gim.js';
import { cleanChat } from './chat.js';

const BOT_NAMES = ['Sofi', 'Mateo', 'Valen', 'Juanchi', 'Isa', 'Tomi', 'Cata', 'Lu', 'Benja', 'Martu', 'Santi', 'Emi'];
const ORDER_AREAS = ['library', 'gym', 'pool', 'dining', 'auditorium', 'art', 'music', 'early', 'tennis', 'h1', 'lab', 'computer', 'club', 'f2', 'hall', 'padel', 'fitness', 'courtyard', 'multi'];
export const HM_ORDERS = { o_gym: 'gym', o_pool: 'pool', o_library: 'library', o_cafe: 'dining', o_work: null, o_run: undefined };
export const PHRASES = ['ph_tasks', 'ph_where', 'ph_sus', 'ph_with', 'ph_skip', 'ph_notme'];
const LINES_EN = ['I will not run in the corridors.', 'I will finish my homework.', 'I will be kind to my classmates.', 'I will not talk in the library.'];
const LINES_ES = ['No voy a correr en los pasillos.', 'Voy a terminar mis deberes.', 'Voy a ser amable con mis compañeros.', 'No voy a hablar en la biblioteca.'];

// Solo mode: three mean teachers on patrol
const SOLO_TEACHERS = [
  { id: 'cuff', name: 'Mr. Cuff', zone: 'fields', x: 12, z: -40, calm: 20, speed: 5.0, look: { color: '#d9965f', hat: 'none', hair: 'none', outfit: 'suit', acc: 'glasses', brows: true } },
  { id: 'jones', name: 'Mr. Jones', zone: 'senior', x: 122, z: -20, calm: 40, speed: 5.3, look: { color: '#f2b48a', hat: 'none', hair: 'bob', hairColor: '#2b2b3a', outfit: 'suitNavy', acc: 'none', brows: true } },
  { id: 'blount', name: 'Mr. Blount', zone: 'junior', x: 60, z: 63.75, calm: 60, speed: 5.6, look: { color: '#ffcf9e', hat: 'cap', hair: 'none', outfit: 'suitGrey', acc: 'whistle', brows: true } },
];

const inside = (p, b, m = 0) => p.x > b.x0 + m && p.x < b.x1 - m && p.z > b.z0 + m && p.z < b.z1 - m;
const ZONES = {
  fields: p => FIELDS.some(f => inside(p, f, 1)),
  senior: p => inside(p, BUILDINGS.find(b => b.key === 'senior')),
  junior: p => ['junior', 'junior2', 'junior3'].some(k => inside(p, BUILDINGS.find(b => b.key === k))),
};

const rand = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const areaRect = key => AREAS.find(a => a.key === key);
const inRect = (p, r) => p.x >= r.x0 && p.x <= r.x1 && p.z >= r.z0 && p.z <= r.z1;
const freeItem = k => pick(ITEMS[k].filter(i => i.price === 0)).id;

/* ---------------- navigation graph for bots ---------------- */
export class Nav {
  constructor(col) {
    this.col = col; this.nodes = [];
    const add = (x, z) => { if (!col.blocked(x, z, 0.5)) this.nodes.push({ x, z, e: [] }); };
    for (let x = -134; x <= 134; x += 8) for (let z = -80; z <= 80; z += 8) { add(x, z); add(x + 4, z + 4); }
    // gates in fences (pool, tennis, padel)
    for (const [x, z] of [[20.5, 34.5], [20.5, 37.5], [20.5, 46.5], [20.5, 49.5], [15.3, 39], [17.8, 39], [-52, 58.5], [-52, 61.5],
      [-75.5, 69], [-72.5, 69], [-67.5, 69], [-64.5, 69]]) add(x, z);
    for (const b of BUILDINGS) {
      for (const d of b.doors || []) {
        const o = 1.5;
        if (d.side === 'n') { add(d.at, b.z0 - o); add(d.at, b.z0 + o); }
        if (d.side === 's') { add(d.at, b.z1 - o); add(d.at, b.z1 + o); }
        if (d.side === 'w') { add(b.x0 - o, d.at); add(b.x0 + o, d.at); }
        if (d.side === 'e') { add(b.x1 - o, d.at); add(b.x1 + o, d.at); }
      }
      for (const w of b.inner || []) for (const at of w[4] || []) {
        if (w[1] === w[3]) { add(at, w[1] - 1.3); add(at, w[1] + 1.3); } else { add(w[0] - 1.3, at); add(w[0] + 1.3, at); }
      }
      for (const r of b.rooms)  // fine grid inside every room so furniture can't cut it off
        for (let x = r.x0 + 1.2; x < r.x1 - 0.8; x += 2.2) for (let z = r.z0 + 1.2; z < r.z1 - 0.8; z += 2.2) add(x, z);
    }
    for (const s of [...STATIONS, ...Object.values(SPECIAL), ...STAFF_DOORS]) {
      const spot = this.standSpot(s.x, s.z); if (spot) this.nodes.push({ x: spot.x, z: spot.z, e: [] });
    }
    let N = this.nodes;
    for (let i = 0; i < N.length; i++) for (let j = i + 1; j < N.length; j++) {
      const d = dist(N[i], N[j]);
      if (d < 13 && col.los(N[i].x, N[i].z, N[j].x, N[j].z, 0.45)) { N[i].e.push([j, d]); N[j].e.push([i, d]); }
    }
    // keep only the biggest connected piece, so every route is walkable
    const comp = new Int32Array(N.length).fill(-1), size = [];
    for (let i = 0; i < N.length; i++) {
      if (comp[i] >= 0) continue;
      const c = size.length, st = [i]; comp[i] = c; size.push(0);
      while (st.length) { const u = st.pop(); size[c]++; for (const [v] of N[u].e) if (comp[v] < 0) { comp[v] = c; st.push(v); } }
    }
    const main = size.indexOf(Math.max(...size)), remap = new Int32Array(N.length).fill(-1);
    const kept = []; N.forEach((n, i) => { if (comp[i] === main) { remap[i] = kept.length; kept.push(n); } });
    for (const n of kept) n.e = n.e.filter(([v]) => remap[v] >= 0).map(([v, d]) => [remap[v], d]);
    this.dropped = N.length - kept.length;
    this.nodes = N = kept;
  }
  standSpot(x, z) {
    if (!this.col.blocked(x, z, 0.5)) return { x, z };
    for (let r = 0.6; r < 2.4; r += 0.4) for (let a = 0; a < 6.28; a += 0.5) {
      const px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r;
      if (!this.col.blocked(px, pz, 0.5)) return { x: px, z: pz };
    }
    return null;
  }
  nearest(x, z) {
    const c = this.nodes.map((n, i) => [i, Math.hypot(n.x - x, n.z - z)]).sort((a, b) => a[1] - b[1]);
    for (let k = 0; k < Math.min(10, c.length); k++) if (this.col.los(x, z, this.nodes[c[k][0]].x, this.nodes[c[k][0]].z, 0.3)) return c[k][0];
    return c[0][0];
  }
  path(ax, az, bx, bz) {
    if (this.col.los(ax, az, bx, bz, 0.45)) return [{ x: bx, z: bz }];
    const s = this.nearest(ax, az), g = this.nearest(bx, bz), N = this.nodes;
    const dd = new Float64Array(N.length).fill(Infinity), prev = new Int32Array(N.length).fill(-1), done = new Uint8Array(N.length);
    dd[s] = 0; const open = [s];
    while (open.length) {
      let bi = 0; for (let i = 1; i < open.length; i++) if (dd[open[i]] + Math.hypot(N[open[i]].x - bx, N[open[i]].z - bz) < dd[open[bi]] + Math.hypot(N[open[bi]].x - bx, N[open[bi]].z - bz)) bi = i;
      const u = open.splice(bi, 1)[0]; if (u === g) break; if (done[u]) continue; done[u] = 1;
      for (const [v, w] of N[u].e) if (dd[u] + w < dd[v]) { dd[v] = dd[u] + w; prev[v] = u; open.push(v); }
    }
    if (g !== s && prev[g] === -1) return [];   // unreachable: don't walk into walls
    const out = [{ x: bx, z: bz }];
    for (let u = g; u !== -1 && u !== s; u = prev[u]) out.unshift({ x: N[u].x, z: N[u].z });
    out.unshift({ x: N[s].x, z: N[s].z });
    return out;
  }
  randomNode() { return this.nodes[Math.floor(Math.random() * this.nodes.length)]; }
}

/* ---------------- the game ---------------- */
export class Sim {
  // mode: 'solo' | 'practice' (local, with bots) | 'online' (this browser hosts real players + optional bots)
  constructor(world, nav, { mode, role = 'student', me, lang = 'en', emit, humans, meId = 'me', bots = 0, chat = true }) {
    this.world = world; this.nav = nav; this.mode = mode; this.lang = lang;
    this.emit = (type, data = {}, to) => emit(type, data, to);   // `to` = one player's id, or everyone
    this.time = 0; this.phase = 'play'; this.meId = meId;
    this.players = new Map(); this.bodies = []; this.sab = null; this.meeting = null; this.result = null;
    this.order = null; this.nextOrder = 25; this.sabReady = 20;
    this.chatOn = chat; this.muted = new Set();

    const add = (p) => { const r = { alive: true, x: 0, z: 0, ry: 0, moving: false, tasks: [], done: new Set(), frozenUntil: 0, points: 0, stars: 0, killReady: 15, bellUsed: false, sus: {}, path: [], ai: {}, ...p }; this.players.set(r.id, r); return r; };
    const tasksPer = mode === 'solo' ? 8 : 5;
    const randTasks = () => shuffle(STATIONS.map(s => s.id)).slice(0, tasksPer);
    const botLook = () => ({ color: pick(COLORS), hat: freeItem('hat'), hair: freeItem('hair'), outfit: freeItem(pick(['uniform', 'uniform', 'kit', 'outfit'])), acc: freeItem('acc') });
    const meRole = mode === 'solo' ? 'student' : role;

    if (mode === 'online') {
      for (const h of humans) add({ id: h.id, name: h.name, look: h.look, human: true, role: h.hm ? 'headmistress' : 'student' });
      const names = shuffle(BOT_NAMES.filter(n => !humans.some(h => h.name === n)));
      for (let i = 0; i < bots; i++) add({ id: 'bot' + i, name: names[i], bot: true, role: 'student', look: botLook() });
      const pool = shuffle(this.list.filter(p => p.role === 'student'));
      pool.slice(0, pool.length >= 7 ? 2 : 1).forEach(p => { p.role = 'teacher'; });
      for (const p of this.list) if (p.role !== 'headmistress') p.tasks = randTasks();
    } else add({ id: 'me', name: me.name, look: me.look, human: true, role: meRole, tasks: meRole === 'headmistress' ? [] : randTasks() });

    if (mode === 'solo') {
      for (const t of SOLO_TEACHERS) add({ id: t.id, name: t.name, npc: true, hunter: true, role: 'teacher', look: t.look, speed: t.speed,
        zone: ZONES[t.zone], zoneNodes: this.nav.nodes.filter(ZONES[t.zone]) });
      this.solo = { endsAt: 8 * 60, detentions: 0 };
      this.nextQuiz = 70; this.sabReady = 90;
    } else if (mode === 'practice') {
      const names = shuffle([...BOT_NAMES]);
      const n = 6;
      for (let i = 0; i < n; i++) add({ id: 'bot' + i, name: names[i], bot: true, role: 'student', tasks: randTasks(), look: botLook() });
      if (meRole !== 'teacher') this.players.get('bot' + Math.floor(Math.random() * n)).role = 'teacher';
    }
    if (mode !== 'online' && meRole !== 'headmistress') {
      const hm = add({ id: 'hm', name: lang === 'es' ? 'Directora Pauli' : 'Headmistress Pauli', npc: true, role: 'headmistress', look: { ...PAULI } });
      Object.assign(hm, { x: 113.6, z: -8.5, ry: Math.PI / 2 });
    }
    this.taskTotal = [...this.players.values()].filter(p => p.role === 'student').reduce((s, p) => s + p.tasks.length, 0);
    this.taskDone = 0;
    this.spawnAll();
    if (mode === 'solo') for (const t of SOLO_TEACHERS) { const g = this.players.get(t.id); Object.assign(g, this.nav.standSpot(t.x, t.z)); g.ai.calm = t.calm; }
  }

  get list() { return [...this.players.values()]; }
  get me() { return this.players.get(this.meId); }
  // the local player's own numbers (the HUD reads these)
  get killReady() { return this.me?.killReady ?? 0; }
  get bellUsed() { return !!this.me?.bellUsed; }
  get starsEarned() { return this.me?.stars ?? 0; }
  // run an action on behalf of another (online) player
  as(pid, fn) { if (!this.players.has(pid)) return; const prev = this.meId; this.meId = pid; try { fn(); } finally { this.meId = prev; } }
  setPos(pid, x, z, ry, moving) { const p = this.players.get(pid); if (p && p.human) Object.assign(p, { x, z, ry, moving }); }
  removePlayer(pid) {
    const p = this.players.get(pid); if (!p) return;
    if (p.role === 'student') this.taskTotal -= p.tasks.length - p.done.size;
    this.players.delete(pid);
    this.meeting?.votes.delete(pid);
    this.bodies = this.bodies.filter(b => b.id !== pid);
    this.emit('toastKey', { key: 'left', vars: { name: p.name } });
    if (this.phase === 'meeting') this.maybeEndVote(); else this.checkWin();
  }

  spawnAll() {
    const ps = this.list.filter(p => p.role !== 'headmistress' || p.human);
    ps.forEach((p, i) => {
      const a = i / ps.length * Math.PI * 2;
      p.x = BELL.x + Math.cos(a) * 4.5; p.z = BELL.z + Math.sin(a) * 4.5; p.ry = Math.atan2(BELL.x - p.x, BELL.z - p.z); p.path = [];
      if (p.human) this.emit('tp', { x: p.x, z: p.z, yaw: p.ry + Math.PI }, p.id);
    });
  }

  /* ---- actions from the local player ---- */
  completeTask(id) {
    const me = this.me;
    if (!me.tasks.includes(id) || me.done.has(id)) return;
    me.done.add(id);
    if (me.role === 'student') { this.taskDone++; me.points += 10; me.stars += 5; }
    this.emit('taskDone', { id, all: me.done.size === me.tasks.length }, me.id);
    this.checkWin();
  }

  report(bodyId) { if (this.phase === 'play' && this.me.alive && this.bodies.some(b => b.id === bodyId)) this.startMeeting('report', this.me.id, bodyId); }
  ringBell() { const me = this.me; if (this.phase === 'play' && me.alive && !me.bellUsed && this.sab?.kind !== 'fire') { me.bellUsed = true; this.startMeeting('bell', me.id); } }
  fix(kind) {
    if (!this.sab) return;
    if (kind === 'lights' && this.sab.kind === 'lights') { this.sab = null; this.emit('sabEnd', {}); }
    if ((kind === 'fireA' || kind === 'fireB') && this.sab.kind === 'fire') {
      this.sab[kind] = true;
      if (this.sab.fireA && this.sab.fireB) { this.sab = null; this.emit('sabEnd', {}); }
    }
  }
  canDetain() { return this.me.role === 'teacher' && this.me.alive && this.phase === 'play' && this.time >= this.me.killReady; }
  detainTarget() {
    if (!this.canDetain()) return null;
    let best = null, bd = 2.4;
    for (const p of this.list) if (p.role === 'student' && p.alive) { const d = dist(p, this.me); if (d < bd) { bd = d; best = p; } }
    return best;
  }
  detain(id) {
    const p = this.players.get(id);
    if (!p || !this.canDetain() || p.role !== 'student' || !p.alive || dist(p, this.me) > 2.6) return;
    this.doDetain(this.me, p);
    this.me.killReady = this.time + 25;
  }
  sabotage(kind) {
    if (this.me.role !== 'teacher' || !this.me.alive || this.phase !== 'play' || this.time < this.sabReady || this.sab) return;
    this.startSab(kind, this.me);
    this.sabReady = this.time + 30;
  }
  startSab(kind, by) {
    if (kind === 'quiz') {
      if (by?.human) this.emit('quizAll', {}, by.id);
      for (const p of this.list) if (p.role === 'student' && p.alive) {
        if (p.bot) p.frozenUntil = Math.max(p.frozenUntil, this.time + rand(3, 7));
        else if (p.human) this.emit('quiz', {}, p.id);
      }
      return;
    }
    if (kind === 'lights') this.sab = { kind, fixAt: this.time + rand(25, 45) };
    if (kind === 'fire') this.sab = { kind, until: this.time + 45, fireA: false, fireB: false };
    this.emit('sab', { kind });
  }
  staffDoor() {
    if (this.me.role !== 'teacher' || !this.me.alive) return;
    let i = STAFF_DOORS.findIndex(d => dist(d, this.me) < 2.2); if (i < 0) return;
    const d = STAFF_DOORS[(i + 1) % STAFF_DOORS.length];
    const s = this.nav.standSpot(d.x + 1, d.z) || d;
    this.emit('tp', { x: s.x, z: s.z }, this.me.id);
  }
  vote(target) {
    const m = this.meeting, me = this.me; if (!m || m.result) return;
    if (target !== 'skip' && !this.players.get(target)?.alive) return;
    if (me.role === 'headmistress') { m.hmVote = target; this.emit('meetingUpdate', {}); return; }
    if (!me.alive || m.votes.has(me.id)) return;
    m.votes.set(me.id, target); this.emit('meetingUpdate', {});
    this.maybeEndVote();
  }
  say(phrase, about) {
    const m = this.meeting, me = this.me; if (!m || m.result || !PHRASES.includes(phrase)) return;
    if (!me.alive && me.role !== 'headmistress') return;
    const mine = m.chat.filter(c => c.id === me.id).length; if (mine >= 8) return;   // no spamming
    m.chat.push({ id: me.id, phrase, about }); this.emit('meetingUpdate', {});
  }
  sayText(raw) {
    const m = this.meeting, me = this.me; if (!m || m.result || !this.chatOn || this.muted.has(me.id)) return;
    if (!me.alive && me.role !== 'headmistress') return;
    if (this.time - (me.lastChat ?? -9) < 1.2) return;                                   // slow down
    if (m.chat.filter(c => c.id === me.id).length >= 25) return;
    const text = cleanChat(raw); if (!text) return;
    me.lastChat = this.time;
    m.chat.push({ id: me.id, text }); if (m.chat.length > 80) m.chat.shift();
    this.emit('meetingUpdate', {});
  }

  /* ---- headmistress powers (practice) ---- */
  hm(action, arg) {
    if (this.me.role !== 'headmistress') return;
    const p = arg && this.players.get(arg);
    switch (action) {
      case 'order': {
        const key = arg.key, area = key ? HM_ORDERS[key] : undefined;
        this.emit('order', { text: arg.text, from: this.me.name });
        if (area) this.botOrder = { area, until: this.time + 30 };
        if (area === null) this.botOrder = null;
        break;
      }
      case 'detention': if (p) { p.frozenUntil = this.time + 15; p.points -= 5; this.emit('toastKey', { key: 'gotDetention', vars: { name: p.name } }); } break;
      case 'lines': if (p) {
        if (p.human) { p.frozenUntil = this.time + 999; this.emit('lines', { sentence: pick(this.lang === 'es' ? LINES_ES : LINES_EN) }, p.id); }
        else p.frozenUntil = this.time + 10;
        this.emit('toastKey', { key: 'gotLines', vars: { name: p.name } });
      } break;
      case 'plus': if (p) { p.points += 10; this.emit('toastKey', { key: 'gotPoints', vars: { name: p.name, d: '+10' } }); } break;
      case 'minus': if (p) { p.points -= 10; this.emit('toastKey', { key: 'gotPoints', vars: { name: p.name, d: '−10' } }); } break;
      case 'summon': {
        const ps = this.list.filter(q => q.id !== this.me.id && q.alive && !q.npc);
        ps.forEach((q, i) => {
          const a = i / ps.length * 6.28; const s = this.nav.standSpot(this.me.x + Math.cos(a) * 2.5, this.me.z + Math.sin(a) * 2.5) || this.me;
          q.x = s.x; q.z = s.z; q.path = []; q.ai.wait = this.time + 6;
          if (q.human) this.emit('tp', { x: s.x, z: s.z }, q.id);
        });
        this.emit('toastKey', { key: 'summoned' }); break;
      }
      case 'assembly': if (this.phase === 'play') this.startMeeting('hm', this.me.id); break;
      case 'mute': if (p && p.human) { if (this.muted.has(p.id)) this.muted.delete(p.id); else this.muted.add(p.id); this.emit('toastKey', { key: this.muted.has(p.id) ? 'gotMuted' : 'gotUnmuted', vars: { name: p.name } }); } break;
      case 'end': this.end('hm'); break;
    }
  }

  /* ---- core rules ---- */
  doDetain(teacher, p) {
    p.alive = false;
    this.bodies.push({ id: p.id, x: p.x, z: p.z, look: p.look, name: p.name });
    for (const w of this.list) if (w.bot && w.alive && w.id !== teacher.id && w.id !== p.id && dist(w, p) < 13 && this.world.col.los(w.x, w.z, p.x, p.z)) w.sus[teacher.id] = (w.sus[teacher.id] || 0) + 3;
    if (p.human) this.emit('detainedMe', {}, p.id);
    if (teacher.human) this.emit('detention', { id: p.id }, teacher.id);
    this.checkWin();
  }

  startMeeting(reason, caller, bodyId) {
    const body = this.bodies.find(b => b.id === bodyId);
    this.phase = 'meeting'; this.sab = null; this.order = null;
    this.meeting = { reason, caller, bodyName: body?.name, endsAt: this.time + 50, votes: new Map(), chat: [], result: null, hmVote: undefined };
    this.bodies = [];
    for (const p of this.list) { p.path = []; p.ai.task = null; }
    for (const b of this.list) if (b.bot && b.alive) { b.ai.voteAt = this.time + rand(6, 28); b.ai.chatAt = this.time + rand(1.5, 10); }
    this.spawnAll();
    this.emit('meeting', {});
  }
  botVote(b) {
    const alive = this.list.filter(p => p.alive && p.role !== 'headmistress' && p.id !== b.id);
    let target = 'skip';
    const sus = Object.entries(b.sus).filter(([id]) => this.players.get(id)?.alive).sort((x, y) => y[1] - x[1]);
    if (b.role === 'teacher') target = Math.random() < 0.6 ? pick(alive.filter(p => p.role !== 'teacher')).id : 'skip';
    else if (sus.length && sus[0][1] >= 2) target = sus[0][0];
    else if (Math.random() < 0.45) target = pick(alive).id;
    this.meeting.votes.set(b.id, target);
  }
  botChat(b) {
    const others = this.list.filter(p => p.alive && p.id !== b.id && p.role !== 'headmistress');
    const sus = Object.entries(b.sus).sort((x, y) => y[1] - x[1])[0];
    if (sus && sus[1] >= 2) this.meeting.chat.push({ id: b.id, phrase: 'ph_sus', about: sus[0] });
    else this.meeting.chat.push({ id: b.id, phrase: pick(['ph_tasks', 'ph_where', 'ph_with', 'ph_skip', 'ph_notme', 'ph_sus']), about: pick(others)?.id });
  }
  voters() { return this.list.filter(p => p.alive && p.role !== 'headmistress'); }
  maybeEndVote() {
    if (this.meeting && !this.meeting.result && this.voters().every(p => this.meeting.votes.has(p.id))) this.tally();
  }
  tally() {
    const m = this.meeting, count = {};
    for (const v of m.votes.values()) count[v] = (count[v] || 0) + 1;
    let best = [], max = 0;
    for (const [k, c] of Object.entries(count)) { if (c > max) { max = c; best = [k]; } else if (c === max) best.push(k); }
    let out = best.length === 1 ? best[0] : (m.hmVote && best.includes(m.hmVote) ? m.hmVote : 'skip');
    const ej = out !== 'skip' ? this.players.get(out) : null;
    m.result = { ejected: ej?.id || null, name: ej?.name, wasTeacher: ej?.role === 'teacher', count };
    if (ej) { ej.alive = false; ej.revealed = true; }
    m.resumeAt = this.time + 5;
    this.emit('meetingResult', m.result);
  }

  checkWin() {
    if (this.phase === 'end') return;
    if (this.mode === 'solo') {
      if (this.me.done.size === this.me.tasks.length) this.end('solo-win');
      return;
    }
    const studentsAlive = this.list.filter(p => p.role === 'student' && p.alive).length;
    const teachersAlive = this.list.filter(p => p.role === 'teacher' && p.alive).length;
    if (this.taskDone >= this.taskTotal || teachersAlive === 0) this.end('students');
    else if (studentsAlive <= teachersAlive) this.end('teacher');
  }
  end(winner) {
    if (this.phase === 'end') return;
    this.phase = 'end';
    this.result = { winner };
    for (const p of this.list) if (p.human) {
      const won = winner === 'solo-win' || (winner === 'students' && p.role === 'student') || (winner === 'teacher' && p.role === 'teacher') || (p.role === 'headmistress' && winner !== 'hm');
      if (won) p.stars += 25;
      this.emit('end', { winner, meWon: won }, p.id);
    }
  }

  /* ---- per-frame update ---- */
  update(dt) {
    if (this.phase === 'end') return;
    this.time += dt;
    const T = this.time;

    if (this.phase === 'meeting') {
      const m = this.meeting;
      if (!m.result) {
        for (const b of this.list) if (b.bot && b.alive) {
          if (b.ai.chatAt && T > b.ai.chatAt) { b.ai.chatAt = Math.random() < 0.4 ? T + rand(4, 12) : 0; this.botChat(b); this.emit('meetingUpdate', {}); }
          if (b.ai.voteAt && T > b.ai.voteAt && !m.votes.has(b.id)) { this.botVote(b); this.emit('meetingUpdate', {}); this.maybeEndVote(); }
        }
        if (T > m.endsAt && !m.result) this.tally();
      } else if (T > m.resumeAt) {
        this.phase = 'play'; this.meeting = null; this.sabReady = T + 25;
        for (const p of this.list) { p.sus = {}; p.killReady = T + 20; }
        this.emit('resume', {});
        this.checkWin();
      }
      return;
    }

    // sabotage timers
    if (this.sab?.kind === 'fire' && T > this.sab.until) { this.end('teacher'); return; }
    if (this.sab?.kind === 'lights' && this.sab.fixAt && T > this.sab.fixAt && this.mode !== 'solo') { this.sab = null; this.emit('sabEnd', {}); }

    // solo clock & NPC sabotage
    if (this.mode === 'solo') {
      if (T > this.solo.endsAt) { this.end('solo-lose-time'); return; }
      if (T > this.sabReady && !this.sab) { this.startSab('lights'); this.sab.fixAt = null; this.sabReady = T + rand(80, 120); }
      if (T > this.nextQuiz) { this.nextQuiz = T + rand(60, 95); if (this.me.frozenUntil < T) this.emit('quiz', {}, this.me.id); }
    } else {
      const tb = this.list.find(p => p.bot && p.role === 'teacher' && p.alive);
      if (tb && T > this.sabReady && !this.sab && Math.random() < dt / 30) { this.startSab(Math.random() < 0.7 ? 'lights' : 'quiz', tb); this.sabReady = T + 40; }
    }

    // NPC headmistress orders (solo & practice)
    if (this.mode !== 'online' && this.players.has('hm') && this.me.role !== 'headmistress') this.updateOrders(T);
    if (this.botOrder && T > this.botOrder.until) this.botOrder = null;

    for (const p of this.list) {
      if (this.phase !== 'play') break;
      if (p.human) continue;
      if (p.hunter) this.updateHunter(p, dt, T);
      else if (p.id === 'hm') this.updateHM(p, dt, T);
      else if (p.bot && p.alive) this.updateBot(p, dt, T);
      else if (p.bot) this.updateGhostBot(p, dt, T);
    }
  }

  updateOrders(T) {
    const me = this.me;
    if (this.order) {
      if (inRect(me, areaRect(this.order.area))) {
        me.points += 15; me.stars += 15; this.emit('orderResult', { ok: true }); this.order = null; this.nextOrder = T + rand(55, 80);
      } else if (T > this.order.endsAt) {
        this.order = null; this.nextOrder = T + rand(55, 80);
        if (me.alive) this.emit('orderResult', { ok: false, sentence: pick(this.lang === 'es' ? LINES_ES : LINES_EN) });
      }
    } else if (T > this.nextOrder && me.alive && me.frozenUntil < T) {
      const candidates = ORDER_AREAS.filter(k => { const r = areaRect(k); return r && !inRect(me, r); });
      const area = pick(candidates), r = areaRect(area);
      const d = Math.hypot((r.x0 + r.x1) / 2 - me.x, (r.z0 + r.z1) / 2 - me.z);
      const secs = Math.ceil(d / 5 + 14);
      this.order = { area, endsAt: T + secs, secs };
      this.emit('npcOrder', { area, secs });
    }
  }

  walk(p, dt, speed) {
    if (!p.path.length) { p.moving = false; return true; }
    const tgt = p.path[0], dx = tgt.x - p.x, dz = tgt.z - p.z, d = Math.hypot(dx, dz);
    if (d < 0.5) { p.path.shift(); return !p.path.length; }
    const s = Math.min(d, speed * dt);
    const ox = p.x, oz = p.z;
    p.x += dx / d * s; p.z += dz / d * s;
    this.world.collide(p, 0.42);
    const want = Math.atan2(dx, dz);
    let diff = want - p.ry; while (diff > Math.PI) diff -= 2 * Math.PI; while (diff < -Math.PI) diff += 2 * Math.PI;
    p.ry += diff * Math.min(1, dt * 10);
    p.moving = true;
    const moved = Math.hypot(p.x - ox, p.z - oz);
    p.ai.stuck = moved < s * 0.3 ? (p.ai.stuck || 0) + dt : 0;
    if (p.ai.stuck > 1.2) { p.ai.stuck = 0; const end = p.path[p.path.length - 1]; p.path = this.nav.path(p.x, p.z, end.x, end.z); if (Math.random() < 0.3) p.path = []; }
    return false;
  }
  goTo(p, x, z) { p.path = this.nav.path(p.x, p.z, x, z); }

  updateBot(b, dt, T) {
    if (b.frozenUntil > T || (b.ai.wait && b.ai.wait > T)) { b.moving = false; return; }
    // report bodies
    if (b.role === 'student') for (const body of this.bodies) {
      if (dist(b, body) < 6 && this.world.col.los(b.x, b.z, body.x, body.z)) { this.startMeeting('report', b.id, body.id); return; }
    }
    // fix sabotage
    if (this.sab && b.role === 'student') {
      if (this.sab.kind === 'fire') {
        const k = !this.sab.fireA && (b.id.charCodeAt(3) % 2 === 0 || this.sab.fireB) ? 'fireA' : (!this.sab.fireB ? 'fireB' : null);
        if (k) {
          const tgt = SPECIAL[k];
          if (b.ai.sabGoal !== k) { b.ai.sabGoal = k; const s = this.nav.standSpot(tgt.x, tgt.z); this.goTo(b, s.x, s.z); }
          if (dist(b, tgt) < 2.5) { this.fix(k); b.ai.sabGoal = null; }
          this.walk(b, dt, 5.4); return;
        }
      }
    } else b.ai.sabGoal = null;
    // teacher hunting
    if (b.role === 'teacher' && T > b.killReady) {
      const prey = this.list.filter(p => p.role === 'student' && p.alive && dist(p, b) < 12 && this.world.col.los(b.x, b.z, p.x, p.z));
      for (const p of prey) {
        const witnesses = this.list.filter(w => w.id !== p.id && w.id !== b.id && w.alive && w.role === 'student' && dist(w, p) < 11);
        if (!witnesses.length) {
          if (dist(b, p) < 1.6) { this.doDetain(b, p); b.killReady = T + rand(25, 40); b.path = []; b.ai.task = null; return; }
          b.path = [{ x: p.x, z: p.z }]; this.walk(b, dt, 6.2); return;
        }
      }
    }
    // obey headmistress orders
    if (this.botOrder && b.ai.order !== this.botOrder) {
      b.ai.order = this.botOrder; const r = areaRect(this.botOrder.area);
      const s = this.nav.standSpot(rand(r.x0 + 1, r.x1 - 1), rand(r.z0 + 1, r.z1 - 1));
      if (s) { this.goTo(b, s.x, s.z); b.ai.task = 'order'; }
    }
    if (b.ai.task === 'order') { if (this.walk(b, dt, 5.2)) { b.moving = false; if (!this.botOrder) b.ai.task = null; } return; }
    // tasks
    if (b.ai.working) {
      b.moving = false;
      if (T > b.ai.working.until) {
        const id = b.ai.working.id; b.ai.working = null; b.done.add(id);
        if (b.role === 'student') { this.taskDone++; this.checkWin(); }
      }
      return;
    }
    if (!b.ai.task) {
      const next = b.tasks.find(id => !b.done.has(id));
      if (next) { const s = STATIONS.find(x => x.id === next); const sp = this.nav.standSpot(s.x, s.z); b.ai.task = next; this.goTo(b, sp.x, sp.z); }
      else { const n = this.nav.randomNode(); b.ai.task = 'wander'; this.goTo(b, n.x, n.z); }
    }
    if (this.walk(b, dt, 5.0)) {
      if (b.ai.task !== 'wander' && b.ai.task !== 'order') b.ai.working = { id: b.ai.task, until: T + rand(3, 6) };
      b.ai.task = null;
      if (b.role === 'teacher' && Math.random() < 0.5) b.ai.wait = T + rand(1, 4);
    }
  }

  updateGhostBot(b, dt, T) {
    if (b.role !== 'student') return;
    if (!b.ai.task && !b.ai.working) {
      const next = b.tasks.find(id => !b.done.has(id)); if (!next) return;
      const s = STATIONS.find(x => x.id === next); b.ai.task = next; b.path = [{ x: s.x, z: s.z }];
    }
    if (b.ai.working) { if (T > b.ai.working.until) { b.done.add(b.ai.working.id); this.taskDone++; b.ai.working = null; this.checkWin(); } return; }
    const tgt = b.path[0]; if (!tgt) return;
    const dx = tgt.x - b.x, dz = tgt.z - b.z, d = Math.hypot(dx, dz);
    if (d < 1.2) { b.path = []; b.ai.working = { id: b.ai.task, until: T + rand(4, 8) }; b.ai.task = null; return; }
    b.x += dx / d * 4 * dt; b.z += dz / d * 4 * dt; b.ry = Math.atan2(dx, dz); b.moving = true;
  }

  updateHunter(g, dt, T) {
    const me = this.me;
    if (g.ai.wait && g.ai.wait > T) { g.moving = false; return; }
    const sight = this.sab?.kind === 'lights' ? 30 : 20;
    const sees = me.frozenUntil < T && dist(g, me) < sight && this.world.col.los(g.x, g.z, me.x, me.z);
    if (sees && T >= (g.ai.calm || 0)) {
      g.ai.last = { x: me.x, z: me.z, t: T }; g.ai.mode = 'chase';
      if (!g.ai.spotted) { g.ai.spotted = true; if (T > (this.spottedAt || 0) + 6) { this.spottedAt = T; this.emit('spotted', { name: g.name }); } }
    }
    else g.ai.spotted = false;
    if (T < (g.ai.calm || 0)) { g.ai.mode = 'patrol'; }
    if (g.ai.mode === 'chase' && T >= (g.ai.calm || 0)) {
      if (sees) g.path = [{ x: me.x, z: me.z }];
      else if (!g.path.length || T - (g.ai.repath || 0) > 1.5) { g.ai.repath = T; if (g.ai.last && T - g.ai.last.t < 12) this.goTo(g, g.ai.last.x, g.ai.last.z); else g.ai.mode = 'patrol'; }
      this.walk(g, dt, g.speed);
      if (dist(g, me) < 1.4 && me.frozenUntil < T) {
        this.solo.detentions++;
        this.emit('soloCaught', { n: this.solo.detentions, name: g.name });
        if (this.solo.detentions >= 3) { this.end('solo-lose-caught'); return; }
        const s = this.nav.standSpot(SPECIAL.office.x, SPECIAL.office.z + 2);
        me.frozenUntil = T + 6;
        this.emit('tp', { x: s.x, z: s.z, yaw: 0 });
        for (const h of this.list) if (h.hunter) { h.ai.calm = Math.max(h.ai.calm || 0, T + (h === g ? 14 : 8)); h.ai.mode = 'patrol'; h.path = []; }
        const n = this.nav.randomNode(); this.goTo(g, n.x, n.z);
      }
      return;
    }
    // patrol his own area (fields / Senior School / Junior School); come looking if you're in it
    if (!g.path.length) {
      const near = g.zone(me) && T > 20 && Math.random() < 0.35 && this.nav.standSpot(me.x + rand(-10, 10), me.z + rand(-10, 10));
      const tgt = near && g.zone(near) ? near : pick(g.zoneNodes);
      this.goTo(g, tgt.x, tgt.z);
      g.ai.wait = T + rand(0.5, 2.5);
    }
    this.walk(g, dt, 4.2);
  }

  updateHM(h, dt, T) {
    // strolls between her office and the corridor
    if (!h.path.length) {
      if (!h.ai.wait || T > h.ai.wait) {
        const spots = [[113.8, 16], [117, 4], [122, 0], [122, 15], [117, 18]];
        const [x, z] = pick(spots); this.goTo(h, x, z); h.ai.wait = T + rand(4, 10);
      } else { h.moving = false; return; }
    }
    this.walk(h, dt, 3);
  }
}
