// All of Mochi's art, drawn in code (original, no third-party assets).
// Each function returns a canvas; registerArt() turns them into Phaser textures.
// Drop a PNG in public/art/ and list it in public/art/manifest.json to replace one.
import { drawCat, rr, mix, OUT } from './drawCat.js';

export const C = {
  cream: '#FFF6E9', peach: '#FFC8A2', mint: '#BDE6CF', lavender: '#CFC4F2', sky: '#A9D6F5', cocoa: OUT,
  sand: '#F6E3B4', grass: '#B5E0A5', meadow: '#C9EBB0', wood: '#D9B48F', water: '#A9D6F5',
};

const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const rnd = (seed) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

// ------------------------------------------------------------------ cat poses (400 × 400, feet at 200,340)
export const CAT_FEET = { x: 200, y: 340, originY: 340 / 400 };

function zees(ctx, x, y) {
  ctx.fillStyle = '#7A6CC4'; ctx.font = '800 34px Nunito, sans-serif'; ctx.fillText('z', x, y);
  ctx.font = '800 26px Nunito, sans-serif'; ctx.fillText('z', x + 26, y - 30);
  ctx.font = '800 18px Nunito, sans-serif'; ctx.fillText('z', x + 46, y - 54);
}

export function catPose(key, coat, acc) {
  const cv = canvas(400, 400), ctx = cv.getContext('2d');
  const base = { x: 200, y: 340, s: 4.2, coat, acc };
  const box = (front) => {
    ctx.save(); ctx.translate(200, 340); ctx.scale(4.2, 4.2); ctx.lineJoin = 'round'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.2;
    if (!front) {
      ctx.fillStyle = '#C99A6E'; ctx.beginPath(); ctx.moveTo(-30, -27); ctx.lineTo(30, -27); ctx.lineTo(27, -19); ctx.lineTo(-27, -19); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else {
      ctx.fillStyle = '#E3B98C'; rr(ctx, -29, -20, 58, 20, 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-29, -20); ctx.lineTo(-38, -31); ctx.lineTo(-29, -27); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(29, -20); ctx.lineTo(37, -30); ctx.lineTo(29, -27); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(91,70,54,0.3)'; ctx.fillRect(-5, -20, 10, 7);
    }
    ctx.restore();
  };
  switch (key) {
    case 'cat1': // sleeping in a box, blanket on top
      box(false);
      drawCat(ctx, { ...base, y: 314, pose: 'sleep', noShadow: true });
      ctx.save(); ctx.translate(200, 340); ctx.scale(4.2, 4.2); ctx.strokeStyle = OUT; ctx.lineWidth = 2;
      ctx.fillStyle = '#CFC4F2';
      ctx.beginPath(); ctx.moveTo(-31, -19); ctx.quadraticCurveTo(-18, -36, -2, -28); ctx.quadraticCurveTo(4, -25, 5, -17); ctx.lineTo(-29, -14); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(91,70,54,0.3)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-20, -29); ctx.lineTo(-18, -17); ctx.moveTo(-10, -30); ctx.lineTo(-8, -17); ctx.stroke();
      ctx.restore();
      box(true); zees(ctx, 268, 150);
      break;
    case 'cat2': // lazy loaf on a cushion
      ctx.save(); ctx.translate(200, 344); ctx.scale(4.2, 4.2); ctx.strokeStyle = OUT; ctx.lineWidth = 2.2;
      ctx.fillStyle = C.mint; ctx.beginPath(); ctx.ellipse(0, -3, 32, 8, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore();
      drawCat(ctx, { ...base, y: 322, pose: 'loaf', expr: 'sleep', noShadow: true });
      break;
    case 'cat3': drawCat(ctx, { ...base, pose: 'sit' }); break;
    case 'cat4': // playing with yarn
      drawCat(ctx, { ...base, pose: 'play', expr: 'happy' });
      ctx.save(); ctx.translate(200, 340); ctx.scale(4.2, 4.2); ctx.strokeStyle = OUT; ctx.lineWidth = 2;
      ctx.fillStyle = '#FF9EB5'; ctx.beginPath(); ctx.arc(26, -7, 7, 0, 7); ctx.fill(); ctx.stroke();
      ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(26, -7, 4, 0.4, 2.8); ctx.stroke(); ctx.beginPath(); ctx.moveTo(32, -4); ctx.quadraticCurveTo(40, 0, 36, 0); ctx.stroke();
      ctx.restore();
      break;
    case 'cat5': // zoomies!
      ctx.strokeStyle = 'rgba(91,70,54,0.45)'; ctx.lineWidth = 7; ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(90 - i * 12, 230 + i * 34); ctx.lineTo(30 - i * 16, 230 + i * 34); ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      for (const [x, y, r] of [[80, 330, 16], [55, 320, 11], [104, 336, 10]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
      drawCat(ctx, { ...base, x: 210, pose: 'run', phase: 1, expr: 'happy' });
      break;
    case 'catListen': // ears up, listening
      drawCat(ctx, { ...base, pose: 'sit', expr: 'listen', tilt: 0.12 });
      ctx.strokeStyle = 'rgba(91,70,54,0.55)'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      for (const r of [26, 46]) { ctx.beginPath(); ctx.arc(318, 120, r, -0.7, 0.5); ctx.stroke(); }
      break;
    case 'catEat': drawCat(ctx, { ...base, pose: 'eat' }); break;
    case 'catHappy': drawCat(ctx, { ...base, pose: 'sit', expr: 'happy' }); break;
    default: drawCat(ctx, { ...base, pose: 'sit' });
  }
  return cv;
}

export function catWalkFrame(i, coat, acc) {
  const cv = canvas(200, 200), ctx = cv.getContext('2d');
  drawCat(ctx, { x: 100, y: 176, s: 2.6, pose: 'walk', phase: (i * Math.PI) / 2, coat, acc });
  return cv;
}

// ------------------------------------------------------------------ the cozy room (720 × 1280)
function cloud(ctx, x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = col || 'rgba(255,255,255,0.92)';
  ctx.beginPath(); ctx.arc(-22, 6, 16, 0, 7); ctx.arc(0, -4, 22, 0, 7); ctx.arc(24, 4, 17, 0, 7); ctx.arc(4, 12, 18, 0, 7); ctx.fill(); ctx.restore();
}
function plant(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.strokeStyle = OUT; ctx.lineWidth = 2.4; ctx.fillStyle = '#8FCB9B';
  for (const [a, l] of [[-0.9, 16], [-0.3, 20], [0.3, 19], [0.9, 15]]) { ctx.save(); ctx.rotate(a); ctx.beginPath(); ctx.ellipse(0, -l / 2 - 8, 5, l / 2, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore(); }
  ctx.fillStyle = '#F0A38A'; ctx.beginPath(); ctx.moveTo(-9, -10); ctx.lineTo(9, -10); ctx.lineTo(6, 2); ctx.lineTo(-6, 2); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}

export function room(night) {
  const cv = canvas(720, 1280), ctx = cv.getContext('2d');
  ctx.lineJoin = 'round'; ctx.strokeStyle = OUT; ctx.lineWidth = 5;
  const wall = night ? '#F2D8C8' : '#FFE3CF';
  ctx.fillStyle = wall; ctx.fillRect(0, 0, 720, 880);
  ctx.fillStyle = night ? '#ECCCB9' : '#FFD2B5';
  for (let y = 30; y < 860; y += 52) for (let x = 20 + ((y / 52) % 2) * 26; x < 720; x += 52) { ctx.beginPath(); ctx.arc(x, y, 6, 0, 7); ctx.fill(); }
  // window
  const wx = 210, wy = 220, ww = 300, wh = 250;
  ctx.fillStyle = '#FFFDF8'; rr(ctx, wx - 14, wy - 14, ww + 28, wh + 28, 18); ctx.fill(); ctx.stroke();
  const g = ctx.createLinearGradient(0, wy, 0, wy + wh);
  if (night) { g.addColorStop(0, '#2D2B57'); g.addColorStop(1, '#4B4680'); } else { g.addColorStop(0, '#A9D6F5'); g.addColorStop(1, '#DFF1FB'); }
  ctx.fillStyle = g; rr(ctx, wx, wy, ww, wh, 10); ctx.fill();
  ctx.save(); rr(ctx, wx, wy, ww, wh, 10); ctx.clip();
  if (night) {
    const r = rnd(5); ctx.fillStyle = '#FFF6D8';
    for (let i = 0; i < 26; i++) { ctx.beginPath(); ctx.arc(wx + r() * ww, wy + r() * wh, 1.5 + r() * 2, 0, 7); ctx.fill(); }
    ctx.beginPath(); ctx.arc(wx + 220, wy + 70, 30, 0, 7); ctx.fill();
    ctx.fillStyle = '#2D2B57'; ctx.beginPath(); ctx.arc(wx + 234, wy + 60, 27, 0, 7); ctx.fill();
  } else {
    ctx.fillStyle = '#FFE7A8'; ctx.beginPath(); ctx.arc(wx + 230, wy + 70, 34, 0, 7); ctx.fill();
    cloud(ctx, wx + 90, wy + 110, 1.2); cloud(ctx, wx + 210, wy + 180, 0.8);
  }
  ctx.fillStyle = night ? '#3E6B5A' : '#A8DBA8'; ctx.beginPath(); ctx.moveTo(wx, wy + wh); ctx.quadraticCurveTo(wx + 100, wy + wh - 70, wx + ww, wy + wh - 30); ctx.lineTo(wx + ww, wy + wh); ctx.fill();
  ctx.restore();
  ctx.lineWidth = 5; rr(ctx, wx, wy, ww, wh, 10); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.moveTo(wx, wy + wh / 2); ctx.lineTo(wx + ww, wy + wh / 2); ctx.stroke();
  ctx.fillStyle = C.peach;
  ctx.beginPath(); ctx.moveTo(wx - 30, wy - 30); ctx.quadraticCurveTo(wx + 30, wy + wh * 0.5, wx - 6, wy + wh + 20); ctx.lineTo(wx - 40, wy + wh + 20); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(wx + ww + 30, wy - 30); ctx.quadraticCurveTo(wx + ww - 30, wy + wh * 0.5, wx + ww + 6, wy + wh + 20); ctx.lineTo(wx + ww + 40, wy + wh + 20); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = C.wood; rr(ctx, wx - 30, wy + wh + 14, ww + 60, 20, 8); ctx.fill(); ctx.stroke();
  plant(ctx, wx + 40, wy + wh + 16, 2.2);
  // fairy lights
  ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 130); ctx.quadraticCurveTo(360, 200, 720, 130); ctx.stroke();
  const bulbs = ['#FFE08A', '#FF9EB5', '#A9D6F5', '#BDE6CF'];
  for (let i = 1; i < 14; i++) {
    const k = i / 14, bx = 720 * k, by = 130 + 70 * 2 * k * (1 - k) * 0.98 + 12;
    if (night) { ctx.fillStyle = 'rgba(255,224,138,0.35)'; ctx.beginPath(); ctx.arc(bx, by, 18, 0, 7); ctx.fill(); }
    ctx.fillStyle = bulbs[i % 4]; ctx.beginPath(); ctx.arc(bx, by, 8, 0, 7); ctx.fill();
  }
  // bookshelf (left)
  ctx.lineWidth = 5; ctx.fillStyle = '#E8C29C'; rr(ctx, 34, 440, 140, 440, 8); ctx.fill(); ctx.stroke();
  for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(34, 440 + i * 110); ctx.lineTo(174, 440 + i * 110); ctx.stroke(); }
  const bookCols = [C.sky, C.lavender, C.mint, C.peach, '#FF9EB5'];
  const r2 = rnd(9);
  for (let s = 0; s < 3; s++) {
    let x = 46;
    while (x < 150) { const w = 14 + r2() * 12, h = 60 + r2() * 30; ctx.fillStyle = bookCols[Math.floor(r2() * 5)]; ctx.lineWidth = 3; rr(ctx, x, 440 + (s + 1) * 110 - h - 3, w, h, 3); ctx.fill(); ctx.stroke(); x += w + 3; }
  }
  plant(ctx, 104, 440, 2);
  // picture frame + floor lamp (right)
  ctx.lineWidth = 5; ctx.fillStyle = '#FFFDF8'; rr(ctx, 560, 300, 120, 100, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = C.sky; ctx.fillRect(572, 312, 96, 76); ctx.fillStyle = C.mint; ctx.beginPath(); ctx.moveTo(572, 388); ctx.quadraticCurveTo(610, 340, 668, 372); ctx.lineTo(668, 388); ctx.fill();
  ctx.fillStyle = '#FFE08A'; ctx.beginPath(); ctx.arc(645, 334, 10, 0, 7); ctx.fill();
  ctx.fillStyle = C.wood; ctx.fillRect(628, 560, 10, 320); ctx.strokeRect(628, 560, 10, 320);
  if (night) { const lg = ctx.createRadialGradient(633, 540, 10, 633, 560, 170); lg.addColorStop(0, 'rgba(255,214,140,0.65)'); lg.addColorStop(1, 'rgba(255,214,140,0)'); ctx.fillStyle = lg; ctx.fillRect(460, 380, 340, 360); }
  ctx.fillStyle = '#FFE7A8'; ctx.beginPath(); ctx.moveTo(588, 560); ctx.lineTo(678, 560); ctx.lineTo(658, 488); ctx.lineTo(608, 488); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = C.wood; rr(ctx, 600, 868, 66, 14, 6); ctx.fill(); ctx.stroke();
  // floor
  ctx.fillStyle = night ? '#D6B08B' : '#E2BE97'; ctx.fillRect(0, 880, 720, 400);
  ctx.strokeStyle = 'rgba(91,70,54,0.22)'; ctx.lineWidth = 3;
  for (let x = -200; x < 900; x += 90) { ctx.beginPath(); ctx.moveTo(x + 200, 880); ctx.lineTo(x, 1280); ctx.stroke(); }
  ctx.fillStyle = '#F7EBDD'; ctx.fillRect(0, 868, 720, 14);
  ctx.strokeStyle = OUT; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 882); ctx.lineTo(720, 882); ctx.stroke();
  // rug
  ctx.lineWidth = 5; ctx.fillStyle = C.lavender; ctx.beginPath(); ctx.ellipse(360, 950, 250, 56, 0, 0, 7); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 4; ctx.setLineDash([14, 14]); ctx.beginPath(); ctx.ellipse(360, 950, 210, 40, 0, 0, 7); ctx.stroke(); ctx.setLineDash([]);
  // floor cushion + yarn basket
  ctx.strokeStyle = OUT; ctx.lineWidth = 5;
  ctx.fillStyle = C.mint; ctx.beginPath(); ctx.ellipse(96, 1080, 80, 30, 0, 0, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#E8C29C'; ctx.beginPath(); ctx.moveTo(560, 1040); ctx.lineTo(680, 1040); ctx.lineTo(666, 1110); ctx.lineTo(574, 1110); ctx.closePath(); ctx.fill(); ctx.stroke();
  for (const [x, col] of [[592, '#FF9EB5'], [626, C.sky], [658, '#FFE08A']]) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, 1036, 18, 0, 7); ctx.fill(); ctx.stroke(); }
  return cv;
}

// ------------------------------------------------------------------ world map (1800 × 3200) + land mask
export const WORLD = { w: 1800, h: 3200 };
export const ISLANDS = [
  { id: 'home', x: 900, y: 1700, rx: 330, ry: 300, ground: C.grass, seed: 3 },
  { id: 'meadow', x: 1250, y: 900, rx: 430, ry: 390, ground: C.meadow, seed: 7 },
  { id: 'beach', x: 490, y: 2620, rx: 400, ry: 320, ground: C.sand, seed: 11 },
];
export const BRIDGES = [[900, 1700, 1250, 900], [900, 1700, 490, 2620]];

function blobPath(ctx, I, grow) {
  const n = 64;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const wob = 1 + 0.07 * Math.sin(a * 3 + I.seed) + 0.05 * Math.sin(a * 5 + I.seed * 2) + 0.03 * Math.sin(a * 9 + I.seed);
    pts.push([I.x + Math.cos(a) * (I.rx * wob + grow), I.y + Math.sin(a) * (I.ry * wob + grow)]);
  }
  ctx.beginPath();
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  let m = mid(pts[n - 1], pts[0]); ctx.moveTo(m[0], m[1]);
  for (let i = 0; i < n; i++) { const q = pts[(i + 1) % n]; m = mid(pts[i], q); ctx.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]); }
  ctx.closePath();
}
function bridge(ctx, [x1, y1, x2, y2], w, fill, outline) {
  ctx.save(); ctx.translate(x1, y1); ctx.rotate(Math.atan2(y2 - y1, x2 - x1));
  const len = Math.hypot(x2 - x1, y2 - y1);
  ctx.fillStyle = fill; ctx.fillRect(0, -w / 2, len, w);
  if (outline) {
    ctx.strokeStyle = 'rgba(91,70,54,0.45)'; ctx.lineWidth = 3;
    for (let x = 10; x < len; x += 22) { ctx.beginPath(); ctx.moveTo(x, -w / 2); ctx.lineTo(x, w / 2); ctx.stroke(); }
    ctx.strokeStyle = OUT; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, -w / 2); ctx.lineTo(len, -w / 2); ctx.moveTo(0, w / 2); ctx.lineTo(len, w / 2); ctx.stroke();
  }
  ctx.restore();
}

