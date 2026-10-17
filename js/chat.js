// Kid-safe chat text: short, no swearing, no links, emails or phone numbers.
// Short words only match as whole words (so "computadora", "recoger" or "cálculo" are fine);
// clearly bad stems also match inside longer words.
const WORDS = [
  'ass', 'dick', 'piss', 'slut', 'whore', 'wtf', 'stfu', 'bastard', 'retard', 'sex', 'sexy', 'damn',
  'puta', 'puto', 'putas', 'putos', 'culo', 'culos', 'orto', 'coger', 'cogo', 'concha', 'forro', 'forra', 'pija', 'verga', 'carajo',
  'choto', 'chota', 'trolo', 'pajero', 'garcha', 'hdp', 'ctm', 'marica', 'joder', 'cabron', 'pendejo', 'pendeja', 'gil', 'tarado', 'tarada', 'niga', 'nigas', 'niger', 'nigers',
];
const STEMS = ['fuck', 'fuk', 'shit', 'bitch', 'ashole', 'cunt', 'porn', 'faggot', 'mierda', 'boludo', 'boluda', 'pelotud', 'gilipola', 'mogolic', 'hijodeputa', 'conchetumadre', 'lpm', 'lpqtp'];
const fold = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/0/g, 'o').replace(/1|!/g, 'i').replace(/3/g, 'e').replace(/4|@/g, 'a').replace(/5|\$/g, 's').replace(/7/g, 't')
  .replace(/[^a-z]/g, '').replace(/(.)\1+/g, '$1');   // "fuuuck" -> "fuck"
const W = new Set(WORDS.map(fold)), S = STEMS.map(fold);

export const CHAT_MAX = 80;

// returns cleaned text, or '' if nothing is left to send
export function cleanChat(raw) {
  let s = String(raw ?? '').replace(/[\u0000-\u001f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, CHAT_MAX);
  if (!s) return '';
  // personal info: links, emails, long numbers (phones, addresses)
  s = s.replace(/\b(https?:\/\/|www\.)\S+/gi, '🚫')
    .replace(/\S+@\S+\.\S+/g, '🚫')
    .replace(/\S+\.(com|net|org|uy|ar|io|gg|me|tv|app)\b\S*/gi, '🚫')
    .replace(/(?:\d[\s.\-()]*){6,}/g, '🚫');
  s = s.split(' ').map(w => {
    const f = fold(w);
    const bad = f && (W.has(f) || W.has(f.replace(/s$/, '')) || S.some(b => f.includes(b)));
    return bad ? '★'.repeat(Math.min(5, Math.max(3, w.length))) : w;
  }).join(' ');
  return s.trim();
}
