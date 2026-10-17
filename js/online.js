// Online rooms, peer-to-peer (PeerJS / WebRTC). The room creator's browser runs the game (Sim);
// friends' browsers send their moves and actions, and draw what the host tells them.
import { Sim, PHRASES } from './sim.js';
import { cleanChat } from './chat.js';
import { STATIONS } from './world.js';

const ROLES = ['student', 'teacher', 'headmistress'];
const STATION_IDS = new Set(STATIONS.map(s => s.id));

const PREFIX = 'tbs-pauligur-v1-';
const LETTERS = 'ABCDEFGHJKMNPQRSTUVWXYZ';
export const MAX_PLAYERS = 11;
export const makeCode = () => Array.from({ length: 4 }, () => LETTERS[Math.floor(Math.random() * LETTERS.length)]).join('');
export const cleanName = n => (String(n || '').replace(/[^A-Za-z0-9_áéíóúñÁÉÍÓÚÑ]/g, '').slice(0, 12)) || 'Student';
const cleanLook = l => {
  const s = v => typeof v === 'string' ? v.slice(0, 20) : undefined;
  return { color: /^#[0-9a-f]{6}$/i.test(l?.color) ? l.color : '#ffcf9e', hat: s(l?.hat) || 'none', hair: s(l?.hair) || 'none', outfit: s(l?.outfit) || 'jumper', acc: s(l?.acc) || 'none' };
};
const num = v => (Number.isFinite(v) ? v : 0);

function newPeer(id) {
  const Peer = window.Peer;
  if (!Peer) throw new Error('nopeer');
  return id ? new Peer(id, { debug: 1 }) : new Peer({ debug: 1 });
}

/* =================================================================== */
/* Host                                                                */
/* =================================================================== */
export class HostRoom {
  constructor({ profile, hm, onLobby, onEvent, onError }) {
    Object.assign(this, { profile, hm, onLobby, onEvent, onError });
    this.code = null; this.peer = null; this.conns = new Map(); this.bots = 0;
    this.chatOn = true; this.chat = []; this.muted = new Set(); this.lastChat = new Map();
    this.lobby = new Map();      // id -> { id, name, look, hm, host }
    this.sim = null; this.timer = null;
    this.hostId = 'host';
  }

  open() {
    return new Promise((resolve, reject) => {
      const tryCode = (left) => {
        this.code = makeCode();
        let peer;
        try { peer = newPeer(PREFIX + this.code); } catch (e) { return reject(e); }
        peer.on('open', () => { this.peer = peer; this.addLobby(this.hostId, this.profile, this.hm); resolve(this.code); });
        peer.on('error', e => {
          if (e.type === 'unavailable-id' && left > 0) { peer.destroy(); tryCode(left - 1); }
          else if (!this.peer) reject(e); else this.onError?.(e);
        });
        peer.on('connection', c => this.accept(c));
        peer.on('disconnected', () => { try { peer.reconnect(); } catch { /* ignore */ } });
      };
      tryCode(3);
    });
  }

  accept(conn) {
    conn.on('open', () => {
      if (this.sim || this.lobby.size >= MAX_PLAYERS) {
        conn.send({ t: 'reject', reason: this.sim ? 'started' : 'full' });
        setTimeout(() => conn.close(), 300); return;
      }
      this.conns.set(conn.peer, conn);
    });
    conn.on('data', msg => this.handle(conn.peer, msg));
    conn.on('close', () => this.drop(conn.peer));
    conn.on('error', () => this.drop(conn.peer));
  }

  addLobby(id, profile, hm = false) {
    let name = cleanName(profile.name);
    const taken = new Set([...this.lobby.values()].map(p => p.name));
    for (let i = 2; taken.has(name); i++) name = cleanName(profile.name).slice(0, 10) + i;
    this.lobby.set(id, { id, name, look: cleanLook(profile.look), hm: !!hm, host: id === this.hostId });
    this.pushLobby();
  }
  lobbyState() { return { t: 'L', code: this.code, bots: this.bots, chatOn: this.chatOn, chat: this.chat, muted: [...this.muted], players: [...this.lobby.values()].map(({ id, name, look, hm, host }) => ({ id, name, look, hm, host })) }; }
  setChat(on) { this.chatOn = !!on; if (this.sim) this.sim.chatOn = this.chatOn; this.pushLobby(); }
  toggleMute(id) { if (this.muted.has(id)) this.muted.delete(id); else this.muted.add(id); this.pushLobby(); }
  lobbyChat(id, raw) {
    const p = this.lobby.get(id); if (!p || !this.chatOn || this.muted.has(id)) return;
    const now = performance.now(); if (now - (this.lastChat.get(id) || 0) < 1200) return;
    const text = cleanChat(raw); if (!text) return;
    this.lastChat.set(id, now);
    this.chat.push({ id, name: p.name, color: p.look.color, text }); if (this.chat.length > 40) this.chat.shift();
    this.pushLobby();
  }
  pushLobby() { const L = this.lobbyState(); this.broadcast(L); this.onLobby?.(L); }
  setBots(n) { this.bots = Math.max(0, Math.min(8, n)); this.pushLobby(); }

  send(id, msg) { const c = this.conns.get(id); if (c && c.open) try { c.send(msg); } catch { /* ignore */ } }
  broadcast(msg) { for (const id of this.conns.keys()) this.send(id, msg); }

  kick(id) {
    if (id === this.hostId) return;
    this.send(id, { t: 'kicked' });
    const c = this.conns.get(id); setTimeout(() => c?.close(), 200);
    this.drop(id);
  }
  drop(id) {
    if (!this.conns.has(id) && !this.lobby.has(id)) return;
    this.conns.delete(id); this.lobby.delete(id);
    if (this.sim) { this.sim.removePlayer(id); this.dirty = true; }
    this.pushLobby();
  }

  handle(id, msg) {
    if (!msg || typeof msg !== 'object') return;
    if (msg.t === 'hello') { if (!this.sim && !this.lobby.has(id)) this.addLobby(id, msg); return; }
    if (!this.lobby.has(id)) return;
    if (msg.t === 'lchat') { this.lobbyChat(id, msg.text); return; }
    const sim = this.sim; if (!sim) return;
    if (msg.t === 'p') { sim.setPos(id, num(msg.x), num(msg.z), num(msg.ry), !!msg.m); return; }
    if (msg.t !== 'act') return;
    sim.as(id, () => {
      switch (msg.a) {
        case 'task': sim.completeTask(String(msg.id)); break;
        case 'report': sim.report(String(msg.id)); break;
        case 'bell': sim.ringBell(); break;
        case 'fix': sim.fix(String(msg.kind)); break;
        case 'detain': sim.detain(String(msg.id)); break;
        case 'sab': if (['lights', 'fire', 'quiz'].includes(msg.kind)) sim.sabotage(msg.kind); break;
        case 'door': sim.staffDoor(); break;
        case 'vote': sim.vote(String(msg.id)); break;
        case 'say': if (PHRASES.includes(msg.ph)) sim.say(msg.ph, String(msg.about || '')); break;
        case 'chat': sim.sayText(String(msg.text || '')); break;
        case 'linesDone': { const p = sim.me; if (p.frozenUntil > sim.time + 100) p.frozenUntil = 0; break; }
      }
    });
    this.dirty = true;
  }

  start(world, nav, lang) {
    const humans = [...this.lobby.values()].map(p => ({ id: p.id, name: p.name, look: p.look, hm: p.hm }));
    this.sim = new Sim(world, nav, { mode: 'online', humans, bots: this.bots, meId: this.hostId, lang, chat: this.chatOn, emit: (type, data, to) => this.emitFromSim(type, data, to) });
    this.sim.muted = this.muted;   // mutes carry over from the lobby (and back)
    this.broadcast({ t: 'start' });
    for (const id of this.conns.keys()) this.sendState(id);
    let last = performance.now(), posT = 0, stateT = 0;
    clearInterval(this.timer);
    this.timer = setInterval(() => {
      const now = performance.now();
      let acc = Math.min(2, (now - last) / 1000); last = now;
      while (acc > 0) { const st = Math.min(0.05, acc); this.sim.update(st); acc -= st; }   // keeps real time even if the tab is in the background
      posT += 1; stateT += 1;
      if (posT >= 1) { posT = 0; for (const id of this.conns.keys()) this.send(id, positionsFor(this.sim, id)); }
      if (stateT >= 5 || (this.dirty && stateT >= 1)) { stateT = 0; this.dirty = false; for (const id of this.conns.keys()) this.sendState(id); }
    }, 66);
    return this.sim;
  }
  sendState(id) { if (this.sim?.players.has(id)) this.send(id, stateFor(this.sim, id)); }

  emitFromSim(type, data, to) {
    this.dirty = true;
    if (to === undefined || to === this.hostId) this.onEvent?.(type, data);
    const msg = { t: 'E', type, data };
    if (to === undefined) this.broadcast(msg); else if (to !== this.hostId) this.send(to, msg);
  }

  backToLobby() {
    clearInterval(this.timer); this.timer = null; this.sim = null;
    this.broadcast({ t: 'lobby' }); this.pushLobby();
  }
  close() {
    clearInterval(this.timer);
    this.broadcast({ t: 'closed' });
    setTimeout(() => { try { this.peer?.destroy(); } catch { /* ignore */ } }, 200);
  }
}

/* ---- what each player is allowed to know ---- */
function visibleRole(sim, viewer, p) {
  if (p.role === 'headmistress') return 'headmistress';
  if (sim.phase === 'end' || p.id === viewer.id || p.revealed) return p.role;
  if (viewer.role === 'headmistress') return p.role;
  if (viewer.role === 'teacher' && p.role === 'teacher') return 'teacher';
  return 'student';
}
function stateFor(sim, id) {
  const v = sim.players.get(id), m = sim.meeting;
  return {
    t: 'S', time: sim.time, phase: sim.phase, chatOn: sim.chatOn, muted: sim.muted.has(id), taskDone: sim.taskDone, taskTotal: sim.taskTotal, sabReady: sim.sabReady,
    sab: sim.sab, result: sim.result, bodies: sim.bodies.map(b => ({ id: b.id, x: b.x, z: b.z, look: b.look, name: b.name })),
    players: sim.list.map(p => ({
      id: p.id, name: p.name, look: p.look, role: visibleRole(sim, v, p), alive: p.alive, revealed: !!p.revealed,
      points: p.points, frozenUntil: p.frozenUntil, npc: !!p.npc, bot: !!p.bot, human: !!p.human, x: p.x, z: p.z, ry: p.ry,
      ...(p.id === id ? { tasks: p.tasks, done: [...p.done], killReady: p.killReady, bellUsed: p.bellUsed, stars: p.stars } : {}),
    })),
    meeting: m && {
      reason: m.reason, caller: m.caller, bodyName: m.bodyName, endsAt: m.endsAt, chat: m.chat, result: m.result,
      voted: [...m.votes.keys()], myVote: m.votes.get(id), hmVote: v.role === 'headmistress' ? m.hmVote : undefined,
    },
  };
}
function positionsFor(sim, id) {
  const v = sim.players.get(id); if (!v) return { t: 'P', d: [] };
  const seeGhosts = !v.alive || v.role === 'headmistress' || sim.phase === 'end';
  const d = [];
  for (const p of sim.list) {
    if (p.id === id) continue;
    if (!p.alive && p.role !== 'headmistress' && !seeGhosts) continue;
    d.push([p.id, Math.round(p.x * 100) / 100, Math.round(p.z * 100) / 100, Math.round(p.ry * 100) / 100, p.moving ? 1 : 0]);
  }
  return { t: 'P', time: sim.time, d };
}

/* =================================================================== */
/* Client                                                              */
/* =================================================================== */
export class ClientRoom {
  constructor({ profile, onLobby, onStart, onBackToLobby, onEvent, onClose }) {
    Object.assign(this, { profile, onLobby, onStart, onBackToLobby, onEvent, onClose });
    this.peer = null; this.conn = null; this.sim = null; this.closed = false;
  }
  join(code) {
    return new Promise((resolve, reject) => {
      let peer;
      try { peer = newPeer(); } catch (e) { return reject(e); }
      this.peer = peer;
      const fail = (why) => { if (!this.conn?.open) { reject(new Error(why)); try { peer.destroy(); } catch { /* ignore */ } } };
      const to = setTimeout(() => fail('timeout'), 15000);
      peer.on('error', e => { clearTimeout(to); fail(e.type === 'peer-unavailable' ? 'notfound' : (e.type || 'error')); });
      peer.on('open', () => {
        const c = peer.connect(PREFIX + code.toUpperCase(), { reliable: true, serialization: 'json' });
        this.conn = c;
        c.on('open', () => { clearTimeout(to); this.myId = peer.id; c.send({ t: 'hello', name: this.profile.name, look: this.profile.look }); resolve(); });
        c.on('data', msg => this.handle(msg));
        c.on('close', () => this.lost('closed'));
        c.on('error', () => this.lost('error'));
      });
    });
  }
  lost(why) { if (this.closed) return; this.closed = true; this.onClose?.(why); try { this.peer?.destroy(); } catch { /* ignore */ } }
  leave() { this.closed = true; try { this.conn?.close(); this.peer?.destroy(); } catch { /* ignore */ } }
  send(msg) { if (this.conn?.open) try { this.conn.send(msg); } catch { /* ignore */ } }
  lobbyChat(text) { this.send({ t: 'lchat', text }); }
  handle(msg) {
    if (!msg || typeof msg !== 'object') return;
    switch (msg.t) {
      case 'L': this.onLobby?.(msg); break;
      case 'reject': this.closed = true; this.onClose?.(msg.reason); break;
      case 'kicked': this.closed = true; this.onClose?.('kicked'); break;
      case 'closed': this.lost('hostleft'); break;
      case 'start': this.sim = new RemoteSim(this); this.onStart?.(this.sim); break;
      case 'lobby': this.sim = null; this.onBackToLobby?.(); break;
      case 'S': this.sim?.applyState(msg); break;
      case 'P': this.sim?.applyPositions(msg); break;
      case 'E': if (this.sim) { this.sim.dirtyEvent(msg.type); this.onEvent?.(msg.type, msg.data || {}); } break;
    }
  }
}

/* A stand-in for Sim on friends' devices: same fields the HUD reads, actions go to the host. */
export class RemoteSim {
  constructor(room) {
    this.room = room; this.meId = room.myId; this.mode = 'online'; this.remote = true;
    this.players = new Map(); this.time = 0; this.phase = 'play'; this.bodies = []; this.sab = null; this.meeting = null;
    this.result = null; this.taskDone = 0; this.taskTotal = 1; this.sabReady = 0; this.order = null; this.solo = null;
    this.gotState = false;
  }
  get list() { return [...this.players.values()]; }
  get me() { return this.players.get(this.meId) || this.placeholder(); }
  placeholder() { return this._ph ||= { id: this.meId, name: '', look: {}, role: 'student', alive: true, x: 0, z: 0, ry: 0, tasks: [], done: new Set(), frozenUntil: 0, points: 0, killReady: 0, stars: 0 }; }
  get killReady() { return this.me.killReady ?? 0; }
  get bellUsed() { return !!this.me.bellUsed; }
  get starsEarned() { return this.me.stars ?? 0; }

  applyState(S) {
    this.time = num(S.time); this.phase = ['play', 'meeting', 'end'].includes(S.phase) ? S.phase : 'play';
    this.chatOn = S.chatOn !== false; this.amMuted = !!S.muted;
    this.taskDone = num(S.taskDone); this.taskTotal = Math.max(1, num(S.taskTotal)); this.sabReady = num(S.sabReady);
    this.sab = S.sab && { kind: String(S.sab.kind), until: num(S.sab.until), fireA: !!S.sab.fireA, fireB: !!S.sab.fireB };
    this.result = S.result && { winner: String(S.result.winner) };
    this.bodies = (S.bodies || []).map(b => ({ id: String(b.id), x: num(b.x), z: num(b.z), name: String(b.name ?? '').slice(0, 20), look: cleanLook(b.look) }));
    const seen = new Set();
    for (const sp of S.players) {
      if (typeof sp?.id !== 'string' || sp.id.length > 64) continue;
      seen.add(sp.id);
      let r = this.players.get(sp.id);
      const first = !r;
      if (!r) { r = { x: sp.x, z: sp.z, ry: sp.ry, tx: sp.x, tz: sp.z, try: sp.ry, moving: false, tasks: [], done: new Set(), sus: {}, path: [], ai: {} }; this.players.set(sp.id, r); }
      const { x, z, ry, tasks, done } = sp;
      Object.assign(r, {
        id: sp.id, name: String(sp.name ?? '').slice(0, 20), look: cleanLook(sp.look),
        role: ROLES.includes(sp.role) ? sp.role : 'student', alive: !!sp.alive, revealed: !!sp.revealed,
        points: num(sp.points), frozenUntil: num(sp.frozenUntil), npc: !!sp.npc, bot: !!sp.bot, human: !!sp.human,
        killReady: num(sp.killReady), bellUsed: !!sp.bellUsed, stars: Math.max(0, Math.min(300, num(sp.stars))),
      });
      if (Array.isArray(tasks)) { r.tasks = tasks.filter(id => STATION_IDS.has(id)); r.done = new Set((done || []).filter(id => STATION_IDS.has(id))); }
      if (sp.id === this.meId) { if (first || !this.gotState) { r.x = x; r.z = z; r.ry = ry; } }
      else if (first) { r.x = r.tx = x; r.z = r.tz = z; r.ry = r.try = ry; }
    }
    for (const id of [...this.players.keys()]) if (!seen.has(id)) this.players.delete(id);
    this.gotState = true;
    const mk = JSON.stringify(S.meeting || null);
    if (mk !== this.meetingKey) { this.meetingKey = mk; this.meetingChanged = true; }
    if (S.meeting) {
      const m = S.meeting;
      const votes = new Map(m.voted.map(v => [v, v === this.meId ? m.myVote : '?']));
      this.meeting = { ...m, votes };
    } else this.meeting = null;
  }
  applyPositions(P) {
    for (const [id, x, z, ry, mv] of P.d || []) {
      const r = this.players.get(id); if (!r) continue;
      r.tx = num(x); r.tz = num(z); r.try = num(ry); r.moving = !!mv;
    }
  }
  dirtyEvent() { /* the next state snapshot follows right after */ }
  update(dt) {
    if (this.phase !== 'end') this.time += dt;
    const k = Math.min(1, dt * 12);
    for (const p of this.players.values()) {
      if (p.id === this.meId || p.tx === undefined) continue;
      if (Math.hypot(p.tx - p.x, p.tz - p.z) > 8) { p.x = p.tx; p.z = p.tz; }   // teleported
      p.x += (p.tx - p.x) * k; p.z += (p.tz - p.z) * k;
      let d = p.try - p.ry; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; p.ry += d * k;
    }
  }

  act(a, extra = {}) { this.room.send({ t: 'act', a, ...extra }); }
  completeTask(id) { const me = this.me; if (me.tasks.includes(id) && !me.done.has(id)) { me.done.add(id); this.act('task', { id }); } }
  report(id) { this.act('report', { id }); }
  ringBell() { this.act('bell'); }
  fix(kind) { this.act('fix', { kind }); }
  canDetain() { const me = this.me; return me.role === 'teacher' && me.alive && this.phase === 'play' && this.time >= this.killReady; }
  detainTarget() {
    if (!this.canDetain()) return null;
    let best = null, bd = 2.4; const me = this.me;
    for (const p of this.list) if (p.role === 'student' && p.alive && p.id !== me.id) { const d = Math.hypot(p.x - me.x, p.z - me.z); if (d < bd) { bd = d; best = p; } }
    return best;
  }
  detain(id) { this.act('detain', { id }); }
  sabotage(kind) { this.act('sab', { kind }); }
  staffDoor() { this.act('door'); }
  vote(id) { this.act('vote', { id }); }
  say(ph, about) { this.act('say', { ph, about }); }
  sayText(text) { this.act('chat', { text }); }
  linesDone() { this.act('linesDone'); }
  hm() { /* only the host can be the Headmistress */ }
}
