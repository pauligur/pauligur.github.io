import * as THREE from 'three';
import { buildWorld, STATIONS, SPECIAL, BELL, STAFF_DOORS, BUILDINGS, FIELDS, POOL, BOUNDS, GATE, roomAt } from './world.js';
import { makeGim, animateGim, setGhost, disposeGim, nameTag, COLORS, ITEMS, PRESETS } from './gim.js';
import { Sim, Nav, HM_ORDERS, PHRASES } from './sim.js';
import { HostRoom, ClientRoom } from './online.js';
import { openGame, closeGame, gameOpen } from './tasks.js';
import { t, setLang, applyI18n } from './i18n.js';
import { store, save } from './store.js';
import { sfx, playMusic, unlockAudio, applyVolume } from './audio.js';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const isTouch = matchMedia('(pointer: coarse)').matches;
if (isTouch) document.body.classList.add('touch');

/* =================================================================== */
/* Renderer, scene, world                                              */
/* =================================================================== */
const canvas = $('#c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
const SKY = new THREE.Color('#9fd6f7'), NIGHT = new THREE.Color('#1b2236');
const scene = new THREE.Scene();
scene.background = SKY.clone();
scene.fog = new THREE.Fog(SKY.clone(), 40, 170);
const camera = new THREE.PerspectiveCamera(72, 1, 0.08, 600);
camera.rotation.order = 'YXZ';
const hemi = new THREE.HemisphereLight('#eaf6ff', '#cbbf9f', 1.9);
const sun = new THREE.DirectionalLight('#fff1d6', 2.2); sun.position.set(60, 120, 40);
const fill = new THREE.DirectionalLight('#dbe6ff', 0.9); fill.position.set(-70, 50, -60);
scene.add(hemi, sun, fill);

const world = buildWorld(scene);
let nav = null;
setTimeout(() => { nav = new Nav(world.col); }, 50);

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  preview.resize();
}
addEventListener('resize', resize);

/* =================================================================== */
/* Character preview (home + inventory)                                */
/* =================================================================== */
const preview = (() => {
  const r = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  r.setPixelRatio(Math.min(devicePixelRatio, 2));
  const sc = new THREE.Scene();
  sc.add(new THREE.HemisphereLight('#ffffff', '#8899bb', 2.4));
  const d = new THREE.DirectionalLight('#ffffff', 2); d.position.set(2, 4, 5); sc.add(d);
  const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 50); cam.position.set(0, 1.1, 5.2); cam.lookAt(0, 0.68, 0);
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.12, 40), new THREE.MeshToonMaterial({ color: '#1f7a3f' }));
  plinth.position.y = -0.06; sc.add(plinth);
  let gim = null, spin = 0.5, drag = null, slot = null;
  const el = r.domElement;
  el.addEventListener('pointerdown', e => { drag = e.clientX; el.setPointerCapture(e.pointerId); });
  el.addEventListener('pointermove', e => { if (drag != null) { spin += (e.clientX - drag) * 0.012; drag = e.clientX; } });
  el.addEventListener('pointerup', () => drag = null);
  return {
    set(look) {
      if (gim) { sc.remove(gim); disposeGim(gim); }
      gim = makeGim(look); gim.rotation.y = spin; sc.add(gim);
      gim.scale.setScalar(0.3);
    },
    mount(container) { slot = container; container.append(el); this.resize(); },
    resize() { if (!slot) return; const w = slot.clientWidth, h = slot.clientHeight; if (!w || !h) return; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); },
    frame(dt) {
      if (!gim || !slot || !slot.offsetParent) return;
      if (drag == null) spin += dt * 0.5;
      gim.rotation.y = spin;
      gim.scale.setScalar(gim.scale.x + (1 - gim.scale.x) * Math.min(1, dt * 9));
      animateGim(gim, dt, false);
      r.render(sc, cam);
    },
  };
})();

// little item thumbnails for the inventory
const thumbs = (() => {
  const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  r.setSize(150, 150, false);
  const sc = new THREE.Scene();
  sc.add(new THREE.HemisphereLight('#ffffff', '#8899bb', 2.4));
  const d = new THREE.DirectionalLight('#ffffff', 2); d.position.set(2, 4, 5); sc.add(d);
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
  const cache = new Map();
  return (look, focus) => {
    const key = JSON.stringify(look) + focus;
    if (cache.has(key)) return cache.get(key);
    const g = makeGim(look); g.rotation.y = 0.45; sc.add(g);
    if (focus === 'hat') { cam.position.set(0, 1.55, 2.0); cam.lookAt(0, 1.18, 0); }
    else { cam.position.set(0, 0.95, 3.2); cam.lookAt(0, 0.72, 0); }
    r.render(sc, cam);
    const url = r.domElement.toDataURL();
    sc.remove(g); disposeGim(g);
    cache.set(key, url); return url;
  };
})();

/* =================================================================== */
/* Screens, settings, inventory                                        */
/* =================================================================== */
let screen = 's-home', settingsReturn = 's-home';
function go(id) {
  $$('.screen').forEach(s => s.classList.toggle('show', s.id === id));
  screen = id;
  if (id === 's-home') preview.mount($('#home-preview'));
  if (id === 's-inventory') { preview.mount($('#inv-preview')); renderInventory(); }
  if (id === 's-settings') renderSettings();
  refreshProfile();
}
$$('[data-go]').forEach(b => b.addEventListener('click', () => { sfx('click'); go(b.dataset.go); }));
document.addEventListener('pointerdown', () => { unlockAudio(); if (!session) playMusic('menu'); }, { once: true });

function refreshProfile() {
  $$('.stars-n').forEach(e => e.textContent = store.stars);
  $$('.name-n').forEach(e => e.textContent = store.name);
}

// ---- settings
function renderSettings() {
  const s = store.settings;
  $$('#set-lang button').forEach(b => b.classList.toggle('on', b.dataset.v === s.lang));
  $('#set-sound').classList.toggle('on', s.sound);
  $('#set-music').classList.toggle('on', s.music);
  $('#set-volume').value = s.volume;
  $('#set-sens').value = s.sens;
}
$$('#set-lang button').forEach(b => b.onclick = () => { store.settings.lang = b.dataset.v; setLang(b.dataset.v); save(); renderSettings(); sfx('click'); });
$('#set-sound').onclick = () => { store.settings.sound = !store.settings.sound; applyVolume(); save(); renderSettings(); sfx('click'); };
$('#set-music').onclick = () => { store.settings.music = !store.settings.music; applyVolume(); save(); renderSettings(); };
$('#set-volume').oninput = e => { store.settings.volume = +e.target.value; applyVolume(); save(); };
$('#set-volume').onchange = () => sfx('pop');
$('#set-sens').oninput = e => { store.settings.sens = +e.target.value; save(); };
$('#settings-back').onclick = () => {
  sfx('click');
  if (settingsReturn === 'pause') { $('#s-settings').classList.remove('show'); $('#pause').classList.add('show'); }
  else go('s-home');
};

