import Phaser from 'phaser';
import { isNight } from '../ui/time.js';

const RUG = { x: 360, y: 950 };            // the cat's usual spot, feet on the rug
const CLOSE = { x: 360, y: 1000 };         // "comfort" spot: closer to you
// Places the cat wanders to (feet positions, all above the speech bubble on phones)
const SPOTS = {
  window: { x: 360, y: 905, then: 'lookup' },
  books: { x: 215, y: 915, then: 'groom' },
  lamp: { x: 560, y: 915, then: 'blink' },
  basket: { x: 560, y: 985, then: 'pounce' },
  rugLeft: { x: 250, y: 965, then: 'stretch' },
};
const WALK_SCALE = 1.615;                  // walk frames (s 2.6) drawn at the size of the poses (s 4.2)
const POSE_TEXTURE = { listen: 'catListen', eat: 'catEat', happy: 'catHappy', rest: 'cat1', stretch: 'catStretch', groom: 'catGroom', blink: 'catBlink', lookup: 'catLookUp', back: 'catBack', crouch: 'catCrouch' };

export default class HomeScene extends Phaser.Scene {
  constructor() { super('Home'); }

  create() {
    this.energy = 3; this.override = null; this.spot = { ...RUG };
    this.busy = false;                     // a behaviour (walk / pose sequence) is running
    this.comfortUntil = 0;                 // after something heavy: stay close and soft
    this.attentiveUntil = 0;               // while talking: stay put and listen
    this.nextLife = this.time.now + 6000;

    this.bg = this.add.image(360, 640, isNight() ? 'roomNight' : 'room');
    this.cat = this.add.sprite(RUG.x, RUG.y, 'cat3').setOrigin(0.5, 0.85).setInteractive({ useHandCursor: true });
    this.cat.on('pointerdown', () => { if (!this.playing) this.petReaction(); this.game.events.emit('catTapped'); });

    this.dimRect = this.add.rectangle(360, 640, 720, 1280, 0xffb070, 1).setAlpha(0).setDepth(10);
    this.nightRect = this.add.rectangle(360, 640, 720, 1280, 0x3b3570, 1).setAlpha(0).setDepth(9);

    this.game.events.on('heard', () => { this.attentiveUntil = this.time.now + 60000; this.interrupt(); });
    this.game.events.on('comfort', () => this.comfort());
    this.time.addEvent({ delay: 1000, loop: true, callback: () => this.life() });
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
    if (this.cat && !this.override && !this.busy) this.idle();
  }

  /** Temporary pose: 'listen' | 'eat' | 'happy' | 'rest' | 'stretch' | … | null (back to the energy look). */
  setPose(pose) {
    this.override = pose;
    if (!this.cat) return;
    this.interrupt();
    this.idle();
  }

  idle() {
    const cat = this.cat;
    if (!cat || this.playing) return;
    this.tweens.killTweensOf(cat);
    cat.stop();
    const comforting = this.time.now < this.comfortUntil && !this.override;
    const at = comforting ? CLOSE : this.spot;
    cat.setPosition(at.x, at.y).setScale(comforting ? 1.12 : 1).setAngle(0).setFlipX(false).setOrigin(0.5, 0.85);
    const key = this.override ? (POSE_TEXTURE[this.override] || 'cat3') : comforting ? 'catKnead0' : 'cat' + this.energy;
    cat.setTexture(key);
    if (this.reduceMotion()) return;
    // breathing idle (slower when sleepy)
    this.tweens.add({ targets: cat, scaleY: cat.scaleY * 0.97, yoyo: true, repeat: -1, duration: this.energy <= 2 && !this.override ? 1800 : 1200, ease: 'Sine.inOut' });
    if (this.override || comforting) return;
    if (this.energy === 5) {
      this.tweens.add({ targets: cat, x: { from: 170, to: 550 }, yoyo: true, repeat: -1, duration: 1400, ease: 'Sine.inOut',
        onYoyo: () => cat.setFlipX(true), onRepeat: () => cat.setFlipX(false) });
    } else if (this.energy === 4) {
      this.tweens.add({ targets: cat, angle: { from: -3, to: 3 }, yoyo: true, repeat: -1, duration: 500, ease: 'Sine.inOut' });
    }
  }

  // ---------------------------------------------------------------- the cat's own life
  life() {
    if (!this.cat || this.playing || this.busy || this.override || this.dimRect.alpha > 0.05) return;
    if (!this.scene.isActive() || this.time.now < this.nextLife) return;
    this.nextLife = this.time.now + Phaser.Math.Between(7000, 13000);
    const now = this.time.now;
    if (now < this.comfortUntil) return this.run(this.pick(['knead', 'knead', 'blink', 'purr']));
    if (now < this.attentiveUntil) return this.run(this.pick(['blink', 'perk', 'blink']));   // listening: stay put
    const byEnergy = {
      1: ['dream', 'dream', 'twitch'],
      2: ['knead', 'groom', 'blink', 'twitch'],
      3: ['window', 'books', 'lamp', 'groom', 'blink', 'stretch', 'rugLeft'],
      4: ['basket', 'back', 'window', 'stretch', 'pounce', 'rugLeft'],
      5: ['pounce', 'back'],
    }[this.energy] || ['blink'];
    this.run(this.pick(byEnergy));
  }

