// Privacy controls (M10): 📷🎙️ indicator, ⏸️ pause, stop when hidden, settings, delete my data.
import { el, openPanel, setSenses, toast, closePanel } from './hud.js';
import { stopMic } from '../sensing/mic.js';
import { clearFace } from '../brain/state.js';
import { load, saveSettings, deleteAll } from '../storage.js';
import { setQuiet } from '../brain/director.js';

let userPaused = false, autoPaused = false;
export const sensesPaused = () => userPaused || autoPaused;

/**
 * app: { startCamera, stopCamera, sayCtx, settingsExtras(): Element[] , onSettingsChange() }
 */
export function installPrivacy(app) {
  const btn = document.getElementById('pauseBtn');

  const pauseSenses = () => {
    app.stopCamera();
    stopMic();
    clearFace();                 // the last 10 s of face numbers are forgotten too
    const s = load().settings;
    setSenses({ cam: s.camera ? 'paused' : 'off', mic: s.mic ? 'paused' : 'off' });
  };
  const resumeSenses = () => {
    const s = load().settings;
    setSenses({ cam: s.camera ? 'on' : 'off', mic: s.mic ? 'on' : 'off' });
    app.startCamera();           // the mic restarts only when you press Talk
  };

  const render = () => {
    btn.textContent = userPaused ? '▶️' : '⏸️';
    btn.setAttribute('aria-label', userPaused ? 'Resume camera and mic' : 'Pause camera and mic');
    btn.setAttribute('aria-pressed', String(userPaused));
  };

  btn.addEventListener('click', () => {
    userPaused = !userPaused;
    render();
    if (userPaused) { pauseSenses(); setQuiet(true); app.sayCtx('goodbye'); toast('📷🎙️ Camera and mic are off'); }
    else { resumeSenses(); setQuiet(false); toast('📷🎙️ Camera and mic are back on'); }
  });

  // Stop sensing when the app is hidden (home screen, other app, locked phone).
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { autoPaused = true; pauseSenses(); }
    else if (autoPaused) { autoPaused = false; if (!userPaused) resumeSenses(); }
  });

  document.getElementById('settingsBtn').addEventListener('click', () => openSettings(app));
  render();
}

function toggle(id, label, checked, onChange) {
  const input = el('input', { type: 'checkbox', id });
  input.checked = !!checked;
  input.addEventListener('change', () => onChange(input.checked));
  return el('label', { class: 'toggle', for: id }, input, el('span', {}, label));
}

export function openSettings(app) {
  const s = load().settings;
  const body = el('div', {},
    el('h3', {}, 'Senses'),
    toggle('setCam', '📷 Notice my expressions (camera)', s.camera, (v) => {
      saveSettings({ camera: v });
      if (v && !sensesPaused()) app.startCamera(); else { app.stopCamera(); clearFace(); setSenses({ cam: 'off' }); }
    }),
    toggle('setMic', '🎙️ Listen when I tap Talk (microphone)', s.mic, (v) => {
      saveSettings({ mic: v });
      if (!v) { stopMic(); setSenses({ mic: 'off' }); } else setSenses({ mic: sensesPaused() ? 'paused' : 'on' });
    }),
    ...(app.settingsExtras ? app.settingsExtras() : []),
    el('h3', {}, 'Comfort'),
    toggle('setMotion', '🐢 Reduce motion', s.reduceMotion, (v) => { saveSettings({ reduceMotion: v }); app.onSettingsChange?.(); }),
    toggle('setBig', '🔠 Bigger text', s.bigText, (v) => { saveSettings({ bigText: v }); app.onSettingsChange?.(); }),
    el('h3', {}, 'Your data'),
    el('p', { class: 'small' }, 'Stored on this phone only: your cat\'s name, these settings, and the last energy/mood guess. Camera frames, audio and what you say or type are processed in memory and thrown away — never stored, never sent.'),
    el('button', {
      class: 'btn', onclick: () => {
        const sure = el('div', {},
          el('p', {}, 'Delete everything Mochi remembers on this phone and start over?'),
          el('div', { class: 'stack' },
            el('button', { class: 'btn primary', onclick: () => { app.stopCamera(); stopMic(); deleteAll(); } }, '🗑️ Yes, delete my data'),
            el('button', { class: 'btn ghost', onclick: () => openSettings(app) }, 'Keep it')));
        closePanel();
        openPanel({ title: 'Delete my data', body: sure });
      },
    }, '🗑️ Delete my data'),
    el('p', { class: 'small' }, 'Mochi is an AI cat, not therapy or a medical device. Made with care at Junction.'));
  openPanel({ title: '⚙️ Settings', body });
}