// ---- inventory
let invTab = 'styles';
const PRESET_PRICE = { classic: 0, headmistress: 0, sporty: 0, scientist: 30, winter: 20, royal: 80 };
const owns = (k, id) => (ITEMS[k].find(i => i.id === id)?.price || 0) === 0 || store.owned.includes(k + ':' + id);
$$('#inv-tabs button').forEach(b => b.onclick = () => { invTab = b.dataset.tab; $$('#inv-tabs button').forEach(x => x.classList.toggle('on', x === b)); renderInventory(); sfx('click'); });
function equip(look) { store.look = { ...store.look, ...look }; save(); preview.set(store.look); renderInventory(); }
function tryBuy(price, onOk, el) {
  if (store.stars >= price) { store.stars -= price; onOk(); sfx('coin'); save(); refreshProfile(); }
  else { sfx('wrong'); el.classList.add('shake'); setTimeout(() => el.classList.remove('shake'), 400); }
}
function renderInventory() {
  const grid = $('#inv-grid'); grid.innerHTML = '';
  const L = store.look;
  const card = (label, thumbHTML, on, price, locked, click) => {
    const d = document.createElement('button');
    d.className = 'item' + (on ? ' on' : '') + (locked ? ' locked' : '') + (locked && store.stars < price ? ' cant' : '');
    d.innerHTML = thumbHTML + `<b>${label}</b>` + (locked ? `<span class="price">⭐ ${price}</span>` : '');
    d.onclick = () => click(d); grid.append(d);
  };
  if (invTab === 'styles') {
    for (const p of PRESETS) {
      const price = PRESET_PRICE[p.id] || 0;
      const locked = price > 0 && !store.owned.includes('preset:' + p.id);
      const on = Object.entries(p.look).every(([k, v]) => L[k] === v);
      card(t('p_' + p.id), `<img class="thumb" src="${thumbs(p.look, 'body')}" alt="">`, on, price, locked, el => {
        const wear = () => { equip(p.look); sfx('pop'); };
        if (locked) tryBuy(price, () => { store.owned.push('preset:' + p.id); for (const k of ['hat', 'outfit', 'acc']) if (!owns(k, p.look[k])) store.owned.push(k + ':' + p.look[k]); wear(); }, el);
        else wear();
      });
    }
  } else if (invTab === 'color') {
    for (const c of COLORS) card('', `<div class="thumb sw" style="background:${c}"></div>`, L.color === c, 0, false, () => { equip({ color: c }); sfx('pop'); });
  } else {
    for (const it of ITEMS[invTab]) {
      const locked = !owns(invTab, it.id);
      card(t('i_' + it.id), `<img class="thumb" src="${thumbs({ ...L, [invTab]: it.id }, invTab === 'hat' || invTab === 'hair' ? 'hat' : 'body')}" alt="">`, L[invTab] === it.id, it.price, locked, el => {
        if (locked) tryBuy(it.price, () => { store.owned.push(invTab + ':' + it.id); equip({ [invTab]: it.id }); }, el);
        else { equip({ [invTab]: it.id }); sfx('pop'); }
      });
    }
  }
}
const nameIn = $('#name-in');
nameIn.addEventListener('input', () => {
  const v = nameIn.value.replace(/[^A-Za-z0-9_áéíóúñÁÉÍÓÚÑ]/g, '').slice(0, 12);
  if (v !== nameIn.value) nameIn.value = v;
  store.name = v || 'pauligur'; save(); refreshProfile();
});
nameIn.addEventListener('keydown', e => e.stopPropagation());

// ---- play / online
let room = null;   // HostRoom (this browser runs the game) or ClientRoom (joined a friend)
$('#btn-solo').onclick = () => { sfx('click'); startSession('solo', 'student'); };
$$('[data-practice]').forEach(b => b.onclick = () => { sfx('click'); startSession('practice', b.dataset.practice); });
const profile = () => ({ name: store.name, look: store.look });

$('#btn-create').onclick = async () => {
  sfx('click');
  const hm = document.querySelector('input[name=role]:checked').value === 'headmistress';
  leaveRoom();
  $('#create-msg').textContent = t('connecting');
  const r = new HostRoom({ profile: profile(), hm, onLobby: renderLobby, onEvent: onSimEvent, onError: () => toast(t('errNet'), 'bad') });
  try {
    await r.open();
    room = r; document.body.classList.add('is-host');
    $('#create-msg').textContent = ''; go('s-lobby'); renderLobby(r.lobbyState());
  } catch { $('#create-msg').textContent = t('errNet'); }
};
$('#btn-join').onclick = async () => {
  sfx('click');
  const code = $('#code-in').value.trim().toUpperCase();
  if (code.length !== 4) { $('#join-msg').textContent = t('errNotFound'); return; }
  leaveRoom();
  $('#join-msg').textContent = t('connecting');
  const r = new ClientRoom({
    profile: profile(),
    onLobby: L => { if (room === r) { renderLobby(L); if (!session && screen !== 's-lobby') go('s-lobby'); } },
    onStart: sim => startSession('online', null, { sim, room: r }),
    onBackToLobby: () => { endSession(); playMusic('menu'); go('s-lobby'); },
    onEvent: onSimEvent,
    onClose: why => {
      if (room !== r) return;
      room = null; endSession(); playMusic('menu'); go('s-online');
      $('#join-msg').textContent = t({ kicked: 'errKicked', hostleft: 'errHostLeft', started: 'errStarted', full: 'errFull' }[why] || 'errLost');
    },
  });
  room = r;
  try { await r.join(code); document.body.classList.remove('is-host'); $('#join-msg').textContent = ''; }
  catch (e) { room = null; $('#join-msg').textContent = t(e.message === 'notfound' ? 'errNotFound' : 'errNet'); }
};
function leaveRoom() {
  if (!room) return;
  const r = room; room = null;
  if (r instanceof HostRoom) r.close(); else r.leave();
  document.body.classList.remove('is-host');
}
$('#lobby-leave').onclick = () => { sfx('click'); leaveRoom(); go('s-online'); };
$('#bots-minus').onclick = () => { if (room instanceof HostRoom) { room.setBots(room.bots - 1); sfx('click'); } };
$('#bots-plus').onclick = () => { if (room instanceof HostRoom) { room.setBots(room.bots + 1); sfx('click'); } };
$('#btn-start').onclick = () => {
  if (!(room instanceof HostRoom)) return;
  sfx('click');
  if (!nav) nav = new Nav(world.col);
  const sim = room.start(world, nav, store.settings.lang);
  startSession('online', sim.me.role, { sim, room });
};
function sendLobbyChat() {
  const inp = $('#lchat-in'), v = inp.value.trim(); if (!v || !room) return;
  if (room instanceof HostRoom) room.lobbyChat(room.hostId, v); else room.lobbyChat(v);
  inp.value = ''; sfx('pop');
}
$('#lchat-send').onclick = sendLobbyChat;
$('#lchat-in').addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') sendLobbyChat(); });
$('#chat-toggle').onclick = () => { if (room instanceof HostRoom) { room.setChat(!room.chatOn); sfx('click'); } };
function renderLobby(L) {
  $('#lobby-code').textContent = L.code || '····';
  const list = $('#lobby-list'); list.innerHTML = '';
  const isHost = room instanceof HostRoom, myId = isHost ? room.hostId : room?.myId;
  for (const p of L.players) {
    const li = document.createElement('li');
    const av = document.createElement('span'); av.className = 'av'; av.style.setProperty('--c', p.look.color);
    const nm = document.createElement('span'); nm.textContent = p.name;
    const sm = document.createElement('small');
    sm.textContent = (p.hm ? '👩‍🏫 ' + t('roleHM') : '🎒 ' + t('roleStudent')) + (p.host ? ' · ' + t('host') : '') + (p.id === myId ? ' · ' + t('you') : '');
    li.append(av, nm, sm);
    if (isHost && !p.host) {
      const mu = document.createElement('button'); const on = (L.muted || []).includes(p.id);
      mu.className = 'mute' + (on ? ' on' : ''); mu.textContent = on ? '🔇' : '💬'; mu.title = t(on ? 'unmute' : 'mute');
      mu.onclick = () => { room.toggleMute(p.id); sfx('click'); };
      const k = document.createElement('button'); k.className = 'kick'; k.textContent = '✕'; k.title = t('hmKick'); k.onclick = () => room.kick(p.id);
      li.append(mu, k);
    }
    list.append(li);
  }
  for (let i = 0; i < L.bots; i++) {
    const li = document.createElement('li');
    const av = document.createElement('span'); av.className = 'av'; av.style.setProperty('--c', COLORS[(i * 3 + 5) % COLORS.length]);
    const nm = document.createElement('span'); nm.textContent = '🤖 ' + t('bots');
    li.append(av, nm); list.append(li);
  }
  $('#bots-n').textContent = L.bots;
  $('#chat-toggle').classList.toggle('on', L.chatOn !== false);
  const log = $('#lchat-log'), atBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 30;
  log.innerHTML = '';
  for (const c of L.chat || []) {
    const d = document.createElement('div'); const b = document.createElement('b'); b.style.setProperty('--c', c.color); b.textContent = c.name + ':';
    d.append(b, document.createTextNode(' ' + c.text)); log.append(d);
  }
  if (atBottom) log.scrollTop = log.scrollHeight;
  const mutedMe = (L.muted || []).includes(myId);
  $('#lobby .chat-row, .lchat .chat-row')?.classList.toggle('off', L.chatOn === false || mutedMe);
  $('#lchat-in').placeholder = mutedMe ? t('youMuted') : L.chatOn === false ? t('chatOffNote') : t('chatPh');
  const students = L.players.filter(p => !p.hm).length + L.bots;
  $('#btn-start').disabled = students < 2;
  $('#lobby-note').textContent = isHost ? (students < 2 ? t('needMore') : t('canStart')) : t('hostWait');
}
$('#code-in').addEventListener('keydown', e => e.stopPropagation());
$('#code-in').addEventListener('input', e => e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g, ''));

