import Phaser from 'phaser';
import { isNight } from '../ui/time.js';

const CAT = { x: 360, y: 950 };          // feet on the rug

export default class HomeScene extends Phaser.Scene {
  constructor() { super('Home'); }

  create() {
    this.energy = 3; this.override = null;
    this.bg = this.add.image(360, 640, isNight() ? 'roomNight' : 'room');
    this.cat = this.add.image(CAT.x, CAT.y, 'cat3').setOrigin(0.5, 0.85).setInteractive({ useHandCursor: true });
    this.cat.on('pointerdown', () => { this.burst('heart', 4); this.game.events.emit('catTapped'); });

    this.zzz = this.add.particles(0, 0, 'heart', { emitting: false });   // reused emitter for hearts / sparks
    this.dimRect = this.add.rectangle(360, 640, 720, 1280, 0xffb070, 0).setDepth(10);
    this.nightRect = this.add.rectangle(360, 640, 720, 1280, 0x3b3570, 0).setDepth(9);

    this.idle();
    this.time.addEvent({ delay: 60000, loop: true, callback: () => this.refreshTime() });
    this.refreshTime();
    this.game.events.emit('homeReady');
  }

  refreshTime() {
    const night = isNight();
    this.bg.setTexture(night ? 'roomNight' : 'room');
    this.nightRect.setAlpha(night ? 0.12 : 0);
  }

  /** The cat mirrors the user's energy (1 asleep in a box … 5 zoomies). */
  setEnergy(e) {
    this.energy = e;
    if (this.cat && !this.override) this.idle();
  }

  /** Temporary pose: 'listen' | 'eat' | 'happy' | null (back to the energy look). */
  setPose(pose) {
    this.override = pose;
    if (this.cat) this.idle();
  }

  idle() {
    const cat = this.cat;
    if (!cat) return;
    this.tweens.killTweensOf(cat);
    cat.setPosition(CAT.x, CAT.y).setScale(1).setAngle(0).setFlipX(false);
    const key = this.override ? { listen: 'catListen', eat: 'catEat', happy: 'catHappy', rest: 'cat1' }[this.override] : 'cat' + this.energy;
    cat.setTexture(key);
    if (this.reduceMotion()) return;
    // breathing idle (slower when sleepy)
    this.tweens.add({ targets: cat, scaleY: 0.97, yoyo: true, repeat: -1, duration: this.energy <= 2 && !this.override ? 1800 : 1200, ease: 'Sine.inOut' });
    if (this.override) return;
    if (this.energy === 5) {
      this.tweens.add({ targets: cat, x: { from: 170, to: 550 }, yoyo: true, repeat: -1, duration: 1400, ease: 'Sine.inOut',
        onYoyo: () => cat.setFlipX(true), onRepeat: () => cat.setFlipX(false) });
    } else if (this.energy === 4) {
      this.tweens.add({ targets: cat, angle: { from: -3, to: 3 }, yoyo: true, repeat: -1, duration: 500, ease: 'Sine.inOut' });
    }
  }

  /** Small reaction animations named in the dialogue CSV ("anim" column). */
  play(anim) {
    if (!this.cat || !anim || this.reduceMotion() || this.energy === 5) return;
    const cat = this.cat;
    const done = () => this.idle();
    const t = { targets: cat, yoyo: true, duration: 220, onComplete: done };
    switch (anim) {
      case 'perk': this.tweens.add({ ...t, y: CAT.y - 40, ease: 'Quad.out' }); break;
      case 'zoom': this.tweens.add({ ...t, x: CAT.x + 120, duration: 300, repeat: 1 }); break;
      case 'tilt': this.tweens.add({ ...t, angle: 8, duration: 400 }); break;
      case 'wiggle': this.tweens.add({ ...t, angle: 6, duration: 90, repeat: 3 }); break;
      case 'lean': this.tweens.add({ ...t, scale: 1.08, duration: 600, hold: 600 }); break;
      case 'curl': this.tweens.add({ ...t, scaleY: 0.9, duration: 700, hold: 400 }); break;
      case 'purr': this.tweens.add({ ...t, x: CAT.x + 2, duration: 40, repeat: 8 }); this.burst('heart', 2); break;
      case 'nod': this.tweens.add({ ...t, y: CAT.y + 8, duration: 200, repeat: 1 }); break;
      default: break;
    }
  }

  burst(key, n) {
    if (this.reduceMotion()) return;
    const em = this.add.particles(this.cat.x, this.cat.y - 260, key, {
      speed: { min: 60, max: 160 }, angle: { min: 230, max: 310 }, lifespan: 1100, scale: { start: 1, end: 0.4 },
      alpha: { start: 1, end: 0 }, gravityY: key === 'paper' ? 300 : -40, emitting: false,
    });
    em.explode(n);
    this.time.delayedCall(1500, () => em.destroy());
  }

  /** Worry-eating: a paper ball flies into the cat's mouth, crunch, gone. */
  eatWorry(onDone) {
    this.setPose('eat');
    const paper = this.add.image(140, 640, 'paper').setScale(2.2);
    this.tweens.add({
      targets: paper, x: this.cat.x + 50, y: this.cat.y - 150, angle: 360, scale: 0.6, duration: this.reduceMotion() ? 10 : 900, ease: 'Quad.in',
      onComplete: () => {
        paper.destroy(); this.burst('paper', 8);
        this.time.delayedCall(700, () => { this.setPose('happy'); this.burst('heart', 4); });
        this.time.delayedCall(2200, () => { this.setPose(null); onDone?.(); });
      },
    });
  }

  /** Help mode: scene dims to warm lantern light (never red, never alarming). */
  dim(on) { this.tweens.add({ targets: this.dimRect, alpha: on ? 0.28 : 0, duration: 600 }); }

  reduceMotion() { return document.documentElement.classList.contains('reduce'); }
}
