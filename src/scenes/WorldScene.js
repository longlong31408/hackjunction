import Phaser from 'phaser';
import { WORLD, ISLANDS, BRIDGES, landMask } from '../art/textures.js';
import { isNight } from '../ui/time.js';

export const PLACES = {
  beach: { x: 400, y: 2600, label: 'Bottle Beach', island: 'beach' },
  meadow: { x: 1300, y: 900, label: 'Sleepy Meadow', island: 'meadow' },
  home: { x: 900, y: 1760, label: 'Home', island: 'home' },
};
const SPEED = 4;            // ms per pixel (as in the guide)
const IDLE_SCALE = 0.62;    // cat3 (400 px) at the same size as the walk frames (200 px)

// Which island is a point on (nearest by ellipse distance)?
function islandAt(x, y) {
  let best = null, bd = Infinity;
  for (const I of ISLANDS) { const d = Math.hypot((x - I.x) / I.rx, (y - I.y) / I.ry); if (d < bd) { bd = d; best = I.id; } }
  return best;
}
// Waypoints on each side of a bridge: every route between islands goes via the home island.
function bridgeTo(id) {
  const b = BRIDGES.find((br) => islandAt(br[2], br[3]) === id);
  const at = (f) => ({ x: b[0] + (b[2] - b[0]) * f, y: b[1] + (b[3] - b[1]) * f });
  return { homeSide: at(0.3), farSide: at(0.72) };
}

export default class WorldScene extends Phaser.Scene {
  constructor() { super('World'); }

  create() {
    this.isLand = landMask();
    this.add.image(0, 0, 'map').setOrigin(0);
    this.cameras.main.setBounds(0, 0, WORLD.w, WORLD.h);

    for (const p of Object.values(PLACES)) {
      this.add.text(p.x, p.y - 150, p.label, {
        fontFamily: 'Nunito, sans-serif', fontSize: '34px', fontStyle: '800', color: '#5B4636',
        backgroundColor: '#FFFDF8', padding: { x: 14, y: 6 },
      }).setOrigin(0.5).setAlpha(0.92);
    }
    this.turtle = this.add.image(PLACES.beach.x + 200, PLACES.beach.y - 20, 'turtle').setOrigin(0.5, 262 / 300).setInteractive({ useHandCursor: true });
    this.sheep = this.add.image(1470, 800, 'sheep').setOrigin(0.5, 250 / 300).setInteractive({ useHandCursor: true });
    this.turtle.on('pointerdown', (p, x, y, ev) => { ev.stopPropagation(); this.visitNpc('turtle'); });
    this.sheep.on('pointerdown', (p, x, y, ev) => { ev.stopPropagation(); this.visitNpc('sheep'); });
    if (!this.reduceMotion()) {
      this.tweens.add({ targets: this.sheep, y: this.sheep.y - 14, yoyo: true, repeat: -1, duration: 2200, ease: 'Sine.inOut' });
    }

    this.cat = this.add.sprite(PLACES.home.x, PLACES.home.y, 'cat3').setScale(IDLE_SCALE).setOrigin(0.5, 0.85);
    this.cameras.main.startFollow(this.cat, true, 0.08, 0.08);

    // Little moments while standing still: grooming, slow blinks, looking around.
    this.time.addEvent({ delay: 9000, loop: true, callback: () => {
      const c = this.cat;
      if (!this.scene.isActive() || this.tweens.isTweening(c) || c.anims.isPlaying || this.reduceMotion()) return;
      const key = ['catGroom', 'catBlink', 'catLookUp', 'catStretch'][Math.floor(Math.random() * 4)];
      c.setTexture(key);
      this.time.delayedCall(1800, () => { if (!this.tweens.isTweening(c) && !c.anims.isPlaying) c.setTexture('cat3'); });
    } });
    this.nightRect = this.add.rectangle(0, 0, 720, 1280, 0x2a2660, 1).setAlpha(0).setOrigin(0).setScrollFactor(0).setDepth(20);
    this.dimRect = this.add.rectangle(0, 0, 720, 1280, 0xffb070, 1).setAlpha(0).setOrigin(0).setScrollFactor(0).setDepth(21);
    this.time.addEvent({ delay: 60000, loop: true, callback: () => this.refreshTime() });
    this.refreshTime();

    // Tap anywhere → cat walks there
    this.input.on('pointerdown', (p) => { if (!this.couch) this.walkTo(p.worldX, p.worldY); else this.setCouch(false); });
    this.couch = false;
  }