/* =================================================================== */
/* Game session                                                        */
/* =================================================================== */
let session = null;          // { sim, mode, role, room, host }
const ctl = { yaw: 0, pitch: 0, keys: new Set(), joy: { x: 0, y: 0 }, third: false, locked: false, stepT: 0 };
const others = new Map();    // id -> { gim, tag, ghost }
const bodies = new Map();    // id -> group
let myGim = null, overlayIntro = false, paused = false, hudT = 0, selVote = null, meetingShown = false;

function startSession(mode, role, { sim, room: r } = {}) {
  if (!nav) nav = new Nav(world.col);
  endSession();
  sim ||= new Sim(world, nav, { mode, role, me: { name: store.name, look: store.look }, lang: store.settings.lang, emit: onSimEvent });
  session = { sim, mode, role, room: r, host: r instanceof HostRoom, sendT: 0 };
  document.body.classList.add('ingame');
  $$('.screen').forEach(s => s.classList.remove('show'));
  $('#hud').hidden = false;
  myGim = makeGim(store.look); myGim.visible = false; scene.add(myGim);
  ctl.third = false; document.body.classList.remove('third', 'lights');
  playMusic('game');
  if (sim.remote && !sim.gotState) session.introPending = true;   // wait for the host to tell us our role
  else showIntro();
}

function endSession() {
  if (!session) return;
  closeGame(true);
  for (const o of others.values()) { scene.remove(o.gim); disposeGim(o.gim); }
  others.clear();
  for (const b of bodies.values()) scene.remove(b);
  bodies.clear();
  if (myGim) { scene.remove(myGim); disposeGim(myGim); myGim = null; }
  ['#meeting', '#end', '#intro', '#pause', '#map'].forEach(s => $(s).classList.remove('show'));
  $('#hmpanel').classList.remove('show'); $('#sab-menu').classList.remove('show');
  $('#banner').classList.remove('show');
  session = null; paused = false; meetingShown = false;
  scene.fog.near = 40; scene.fog.far = 170; scene.fog.color.copy(SKY); scene.background.copy(SKY);
  document.body.classList.remove('ingame', 'lights');
  $('#hud').hidden = true;
  if (document.pointerLockElement) document.exitPointerLock();
}

function quitToMenu() { endSession(); leaveRoom(); playMusic('menu'); go('s-home'); }

function showIntro() {
  const s = session.sim, role = s.me.role;
  session.introPending = false;
  myGim.scale.setScalar(role === 'headmistress' ? 1.3 : 1);
  setupActionButtons();
  const el = $('#intro');
  const col = role === 'teacher' ? 'var(--red-2)' : role === 'headmistress' ? 'var(--gold-2)' : 'var(--green-3)';
  const who = role === 'teacher' ? t('youTeacher') : role === 'headmistress' ? t('youHM') : t('youStudent');
  const msg = session.mode === 'solo' ? t('introSolo') : role === 'teacher' ? t('introTeacher') : role === 'headmistress' ? t('introHM') : t('introStudent');
  el.innerHTML = `<div class="reveal" style="--c:${col}"><small>${t('youAre')}</small><h2>${who}</h2><p>${msg}</p></div>`;
  el.classList.add('show'); overlayIntro = true;
  sfx(role === 'teacher' ? 'detention' : 'bell');
  setTimeout(() => { el.classList.remove('show'); overlayIntro = false; if (session) world.ringBell(clock.elapsedTime); }, 3200);
}

/* ---- sim events ---- */
function onSimEvent(type, d) {
  const sim = session?.sim;
  switch (type) {
    case 'tp': if (sim) { sim.me.x = d.x; sim.me.z = d.z; if (d.yaw != null) { ctl.yaw = d.yaw; ctl.pitch = 0; } else sfx('whoosh'); } break;
    case 'taskDone': toast(d.all ? t('allDone') : t('taskDone'), 'good'); break;
    case 'detainedMe': closeGame(true); banner(t('detainedYou'), t('detainedGhost'), true); sfx('detention'); setGhost(myGim, true); break;
    case 'detention': if (sim && sim.me.role === 'teacher') sfx('detention'); break;
    case 'meeting': closeGame(true); closePanels(); sfx('meeting'); selVote = null; meetingShown = true; renderMeeting(); world.ringBell(clock.elapsedTime); break;
    case 'meetingUpdate': case 'meetingResult': renderMeeting(); if (type === 'meetingResult') sfx(d.wasTeacher ? 'win' : 'whoosh'); break;
    case 'resume': $('#meeting').classList.remove('show'); meetingShown = false; break;
    case 'sab':
      if (d.kind === 'lights') { banner(t('sabLights'), t('lightsOut'), true); sfx('alarm'); }
      if (d.kind === 'fire') { banner(t('fireIn'), t('fireDrill'), true); sfx('alarm'); }
      break;
    case 'sabEnd': $('#banner').classList.remove('show'); sfx('good'); break;
    case 'quiz': closeGame(true); openGame('quiz', null, { title: t('sabQuiz'), icon: '📝', closable: false, onDone: () => sfx('good') }); sfx('alarm'); break;
    case 'quizAll': toast(t('sabQuiz') + '!', 'bad'); break;
    case 'order': banner(d.text, d.from); sfx('bell'); break;
    case 'npcOrder': banner(t('orderGo', { place: t(d.area), s: d.secs }), t('order')); sfx('bell'); break;
    case 'orderResult':
      if (d.ok) { toast(t('orderOK'), 'good'); sfx('coin'); $('#banner').classList.remove('show'); }
      else { toast(t('orderFail'), 'bad'); $('#banner').classList.remove('show'); closeGame(true); sim.me.frozenUntil = Infinity; openGame('lines', null, { title: t('hmLines'), icon: '✍️', closable: false, data: { sentence: d.sentence }, onDone: () => { sim.me.frozenUntil = 0; } }); }
      break;
    case 'toastKey': toast(t(d.key, d.vars)); break;
    case 'lines': closeGame(true); openGame('lines', null, { title: t('hmLines'), icon: '✍️', closable: false, data: { sentence: d.sentence }, onDone: () => { if (sim?.remote) sim.linesDone(); else if (sim) sim.me.frozenUntil = 0; } }); sfx('detention'); break;
    case 'soloCaught': closeGame(true); banner(t('soloCaught', { name: d.name }), `${t('detentions')}: ${d.n} / 3`, true); sfx('detention'); break;
    case 'spotted': toast(t('spotted', { name: d.name }), 'bad'); sfx('alarm'); break;
    case 'end': setTimeout(() => showEnd(d), 600); break;
  }
}

