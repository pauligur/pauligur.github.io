// Tiny synth: sound effects + a looping chiptune, no audio files needed.
import { store } from './store.js';

let ctx, master, sfxGain, musicGain, musicTimer, musicStep = 0, musicMode = null;

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain(); master.connect(ctx.destination);
  sfxGain = ctx.createGain(); sfxGain.connect(master);
  musicGain = ctx.createGain(); musicGain.connect(master);
  applyVolume();
  return ctx;
}

export function unlockAudio() { const c = ensure(); if (c && c.state === 'suspended') c.resume(); }

export function applyVolume() {
  if (!ctx) return;
  const s = store.settings;
  master.gain.value = s.volume;
  sfxGain.gain.value = s.sound ? 0.6 : 0;
  musicGain.gain.value = s.music ? 0.22 : 0;
}

function tone(freq, start, dur, { type = 'square', vol = 0.3, slide = 0, out = sfxGain } = {}) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, start);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), start + dur);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(vol, start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g); g.connect(out); o.start(start); o.stop(start + dur + 0.02);
}

const SFX = {
  click: t => tone(660, t, 0.06, { vol: 0.15 }),
  pop: t => tone(520, t, 0.09, { type: 'triangle', vol: 0.3, slide: 400 }),
  good: t => { tone(660, t, 0.08, { type: 'triangle' }); tone(880, t + 0.07, 0.1, { type: 'triangle' }); },
  wrong: t => tone(200, t, 0.22, { type: 'sawtooth', vol: 0.18, slide: -80 }),
  done: t => [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.08, 0.16, { type: 'triangle', vol: 0.3 })),
  bell: t => { for (let i = 0; i < 6; i++) { tone(1320, t + i * 0.18, 0.5, { type: 'sine', vol: 0.3 }); tone(1980, t + i * 0.18, 0.3, { type: 'sine', vol: 0.12 }); } },
  detention: t => { tone(150, t, 0.5, { type: 'sawtooth', vol: 0.3 }); tone(110, t + 0.25, 0.6, { type: 'sawtooth', vol: 0.3 }); },
  meeting: t => { for (let i = 0; i < 4; i++) { tone(880, t + i * 0.3, 0.14); tone(660, t + i * 0.3 + 0.15, 0.14); } },
  alarm: t => { for (let i = 0; i < 3; i++) tone(700, t + i * 0.4, 0.35, { type: 'sawtooth', vol: 0.15, slide: 400 }); },
  whoosh: t => tone(300, t, 0.35, { type: 'sine', vol: 0.25, slide: 900 }),
  win: t => [523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.13, 0.22, { type: 'square', vol: 0.2 })),
  lose: t => [392, 330, 262, 196].forEach((f, i) => tone(f, t + i * 0.2, 0.3, { type: 'triangle', vol: 0.3 })),
  step: t => tone(90 + Math.random() * 30, t, 0.04, { type: 'triangle', vol: 0.05 }),
  coin: t => { tone(988, t, 0.07, { vol: 0.2 }); tone(1319, t + 0.07, 0.18, { vol: 0.2 }); },
};
export function sfx(name, note) {
  const c = ensure(); if (!c || !store.settings.sound) return;
  if (name === 'note') return tone(note, c.currentTime, 0.35, { type: 'triangle', vol: 0.35 });
  SFX[name]?.(c.currentTime);
}

