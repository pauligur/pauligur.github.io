// Settings, look and unlocks, saved in this browser only.
const KEY = 'sus-at-tbs-v1';
const DEFAULTS = {
  name: 'pauligur',
  look: { color: '#ffcf9e', hat: 'boater', hair: 'none', outfit: 'jumper', acc: 'none' },
  stars: 30,
  owned: [],
  settings: { lang: 'en', sound: true, music: true, volume: 0.7, sens: 1 },
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw);
      return { ...DEFAULTS, ...d, look: { ...DEFAULTS.look, ...d.look }, settings: { ...DEFAULTS.settings, ...d.settings } };
    }
  } catch { /* storage blocked */ }
  const d = structuredClone(DEFAULTS);
  if (navigator.language?.startsWith('es')) d.settings.lang = 'es';
  return d;
}

export const store = load();
export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(store)); } catch { /* ignore */ }
}