function toast(msg, kind = '') {
  const d = document.createElement('div'); d.className = 'toast ' + kind; d.textContent = msg;
  $('#toasts').append(d); setTimeout(() => d.remove(), 3300);
}
let bannerTimer;
function banner(text, small, alert = false) {
  const b = $('#banner'); b.innerHTML = '';
  if (small) { const s = document.createElement('small'); s.textContent = small; b.append(s); }
  b.append(document.createTextNode(text));
  b.classList.toggle('alert', alert); b.classList.add('show');
  clearTimeout(bannerTimer); bannerTimer = setTimeout(() => { if (!session?.sim.sab) b.classList.remove('show'); }, 6500);
}

/* =================================================================== */
/* Input                                                               */
/* =================================================================== */
const blockingOverlay = () => gameOpen() || overlayIntro || paused || meetingShown || $('#end').classList.contains('show') || $('#map').classList.contains('show');

addEventListener('keydown', e => {
  if (!session) return;
  if (e.target.tagName === 'INPUT') return;
  const k = e.code;
  if (k === 'Escape') {
    if (gameOpen()) { closeGame(); return; }
    if ($('#map').classList.contains('show')) { $('#map').classList.remove('show'); return; }
    if ($('#hmpanel').classList.contains('show')) { $('#hmpanel').classList.remove('show'); return; }
    if (!meetingShown && !$('#end').classList.contains('show')) togglePause();
    return;
  }
  if (blockingOverlay() && k !== 'KeyM') return;
  ctl.keys.add(k);
  if (k === 'KeyE' || k === 'Enter') doUse();
  if (k === 'KeyQ') doDetain();
  if (k === 'KeyF') toggleSab();
  if (k === 'KeyV') session.sim.staffDoor();
  if (k === 'KeyM') toggleMap();
  if (k === 'KeyC') toggleView();
  if (k === 'KeyH') toggleHM();
});
addEventListener('keyup', e => ctl.keys.delete(e.code));
addEventListener('blur', () => ctl.keys.clear());

// mouse look: pointer lock, with click-drag as a fallback
let dragLook = null, downAt = null;
canvas.addEventListener('pointerdown', e => {
  if (!session || e.pointerType === 'touch') return;
  downAt = { x: e.clientX, y: e.clientY }; dragLook = { x: e.clientX, y: e.clientY };
});
addEventListener('pointermove', e => {
  if (!session || e.pointerType === 'touch') return;
  if (ctl.locked) look(e.movementX, e.movementY);
  else if (dragLook && !blockingOverlay()) { look(e.clientX - dragLook.x, e.clientY - dragLook.y); dragLook = { x: e.clientX, y: e.clientY }; }
});
addEventListener('pointerup', e => {
  if (!session || e.pointerType === 'touch') return;
  if (downAt && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) < 5 && !blockingOverlay() && e.target === canvas) canvas.requestPointerLock?.();
  dragLook = downAt = null;
});
document.addEventListener('pointerlockchange', () => {
  ctl.locked = document.pointerLockElement === canvas;
  document.body.classList.toggle('unlocked', !ctl.locked);
});
document.body.classList.add('unlocked');
function look(dx, dy) {
  const s = 0.0024 * store.settings.sens;
  ctl.yaw -= dx * s; ctl.pitch = Math.max(-1.35, Math.min(1.35, ctl.pitch - dy * s));
}
function releaseLock() { if (document.pointerLockElement) document.exitPointerLock(); }

// touch: joystick + drag to look
(() => {
  const joy = $('#joy'), knob = joy.querySelector('.joy-knob');
  let jid = null;
  joy.addEventListener('pointerdown', e => { jid = e.pointerId; joy.setPointerCapture(jid); moveJoy(e); });
  joy.addEventListener('pointermove', e => { if (e.pointerId === jid) moveJoy(e); });
  const endJoy = e => { if (e.pointerId !== jid) return; jid = null; ctl.joy.x = ctl.joy.y = 0; knob.style.transform = ''; };
  joy.addEventListener('pointerup', endJoy); joy.addEventListener('pointercancel', endJoy);
  function moveJoy(e) {
    const r = joy.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let dx = (e.clientX - cx) / (r.width / 2), dy = (e.clientY - cy) / (r.height / 2);
    const m = Math.hypot(dx, dy); if (m > 1) { dx /= m; dy /= m; }
    ctl.joy.x = dx; ctl.joy.y = dy; knob.style.transform = `translate(${dx * 44}px,${dy * 44}px)`;
  }
  const looks = new Map();
  canvas.addEventListener('pointerdown', e => { if (e.pointerType === 'touch') looks.set(e.pointerId, { x: e.clientX, y: e.clientY }); });
  canvas.addEventListener('pointermove', e => {
    const p = looks.get(e.pointerId); if (!p || !session || blockingOverlay()) return;
    look((e.clientX - p.x) * 1.6, (e.clientY - p.y) * 1.6); p.x = e.clientX; p.y = e.clientY;
  });
  const endLook = e => looks.delete(e.pointerId);
  canvas.addEventListener('pointerup', endLook); canvas.addEventListener('pointercancel', endLook);
})();

// action buttons
$('#a-use').onclick = () => doUse();
$('#a-detain').onclick = () => doDetain();
$('#a-sab').onclick = () => toggleSab();
$('#a-door').onclick = () => session?.sim.staffDoor();
$('#a-panel').onclick = () => toggleHM();
$('#a-map').onclick = () => toggleMap();
$('#a-view').onclick = () => toggleView();
$('#a-pause').onclick = () => togglePause();
$$('#sab-menu button').forEach(b => b.onclick = () => { session?.sim.sabotage(b.dataset.sab); $('#sab-menu').classList.remove('show'); sfx('click'); });
$('#map').onclick = () => $('#map').classList.remove('show');
$('#p-resume').onclick = () => togglePause();
$('#p-quit').onclick = () => { sfx('click'); quitToMenu(); };
$('#p-settings').onclick = () => { sfx('click'); settingsReturn = 'pause'; $('#pause').classList.remove('show'); renderSettings(); $('#s-settings').classList.add('show'); };

function setupActionButtons() {
  const r = session.sim.me.role;
  $('#a-detain').hidden = r !== 'teacher';
  $('#a-sab').hidden = r !== 'teacher';
  $('#a-door').hidden = r !== 'teacher';
  $('#a-panel').hidden = r !== 'headmistress';
  $('#a-use').hidden = false;
}

function togglePause() {
  if (!session) return;
  paused = !paused;
  $('#pause').classList.toggle('show', paused);
  $('#s-settings').classList.remove('show'); settingsReturn = 's-home';
  if (paused) releaseLock();
}
function toggleView() { ctl.third = !ctl.third; document.body.classList.toggle('third', ctl.third); sfx('click'); }
function toggleMap() { const m = $('#map'); m.classList.toggle('show'); if (m.classList.contains('show')) { releaseLock(); drawMap(); } }
function toggleSab() { if (session?.sim.me.role === 'teacher') $('#sab-menu').classList.toggle('show'); }
function toggleHM() {
  if (session?.sim.me.role !== 'headmistress') return;
  const p = $('#hmpanel'); p.classList.toggle('show');
  if (p.classList.contains('show')) { releaseLock(); renderHM(); }
}
function closePanels() { $('#hmpanel').classList.remove('show'); $('#sab-menu').classList.remove('show'); $('#map').classList.remove('show'); }

