// The calm help panel (safety rules, section 8 of the guide).
// Calm, warm, steady — never red, never "crisis detected". Lines are pre-written, never generated.
import help from '../data/helplines.json';
import { el } from './hud.js';

const $ = (id) => document.getElementById(id);

/** "09 2525 0111" → "tel:+358925250111"; short service numbers stay as they are. */
export function telHref(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length > 6 && digits.startsWith('0')) return 'tel:+358' + digits.slice(1);
  return 'tel:' + digits;
}

const INTRO = {
  0: 'Whatever is going on, you don\'t have to handle it alone. Here is who you can reach — and I\'m staying right here.',
  1: 'Whatever is going on, you don\'t have to handle it alone. Here is who you can reach — and I\'m staying right here.',
  2: 'Thank you for telling me. That sounds really painful. I\'m right here with you.',
  3: 'I\'m really glad you told me. You deserve support from a real person right now.',
};

let open = false;
export const helpOpen = () => open;

/**
 * level: 0 (🛟 button) · 1 concern · 2 high · 3 urgent
 * hooks: { catName, dim(on), onStay(), onClose() }
 */
export function showHelp(level, hooks = {}) {
  const panel = $('helpPanel');
  const name = hooks.catName || 'Mochi';
  open = true;
  hooks.dim?.(true);

  const close = () => { open = false; panel.hidden = true; panel.innerHTML = ''; hooks.dim?.(false); hooks.onClose?.(); };
  const askSafe = () => {
    body.innerHTML = '';
    body.append(
      el('p', { class: 'lead' }, 'Before I go quiet: are you safe right now?'),
      el('div', { class: 'stack' },
        el('button', { class: 'btn', onclick: close }, 'Yes, I\'m safe for now'),
        el('button', { class: 'btn', onclick: () => render(3, true) }, 'No'),
        el('button', { class: 'btn', onclick: () => render(3) }, 'I\'m not sure')));
  };

  const card = el('div', { class: 'help-card', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'helpTitle' });
  const body = el('div', { class: 'help-body' });

  function render(lvl, notSafe) {
    body.innerHTML = '';
    const e = help.emergency;
    const lines = help.lines;
    const big = lvl >= 3;
    if (notSafe) {
      body.append(el('p', { class: 'lead' }, 'Thank you for being honest with me. Please call the emergency number now — they can help straight away.'));
    } else {
      body.append(el('p', { class: 'lead' }, INTRO[lvl]));
    }
    if (big) {
      body.append(
        el('a', { class: 'call big', href: telHref(e.phone) }, '🚑 ' + e.name + ' ' + e.phone),
        el('a', { class: 'call big', href: telHref(lines[0].phone) }, '📞 ' + lines[0].name + ' · ' + lines[0].phone));
    }
    if (!notSafe) {
      body.append(el('div', { class: 'stack' },
        el('button', { class: 'btn', onclick: () => { close(); hooks.onStay?.(); } }, '🫂 Stay with me'),
        el('button', { class: 'btn', onclick: () => reach.hidden = !reach.hidden }, '💌 Help me reach someone')));
    }
    const msg = el('textarea', { rows: 3, 'aria-label': 'Message to someone you trust' },
      'Hey, I\'m having a really hard time right now. Could you talk with me or come over?');
    const reach = el('div', { class: 'reach', hidden: !notSafe ? true : false },
      el('p', {}, 'Send this to someone you trust (you can change it):'),
      msg,
      el('button', { class: 'btn', onclick: async () => {
        const text = msg.value;
        try {
          if (navigator.share) await navigator.share({ text });
          else { await navigator.clipboard.writeText(text); reachNote.textContent = 'Copied — paste it into a message. 💛'; }
        } catch { /* share cancelled */ }
      } }, '📤 Send / copy message'));
    const reachNote = el('p', { class: 'small' });
    reach.append(reachNote);
    body.append(reach);

    body.append(el('h3', {}, 'People you can call (Finland)'),
      el('div', { class: 'lines' },
        el('a', { class: 'call', href: telHref(e.phone) }, '🚑 ' + e.name + ' · ' + e.phone),
        lines.map((l) => l.phone
          ? el('div', { class: 'line' }, el('a', { class: 'call', href: telHref(l.phone) }, '📞 ' + l.name + ' · ' + l.phone), l.hours ? el('p', { class: 'small' }, l.hours) : null)
          : el('a', { class: 'call link', href: l.url, target: '_blank', rel: 'noopener' }, '💬 ' + l.name))),
      el('details', {}, el('summary', {}, 'Under 18, or outside Finland?'),
        help.youth.map((l) => l.phone
          ? el('a', { class: 'call', href: telHref(l.phone) }, '📞 ' + l.name + ' · ' + l.phone)
          : el('a', { class: 'call link', href: l.url, target: '_blank', rel: 'noopener' }, '💬 ' + l.name)),
        el('a', { class: 'call link', href: help.elsewhere.url, target: '_blank', rel: 'noopener' }, '🌍 ' + help.elsewhere.name)),
      el('p', { class: 'small' }, name + ' is an AI cat, not a crisis service, therapy or a medical device. Numbers last checked ' + help.lastVerified + '.'));
  }

  const closeBtn = el('button', { class: 'icon', 'aria-label': 'Close help', onclick: () => (level >= 3 ? askSafe() : close()) }, '✕');
  card.append(el('div', { class: 'help-head' }, el('h2', { id: 'helpTitle' }, '🛟 Help is here'), closeBtn), body);
  panel.innerHTML = '';
  panel.append(card);
  panel.hidden = false;
  render(level);
  setTimeout(() => card.querySelector('a, button:not(.icon)')?.focus(), 60);
}