  pick(list) { return list[Math.floor(Math.random() * list.length)]; }

  /** Stop whatever the cat is doing (e.g. the person started talking). */
  interrupt() {
    if (!this.busy || !this.cat) return;
    this.busy = false;
    this.lifeTimers?.forEach((t) => t.remove());
    this.lifeTimers = [];
    this.spot = { ...RUG };
    this.idle();
  }

  after(ms, fn) { const t = this.time.delayedCall(ms, () => { if (this.busy) fn(); }); (this.lifeTimers = this.lifeTimers || []).push(t); }
  done() { this.busy = false; this.idle(); }

  /** Show a pose for a moment, then go back to idle. */
  flash(key, ms) {
    this.tweens.killTweensOf(this.cat);
    this.cat.stop(); this.cat.setTexture(key);
    this.after(ms, () => this.done());
  }

  run(name) {
    const reduce = this.reduceMotion();
    if (reduce && !['blink', 'groom', 'knead', 'dream', 'purr', 'perk'].includes(name)) name = 'blink';
    this.busy = true;
    const cat = this.cat;
    switch (name) {
      case 'blink': return this.flash('catBlink', 1300);                       // a slow blink means "I trust you"
      case 'perk': return this.flash('catListen', 2200);
      case 'groom': return this.flash('catGroom', 2600);
      case 'stretch': return this.flash('catStretch', 2200);
      case 'back': this.burst('heart', 2); return this.flash('catBack', 2800);
      case 'purr': this.burst('heart', 2); this.game.events.emit('purr'); return this.flash('catBlink', 1600);
      case 'knead': {
        this.tweens.killTweensOf(cat); cat.stop();
        for (let i = 0; i < 8; i++) this.after(i * 350, () => cat.setTexture(i % 2 ? 'catKnead1' : 'catKnead0'));
        return this.after(8 * 350, () => this.done());
      }
      case 'dream':
        this.burst('heart', 1);
        return this.after(1500, () => this.done());
      case 'twitch':
        this.tweens.add({ targets: cat, angle: 2, yoyo: true, repeat: 2, duration: 90 });
        return this.after(800, () => this.done());
      case 'pounce': {
        this.tweens.killTweensOf(cat); cat.stop(); cat.setTexture('catCrouch');
        this.tweens.add({ targets: cat, angle: { from: -2, to: 2 }, yoyo: true, repeat: 3, duration: 120 });   // bottom wiggle
        this.after(1000, () => {
          cat.setTexture('cat4').setAngle(0);
          this.tweens.add({ targets: cat, y: cat.y - 90, x: cat.x + 60 * (cat.flipX ? -1 : 1), yoyo: true, duration: 260, ease: 'Quad.out' });
        });
        return this.after(2000, () => this.done());
      }
      default: {
        const spot = SPOTS[name];
        if (!spot) return this.done();
        this.walkTo(spot.x, spot.y, () => {
          this.spot = { x: spot.x, y: spot.y };
          if (spot.then === 'lookup') { cat.setTexture('catLookUp'); this.after(3200, () => this.walkBack()); }
          else if (spot.then === 'pounce') { cat.setTexture('catCrouch'); this.after(900, () => { cat.setTexture('cat4'); this.burst('heart', 1); this.after(1600, () => this.walkBack()); }); }
          else { cat.setTexture(POSE_TEXTURE[spot.then] || 'cat3'); this.after(2600, () => this.walkBack()); }
        });
      }
    }
  }

  walkTo(x, y, onArrive) {
    const cat = this.cat;
    this.tweens.killTweensOf(cat);
    const dist = Math.hypot(x - cat.x, y - cat.y);
    if (dist < 8) { onArrive(); return; }
    cat.setFlipX(x < cat.x).setScale(WALK_SCALE).setOrigin(0.5, 176 / 200).play('walk');
    this.tweens.add({
      targets: cat, x, y, duration: Math.max(300, dist * 5), ease: 'Sine.inOut',
      onComplete: () => { if (!this.busy && !this.playing) return; cat.stop(); cat.setScale(1).setOrigin(0.5, 0.85); onArrive(); },
    });
  }
  walkBack() { this.walkTo(RUG.x, RUG.y, () => { this.spot = { ...RUG }; this.done(); }); }

  /** After something heavy: come close, knead, slow-blink, purr. No silly antics for a while. */
  comfort() {
    this.comfortUntil = this.time.now + 3 * 60 * 1000;
    this.nextLife = this.time.now + 4000;
    this.interrupt();
    if (!this.override && !this.playing) this.idle();
  }