/* ---- what can I do right here? ---- */
function findAction() {
  const s = session.sim, me = s.me;
  if (s.phase !== 'play' || me.frozenUntil > s.time) return null;
  const near = (p, r) => Math.hypot(p.x - me.x, p.z - me.z) < r;
  if (me.alive && me.role !== 'headmistress') for (const b of s.bodies) if (near(b, 3.5)) return { label: t('reportSlip'), icon: '📢', run: () => s.report(b.id) };
  if (s.sab && me.alive && me.role === 'student') {
    if (s.sab.kind === 'lights' && near(SPECIAL.fuse, 2.6)) return { label: t('fixLights'), icon: '💡', run: () => openGame('fuse', null, { title: t('fixLights'), icon: '💡', onDone: () => s.fix('lights') }) };
    if (s.sab.kind === 'fire') for (const k of ['fireA', 'fireB']) if (!s.sab[k] && near(SPECIAL[k], 2.6)) return { label: t('fixFire'), icon: '🚨', run: () => openGame('fire', null, { title: t('fixFire'), icon: '🚨', onDone: () => s.fix(k) }) };
  }
  if (me.role !== 'headmistress') for (const id of me.tasks) {
    if (me.done.has(id)) continue;
    const st = STATIONS.find(x => x.id === id);
    if (near(st, 2.9)) return { label: t('t_' + id), icon: st.icon, run: () => openGame(st.game, st.set, { title: t('t_' + id), icon: st.icon, onDone: () => s.completeTask(id) }) };
  }
  if (me.alive && me.role !== 'headmistress' && !s.bellUsed && near(BELL, 3.4)) return { label: t('ringBell'), icon: '🔔', run: () => s.ringBell() };
  if (me.role === 'teacher' && me.alive && STAFF_DOORS.some(d => near(d, 2.2))) return { label: t('useDoor'), icon: '🚪', key: 'V', run: () => s.staffDoor() };
  return null;
}
function doUse() {
  if (!session || blockingOverlay()) return;
  const a = findAction(); if (!a) return;
  sfx('click');
  if (a.key !== 'V') releaseLock();
  a.run();
}
function doDetain() {
  if (!session) return;
  const tg = session.sim.detainTarget(); if (tg) session.sim.detain(tg.id);
}

/* =================================================================== */
/* Rendering other characters                                          */
/* =================================================================== */
function ensureOther(p) {
  let o = others.get(p.id);
  if (o) return o;
  const g = makeGim(p.look);
  if (p.role === 'headmistress') g.scale.setScalar(1.3);
  scene.add(g);
  o = { gim: g, tag: null, tagColor: null, ghost: false };
  others.set(p.id, o);
  return o;
}
function tagColorFor(p, me) {
  if (p.role === 'headmistress') return '#ffe27a';
  if (p.role === 'teacher' && (p.npc || me.role === 'teacher' || me.role === 'headmistress' || p.revealed || session.sim.phase === 'end')) return '#ff6b6b';
  return '#ffffff';
}
function syncOthers(dt) {
  const s = session.sim, me = s.me;
  const seeGhosts = !me.alive || me.role === 'headmistress';
  for (const p of s.list) {
    if (p.id === s.me.id) continue;
    const o = ensureOther(p);
    const visible = p.alive || p.role === 'headmistress' || seeGhosts;
    o.gim.visible = visible && s.phase !== 'meeting';
    if (!o.gim.visible) continue;
    if (!p.alive !== o.ghost) { o.ghost = !p.alive; setGhost(o.gim, o.ghost); }
    o.gim.position.set(p.x, o.ghost ? 0.25 + Math.sin(clock.elapsedTime * 2 + p.x) * 0.1 : 0, p.z);
    o.gim.rotation.y = p.ry;
    const frozen = p.frozenUntil > s.time;
    animateGim(o.gim, dt, p.moving && !frozen);
    const c = tagColorFor(p, me);
    if (c !== o.tagColor) {
      if (o.tag) { o.gim.remove(o.tag); o.tag.material.map.dispose(); o.tag.material.dispose(); }
      o.tag = nameTag(p.name, c); o.tag.position.y = 1.75; o.gim.add(o.tag); o.tagColor = c;
    }
  }
  // detention slips (bodies)
  const ids = new Set(s.bodies.map(b => b.id));
  for (const [id, g] of bodies) if (!ids.has(id)) { scene.remove(g); bodies.delete(id); }
  for (const b of s.bodies) if (!bodies.has(b.id)) {
    const grp = new THREE.Group();
    const g = makeGim(b.look); g.rotation.x = -0.5; g.position.y = -0.1; g.scale.y = 0.85; grp.add(g);
    const sign = nameTag('📝 DETENTION', '#ff6b6b'); sign.position.y = 1.5; sign.scale.set(3.2, 0.4, 1); grp.add(sign);
    grp.position.set(b.x, 0, b.z); scene.add(grp); bodies.set(b.id, grp);
  }
}

/* =================================================================== */
/* HUD                                                                 */
/* =================================================================== */
function updateHUD() {
  const s = session.sim, me = s.me;
  $('#taskfill').style.width = (s.mode === 'solo' ? me.done.size / me.tasks.length : s.taskDone / Math.max(1, s.taskTotal)) * 100 + '%';
  // clock
  const clk = $('#clock');
  if (s.sab?.kind === 'fire') { clk.textContent = '🔥 ' + Math.max(0, Math.ceil(s.sab.until - s.time)); clk.classList.add('warn'); }
  else if (s.mode === 'solo') {
    const left = Math.max(0, s.solo.endsAt - s.time), m = Math.floor(left / 60), sec = Math.floor(left % 60);
    clk.textContent = `🔔 ${m}:${String(sec).padStart(2, '0')}  ·  📝 ${s.solo.detentions}/3`; clk.classList.toggle('warn', left < 45);
  } else if (s.order) { clk.textContent = '👩‍🏫 ' + Math.max(0, Math.ceil(s.order.endsAt - s.time)); clk.classList.add('warn'); }
  else { clk.textContent = ''; clk.classList.remove('warn'); }
  if (s.mode === 'solo' && s.order) clk.textContent += '  ·  👩‍🏫 ' + Math.max(0, Math.ceil(s.order.endsAt - s.time));
  // task list
  const tl = $('#tasklist');
  if (me.role === 'headmistress') {
    tl.innerHTML = `<h4>👩‍🏫 ${t('hmTitle')}</h4><ul><li style="opacity:.8">${t('hmSeeTeacher')}</li></ul>`;
  } else {
    let html = `<h4>${me.role === 'teacher' ? '🤫 ' + t('fakeTasks') : '📋 ' + t('tasks')}</h4><ul>`;
    for (const id of me.tasks) {
      const st = STATIONS.find(x => x.id === id);
      html += `<li class="${me.done.has(id) ? 'done' : ''}">${t('t_' + id)}<small>${t(roomAt(st.x, st.z))}</small></li>`;
    }
    html += '</ul>';
    if (s.sab?.kind === 'lights' && me.role === 'student') html += `<div class="extra">💡 ${t('fixLights')} · ${t('changing')}</div>`;
    if (s.sab?.kind === 'fire') html += `<div class="extra">🚨 ${t('fixFire')}: ${t('gym')} ${s.sab.fireA ? '✅' : '❌'} · ${t('senior')} ${s.sab.fireB ? '✅' : '❌'}</div>`;
    if (tl.innerHTML !== html) tl.innerHTML = html;
  }
  // role chip
  const rc = $('#rolechip');
  rc.className = 'rolechip ' + me.role;
  rc.textContent = (me.role === 'teacher' ? '😈 ' + t('roleTeacher') : me.role === 'headmistress' ? '👩‍🏫 ' + t('roleHM') : '🎒 ' + t('roleStudent')) + (me.alive ? '' : ' · 👻 ' + t('ghost')) + `  ·  ${me.points} ${t('points').toLowerCase()}`;
  $('#room-label').textContent = '📍 ' + t(roomAt(me.x, me.z));
  // prompt
  const a = findAction();
  $('#prompt').innerHTML = a ? `<kbd>${isTouch ? a.icon : (a.key || 'E')}</kbd>${a.label}` : '';
  $('#a-use').classList.toggle('dim', !a || a.key === 'V');
  if (a && a.key !== 'V') $('#a-use .ai').textContent = a.icon; else $('#a-use .ai').textContent = '✋';
  // teacher cooldowns
  if (me.role === 'teacher') {
    const kc = Math.ceil(s.killReady - s.time), sc = Math.ceil(s.sabReady - s.time);
    const kcd = $('#a-detain .cd'); kcd.classList.toggle('on', kc > 0); kcd.textContent = kc > 0 ? kc : '';
    $('#a-detain').classList.toggle('dim', !s.detainTarget());
    const scd = $('#a-sab .cd'); scd.classList.toggle('on', sc > 0 || !!s.sab); scd.textContent = sc > 0 ? sc : '';
    $('#a-door').classList.toggle('dim', !STAFF_DOORS.some(d => Math.hypot(d.x - me.x, d.z - me.z) < 2.2));
  }
  // frozen overlay
  const fr = $('#frozen'), fz = me.frozenUntil > s.time && me.frozenUntil !== Infinity;
  fr.classList.toggle('show', fz);
  if (fz) fr.innerHTML = `<span>📝 ${t('frozen')} ${Math.ceil(me.frozenUntil - s.time)}</span>`;
  if ($('#hmpanel').classList.contains('show') && Math.random() < 0.15) renderHM();
  if ($('#map').classList.contains('show')) drawMap();
  if (meetingShown) updateMeetingTimer();
}

