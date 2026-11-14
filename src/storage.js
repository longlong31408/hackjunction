// Tiny localStorage wrapper. Stores ONLY: cat name, settings, last energy/mood.
// Never audio, images or transcripts.
const KEY = 'mochi';
const DEFAULTS = {
  name: 'Mochi',
  onboarded: false,
  settings: { camera: true, mic: true, sound: true, music: true, reduceMotion: false, bigText: false, coat: 'cream', acc: 'none', time: null },
  last: { energy: 3, mood: 'neutral' },
};

export const load = () => {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { saved = {}; }
  return { ...DEFAULTS, ...saved, settings: { ...DEFAULTS.settings, ...(saved.settings || {}) }, last: { ...DEFAULTS.last, ...(saved.last || {}) } };
};
export const save = (obj) => {
  try { localStorage.setItem(KEY, JSON.stringify({ ...load(), ...obj })); } catch { /* private mode: keep going */ }
};
export const saveSettings = (patch) => save({ settings: { ...load().settings, ...patch } });

export function deleteAll() {
  localStorage.removeItem(KEY);
  location.reload();
}
