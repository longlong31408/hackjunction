// Onboarding (M1): honest about AI + camera/mic, "nothing leaves your phone",
// 18+ confirm (under 18 → youth resources and stop), name your cat.
import help from '../data/helplines.json';
import { el } from './hud.js';
import { telHref } from './help.js';

export function startOnboarding(onDone) {
  const root = document.getElementById('onboarding');
  document.body.classList.add('onboarding');
  const card = el('div', { class: 'ob-card' });
  root.innerHTML = ''; root.append(card); root.hidden = false;

  const screen1 = () => {
    card.innerHTML = '';
    card.append(
      el('div', { class: 'ob-cat', 'aria-hidden': 'true' }, '🐱'),
      el('h1', {}, 'Hi. I\'m a cat. Well — an AI cat.'),
      el('ul', { class: 'ob-list' },
        el('li', {}, '📷 I can notice your facial expressions with the camera, a few times a second.'),
        el('li', {}, '🎙️ When you tap Talk, I listen and turn your words into text.'),
        el('li', {}, '🔒 All of that happens on this phone. No pictures, sound or words ever leave it.'),
        el('li', {}, '🐾 I\'m not therapy or a medical device. The 🛟 button (top right) is always there.')),
      el('p', { class: 'small' }, 'You can pause the camera and mic any time with ⏸️, or say no to them completely.'),
      el('div', { class: 'stack' },
        el('button', { class: 'btn primary', onclick: screen2 }, 'I\'m 18 or older'),
        el('button', { class: 'btn ghost', onclick: under18 }, 'I\'m under 18')));
  };

  const under18 = () => {
    card.innerHTML = '';
    card.append(
      el('h1', {}, 'Thank you for telling me.'),
      el('p', {}, 'For now I\'m only for adults. But you deserve someone to talk to — these people are there for young people:'),
      el('div', { class: 'lines' },
        help.youth.map((l) => l.phone
          ? el('a', { class: 'call', href: telHref(l.phone) }, '📞 ' + l.name + ' · ' + l.phone)
          : el('a', { class: 'call link', href: l.url, target: '_blank', rel: 'noopener' }, '💬 ' + l.name)),
        el('a', { class: 'call', href: telHref(help.emergency.phone) }, '🚑 Emergency ' + help.emergency.phone),
        el('a', { class: 'call link', href: help.elsewhere.url, target: '_blank', rel: 'noopener' }, '🌍 ' + help.elsewhere.name)),
      el('button', { class: 'btn ghost', onclick: screen1 }, '← Back'));
  };

  const screen2 = () => {
    card.innerHTML = '';
    const name = el('input', { type: 'text', maxlength: 16, value: 'Mochi', 'aria-label': 'Your cat\'s name' });
    const cam = el('input', { type: 'checkbox', id: 'obCam', checked: true });
    const mic = el('input', { type: 'checkbox', id: 'obMic', checked: true });
    cam.checked = true; mic.checked = true;
    card.append(
      el('div', { class: 'ob-cat', 'aria-hidden': 'true' }, '😺'),
      el('h1', {}, 'What should I be called?'),
      name,
      el('label', { class: 'toggle', for: 'obCam' }, cam, el('span', {}, '📷 Let me notice your expressions (camera)')),
      el('label', { class: 'toggle', for: 'obMic' }, mic, el('span', {}, '🎙️ Let me listen when you tap Talk (microphone)')),
      el('p', { class: 'small' }, 'Without them I still work — you can type to me. The first time, I download my listening brain (about 100 MB, once) — Wi-Fi is best.'),
      el('div', { class: 'stack' },
        el('button', { class: 'btn primary', onclick: () => finish(name.value, cam.checked, mic.checked) }, 'Meet me 🐾'),
        el('button', { class: 'btn ghost', onclick: screen1 }, '← Back')));
  };

  const finish = (name, camera, micOn) => {
    root.hidden = true; root.innerHTML = '';
    document.body.classList.remove('onboarding');
    onDone({ name: (name || '').trim().slice(0, 16) || 'Mochi', camera, mic: micOn });
  };

  screen1();
}