/* ---- meeting ---- */
const avHTML = (look, dead) => `<span class="av${dead ? ' dead' : ''}" style="--c:${look.color}"></span>`;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function renderMeeting() {
  const s = session.sim, m = s.meeting; if (!m) return;
  const el = $('#meeting'); el.classList.add('show'); releaseLock();
  const callerName = s.players.get(m.caller)?.name || '';
  const reason = m.reason === 'report' ? t('meetingReport', { name: callerName }) : m.reason === 'bell' ? t('meetingBell', { name: callerName }) : t('meetingHM');
  const me = s.me, isHM = me.role === 'headmistress';
  const myVote = isHM ? m.hmVote : m.votes.get(me.id);
  const cands = s.list.filter(p => p.role !== 'headmistress');
  let html = `<div class="meet"><div class="meet-head"><div><h2>📢 ${t('meeting')}</h2><p>${esc(reason)} ${t('whoTeacher')}</p></div><div class="meet-timer" id="meet-timer"></div></div>`;
  if (m.result) {
    const r = m.result;
    const txt = r.ejected ? (r.wasTeacher ? t('ejectedTeacher', { name: r.name }) : t('ejectedNot', { name: r.name })) : t('noEject');
    html += `<div class="meet-result">${r.ejected ? (r.wasTeacher ? '🎉 ' : '😬 ') : '🤷 '}${esc(txt)}</div>`;
  } else {
    html += `<div class="meet-body"><div class="vote-grid">`;
    for (const p of cands) {
      const voted = m.votes.has(p.id);
      const canVote = p.alive && (isHM || (me.alive && !m.votes.has(me.id)));
      html += `<button class="vote${selVote === p.id || myVote === p.id ? ' mine' : ''}${p.alive ? '' : ' dead'}" data-id="${p.id}" ${canVote ? '' : 'disabled'}>${avHTML(p.look, !p.alive)}<span>${esc(p.name)}${p.id === me.id ? ' (' + t('you') + ')' : ''}</span>${voted ? `<span class="tag">${t('voted')}</span>` : ''}</button>`;
    }
    html += `</div><div class="chat"><div class="chat-log" id="chat-log">`;
    for (const c of m.chat) {
      const p = s.players.get(c.id); if (!p) continue;
      const about = s.players.get(c.about)?.name || '?';
      html += `<div>${avHTML(p.look)}<b>${esc(p.name)}:</b> ${esc(c.text ?? t(c.phrase, { name: about }))}</div>`;
    }
    html += `</div><div class="phrases">`;
    if (me.alive || isHM) for (const ph of PHRASES) html += `<button data-ph="${ph}">${esc(t(ph, { name: selVote ? s.players.get(selVote)?.name : '…' }))}</button>`;
    html += `</div>`;
    const muted = s.remote ? s.amMuted : s.muted?.has(me.id);
    if ((me.alive || isHM) && s.mode !== 'solo') {
      if (s.chatOn === false) html += `<div class="chat-note">${t('chatOffNote')}</div>`;
      else if (muted) html += `<div class="chat-note">🔇 ${t('youMuted')}</div>`;
      else html += `<div class="chat-row"><input id="m-chat" maxlength="80" autocomplete="off" placeholder="${esc(t('chatPh'))}"><button id="m-send">${t('hmSend')}</button></div>`;
    }
    html += `</div></div><div class="meet-foot">`;
    if (isHM) html += `<p class="note" style="flex:2;align-self:center">${t('hmVoteNote')}</p>`;
    html += `<button class="chunky green" id="m-vote" ${selVote && (isHM || (me.alive && !m.votes.has(me.id))) ? '' : 'disabled'}>${t('vote')}</button><button class="chunky navy" id="m-skip" ${(isHM || (me.alive && !m.votes.has(me.id))) ? '' : 'disabled'}>${t('skip')}</button></div>`;
  }
  html += '</div>';
  const oldIn = el.querySelector('#m-chat'), draft = oldIn?.value || '', typing = document.activeElement === oldIn;
  el.innerHTML = html;
  const chatIn = el.querySelector('#m-chat');
  if (chatIn) {
    chatIn.value = draft; if (typing) chatIn.focus();
    const send = () => { const v = chatIn.value.trim(); if (v) { s.sayText(v); chatIn.value = ''; sfx('pop'); } };
    chatIn.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') send(); });
    chatIn.addEventListener('keyup', e => e.stopPropagation());
    el.querySelector('#m-send').onclick = send;
  }
  el.querySelectorAll('.vote').forEach(b => b.onclick = () => { selVote = b.dataset.id; sfx('click'); renderMeeting(); });
  el.querySelectorAll('[data-ph]').forEach(b => b.onclick = () => {
    const ph = b.dataset.ph;
    s.say(ph, selVote || cands.filter(p => p.id !== me.id)[0]?.id); sfx('pop');
  });
  const v = el.querySelector('#m-vote'); if (v) v.onclick = () => { if (selVote) { s.vote(selVote); sfx('good'); } };
  const k = el.querySelector('#m-skip'); if (k) k.onclick = () => { s.vote('skip'); sfx('good'); };
  const log = el.querySelector('#chat-log'); if (log) log.scrollTop = log.scrollHeight;
  updateMeetingTimer();
}
function updateMeetingTimer() {
  const s = session.sim, m = s.meeting, el = $('#meet-timer'); if (!m || !el) return;
  el.textContent = m.result ? '' : Math.max(0, Math.ceil(m.endsAt - s.time));
}

/* ---- end ---- */
function showEnd(r) {
  if (!session) return;
  const s = session.sim;
  releaseLock(); closeGame(true); closePanels();
  $('#meeting').classList.remove('show'); meetingShown = false;
  const titles = { 'solo-win': t('winSolo'), 'solo-lose-time': t('loseSolo'), 'solo-lose-caught': t('loseSolo'), students: t('winStudents'), teacher: t('winTeacher'), hm: t('hmEnded') };
  const whys = { 'solo-win': '', 'solo-lose-time': t('loseTime'), 'solo-lose-caught': t('loseCaught'), students: t('winStudentsWhy'), teacher: t('winTeacherWhy'), hm: '' };
  store.stars += s.starsEarned; save();
  let roster = '';
  if (s.mode !== 'solo') {
    roster = '<div class="roster">' + s.list.filter(p => p.role !== 'headmistress').map(p =>
      `<span class="${p.role}">${avHTML(p.look, !p.alive)}${esc(p.name)}${p.role === 'teacher' ? ' 😈' : ''}</span>`).join('') + '</div>';
  }
  const el = $('#end');
  el.innerHTML = `<div class="endcard ${r.meWon ? '' : 'lose'}"><h2>${titles[r.winner]}</h2><p>${whys[r.winner] || ''}</p>
    <div class="earned">${t('earned', { n: s.starsEarned })}</div>${roster}
    <div class="btns">${session.mode === 'online' && !session.host ? `<p class="note" style="flex:1;align-self:center">${t('waitHost')}</p>` : `<button class="chunky green" id="e-again">${session.mode === 'online' ? t('backLobby') : t('playAgain')}</button>`}<button class="chunky navy" id="e-menu">${t('menu')}</button></div></div>`;
  el.classList.add('show');
  sfx(r.meWon ? 'win' : 'lose');
  const again = $('#e-again');
  if (again) again.onclick = () => {
    const { mode, role, room: r } = session;
    if (mode === 'online') { endSession(); r.backToLobby(); playMusic('menu'); go('s-lobby'); }
    else startSession(mode, role);
  };
  $('#e-menu').onclick = () => quitToMenu();
}