// ---- Home-screen theme, from pauligur's MIDI (in the style of the school anthem).
// [beat, length in beats, midi note, velocity]
const ANTHEM = [[0.0,0.25,48,0.8],[0.0,0.25,55,0.75],[0.0,0.25,60,0.71],[0.0,0.25,67,0.8],[0.5,0.25,62,0.7],[0.5,0.25,64,0.53],[0.75,0.25,60,0.78],[1.0,0.25,55,0.73],[1.5,0.25,67,0.78],[1.75,0.75,55,0.72],[1.75,0.75,62,0.79],[1.75,1.25,47,0.68],[2.75,0.25,67,0.8],[3.75,0.25,60,0.83],[3.75,0.5,45,0.72],[3.75,0.5,52,0.69],[3.75,0.5,55,0.76],[4.25,0.25,64,0.65],[4.75,0.25,67,0.86],[4.75,0.5,43,0.67],[4.75,0.5,52,0.6],[4.75,0.75,55,0.72],[5.0,0.25,60,0.66],[5.5,1.25,41,0.74],[5.5,1.25,48,0.69],[5.5,1.25,55,0.84],[5.5,1.25,60,0.78],[7.5,0.25,55,0.75],[7.5,0.5,52,0.79],[7.5,1.5,40,0.66],[7.5,1.5,48,0.65],[8.0,0.25,60,0.68],[8.25,0.5,55,0.75],[8.75,0.25,52,0.78],[9.25,0.25,48,0.53],[9.25,0.5,54,0.82],[9.25,1.75,38,0.68],[9.75,0.25,55,0.57],[10.25,0.5,57,0.65],[10.25,0.75,45,0.69],[10.5,0.25,60,0.72],[11.0,0.25,43,0.77],[11.0,0.25,50,0.76],[11.0,0.25,59,0.76],[12.0,0.25,45,0.76],[12.0,0.25,52,0.83],[12.0,0.25,60,0.79],[12.75,0.75,53,0.83],[12.75,1.5,47,0.81],[12.75,1.5,62,0.8],[13.75,0.5,53,0.78],[14.25,0.25,59,0.58],[14.5,0.25,48,0.75],[15.0,0.25,55,0.56],[15.0,0.25,60,0.61],[15.0,0.25,64,0.69],[15.5,0.25,43,0.58],[16.0,0.25,55,0.62],[16.0,0.25,60,0.72],[16.0,0.25,64,0.56],[16.5,0.5,48,0.8],[16.75,0.25,67,0.81],[16.75,0.5,55,0.73],[16.75,0.5,60,0.73],[17.25,0.75,48,0.78],[17.5,0.25,64,0.56],[17.75,0.25,62,0.71],[18.0,0.25,60,0.76],[18.0,0.5,47,0.82],[18.5,0.25,55,0.68],[18.5,0.25,62,0.71],[19.0,0.5,47,0.74],[19.5,0.5,55,0.79],[19.5,0.5,67,0.84],[19.75,0.5,47,0.77],[20.25,1.0,55,0.79],[20.25,1.0,62,0.83],[20.75,0.75,47,0.74],[21.25,0.25,59,0.72],[21.75,0.25,45,0.69],[21.75,0.25,52,0.63],[21.75,0.25,55,0.8],[21.75,0.25,60,0.81],[22.0,0.25,55,0.61],[22.5,0.25,45,0.72],[22.5,0.25,52,0.71],[22.5,0.25,55,0.69],[22.5,0.25,64,0.78],[23.0,0.25,55,0.47],[23.0,0.25,60,0.68],[23.5,0.25,45,0.69],[23.5,0.25,52,0.63],[23.5,0.25,55,0.78],[23.5,0.25,64,0.79],[23.75,0.25,62,0.67],[24.0,0.25,55,0.57],[24.25,0.25,45,0.71],[24.25,0.25,52,0.69],[24.25,0.25,55,0.73],[24.25,0.25,60,0.83],[24.75,0.25,55,0.57],[24.75,0.25,59,0.75],[25.25,0.25,53,0.71],[25.25,1.0,55,0.75],[25.25,1.0,57,0.8],[25.25,1.25,41,0.73],[25.25,1.25,48,0.75],[25.25,1.25,60,0.78],[26.25,0.25,55,0.48],[26.5,0.25,41,0.8],[26.5,0.25,48,0.76],[26.5,0.25,55,0.69],[26.5,0.25,57,0.76],[27.0,0.75,48,0.69],[27.0,1.25,52,0.87],[27.0,1.25,55,0.76],[27.0,1.5,40,0.74],[28.0,0.5,48,0.64],[28.5,0.25,52,0.73],[28.5,0.25,55,0.58],[28.75,0.25,54,0.87],[29.0,0.25,45,0.69],[29.0,0.25,48,0.76],[29.0,0.5,38,0.76],[29.75,0.25,38,0.74],[29.75,0.25,45,0.73],[29.75,0.25,57,0.8],[29.75,0.5,48,0.86],[30.75,0.25,45,0.75],[30.75,0.25,60,0.84],[30.75,0.5,38,0.76],[30.75,0.5,48,0.88],[30.75,0.5,54,0.89],[31.5,0.25,48,0.88],[31.75,0.25,45,0.72],[31.75,0.25,57,0.83],[31.75,0.5,38,0.67],[32.5,0.75,43,0.75],[32.5,0.75,50,0.82],[32.5,0.75,59,0.82],[33.5,0.75,45,0.78],[33.5,0.75,52,0.87],[33.5,0.75,60,0.84],[34.5,0.5,47,0.89],[34.5,0.5,53,0.85],[34.5,0.5,62,0.88]];
const ANTHEM_BPM = 112, ANTHEM_LOOP = 38;
const mtof = n => 440 * Math.pow(2, (n - 69) / 12);
function anthemNote(beat0, [b, len, n, v]) {
  const spb = 60 / ANTHEM_BPM, t = beat0 + b * spb, d = Math.max(0.18, len * spb);
  if (n >= 60) {        // melody: soft chime
    tone(mtof(n), t, d + 0.25, { type: 'triangle', vol: 0.32 * v, out: musicGain });
    tone(mtof(n + 12), t, 0.35, { type: 'sine', vol: 0.08 * v, out: musicGain });
  } else if (n >= 48) { // chords
    tone(mtof(n), t, d + 0.15, { type: 'triangle', vol: 0.16 * v, out: musicGain });
  } else {              // bass
    tone(mtof(n), t, d, { type: 'triangle', vol: 0.42 * v, out: musicGain });
  }
}