export function worldMap() {
  const { w, h } = WORLD;
  const cv = canvas(w, h), ctx = cv.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#B3DCF7'); g.addColorStop(1, '#8FC6EC');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  const r = rnd(42);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  for (let i = 0; i < 260; i++) { const x = r() * w, y = r() * h; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 12, y - 8, x + 24, y); ctx.quadraticCurveTo(x + 36, y + 8, x + 48, y); ctx.stroke(); }
  // shallow water rings, then bridges (under the islands), then land
  ISLANDS.forEach((I) => { blobPath(ctx, I, 60); ctx.fillStyle = '#C6E8F8'; ctx.fill(); });
  BRIDGES.forEach((b) => bridge(ctx, b, 74, C.wood, true));
  ISLANDS.forEach((I) => {
    ctx.save(); ctx.translate(0, 14); blobPath(ctx, I, 0); ctx.fillStyle = '#D9BE8A'; ctx.fill(); ctx.restore(); // cliff lip
    blobPath(ctx, I, 0); ctx.fillStyle = C.sand; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(91,70,54,0.5)'; ctx.stroke();
    if (I.ground !== C.sand) { blobPath(ctx, I, -46); ctx.fillStyle = I.ground; ctx.fill(); }
    else { const gi = { ...I, x: I.x - 90, y: I.y - 110, rx: 160, ry: 110 }; blobPath(ctx, gi, 0); ctx.fillStyle = C.grass; ctx.fill(); }
  });
  // texture: grass tufts and flowers
  ISLANDS.forEach((I) => {
    const rr2 = rnd(I.seed * 31);
    for (let i = 0; i < (I.id === 'meadow' ? 520 : 200); i++) {
      const a = rr2() * Math.PI * 2, d = Math.sqrt(rr2()) * 0.82;
      const x = I.x + Math.cos(a) * I.rx * d, y = I.y + Math.sin(a) * I.ry * d;
      if (I.id === 'beach' && Math.hypot((x - (I.x - 90)) / 160, (y - (I.y - 110)) / 110) > 1) {
        ctx.fillStyle = 'rgba(200,170,120,0.5)'; ctx.beginPath(); ctx.arc(x, y, 2.5, 0, 7); ctx.fill(); continue;
      }
      if (rr2() < 0.55) { ctx.strokeStyle = '#8FC58E'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.lineTo(x - 2, y - 10); ctx.moveTo(x + 2, y); ctx.lineTo(x + 5, y - 10); ctx.stroke(); }
      else { ctx.fillStyle = ['#FF9EB5', '#FFE08A', '#FFFDF8', '#CFC4F2'][Math.floor(rr2() * 4)]; for (let k = 0; k < 5; k++) { const b = k * 1.256; ctx.beginPath(); ctx.arc(x + Math.cos(b) * 4, y + Math.sin(b) * 4, 3.2, 0, 7); ctx.fill(); } ctx.fillStyle = '#FFC85A'; ctx.beginPath(); ctx.arc(x, y, 2.2, 0, 7); ctx.fill(); }
    }
  });
  // dirt paths
  ctx.strokeStyle = '#EFD9B0'; ctx.lineWidth = 46; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(900, 1760); ctx.quadraticCurveTo(980, 1560, 1100, 1420); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(900, 1760); ctx.quadraticCurveTo(800, 1900, 720, 2000); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(1180, 1240); ctx.quadraticCurveTo(1230, 1060, 1300, 960); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(640, 2290); ctx.quadraticCurveTo(520, 2440, 470, 2600); ctx.stroke();
  // home: little house
  house(ctx, 900, 1640);
  // meadow: picnic blanket, trees, tall grass
  ctx.save(); ctx.translate(1300, 900); ctx.rotate(-0.08); ctx.lineWidth = 5; ctx.strokeStyle = OUT;
  ctx.fillStyle = '#FFFDF8'; rr(ctx, -90, -50, 180, 100, 10); ctx.fill(); ctx.stroke();
  ctx.fillStyle = C.mint; for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2 === 0) ctx.fillRect(-90 + i * 30, -50 + j * 25, 30, 25);
  rr(ctx, -90, -50, 180, 100, 10); ctx.stroke(); ctx.restore();
  for (const [x, y, s] of [[1050, 700, 1.3], [1580, 760, 1.5], [1500, 1150, 1.2], [1120, 1100, 1]]) tree(ctx, x, y, s);
  // beach: palms, shells, a bottle, foam
  ISLANDS.filter((I) => I.id === 'beach').forEach((I) => { blobPath(ctx, I, 18); ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 8; ctx.setLineDash([30, 22]); ctx.stroke(); ctx.setLineDash([]); });
  for (const [x, y] of [[250, 2500], [700, 2720], [330, 2820]]) palm(ctx, x, y);
  for (const [x, y] of [[520, 2780], [380, 2700], [640, 2560], [300, 2620]]) shell(ctx, x, y);
  ctx.save(); ctx.translate(600, 2830); ctx.rotate(0.6); ctx.fillStyle = 'rgba(169,214,245,0.95)'; ctx.strokeStyle = OUT; ctx.lineWidth = 4; rr(ctx, -12, -28, 24, 44, 9); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#C9A27F'; ctx.fillRect(-6, -40, 12, 12); ctx.fillStyle = '#FFFDF8'; ctx.fillRect(-5, -14, 10, 16); ctx.restore();
  return cv;
}
function tree(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s * 2, s * 2); ctx.strokeStyle = OUT; ctx.lineWidth = 2.4;
  ctx.fillStyle = 'rgba(91,70,54,0.15)'; ctx.beginPath(); ctx.ellipse(0, 0, 18, 5, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#B98A66'; rr(ctx, -5, -30, 10, 30, 3); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#9ED19A'; ctx.beginPath(); ctx.arc(0, -44, 19, 0, 7); ctx.arc(-13, -36, 13, 0, 7); ctx.arc(13, -36, 13, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -44, 19, Math.PI * 0.9, Math.PI * 2.1); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.arc(-5, -50, 6, 0, 7); ctx.fill();
  ctx.restore();
}
function palm(ctx, x, y) {
  ctx.save(); ctx.translate(x, y); ctx.scale(2, 2); ctx.lineCap = 'round';
  ctx.strokeStyle = OUT; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(8, -30, 2, -56); ctx.stroke();
  ctx.strokeStyle = '#C9A27F'; ctx.lineWidth = 5.5; ctx.stroke();
  ctx.lineWidth = 2.2; ctx.strokeStyle = OUT; ctx.fillStyle = '#9ED19A';
  for (const a of [-2.6, -1.9, -1.2, -0.5, 0.2]) { ctx.save(); ctx.translate(2, -56); ctx.rotate(a); ctx.beginPath(); ctx.ellipse(16, 0, 17, 5.5, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore(); }
  ctx.restore();
}
function shell(ctx, x, y) {
  ctx.save(); ctx.translate(x, y); ctx.scale(2, 2); ctx.strokeStyle = OUT; ctx.lineWidth = 1.6; ctx.fillStyle = '#FFC8D0';
  ctx.beginPath(); ctx.moveTo(0, 5); ctx.arc(0, 0, 7, Math.PI * 1.05, Math.PI * 1.95); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
}
function house(ctx, x, y) {
  ctx.save(); ctx.translate(x, y); ctx.lineWidth = 5; ctx.strokeStyle = OUT; ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(91,70,54,0.15)'; ctx.beginPath(); ctx.ellipse(0, 4, 150, 16, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#E8B79A'; rr(ctx, 60, -210, 30, 60, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#F7D9BC'; rr(ctx, -120, -130, 240, 130, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#F0A38A'; ctx.beginPath(); ctx.moveTo(-142, -122); ctx.quadraticCurveTo(-70, -170, 0, -212); ctx.quadraticCurveTo(70, -170, 142, -122); ctx.closePath(); ctx.fill(); ctx.stroke();
  for (const wx of [-90, 50]) { ctx.fillStyle = C.sky; rr(ctx, wx, -100, 40, 34, 5); ctx.fill(); ctx.stroke(); }
  ctx.fillStyle = '#8FCB9B'; ctx.beginPath(); ctx.moveTo(-24, 0); ctx.lineTo(-24, -54); ctx.quadraticCurveTo(0, -84, 24, -54); ctx.lineTo(24, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#FFE08A'; ctx.beginPath(); ctx.arc(14, -26, 4, 0, 7); ctx.fill();
  ctx.restore();
}

/** Low-res mask (1 px = 8 world px) of where the cat may walk: islands + bridges. */
export function landMask() {
  const S = 8, cv = canvas(WORLD.w / S, WORLD.h / S), ctx = cv.getContext('2d');
  ctx.scale(1 / S, 1 / S); ctx.fillStyle = '#fff';
  ISLANDS.forEach((I) => { blobPath(ctx, I, -14); ctx.fill(); });
  BRIDGES.forEach((b) => bridge(ctx, b, 60, '#fff', false));
  const data = ctx.getImageData(0, 0, cv.width, cv.height).data;
  return (x, y) => {
    const mx = Math.floor(x / S), my = Math.floor(y / S);
    if (mx < 0 || my < 0 || mx >= cv.width || my >= cv.height) return false;
    return data[(my * cv.width + mx) * 4] > 128;
  };
}

// ------------------------------------------------------------------ Old Turtle & Cloud Sheep (300 × 300, feet at 150,260)
export function turtle(nod) {
  const cv = canvas(300, 300), ctx = cv.getContext('2d');
  ctx.translate(150, 262); ctx.scale(2.6, 2.6); ctx.strokeStyle = OUT; ctx.lineWidth = 2.4; ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(91,70,54,0.16)'; ctx.beginPath(); ctx.ellipse(0, 0, 40, 5, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#B9DDA0';
  for (const lx of [-26, 18]) { rr(ctx, lx, -12, 12, 12, 5); ctx.fill(); ctx.stroke(); }
  // head
  const hy = nod ? -14 : -22;
  ctx.beginPath(); ctx.ellipse(36, hy, 15, 13, nod ? 0.3 : -0.1, 0, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = OUT; ctx.beginPath(); ctx.arc(40, hy - 3, 2.2, 0, 7); ctx.fill();
  ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(38, hy + 4, 4, 0.2, Math.PI - 0.6); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(40, hy - 3, 5.5, 0, 7); ctx.fill(); ctx.stroke();  // tiny spectacles
  ctx.lineWidth = 2.4;
  // shell
  ctx.fillStyle = '#8FC08E'; ctx.beginPath(); ctx.moveTo(-36, -8); ctx.quadraticCurveTo(-34, -52, 0, -54); ctx.quadraticCurveTo(34, -52, 32, -8); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#F6E3B4'; rr(ctx, -38, -12, 72, 8, 4); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(91,70,54,0.5)'; ctx.lineWidth = 2;
  for (const [x, y] of [[-14, -34], [10, -34], [-2, -20], [-24, -20], [20, -20]]) { ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; ctx.lineTo(x + Math.cos(a) * 8, y + Math.sin(a) * 7); } ctx.closePath(); ctx.stroke(); }
  return cv;
}

export function sheep() {
  const cv = canvas(300, 300), ctx = cv.getContext('2d');
  ctx.translate(150, 250); ctx.scale(2.4, 2.4); ctx.strokeStyle = OUT; ctx.lineWidth = 2.4;
  ctx.fillStyle = 'rgba(91,70,54,0.12)'; ctx.beginPath(); ctx.ellipse(0, 4, 30, 4, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#6B6575'; for (const lx of [-16, -6, 8, 18]) { rr(ctx, lx, -14, 5, 14, 2); ctx.fill(); }
  const puffs = [[-22, -30, 14], [-8, -42, 16], [10, -40, 15], [24, -28, 13], [0, -24, 18]];
  ctx.beginPath(); for (const [x, y, r] of puffs) { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, 7); }
  ctx.strokeStyle = 'rgba(91,70,54,0.55)'; ctx.lineWidth = 4.4; ctx.stroke();   // outline first…
  ctx.fillStyle = '#FFFFFF'; ctx.fill();                                         // …then fill, so only the silhouette shows
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = OUT; ctx.fillStyle = '#8A8396'; ctx.beginPath(); ctx.ellipse(30, -36, 10, 12, 0.2, 0, 7); ctx.fill(); ctx.stroke();
  ctx.lineWidth = 1.6; ctx.strokeStyle = '#FFF6E9'; ctx.beginPath(); ctx.arc(28, -38, 2.4, 0.15 * Math.PI, 0.85 * Math.PI); ctx.arc(35, -38, 2.4, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  ctx.fillStyle = '#FF9DA7'; ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.arc(26, -31, 2.2, 0, 7); ctx.arc(37, -31, 2.2, 0, 7); ctx.fill();
  return cv;
}

// ------------------------------------------------------------------ small particles
export function particle(kind) {
  const cv = canvas(48, 48), ctx = cv.getContext('2d'); ctx.translate(24, 24); ctx.strokeStyle = OUT; ctx.lineWidth = 2;
  if (kind === 'heart') { ctx.scale(2.4, 2.4); ctx.fillStyle = '#FF8FAB'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 5); ctx.bezierCurveTo(-8, -1, -5, -8, 0, -4); ctx.bezierCurveTo(5, -8, 8, -1, 0, 5); ctx.fill(); ctx.stroke(); }
  if (kind === 'spark') { ctx.fillStyle = '#FFE08A'; ctx.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? 5 : 16, a = (i * Math.PI) / 4; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.fill(); }
  if (kind === 'paper') { ctx.fillStyle = '#FFFDF8'; ctx.fillRect(-5, -12, 10, 24); ctx.strokeRect(-5, -12, 10, 24); }
  if (kind === 'yarn') {
    ctx.lineWidth = 2.5; ctx.fillStyle = '#FF9EB5'; ctx.beginPath(); ctx.arc(0, 0, 19, 0, 7); ctx.fill(); ctx.stroke();
    ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(-3, 2, 12, 0.3, 2.6); ctx.stroke(); ctx.beginPath(); ctx.arc(4, -3, 10, 3.6, 5.6); ctx.stroke();
  }
  return cv;
}

export const CAT_KEYS = ['cat1', 'cat2', 'cat3', 'cat4', 'cat5', 'catListen', 'catEat', 'catHappy'];

/** Register every generated texture that wasn't already loaded from public/art. */
export function registerArt(scene, look = {}) {
  const tex = scene.textures;
  const add = (key, make) => { if (!tex.exists(key)) tex.addCanvas(key, make()); };
  CAT_KEYS.forEach((k) => add(k, () => catPose(k, look.coat, look.acc)));
  for (let i = 0; i < 4; i++) add('walk' + i, () => catWalkFrame(i, look.coat, look.acc));
  add('room', () => room(false));
  add('roomNight', () => room(true));
  add('map', () => worldMap());
  add('turtle', () => turtle(false));
  add('turtleNod', () => turtle(true));
  add('sheep', () => sheep());
  ['heart', 'spark', 'paper', 'yarn'].forEach((k) => add(k, () => particle(k)));
}

/** Redraw the cat textures (new coat or accessory). PNG overrides are left alone. */
export function redrawCat(scene, look, pngKeys) {
  const tex = scene.textures;
  const redo = (key, make) => {
    if (pngKeys.has(key)) return;
    if (tex.exists(key)) tex.remove(key);
    tex.addCanvas(key, make());
  };
  CAT_KEYS.forEach((k) => redo(k, () => catPose(k, look.coat, look.acc)));
  for (let i = 0; i < 4; i++) redo('walk' + i, () => catWalkFrame(i, look.coat, look.acc));
}

export { mix };