/* ---- headmistress panel ---- */
function renderHM() {
  const s = session.sim, p = $('#hmpanel');
  const students = s.list.filter(q => q.role !== 'headmistress');
  let html = `<div class="hm-head">👩‍🏫 ${t('hmTitle')}<button class="px" id="hm-x">✕</button></div><div class="hm-body">`;
  html += `<div><h4>📣 ${t('hmOrders')}</h4><div class="hm-orders">${Object.keys(HM_ORDERS).map(k => `<button data-o="${k}">${t(k)}</button>`).join('')}</div>
    <div class="hm-custom"><input id="hm-text" maxlength="80" placeholder="${esc(t('hmCustom'))}"><button id="hm-send">${t('hmSend')}</button></div></div>`;
  html += `<div class="hm-big"><button id="hm-summon">🧲 ${t('hmSummon')}</button><button id="hm-assembly">🔔 ${t('hmAssembly')}</button><button class="r" id="hm-end" style="grid-column:1/-1">⏹ ${t('hmEnd')}</button></div>`;
  html += `<div><h4>🎒 ${t('hmPlayers')}</h4><p class="hm-note">${t('hmSeeTeacher')}</p><div style="display:grid;gap:6px">`;
  for (const q of students) {
    html += `<div class="hm-student">${avHTML(q.look, !q.alive)}<div class="nm ${q.role === 'teacher' ? 'teacher' : ''}">${esc(q.name)}${q.role === 'teacher' ? ' 😈' : ''}<small>${q.points} ${t('points').toLowerCase()}${q.alive ? '' : ' · 👻'}${q.frozenUntil > s.time ? ' · 📝' : ''}</small></div>
      <div class="btns"><button class="r" data-a="detention" data-id="${q.id}">📝 ${t('hmDetention')}</button><button data-a="lines" data-id="${q.id}">✍️ ${t('hmLines')}</button><button data-a="plus" data-id="${q.id}">⭐ ${t('hmPlus')}</button><button data-a="minus" data-id="${q.id}">${t('hmMinus')}</button>${q.human && session.host ? `<button data-mute="${q.id}">${s.muted.has(q.id) ? '🔇 ' + t('unmute') : '💬 ' + t('mute')}</button><button class="k" data-kick="${q.id}">✕ ${t('hmKick')}</button>` : ''}</div></div>`;
  }
  html += '</div></div></div>';
  const focusText = document.activeElement?.id === 'hm-text' ? $('#hm-text').value : null;
  if (focusText !== null) return; // don't rebuild while typing
  p.innerHTML = html;
  p.querySelector('#hm-x').onclick = () => p.classList.remove('show');
  p.querySelectorAll('[data-o]').forEach(b => b.onclick = () => { s.hm('order', { key: b.dataset.o, text: t(b.dataset.o) }); sfx('click'); });
  const send = () => { const v = $('#hm-text').value.trim(); if (v) { s.hm('order', { text: v.slice(0, 80) }); $('#hm-text').value = ''; } };
  p.querySelector('#hm-send').onclick = send;
  const ti = p.querySelector('#hm-text'); ti.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') send(); }; ti.onkeyup = e => e.stopPropagation();
  p.querySelector('#hm-summon').onclick = () => { s.hm('summon'); sfx('whoosh'); };
  p.querySelector('#hm-assembly').onclick = () => { s.hm('assembly'); };
  p.querySelector('#hm-end').onclick = () => { s.hm('end'); };
  p.querySelectorAll('[data-mute]').forEach(b => b.onclick = () => { s.hm('mute', b.dataset.mute); sfx('click'); renderHM(); });
  p.querySelectorAll('[data-kick]').forEach(b => b.onclick = () => { session.room.kick(b.dataset.kick); sfx('click'); setTimeout(renderHM, 100); });
  p.querySelectorAll('[data-a]').forEach(b => b.onclick = () => { s.hm(b.dataset.a, b.dataset.id); sfx(b.dataset.a === 'detention' ? 'detention' : 'click'); renderHM(); });
}

/* ---- map ---- */
function drawMap() {
  const cv = $('#mapc'), g = cv.getContext('2d'), s = session.sim, me = s.me;
  const W = cv.width, H = cv.height, X0 = -146, Z0 = -90, SX = W / 292, SZ = H / 180;
  const px = x => (x - X0) * SX, pz = z => (z - Z0) * SZ;
  const R = (r, c) => { g.fillStyle = c; g.fillRect(px(r.x0), pz(r.z0), (r.x1 - r.x0) * SX, (r.z1 - r.z0) * SZ); };
  g.fillStyle = '#86a35f'; g.fillRect(0, 0, W, H);
  R(BOUNDS, '#64a148');
  for (const f of FIELDS) R(f, { rugby: '#74b555', football: '#74b555', hockey: '#3d8a6a', hockeyGrass: '#74b555', synthetic: '#46a85a', tennis: '#c4693c', padel: '#2f6fb8' }[f.kind]);
  R(POOL.deck, '#e9e5dc'); for (const w of POOL.water) R(w, '#29a8dd');
  for (const pk of [{ x0: 40, z0: 70, x1: 112, z1: 78 }, { x0: -98, z0: 72, x1: -86, z1: 83 }]) R(pk, '#a7a6a0');
  R({ x0: GATE.x0, z0: 83, x1: GATE.x1, z1: 87 }, '#14285a');
  g.font = '600 13px Fredoka, sans-serif'; g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText('TBS', px((GATE.x0 + GATE.x1) / 2), pz(85.3));
  g.textAlign = 'center'; g.textBaseline = 'middle';
  for (const b of BUILDINGS) {
    R({ x0: b.x0 - 0.6, z0: b.z0 - 0.6, x1: b.x1 + 0.6, z1: b.z1 + 0.6 }, '#14285a');
    for (const r of b.rooms) { R(r, '#fff8ea'); g.strokeStyle = '#c9bfa6'; g.lineWidth = 1; g.strokeRect(px(r.x0), pz(r.z0), (r.x1 - r.x0) * SX, (r.z1 - r.z0) * SZ); }
  }
  g.font = '600 12px Fredoka, sans-serif'; g.fillStyle = '#14285a';
  for (const b of BUILDINGS) for (const r of b.rooms) {
    if (r.key === 'corridor' || r.key === 'jcorridor') continue;
    const w = (r.x1 - r.x0) * SX;
    const label = t(r.key);
    g.save(); g.translate(px((r.x0 + r.x1) / 2), pz((r.z0 + r.z1) / 2)); if (w < 40) g.rotate(-Math.PI / 2);
    const room = (w < 40 ? (r.z1 - r.z0) * SZ : w) - 6;
    let fs = 12; g.font = `600 ${fs}px Fredoka, sans-serif`;
    while (fs > 7 && g.measureText(label).width > room) g.font = `600 ${--fs}px Fredoka, sans-serif`;
    g.fillText(label, 0, 0); g.restore();
  }
  g.font = '600 14px Fredoka, sans-serif'; g.fillStyle = 'rgba(255,255,255,.9)';
  for (const f of FIELDS) g.fillText(t(f.key), px((f.x0 + f.x1) / 2), pz((f.z0 + f.z1) / 2));
  g.fillStyle = '#d4a52c'; g.beginPath(); g.arc(px(BELL.x), pz(BELL.z), 6, 0, 7); g.fill(); g.font = '16px serif'; g.fillText('🔔', px(BELL.x), pz(BELL.z) - 14);
  // my tasks
  g.font = '18px serif';
  for (const id of me.tasks) if (!me.done.has(id)) {
    const st = STATIONS.find(x => x.id === id);
    g.fillStyle = '#ffd43b'; g.beginPath(); g.arc(px(st.x), pz(st.z), 11, 0, 7); g.fill(); g.strokeStyle = '#1a1a2e'; g.lineWidth = 2; g.stroke();
    g.fillText(st.icon, px(st.x), pz(st.z) + 1);
  }
  if (s.sab?.kind === 'lights' && me.role === 'student') { g.fillText('💡', px(SPECIAL.fuse.x), pz(SPECIAL.fuse.z)); }
  if (s.sab?.kind === 'fire') for (const k of ['fireA', 'fireB']) if (!s.sab[k]) g.fillText('🚨', px(SPECIAL[k].x), pz(SPECIAL[k].z));
  if (me.role === 'teacher') { g.font = '14px serif'; for (const d of STAFF_DOORS) g.fillText('🚪', px(d.x), pz(d.z)); }
  // everyone (headmistress sees all)
  if (me.role === 'headmistress') for (const p of s.list) if (p.id !== me.id) {
    g.fillStyle = p.look.color; g.beginPath(); g.arc(px(p.x), pz(p.z), 7, 0, 7); g.fill();
    g.lineWidth = 3; g.strokeStyle = p.role === 'teacher' ? '#e03131' : '#1a1a2e'; g.stroke();
  }
  // me
  g.save(); g.translate(px(me.x), pz(me.z)); g.rotate(-ctl.yaw);
  g.fillStyle = '#e03131'; g.beginPath(); g.moveTo(0, -13); g.lineTo(9, 9); g.lineTo(0, 4); g.lineTo(-9, 9); g.closePath(); g.fill();
  g.strokeStyle = '#fff'; g.lineWidth = 2.5; g.stroke(); g.restore();
}

