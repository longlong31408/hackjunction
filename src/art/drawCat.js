// Procedural chibi cat — original art drawn in code (big round head, small body,
// dot eyes, soft cocoa outlines). drawCat(ctx, { x, y, s, pose, coat, acc, dir, expr, phase })
// (x, y) is the point between the cat's feet; s = 1 is about 60 px tall.
export const OUT = '#5B4636';

export const COATS = {
  cream: { label: 'Cream puff', body: '#F8E2C2', belly: '#FFF8EC', ear: '#FFC2C2' },
  ginger: { label: 'Ginger', body: '#F6B27A', belly: '#FFEBD6', mark: '#E08A4C', stripes: true, ear: '#FFB9A8' },
  mist: { label: 'Misty grey', body: '#C8C5D3', belly: '#F2F0F7', mark: '#A29DB5', stripes: true, ear: '#F4C4D0' },
  midnight: { label: 'Midnight', body: '#4B4556', belly: '#615A70', ear: '#C99AAE', dark: true },
  calico: { label: 'Calico', body: '#FFFBF4', belly: '#FFFFFF', mark: '#F2A863', mark2: '#6B5E6E', patches: true, ear: '#FFC2C2' },
  tuxedo: { label: 'Tuxedo', body: '#3F3B48', belly: '#FFFBF4', ear: '#C99AAE', dark: true, tux: true },
};

export function rr(ctx, x, y, w, h, r) {
  const [a, b, c, d] = Array.isArray(r) ? r : [r, r, r, r];
  ctx.beginPath();
  ctx.moveTo(x + a, y);
  ctx.lineTo(x + w - b, y); ctx.quadraticCurveTo(x + w, y, x + w, y + b);
  ctx.lineTo(x + w, y + h - c); ctx.quadraticCurveTo(x + w, y + h, x + w - c, y + h);
  ctx.lineTo(x + d, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - d);
  ctx.lineTo(x, y + a); ctx.quadraticCurveTo(x, y, x + a, y);
  ctx.closePath();
}
export function mix(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (s) => Math.round(((pa >> s) & 255) + (((pb >> s) & 255) - ((pa >> s) & 255)) * t);
  return '#' + ((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1);
}

function ell(ctx, x, y, rx, ry, rot, fill, stroke) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke !== false) ctx.stroke();
}

function tail(ctx, c, p, w) {
  ctx.save(); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.bezierCurveTo(p[2], p[3], p[4], p[5], p[6], p[7]);
  ctx.strokeStyle = OUT; ctx.lineWidth = w + 5; ctx.stroke();
  ctx.strokeStyle = c.body; ctx.lineWidth = w; ctx.stroke();
  if (c.stripes) { ctx.strokeStyle = c.mark; ctx.setLineDash([3, 5]); ctx.stroke(); ctx.setLineDash([]); }
  ctx.restore();
}

function leg(ctx, c, x, top, len, w, shade) {
  ctx.fillStyle = shade ? mix(c.body, OUT, 0.18) : (c.tux ? c.belly : c.body);
  rr(ctx, x - w / 2, top, w, len, w / 2); ctx.fill(); ctx.stroke();
}

function flower(ctx, x, y, col) {
  ctx.fillStyle = col;
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 2.6, y + Math.sin(a) * 2.6, 2.2, 0, 7); ctx.fill(); }
  ctx.fillStyle = '#FFD86B'; ctx.beginPath(); ctx.arc(x, y, 1.6, 0, 7); ctx.fill();
}

