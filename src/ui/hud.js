// HTML overlay: speech bubble with tap choices, loader, toasts, bottom-sheet panels.
export function el(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
    else if (k === 'value') e.value = v;
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) e.append(kid.nodeType ? kid : String(kid));
  return e;
}
const $ = (id) => document.getElementById(id);

const SPEAKERS = { turtle: '🐢 Old Turtle', sheep: '☁️ Cloud Sheep' };
let hideTimer = 0;
let current = null;

/**
 * Show a line in the speech bubble.
 * opts: { catName, onChoice(effect, line), quote, chip, onChip, sticky }
 * Every question (a line with choices) always gets a "Not now" choice.
 */
export function showBubble(line, opts = {}) {
  if (!line) return;
  clearTimeout(hideTimer);
  current = line;
  const box = $('bubble'), choices = $('bubbleChoices');
  $('bubbleWho').textContent = SPEAKERS[line.speaker] || '🐱 ' + (opts.catName || 'Mochi');
  const text = $('bubbleText');
  text.textContent = '';
  if (opts.quote) text.append(el('span', { class: 'quote' }, '“' + opts.quote + '”'), el('br'));
  text.append(line.text);
  choices.innerHTML = '';
  const list = (line.choices || []).slice();
  if (list.length) list.push({ label: 'Not now', effect: 'notnow' });
  for (const c of list) {
    choices.append(el('button', { class: 'choice' + (c.effect === 'notnow' ? ' quiet' : ''), onclick: () => { hideBubble(); opts.onChoice?.(c.effect, line); } }, c.label));
  }
  if (opts.chip) choices.append(el('button', { class: 'choice chip', onclick: () => opts.onChip?.() }, '🛟 Help is here'));
  box.querySelector('.bubble-x')?.remove();
  box.append(el('button', { class: 'bubble-x', 'aria-label': 'Close', onclick: () => { hideBubble(); if (list.length) opts.onChoice?.('notnow', line); } }, '✕'));
  box.hidden = false;
  box.classList.remove('pop'); void box.offsetWidth; box.classList.add('pop');
  if (!list.length && !opts.chip && !opts.sticky) hideTimer = setTimeout(hideBubble, Math.max(5000, line.text.length * 90));
}
export function hideBubble() { clearTimeout(hideTimer); $('bubble').hidden = true; current = null; }
export const bubbleOpen = () => !$('bubble').hidden && !!(current && current.choices && current.choices.length);

export function catThinking(on, text) {
  if (!on) { if (current?.id === '__thinking') hideBubble(); return; }
  showBubble({ id: '__thinking', speaker: 'cat', text: text || '…' }, { sticky: true });
}

export function setLoader(text) {
  const l = $('loader');
  if (!text) { l.hidden = true; return; }
  $('loaderText').textContent = text; l.hidden = false;
}

export function toast(text, ms = 2600) {
  const t = el('div', { class: 'toast', role: 'status' }, text);
  document.body.append(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 400); }, ms);
}

/** Bottom sheet for tasks, settings, typing, breathing… returns { close, body }. */
export function openPanel({ title, body, onClose, className }) {
  const p = $('panel');
  p.innerHTML = '';
  let closed = false;
  const close = () => { if (closed) return; closed = true; p.hidden = true; p.innerHTML = ''; onClose?.(); };
  const sheet = el('div', { class: 'sheet ' + (className || ''), role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
    el('div', { class: 'sheet-head' }, el('h2', {}, title), el('button', { class: 'icon', 'aria-label': 'Close', onclick: close }, '✕')),
    body);
  p.append(el('div', { class: 'backdrop', onclick: close }), sheet);
  p.hidden = false;
  setTimeout(() => sheet.querySelector('input, textarea, button:not(.icon)')?.focus(), 50);
  return { close, body };
}
export const panelOpen = () => !$('panel').hidden;
export function closePanel() { const p = $('panel'); p.hidden = true; p.innerHTML = ''; }

/** 📷🎙️ indicator: 'on' | 'off' (denied / unavailable) | 'paused'. */
export function setSenses({ cam, mic }) {
  if (cam) { const c = $('camDot'); c.className = cam; c.title = 'Camera ' + cam; }
  if (mic) { const m = $('micDot'); m.className = mic; m.title = 'Microphone ' + mic; }
}