/* =================================================================== */
/* Main loop                                                           */
/* =================================================================== */
const clock = new THREE.Clock();
const _fwd = new THREE.Vector3();
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, clock.getDelta()), T = clock.elapsedTime;
  world.update(T); world.animateBell(T);

  if (session) {
    const s = session.sim, me = s.me;
    const running = !paused && !overlayIntro;
    if (session.mode !== 'online') { if (running) s.update(dt); }      // online host runs the game on a timer (online.js)
    else if (s.remote) {
      s.update(dt);
      if (session.introPending && s.gotState) showIntro();
      if (s.meetingChanged) { s.meetingChanged = false; if (meetingShown && s.meeting) renderMeeting(); }
      session.sendT -= dt;
      if (session.sendT < 0) { session.sendT = 0.066; session.room.send({ t: 'p', x: s.me.x, z: s.me.z, ry: s.me.ry, m: s.me.moving ? 1 : 0 }); }
    }
    // movement
    let mx = 0, mz = 0;
    if (running && !blockingOverlay() && me.frozenUntil <= s.time && s.phase === 'play') {
      const k = ctl.keys;
      if (k.has('KeyW') || k.has('ArrowUp')) mz += 1;
      if (k.has('KeyS') || k.has('ArrowDown')) mz -= 1;
      if (k.has('KeyA') || k.has('ArrowLeft')) mx -= 1;
      if (k.has('KeyD') || k.has('ArrowRight')) mx += 1;
      mx += ctl.joy.x; mz -= ctl.joy.y;
    }
    const mag = Math.min(1, Math.hypot(mx, mz));
    if (mag > 0.05) {
      const speed = (me.role === 'headmistress' || !me.alive ? 8 : 6.6) * mag;
      // forward = (-sin yaw, -cos yaw), right = (cos yaw, -sin yaw)
      const fx = -Math.sin(ctl.yaw), fz = -Math.cos(ctl.yaw), rx = Math.cos(ctl.yaw), rz = -Math.sin(ctl.yaw);
      const nx = (fx * mz + rx * mx) / Math.max(1, Math.hypot(mx, mz)), nz = (fz * mz + rz * mx) / Math.max(1, Math.hypot(mx, mz));
      me.x += nx * speed * dt; me.z += nz * speed * dt;
      if (me.alive) world.collide(me, 0.4);
      else { me.x = Math.max(BOUNDS.x0, Math.min(BOUNDS.x1, me.x)); me.z = Math.max(BOUNDS.z0, Math.min(BOUNDS.z1, me.z)); }
      me.moving = true;
      ctl.stepT -= dt; if (ctl.stepT < 0) { ctl.stepT = 0.33; sfx('step'); }
    } else me.moving = false;
    me.ry = ctl.yaw + Math.PI;

    // my own gim (seen in third-person)
    myGim.position.set(me.x, me.alive ? 0 : 0.25, me.z); myGim.rotation.y = me.ry;
    animateGim(myGim, dt, me.moving);
    myGim.visible = ctl.third;
    const eye = me.role === 'headmistress' ? 1.55 : 1.15;
    if (ctl.third) {
      _fwd.set(-Math.sin(ctl.yaw), 0, -Math.cos(ctl.yaw));
      const back = 4.2, up = 2.1 + ctl.pitch * -1.6;
      camera.position.set(me.x - _fwd.x * back, Math.max(0.6, up), me.z - _fwd.z * back);
      camera.lookAt(me.x, 1.1, me.z);
    } else {
      camera.position.set(me.x, eye + (me.moving ? Math.abs(Math.sin(T * 11)) * 0.05 : 0), me.z);
      camera.rotation.set(ctl.pitch, ctl.yaw, 0);
    }
    // fog / lights sabotage
    const dark = s.sab?.kind === 'lights' && me.alive && me.role === 'student';
    document.body.classList.toggle('lights', dark);
    const far = dark ? 11 : (me.role === 'student' && me.alive ? 75 : 140);
    scene.fog.far += (far - scene.fog.far) * Math.min(1, dt * 3);
    scene.fog.near = Math.min(30, scene.fog.far * 0.35);
    scene.fog.color.lerpColors(SKY, NIGHT, dark ? Math.min(1, (75 - scene.fog.far) / 60) : 0);
    scene.background.copy(scene.fog.color);
    syncOthers(dt);
    hudT -= dt; if (hudT < 0) { hudT = 0.1; updateHUD(); }
  } else {
    // menu: slow flyover of the campus
    const a = T * 0.05;
    camera.position.set(25 + Math.cos(a) * 120, 48 + Math.sin(T * 0.13) * 6, 5 + Math.sin(a) * 85);
    camera.lookAt(25, 0, 5);
    preview.frame(dt);
  }
  renderer.render(scene, camera);
}

// handy for testing from the browser console (only when running on this computer)
if (['localhost', '127.0.0.1'].includes(location.hostname)) window.__tbs = { get session() { return session; }, ctl, camera, startSession };

/* =================================================================== */
/* Boot                                                                */
/* =================================================================== */
setLang(store.settings.lang);
applyI18n();
nameIn.value = store.name;
preview.set(store.look);
preview.mount($('#home-preview'));
resize();
refreshProfile();
frame();
document.fonts?.ready.then(() => setTimeout(() => $('#loading').classList.add('hide'), 300));
setTimeout(() => $('#loading').classList.add('hide'), 2500);
