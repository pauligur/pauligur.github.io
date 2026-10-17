// Mini-games shown in a pop-up panel. Everything is touch + mouse friendly.
import { t } from './i18n.js';
import { sfx } from './audio.js';

const root = () => document.getElementById('modal');
let current = null;

export const gameOpen = () => !!current;
export function closeGame(silent) {
  if (!current) return;
  current.cleanup?.();
  const c = current; current = null;
  root().innerHTML = ''; root().classList.remove('show');
  if (!silent) c.onClose?.();
}

const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

export function openGame(kind, set, { title, icon = '', closable = true, onDone, onClose, data } = {}) {
  closeGame(true);
  const m = root();
  m.innerHTML = '';
  const panel = el('div', 'panel game-' + kind);
  const head = el('div', 'phead');
  head.append(el('div', 'ptitle', `<span class="picon">${icon}</span>${title}`));
  if (closable) { const x = el('button', 'px', '✕'); x.onclick = () => { sfx('click'); closeGame(); }; head.append(x); }
  const hint = el('div', 'phint', t('g_' + kind) || '');
  const body = el('div', 'pbody');
  panel.append(head, hint, body); m.append(panel); m.classList.add('show');
  const finish = () => {
    if (!current) return;
    sfx('done');
    panel.classList.add('win');
    const c = current; current.cleanup?.(); current = null;
    setTimeout(() => { m.innerHTML = ''; m.classList.remove('show'); c.onDone?.(); }, 650);
  };
  current = { onDone, onClose, cleanup: null };
  const g = GAMES[kind];
  current.cleanup = g(body, set, finish, data, hint) || null;
}

/* ---------------------------------------------------------------- */

const SORT_SETS = {
  recycle: { bins: [['b_plastic', '#f1c40f', '🟨'], ['b_paper', '#2e6fd0', '🟦'], ['b_other', '#8c939a', '⬜']], items: [['🧴', 0], ['🥤', 0], ['🍼', 0], ['📰', 1], ['📦', 1], ['📄', 1], ['🍌', 2], ['🍎', 2]] },
  books: { bins: [['b_red', '#c0392b', '📕'], ['b_blue', '#2e5aa8', '📘'], ['b_green', '#2e8b57', '📗']], items: [['📕', 0], ['📕', 0], ['📘', 1], ['📘', 1], ['📗', 2], ['📗', 2], ['📕', 0]] },
  fruit: { bins: [['', '#e74c3c', '🍎'], ['', '#f1c40f', '🍌'], ['', '#e67e22', '🍊']], items: [['🍎', 0], ['🍎', 0], ['🍌', 1], ['🍌', 1], ['🍊', 2], ['🍊', 2]] },
  art: { bins: [['', '#d4a52c', '✏️'], ['', '#8e44ad', '🖌️'], ['', '#7f8c8d', '✂️']], items: [['✏️', 0], ['🖍️', 0], ['✏️', 0], ['🖌️', 1], ['🖌️', 1], ['✂️', 2], ['✂️', 2]] },
};