  refreshTime() { this.nightRect.setAlpha(isNight() ? 0.32 : 0); }
  reduceMotion() { return document.documentElement.classList.contains('reduce'); }

  /** Route from the cat to (x, y): straight on one island, otherwise over the bridges. */
  route(x, y) {
    // Never walk into the sea: stop at the last land point on the way.
    if (!this.isLand(x, y)) {
      const from = { x: this.cat.x, y: this.cat.y };
      let last = from;
      for (let k = 1; k <= 60; k++) { const px = from.x + (x - from.x) * (k / 60), py = from.y + (y - from.y) * (k / 60); if (!this.isLand(px, py)) break; last = { x: px, y: py }; }
      if (last === from) return [];
      ({ x, y } = last);
    }
    const a = islandAt(this.cat.x, this.cat.y), b = islandAt(x, y);
    const pts = [];
    if (a !== b) {
      if (a !== 'home') { const br = bridgeTo(a); pts.push(br.farSide, br.homeSide); }
      if (b !== 'home') { const br = bridgeTo(b); pts.push(br.homeSide, br.farSide); }
    }
    pts.push({ x, y });
    return pts;
  }

  walkTo(x, y, onArrive) {
    const pts = this.route(x, y);
    this.tweens.killTweensOf(this.cat);
    if (!pts.length) return;
    this.cat.setScale(1).setOrigin(0.5, 0.88);
    if (!this.reduceMotion()) this.cat.play('walk'); else this.cat.setTexture('walk0');
    const step = (i) => {
      if (i >= pts.length) {
        this.cat.stop(); this.cat.setTexture('cat3').setScale(IDLE_SCALE).setOrigin(0.5, 0.85);
        onArrive?.();
        return;
      }
      const p = pts[i];
      this.cat.setFlipX(p.x < this.cat.x);
      const dist = Phaser.Math.Distance.Between(this.cat.x, this.cat.y, p.x, p.y);
      this.tweens.add({ targets: this.cat, x: p.x, y: p.y, duration: Math.max(60, dist * SPEED), ease: i === pts.length - 1 ? 'Sine.out' : 'Linear', onComplete: () => step(i + 1) });
    };
    step(0);
  }

  // "Follow me" — the cat leads, the camera follows
  leadTo(placeKey, onArrive) {
    const p = PLACES[placeKey];
    this.walkTo(p.x - 40, p.y + 60, () => { this.game.events.emit('arrived', placeKey); onArrive?.(); });
  }

  visitNpc(who) {
    const npc = who === 'turtle' ? this.turtle : this.sheep;
    this.walkTo(npc.x - 190, npc.y + 30, () => {
      this.cat.setFlipX(false);
      if (who === 'turtle' && !this.reduceMotion()) {
        this.turtle.setTexture('turtleNod');
        this.time.delayedCall(700, () => this.turtle.setTexture('turtle'));
      }
      this.game.events.emit('npc', who);
    });
  }

  /** Couch mode: the cat wanders by itself, like a calm screensaver. */
  setCouch(on) {
    this.couch = on;
    this.game.events.emit('couch', on);
    if (!on) return;
    const wander = () => {
      if (!this.couch) return;
      const keys = Object.keys(PLACES);
      const p = PLACES[keys[Math.floor(Math.random() * keys.length)]];
      const I = ISLANDS.find((i) => i.id === p.island);
      const x = I.x + (Math.random() - 0.5) * I.rx, y = I.y + (Math.random() - 0.5) * I.ry;
      this.walkTo(x, y, () => this.time.delayedCall(2500 + Math.random() * 3000, wander));
    };
    wander();
  }

  goHomeInstantly() {
    this.tweens.killTweensOf(this.cat);
    this.cat.stop(); this.cat.setTexture('cat3').setScale(IDLE_SCALE).setOrigin(0.5, 0.85).setPosition(PLACES.home.x, PLACES.home.y);
  }

  dim(on) { this.tweens.add({ targets: this.dimRect, alpha: on ? 0.28 : 0, duration: 600 }); }
}