function headAcc(ctx, acc) {
  ctx.lineWidth = 2; ctx.strokeStyle = OUT;
  if (acc === 'bow') {
    ctx.save(); ctx.translate(13, -14); ctx.rotate(0.35); ctx.fillStyle = '#FF8FAB';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-8, -6); ctx.lineTo(-8, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(8, -6); ctx.lineTo(8, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ell(ctx, 0, 0, 2.8, 2.8, 0, '#FF6F96'); ctx.restore();
  } else if (acc === 'glasses') {
    ctx.lineWidth = 1.8;
    ell(ctx, -7, 1, 5.6, 5.2, 0, 'rgba(255,255,255,0.28)'); ell(ctx, 9, 1, 5.6, 5.2, 0, 'rgba(255,255,255,0.28)');
    ctx.beginPath(); ctx.moveTo(-1.4, 0); ctx.quadraticCurveTo(1, -2, 3.4, 0); ctx.stroke();
  } else if (acc === 'beanie') {
    ctx.fillStyle = '#A9D6F5';
    ctx.beginPath(); ctx.ellipse(0, -8, 20.5, 13, 0, Math.PI, Math.PI * 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#7FBCE8'; rr(ctx, -21, -11, 42, 6, 3); ctx.fill(); ctx.stroke();
    ell(ctx, 0, -22, 4.5, 4.5, 0, '#FFF6E9');
  } else if (acc === 'flowers') {
    const cols = ['#FF9EB5', '#FFE08A', '#CFC4F2', '#BDE6CF', '#FFC8A2'];
    for (let i = 0; i < 5; i++) { const a = Math.PI * (1.12 + i * 0.19); flower(ctx, Math.cos(a) * 18, Math.sin(a) * 14.5 - 1, cols[i]); }
  }
}

function head(ctx, c, o, hx, hy, hs, hrot) {
  ctx.save(); ctx.translate(hx, hy); ctx.rotate(hrot || 0); ctx.scale(hs, hs);
  const face = c.dark ? '#F6E8DC' : OUT;
  const perk = o.expr === 'listen' ? -4 : 0;          // ears up when listening
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(sx * 18, -5); ctx.quadraticCurveTo(sx * 17, -20 + perk, sx * 13, -25 + perk * 1.5); ctx.quadraticCurveTo(sx * 6, -18, sx * 2, -15);
    ctx.closePath(); ctx.fillStyle = c.body; ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx * 14.5, -9); ctx.quadraticCurveTo(sx * 14, -18 + perk, sx * 12.5, -20.5 + perk * 1.3); ctx.quadraticCurveTo(sx * 8, -16, sx * 6, -14.5);
    ctx.closePath(); ctx.fillStyle = c.ear; ctx.fill();
  }
  ell(ctx, 0, 0, 21, 17.5, 0, c.body, false);
  ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, 21, 17.5, 0, 0, Math.PI * 2); ctx.clip();
  if (c.patches) { ell(ctx, 13, -11, 11, 9, 0.4, c.mark, false); ell(ctx, -15, -9, 8, 7, 0, c.mark2, false); }
  if (c.tux) ell(ctx, 1, 9, 11, 7.5, 0, c.belly, false);
  if (c.stripes) {
    ctx.strokeStyle = c.mark; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
    for (const dx of [-5, 0, 5]) { ctx.beginPath(); ctx.moveTo(dx, -17); ctx.lineTo(dx * 0.8, -11 - Math.abs(dx) * 0.2); ctx.stroke(); }
  }
  ctx.restore();
  ell(ctx, 0, 0, 21, 17.5, 0, null);
  ctx.globalAlpha = 0.5; ell(ctx, -12.5, 6, 3.8, 2.3, 0, '#FF9DA7', false); ell(ctx, 14, 6, 3.8, 2.3, 0, '#FF9DA7', false); ctx.globalAlpha = 1;
  const expr = o.expr || 'neutral';
  ctx.strokeStyle = face; ctx.fillStyle = face; ctx.lineWidth = 2; ctx.lineCap = 'round';
  for (const [ex, ey] of [[-7, 1], [9, 1]]) {
    ctx.beginPath();
    if (expr === 'happy') { ctx.arc(ex, ey + 1.5, 3, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); }
    else if (expr === 'sleep') { ctx.arc(ex, ey - 1, 3, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke(); }
    else if (expr === 'squint') { const d = ex < 0 ? 1 : -1; ctx.moveTo(ex - 2.5 * d, ey - 2.5); ctx.lineTo(ex + 2 * d, ey); ctx.lineTo(ex - 2.5 * d, ey + 2.5); ctx.stroke(); }
    else {
      const r = expr === 'listen' || expr === 'surprised' ? 3.4 : 2.7;
      ctx.arc(ex, ey, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(ex - 0.9, ey - 1, r * 0.36, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = face;
    }
  }
  ctx.fillStyle = '#F48FA0'; ctx.beginPath(); ctx.moveTo(-0.6, 4.2); ctx.lineTo(3.4, 4.2); ctx.lineTo(1.4, 6.2); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = face; ctx.lineWidth = 1.5;
  if (expr === 'eat' || expr === 'surprised') {
    ell(ctx, 1.4, 9.5, 4, expr === 'eat' ? 4.5 : 2.6, 0, '#C8576A', false); ctx.strokeStyle = face; ctx.stroke();
  } else {
    ctx.beginPath(); ctx.arc(-0.6, 7, 2, 0.1, Math.PI - 0.1); ctx.stroke();
    ctx.beginPath(); ctx.arc(3.4, 7, 2, 0.1, Math.PI - 0.1); ctx.stroke();
  }
  ctx.globalAlpha = 0.55; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-15, 4); ctx.lineTo(-25, 2); ctx.moveTo(-15, 7.5); ctx.lineTo(-24, 9);
  ctx.moveTo(17, 4); ctx.lineTo(27, 2); ctx.moveTo(17, 7.5); ctx.lineTo(26, 9);
  ctx.stroke();
  ctx.globalAlpha = 1; ctx.lineWidth = 2.4; ctx.strokeStyle = OUT;
  headAcc(ctx, o.acc);
  ctx.restore();
}

function neckAcc(ctx, acc, nx, ny, nw) {
  if (acc !== 'scarf') return;
  ctx.fillStyle = '#FF9E7A';
  rr(ctx, nx - nw / 2, ny - 3.5, nw, 7, 3.5); ctx.fill(); ctx.stroke();
  ctx.save(); ctx.translate(nx - nw * 0.25, ny + 2); ctx.rotate(0.15);
  rr(ctx, -3.5, 0, 7, 12, 3); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#FFF6E9'; ctx.fillRect(-3, 4, 6, 2); ctx.restore();
}

export function drawCat(ctx, o) {
  const c = COATS[o.coat] || COATS.cream;
  const s = o.s || 1, dir = o.dir || 1, pose = o.pose || 'sit';
  ctx.save();
  ctx.translate(o.x, o.y); ctx.scale(s * dir, s);
  if (o.rot) ctx.rotate(o.rot);
  ctx.lineJoin = 'round'; ctx.lineWidth = 2.4; ctx.strokeStyle = OUT;
  if (!o.noShadow) {
    ctx.save(); ctx.globalAlpha = 0.16; ctx.fillStyle = OUT;
    ctx.beginPath(); ctx.ellipse(1, 0.5, pose === 'sit' ? 18 : 22, 3.4, 0, 0, 7); ctx.fill(); ctx.restore();
  }
  if (pose === 'sit' || pose === 'play' || pose === 'eat') {
    tail(ctx, c, [-13, -5, -30, -6, -32, -24, -24, -34], 5.5);
    ell(ctx, 0, -15, 16, 15, 0, c.body);
    ell(ctx, 4, -12, 9, 9.5, 0, c.belly, false);
    ell(ctx, -4, -1.5, 5, 3.2, 0, c.tux ? c.belly : c.body);
    if (pose === 'play') ell(ctx, 13, -14, 4.5, 4, 0, c.tux ? c.belly : c.body);
    else ell(ctx, 8, -1.5, 5, 3.2, 0, c.tux ? c.belly : c.body);
    neckAcc(ctx, o.acc, 3, -26, 26);
    const eat = pose === 'eat';
    head(ctx, c, { ...o, expr: eat ? 'eat' : o.expr }, eat ? 9 : 3, eat ? -32 : -39, 1, eat ? 0.22 : (o.tilt || 0));
  } else if (pose === 'groom') {   // paw up to the face, eyes closed, a tiny pink tongue
    tail(ctx, c, [-13, -5, -30, -6, -32, -24, -24, -34], 5.5);
    ell(ctx, 0, -15, 16, 15, 0, c.body);
    ell(ctx, 4, -12, 9, 9.5, 0, c.belly, false);
    ell(ctx, -4, -1.5, 5, 3.2, 0, c.tux ? c.belly : c.body);
    neckAcc(ctx, o.acc, 3, -26, 26);
    head(ctx, c, { ...o, expr: 'sleep' }, 5, -37, 1, 0.28);
    ctx.fillStyle = '#F48FA0'; ell(ctx, 13, -27, 2.2, 1.6, 0, '#F48FA0', false);
    ell(ctx, 14, -24, 4.6, 6, -0.3, c.tux ? c.belly : c.body);   // the raised paw
  } else if (pose === 'stretch') {   // play bow: front low, bottom up
    tail(ctx, c, [-18, -24, -26, -34, -20, -46, -12, -50], 5.5);
    leg(ctx, c, -14, -16, 16, 6, true); leg(ctx, c, -8, -16, 16, 6, false);
    ctx.save(); ctx.translate(0, -16); ctx.rotate(0.32); ell(ctx, 0, 0, 20, 9.5, 0, c.body); ell(ctx, 5, 4, 11, 4, 0, c.belly, false); ctx.restore();
    for (const lx of [10, 15]) { ctx.fillStyle = c.tux ? c.belly : c.body; rr(ctx, lx, -4, 18, 5.5, 2.75); ctx.fill(); ctx.stroke(); }
    head(ctx, c, { ...o, expr: 'squint' }, 24, -16, 0.85, 0.15);
  } else if (pose === 'back') {      // rolled over, paws up, belly out
    tail(ctx, c, [-20, -8, -30, -4, -32, -16, -26, -22], 5);
    for (const [px, py] of [[-12, -22], [-4, -25]]) ell(ctx, px, py, 4, 5.5, 0, c.tux ? c.belly : c.body);
    ell(ctx, 0, -11, 21, 11, 0, c.body);
    ell(ctx, 0, -14, 14, 6.5, 0, c.belly, false);
    for (const [px, py] of [[8, -25], [14, -22]]) ell(ctx, px, py, 4, 5.5, 0.3, c.tux ? c.belly : c.body);
    head(ctx, c, { ...o, expr: 'happy' }, 24, -12, 0.85, -0.5);
  } else if (pose === 'knead') {     // making biscuits: front paws pressing in turn
    tail(ctx, c, [-18, -6, -24, 2, -6, 3, 10, 0], 5);
    ell(ctx, 0, -11, 22, 11, 0, c.body);
    ell(ctx, 8, -6, 9, 4.5, 0, c.belly, false);
    const k = o.phase || 0;
    ell(ctx, 16, k ? -6 : -2.5, 4.5, 3.5, 0, c.tux ? c.belly : c.body);
    ell(ctx, 24, k ? -2.5 : -6, 4.5, 3.5, 0, c.tux ? c.belly : c.body);
    neckAcc(ctx, o.acc, 11, -16, 22);
    head(ctx, c, { ...o, expr: 'happy' }, 10, -27, 0.92, 0);
  } else if (pose === 'crouch') {    // getting ready to pounce, bottom wiggle
    tail(ctx, c, [-16, -8, -28, -10, -34, -6, -40, -12], 5);
    ell(ctx, -2, -9, 20, 8, 0.12, c.body);
    for (const lx of [-12, 10]) { ctx.fillStyle = c.body; rr(ctx, lx, -4, 9, 4.5, 2.2); ctx.fill(); ctx.stroke(); }
    head(ctx, c, { ...o, expr: 'surprised' }, 17, -17, 0.88, 0);
  } else if (pose === 'loaf') {
    tail(ctx, c, [-18, -6, -24, 2, -6, 3, 10, 0], 5);
    ell(ctx, 0, -11, 22, 11, 0, c.body);
    ell(ctx, 8, -6, 9, 4.5, 0, c.belly, false);
    neckAcc(ctx, o.acc, 11, -16, 22);
    head(ctx, c, o, 12, -26, 0.92, 0);
  } else if (pose === 'sleep') {
    ell(ctx, -2, -11, 21, 12, 0, c.body);
    tail(ctx, c, [-20, -6, -22, 3, 0, 4, 16, -2], 5);
    head(ctx, c, { ...o, expr: 'sleep' }, 11, -14, 0.8, 0.18);
  } else {
    // walk / run / stand
    const run = pose === 'run', ph = o.phase || 0, amp = run ? 5 : 3.2;
    const bob = pose === 'stand' ? 0 : Math.abs(Math.sin(ph)) * (run ? 2 : 1.2);
    const legs = [[-11, 0, true], [9, Math.PI, true], [-6, Math.PI, false], [14, 0, false]];
    for (const [lx, off, far] of legs) if (far) leg(ctx, c, lx + Math.sin(ph + off) * amp, -10 - bob, 10 - Math.max(0, -Math.cos(ph + off)) * 2, 6, true);
    tail(ctx, c, [-16, -16 - bob, -26, -18, -26, -30, -22, -36], 5.5);
    ell(ctx, 0, -15 - bob, run ? 20 : 18, run ? 10 : 11, 0, c.body);
    ell(ctx, 4, -10 - bob, 11, 5, 0, c.belly, false);
    for (const [lx, off, far] of legs) if (!far) leg(ctx, c, lx + Math.sin(ph + off) * amp, -10 - bob, 10 - Math.max(0, -Math.cos(ph + off)) * 2, 6, false);
    neckAcc(ctx, o.acc, 15, -24 - bob, 18);
    head(ctx, c, o, 17, -31 - bob, 0.92, run ? 0.12 : 0);
  }
  ctx.restore();
}