const GAMES = {
  sort(body, set, done) {
    const cfg = SORT_SETS[set];
    const area = el('div', 'sort-area'), bins = el('div', 'sort-bins');
    body.append(area, bins);
    cfg.bins.forEach(([label, color, ico], i) => {
      const b = el('div', 'bin', `<div class="bin-ico">${ico}</div><div class="bin-label">${label ? t(label) : ''}</div>`);
      b.style.setProperty('--c', color); b.dataset.bin = i; bins.append(b);
    });
    let left = cfg.items.length;
    shuffle([...cfg.items]).forEach(([emo, bin], i) => {
      const it = el('div', 'drag', emo);
      it.style.left = (8 + (i % 4) * 23 + Math.random() * 6) + '%';
      it.style.top = (8 + Math.floor(i / 4) * 44 + Math.random() * 10) + '%';
      area.append(it);
      let sx, sy, ox, oy;
      it.onpointerdown = e => {
        e.preventDefault(); it.setPointerCapture(e.pointerId); it.classList.add('held');
        sx = e.clientX; sy = e.clientY; ox = 0; oy = 0; sfx('pop');
      };
      it.onpointermove = e => { if (!it.classList.contains('held')) return; ox = e.clientX - sx; oy = e.clientY - sy; it.style.transform = `translate(${ox}px,${oy}px) scale(1.15)`; };
      it.onpointerup = e => {
        if (!it.classList.contains('held')) return;
        it.classList.remove('held');
        it.style.visibility = 'hidden';
        const under = document.elementFromPoint(e.clientX, e.clientY)?.closest('.bin');
        it.style.visibility = '';
        if (under && +under.dataset.bin === bin) {
          sfx('good'); it.remove(); under.classList.add('bump'); setTimeout(() => under.classList.remove('bump'), 250);
          if (--left === 0) done();
        } else {
          if (under) sfx('wrong');
          it.style.transform = ''; it.classList.add('shake'); setTimeout(() => it.classList.remove('shake'), 400);
        }
      };
    });
  },

  simon(body, set, done) {
    const pads = set === 'piano'
      ? [['#f8f9fa', 262, '🎵'], ['#f8f9fa', 330, '🎶'], ['#f8f9fa', 392, '🎵'], ['#f8f9fa', 523, '🎶']]
      : [['#e03131', 330, '🧪'], ['#2f9e44', 392, '🧪'], ['#1971c2', 494, '🧪'], ['#f08c00', 587, '🧪']];
    const grid = el('div', 'simon' + (set === 'piano' ? ' piano' : ''));
    const status = el('div', 'simon-status');
    body.append(status, grid);
    const btns = pads.map(([c, f, ico], i) => { const b = el('button', 'pad', ico); b.style.setProperty('--c', c); grid.append(b); return b; });
    const seq = Array.from({ length: 4 }, () => Math.floor(Math.random() * 4));
    let round = 1, idx = 0, listening = false, timers = [];
    const flash = i => { btns[i].classList.add('lit'); sfx('note', pads[i][1]); timers.push(setTimeout(() => btns[i].classList.remove('lit'), 320)); };
    const play = () => {
      listening = false; idx = 0; status.textContent = '👀 ' + round + ' / ' + seq.length;
      seq.slice(0, round).forEach((s, k) => timers.push(setTimeout(() => flash(s), 600 + k * 520)));
      timers.push(setTimeout(() => { listening = true; status.textContent = '👉 ' + round + ' / ' + seq.length; }, 600 + round * 520));
    };
    btns.forEach((b, i) => b.onpointerdown = () => {
      if (!listening) return;
      flash(i);
      if (i !== seq[idx]) { sfx('wrong'); grid.classList.add('shake'); setTimeout(() => grid.classList.remove('shake'), 400); timers.push(setTimeout(play, 700)); listening = false; return; }
      idx++;
      if (idx === round) { listening = false; round++; if (round > seq.length) timers.push(setTimeout(done, 300)); else timers.push(setTimeout(play, 700)); }
    });
    play();
    return () => timers.forEach(clearTimeout);
  },

  wires(body, set, done) {
    const colors = shuffle(['#e03131', '#1971c2', '#f08c00', '#2f9e44', '#ae3ec9'].slice(0, 4));
    const right = shuffle([...colors]);
    const box = el('div', 'wires');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'wire-svg');
    const L = el('div', 'wcol'), R = el('div', 'wcol right');
    box.append(L, svg, R); body.append(box);
    const lefts = colors.map(c => { const d = el('div', 'wend'); d.style.setProperty('--c', c); d.dataset.c = c; L.append(d); return d; });
    const rights = right.map(c => { const d = el('div', 'wend'); d.style.setProperty('--c', c); d.dataset.c = c; R.append(d); return d; });
    let linked = 0, drag = null;
    const pt = (d) => { const a = d.getBoundingClientRect(), b = box.getBoundingClientRect(); return [a.left + a.width / 2 - b.left, a.top + a.height / 2 - b.top]; };
    const line = (c) => { const l = document.createElementNS('http://www.w3.org/2000/svg', 'line'); l.setAttribute('stroke', c); l.setAttribute('stroke-width', 12); l.setAttribute('stroke-linecap', 'round'); svg.append(l); return l; };
    lefts.forEach(d => d.onpointerdown = e => {
      if (d.classList.contains('ok')) return;
      e.preventDefault(); box.setPointerCapture(e.pointerId);
      const [x, y] = pt(d); const l = line(d.dataset.c); l.setAttribute('x1', x); l.setAttribute('y1', y); l.setAttribute('x2', x); l.setAttribute('y2', y);
      drag = { d, l }; sfx('pop');
    });
    box.onpointermove = e => { if (!drag) return; const b = box.getBoundingClientRect(); drag.l.setAttribute('x2', e.clientX - b.left); drag.l.setAttribute('y2', e.clientY - b.top); };
    box.onpointerup = e => {
      if (!drag) return;
      const target = rights.find(r => { const a = r.getBoundingClientRect(); return e.clientX > a.left - 20 && e.clientX < a.right + 20 && e.clientY > a.top - 14 && e.clientY < a.bottom + 14; });
      if (target && target.dataset.c === drag.d.dataset.c && !target.classList.contains('ok')) {
        const [x, y] = pt(target); drag.l.setAttribute('x2', x); drag.l.setAttribute('y2', y);
        drag.d.classList.add('ok'); target.classList.add('ok'); sfx('good');
        if (++linked === colors.length) done();
      } else { drag.l.remove(); if (target) sfx('wrong'); }
      drag = null;
    };
  },

  collect(body, set, done) {
    const emo = { leaves: ['🍂', '🍁', '🍃'], hockey: ['⚪'], toys: ['🧸', '🪀', '🚂', '🧩', '🪁', '🎲'] }[set];
    const bg = { leaves: 'linear-gradient(#3fb7e0,#1c8fc0)', hockey: 'linear-gradient(#3d8a6a,#2f6f55)', toys: 'repeating-conic-gradient(#f6c9a9 0 25%, #f3b98f 0 50%) 0 0/60px 60px' }[set];
    const area = el('div', 'collect'); area.style.background = bg; body.append(area);
    let left = 8; const items = [];
    for (let i = 0; i < left; i++) {
      const it = el('div', 'citem', emo[i % emo.length]);
      const s = { x: 10 + Math.random() * 75, y: 10 + Math.random() * 70, vx: (Math.random() - 0.5) * 14, vy: (Math.random() - 0.5) * 14, el: it };
      items.push(s); area.append(it);
      it.onpointerdown = e => { e.preventDefault(); if (it.classList.contains('got')) return; it.classList.add('got'); sfx('pop'); setTimeout(() => it.remove(), 250); if (--left === 0) done(); };
    }
    let last = performance.now(), raf;
    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      for (const s of items) {
        s.x += s.vx * dt; s.y += s.vy * dt;
        if (s.x < 2 || s.x > 88) s.vx *= -1; if (s.y < 2 || s.y > 82) s.vy *= -1;
        s.el.style.left = s.x + '%'; s.el.style.top = s.y + '%';
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  },

  hold(body, set, done) {
    const [a, b] = set === 'pump' ? ['🏀', '🏀'] : ['🌱', '🌻'];
    const vis = el('div', 'hold-vis', a), bar = el('div', 'pbar'), fill = el('div', 'fill');
    bar.append(fill);
    const btn = el('button', 'big-btn', t('hold'));
    body.append(vis, bar, btn);
    let v = 0, holding = false, raf, last = performance.now();
    const on = e => { e.preventDefault(); holding = true; btn.classList.add('down'); };
    const off = () => { holding = false; btn.classList.remove('down'); };
    btn.onpointerdown = on; btn.onpointerup = off; btn.onpointerleave = off;
    const key = e => { if (e.code === 'Space') { e.type === 'keydown' ? on(e) : off(); } };
    addEventListener('keydown', key); addEventListener('keyup', key);
    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      v = Math.max(0, Math.min(1, v + (holding ? 0.38 : -0.15) * dt));
      fill.style.width = v * 100 + '%';
      vis.style.transform = `scale(${set === 'pump' ? 0.6 + v * 0.7 : 0.8 + v * 0.5})`;
      vis.textContent = v > 0.7 ? b : a;
      if (holding && Math.random() < 0.15) sfx('step');
      if (v >= 1) { done(); return; }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); removeEventListener('keydown', key); removeEventListener('keyup', key); };
  },

  gauge(body, set, done) {
    const g = el('div', 'gauge'), zone = el('div', 'zone'), needle = el('div', 'needle');
    const marks = el('div', 'gauge-marks', '●'.repeat(0));
    g.append(zone, needle); body.append(g, marks);
    const btn = el('button', 'big-btn', t('stop')); body.append(btn);
    let p = 0, dir = 1, hits = 0, raf, last = performance.now();
    const z0 = 0.35 + Math.random() * 0.35; zone.style.left = z0 * 100 + '%'; zone.style.width = '16%';
    const loop = (now) => { const dt = Math.min(0.05, (now - last) / 1000); last = now; p += dir * dt * (0.8 + hits * 0.35); if (p > 1) { p = 1; dir = -1; } if (p < 0) { p = 0; dir = 1; } needle.style.left = p * 100 + '%'; raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    btn.onpointerdown = e => {
      e.preventDefault();
      if (p >= z0 && p <= z0 + 0.16) { hits++; sfx('good'); marks.textContent = '✅'.repeat(hits); if (hits >= 2) { cancelAnimationFrame(raf); done(); } }
      else { sfx('wrong'); g.classList.add('shake'); setTimeout(() => g.classList.remove('shake'), 400); }
    };
    return () => cancelAnimationFrame(raf);
  },

  sequence(body, set, done) {
    const N = 10, grid = el('div', 'seq'); body.append(grid);
    let next = 1;
    shuffle(Array.from({ length: N }, (_, i) => i + 1)).forEach(n => {
      const b = el('button', 'seq-btn', n);
      b.onpointerdown = e => {
        e.preventDefault();
        if (n === next) { b.classList.add('ok'); sfx('note', 300 + n * 40); if (++next > N) done(); }
        else { sfx('wrong'); next = 1; grid.querySelectorAll('.ok').forEach(x => x.classList.remove('ok')); grid.classList.add('shake'); setTimeout(() => grid.classList.remove('shake'), 400); }
      };
      grid.append(b);
    });
  },

  sweep(body, set, done) {
    const cv = el('canvas', 'sweep'); cv.width = 520; cv.height = 300; body.append(cv);
    const bg = { table: '#e8e4dc', clay: '#c4693c', grass: '#68ad4c' }[set];
    cv.style.background = bg;
    const g = cv.getContext('2d');
    // dirt layer
    for (let i = 0; i < 260; i++) {
      const x = Math.random() * 520, y = Math.random() * 300, r = 10 + Math.random() * 26;
      g.fillStyle = set === 'grass' ? `rgba(${30 + Math.random() * 30},${90 + Math.random() * 50},${30},0.95)` : set === 'clay' ? `rgba(${120 + Math.random() * 60},${90 + Math.random() * 30},40,0.9)` : `rgba(${110 + Math.random() * 60},${80 + Math.random() * 40},50,0.85)`;
      g.beginPath(); g.ellipse(x, y, r, r * (set === 'grass' ? 2.2 : 0.8), Math.random() * 3, 0, Math.PI * 2); g.fill();
    }
    if (set === 'clay') { g.font = '30px serif'; for (let i = 0; i < 14; i++) g.fillText('🍂', Math.random() * 480, 30 + Math.random() * 260); }
    if (set === 'table') { g.font = '26px serif'; for (let i = 0; i < 10; i++) g.fillText(['🍞', '🥛', '🍝'][i % 3], Math.random() * 480, 30 + Math.random() * 260); }
    g.globalCompositeOperation = 'destination-out';
    let down = false, n = 0;
    const rub = e => {
      const r = cv.getBoundingClientRect(); const x = (e.clientX - r.left) * 520 / r.width, y = (e.clientY - r.top) * 300 / r.height;
      g.beginPath(); g.arc(x, y, 30, 0, Math.PI * 2); g.fill();
      if (++n % 12 === 0) {
        sfx('step');
        const d = g.getImageData(0, 0, 520, 300).data; let c = 0;
        for (let i = 3; i < d.length; i += 64) if (d[i] > 40) c++;
        if (c / (d.length / 64) < 0.05) { down = false; done(); }
      }
    };
    cv.onpointerdown = e => { e.preventDefault(); down = true; cv.setPointerCapture(e.pointerId); rub(e); };
    cv.onpointermove = e => { if (down) rub(e); };
    cv.onpointerup = () => down = false;
  },

  fuse(body, set, done) {
    const row = el('div', 'fuse'); body.append(row);
    const st = Array.from({ length: 6 }, () => Math.random() < 0.7 ? 0 : 1); if (st.every(x => x)) st[0] = 0;
    st.forEach((s, i) => {
      const sw = el('button', 'switch' + (s ? ' on' : ''), '<span></span>');
      sw.onpointerdown = e => { e.preventDefault(); st[i] ^= 1; sw.classList.toggle('on', !!st[i]); sfx('click'); if (st.every(x => x)) done(); };
      row.append(sw);
    });
  },

  fire(body, set, done) {
    GAMES.hold(body, 'fire', done);
    body.querySelector('.hold-vis').textContent = '🚨';
  },

  quiz(body, set, done, data, hint) {
    hint.textContent = t('popQuiz');
    const q = el('div', 'quiz-q'), opts = el('div', 'quiz-opts'); body.append(q, opts);
    const ask = () => {
      const a = 2 + Math.floor(Math.random() * 9), b = 2 + Math.floor(Math.random() * 9), op = Math.random() < 0.5 ? '×' : '+';
      const ans = op === '×' ? a * b : a + b;
      q.textContent = `${a} ${op} ${b} = ?`;
      const choices = shuffle([ans, ans + 1 + Math.floor(Math.random() * 3), Math.max(0, ans - 1 - Math.floor(Math.random() * 3)), ans + 10]);
      opts.innerHTML = '';
      choices.forEach(c => { const b2 = el('button', 'big-btn small', c); b2.onclick = () => { if (c === ans) done(); else { sfx('wrong'); ask(); } }; opts.append(b2); });
    };
    ask();
  },

  lines(body, set, done, data, hint) {
    hint.textContent = t('lines');
    const sentence = String(data?.sentence || 'I will not run in the corridors.').slice(0, 80);
    const s = el('div', 'lines-s'); s.textContent = '“' + sentence + '”';
    const inp = el('input', 'lines-in'); inp.autocomplete = 'off'; inp.spellcheck = false;
    const btn = el('button', 'big-btn small', t('linesBtn'));
    body.append(s, inp, btn);
    const norm = x => x.toLowerCase().replace(/[^a-záéíóúñü ]/g, '').replace(/\s+/g, ' ').trim();
    const check = () => { if (norm(inp.value) === norm(sentence)) done(); else { sfx('wrong'); inp.classList.add('shake'); setTimeout(() => inp.classList.remove('shake'), 400); } };
    btn.onclick = check; inp.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') check(); };
    inp.onkeyup = e => e.stopPropagation();
    setTimeout(() => inp.focus(), 50);
  },
};
