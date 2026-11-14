// Could-haves: couch mode, cat coat & accessories, sound & music settings.
import { el, toast } from './hud.js';
import { load, saveSettings } from '../storage.js';
import { redrawCat } from '../art/textures.js';
import { COATS } from '../art/drawCat.js';
import { initSound, play, setMusic, setSfx } from './sound.js';

const ACCESSORIES = [['none', 'None'], ['bow', '🎀 Bow'], ['scarf', '🧣 Scarf'], ['glasses', '👓 Glasses'], ['beanie', '🧢 Beanie'], ['flowers', '🌼 Flowers']];

/** app: { game, home, world, showScene, addSettings, catName } */
export function installExtras(app) {
  const s = load().settings;
  setSfx(s.sound);
  app.sound = (kind) => play(kind);
  app.game.events.on('said', (line) => { if (line.id !== '__thinking') play('pop'); });
  app.game.events.on('catTapped', () => play(Math.random() < 0.5 ? 'meow' : 'purr'));
  app.game.events.on('purr', () => play('purr'));
  // Browsers only allow audio after a tap: start music on the first one (it's after onboarding's button).
  const unlock = () => { initSound(); if (load().settings.music) setMusic(true); };
  unlock();
  document.addEventListener('pointerdown', unlock, { once: true });

  // ---- couch mode: the cat wanders by itself, like a calm screensaver
  const couch = document.getElementById('couchBtn');
  couch.addEventListener('click', (e) => { e.stopPropagation(); app.world().setCouch(!app.world().couch); });
  app.game.events.on('couch', (on) => {
    couch.textContent = on ? '⏹️ Stop watching' : '🛋️ Couch mode';
    couch.setAttribute('aria-pressed', String(on));
    document.body.classList.toggle('couch', on);
    if (on) toast('Just watch ' + app.catName() + ' wander. Tap the map to stop.');
  });

  // ---- settings rows
  app.addSettings(() => {
    const cur = load().settings;
    const chips = (options, value, onPick) => {
      const wrap = el('div', { class: 'chips' });
      const render = (v) => {
        wrap.innerHTML = '';
        options.forEach(([id, label]) => wrap.append(el('button', { class: 'chip' + (id === v ? ' on' : ''), 'aria-pressed': String(id === v), onclick: () => { onPick(id); render(id); } }, label)));
      };
      render(value);
      return wrap;
    };
    const toggle = (id, label, checked, onChange) => {
      const input = el('input', { type: 'checkbox', id }); input.checked = !!checked;
      input.addEventListener('change', () => onChange(input.checked));
      return el('label', { class: 'toggle', for: id }, input, el('span', {}, label));
    };
    return [
      el('h3', {}, 'Your cat'),
      chips(Object.entries(COATS).map(([id, c]) => [id, c.label]), cur.coat, (coat) => { saveSettings({ coat }); refreshLook(app); }),
      chips(ACCESSORIES, cur.acc, (acc) => { saveSettings({ acc }); refreshLook(app); }),
      el('h3', {}, 'Sound'),
      toggle('setSfx', '🐾 Purrs, meows and pops', cur.sound, (v) => { saveSettings({ sound: v }); setSfx(v); if (v) { initSound(); play('pop'); } }),
      toggle('setMusic', '🎵 Soft lo-fi music', cur.music, (v) => { saveSettings({ music: v }); initSound(); setMusic(v); }),
    ];
  });
}

/** Redraw the cat in its new coat/accessory everywhere it appears. */
export function refreshLook(app) {
  const s = load().settings;
  const look = { coat: s.coat, acc: s.acc };
  const home = app.home();
  app.game.registry.set('look', look);
  redrawCat(home, look, app.game.registry.get('pngKeys') || new Set());
  home.anims.remove('walk');
  home.anims.create({ key: 'walk', frames: [0, 1, 2, 3].map((i) => ({ key: 'walk' + i })), frameRate: 8, repeat: -1 });
  home.idle();
  const w = app.world();
  if (w?.cat) { const playing = w.cat.anims.isPlaying; w.cat.setTexture(playing ? 'walk0' : 'cat3'); if (playing) w.cat.play('walk'); }
}