  /** Petting gets different reactions, so it never feels the same twice. */
  petReaction() {
    if (this.override || this.busy || this.energy <= 1) return;
    this.busy = true;
    const r = Math.random();
    if (this.time.now < this.comfortUntil || r < 0.35) { this.burst('heart', 3); return this.flash('catBlink', 1500); }
    if (r < 0.6) { this.burst('heart', 4); return this.flash('catHappy', 1500); }
    if (r < 0.8 && this.energy >= 3) { this.burst('heart', 3); return this.flash('catBack', 2000); }
    // head-bump: lean in toward you
    this.tweens.killTweensOf(this.cat);
    this.cat.setTexture('catHappy');
    this.tweens.add({ targets: this.cat, scale: 1.12, yoyo: true, duration: 250 });
    this.burst('heart', 2);
    this.after(800, () => this.done());
  }

  /** Small reaction animations named in the dialogue CSV ("anim" column). */
  play(anim) {
    if (!this.cat || !anim || this.reduceMotion() || this.energy === 5 || this.busy || this.playing) return;
    const cat = this.cat;
    const base = { x: cat.x, y: cat.y, s: cat.scaleX };
    const done = () => this.idle();
    const t = { targets: cat, yoyo: true, duration: 220, onComplete: done };
    switch (anim) {
      case 'perk': this.tweens.add({ ...t, y: base.y - 40, ease: 'Quad.out' }); break;
      case 'zoom': this.tweens.add({ ...t, x: base.x + 120, duration: 300, repeat: 1 }); break;
      case 'tilt': this.tweens.add({ ...t, angle: 8, duration: 400 }); break;
      case 'wiggle': this.tweens.add({ ...t, angle: 6, duration: 90, repeat: 3 }); break;
      case 'lean': this.tweens.add({ ...t, scale: base.s * 1.08, duration: 600, hold: 600 }); break;
      case 'curl': this.tweens.add({ ...t, scaleY: base.s * 0.9, duration: 700, hold: 400 }); break;
      case 'purr': this.tweens.add({ ...t, x: base.x + 2, duration: 40, repeat: 8 }); this.burst('heart', 2); break;
      case 'nod': this.tweens.add({ ...t, y: base.y + 8, duration: 200, repeat: 1 }); break;
      default: break;
    }
  }

  burst(key, n) {
    if (this.reduceMotion() || !this.cat) return;
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

  // ---------------------------------------------------------------- play: tap the floor, the cat chases the yarn
  startPlay(onEnd) {
    this.interrupt();
    this.playing = true;
    this.tweens.killTweensOf(this.cat);
    this.yarn = this.add.image(500, 975, 'yarn').setScale(1.2);
    this.cat.setTexture('catHappy').setScale(1).setAngle(0).setPosition(RUG.x, RUG.y).setOrigin(0.5, 0.85);
    this.playTap = (p) => this.throwYarn(p.worldX, p.worldY);
    this.input.on('pointerdown', this.playTap);
    this.playEnd = this.time.delayedCall(60000, () => onEnd?.());
  }

  throwYarn(x, y) {
    if (!this.playing) return;
    x = Phaser.Math.Clamp(x, 110, 610); y = Phaser.Math.Clamp(y, 915, 1010);
    const fast = this.reduceMotion() ? 0 : 1;
    this.tweens.killTweensOf(this.yarn);
    this.tweens.add({ targets: this.yarn, x, y, angle: this.yarn.angle + 540, duration: 500 * fast + 1, ease: 'Quad.out' });
    const dir = x < this.cat.x ? -1 : 1;
    const tx = x - dir * 70;
    const dist = Math.abs(tx - this.cat.x) + Math.abs(y - this.cat.y);
    this.tweens.killTweensOf(this.cat);
    this.cat.setFlipX(dir < 0).setScale(WALK_SCALE).setOrigin(0.5, 176 / 200);
    if (fast) this.cat.play('walk'); else this.cat.setTexture('walk0');
    this.tweens.add({
      targets: this.cat, x: tx, y, duration: Math.max(200, dist * 2.2 * fast), ease: 'Sine.inOut',
      onComplete: () => {
        if (!this.playing) return;
        this.cat.stop(); this.cat.setTexture('cat4').setScale(1).setOrigin(0.5, 0.85);   // pounce!
        this.burst('heart', 2);
        this.game.events.emit('catPlayed');
      },
    });
  }

  stopPlay() {
    if (!this.playing) return;
    this.playing = false;
    this.input.off('pointerdown', this.playTap);
    this.playEnd?.remove();
    this.yarn?.destroy(); this.yarn = null;
    this.cat.setFlipX(false);
    this.spot = { ...RUG };
    this.idle();
  }

  /** Help mode: scene dims to warm lantern light (never red, never alarming). */
  dim(on) { this.tweens.add({ targets: this.dimRect, alpha: on ? 0.28 : 0, duration: 600 }); }

  reduceMotion() { return document.documentElement.classList.contains('reduce'); }
}