// ---- Music: the anthem loop (home) and a sneakier pentatonic loop (game)
const SCALES = {
  game: { bpm: 96, bass: [110, 110, 130.8, 98], lead: [440, 523, 587, 659, 784, 880] },
};
let rngSeed = 1;
const rand = () => (rngSeed = (rngSeed * 16807) % 2147483647) / 2147483647;

export function playMusic(mode) {
  const c = ensure(); if (!c) return;
  if (musicMode === mode) return;
  musicMode = mode; musicStep = 0; rngSeed = mode === 'menu' ? 7 : 3;
  clearInterval(musicTimer);
  if (!mode) return;
  if (mode === 'menu') {
    let loopStart = c.currentTime + 0.15, idx = 0;
    const loopSecs = ANTHEM_LOOP * 60 / ANTHEM_BPM;
    musicTimer = setInterval(() => {
      const horizon = c.currentTime + 0.5;
      while (true) {
        if (idx >= ANTHEM.length) { idx = 0; loopStart += loopSecs; }
        const n = ANTHEM[idx], at = loopStart + n[0] * 60 / ANTHEM_BPM;
        if (at > horizon) break;
        if (at > c.currentTime - 0.05) anthemNote(loopStart, n);
        idx++;
      }
    }, 120);
    return;
  }
  const sc = SCALES[mode], stepDur = 60 / sc.bpm / 2;
  let next = c.currentTime + 0.1;
  const pattern = Array.from({ length: 32 }, (_, i) => (i % 4 === 3 && rand() < 0.5) ? null : sc.lead[Math.floor(rand() * sc.lead.length)]);
  musicTimer = setInterval(() => {
    while (next < c.currentTime + 0.3) {
      const i = musicStep % 32;
      if (i % 4 === 0) tone(sc.bass[Math.floor(i / 8) % 4], next, stepDur * 3.5, { type: 'triangle', vol: 0.5, out: musicGain });
      const n = pattern[i];
      if (n && (i % 2 === 0 || mode === 'menu')) tone(n, next, stepDur * 0.9, { type: 'square', vol: 0.12, out: musicGain });
      if (i % 8 === 4) tone(2000, next, 0.03, { type: 'square', vol: 0.05, out: musicGain });
      next += stepDur; musicStep++;
    }
  }, 100);
}
