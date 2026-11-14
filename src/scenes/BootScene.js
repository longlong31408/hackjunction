import Phaser from 'phaser';
import { registerArt } from '../art/textures.js';

// Loads any drawn PNGs listed in public/art/manifest.json, then generates the rest in code.
export default class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    this.load.setBaseURL(import.meta.env.BASE_URL);
    this.load.json('artManifest', 'art/manifest.json');
  }

  create() {
    const manifest = this.cache.json.get('artManifest') || {};
    const pngKeys = new Set(Object.keys(manifest));
    this.registry.set('pngKeys', pngKeys);
    const finish = () => {
      registerArt(this, this.registry.get('look') || {});
      this.anims.create({ key: 'walk', frames: [0, 1, 2, 3].map((i) => ({ key: 'walk' + i })), frameRate: 8, repeat: -1 });
      this.scene.launch('World');
      this.scene.sleep('World');
      this.scene.start('Home');
      this.game.events.emit('booted');
    };
    if (!pngKeys.size) return finish();
    for (const [key, file] of Object.entries(manifest)) this.load.image(key, 'art/' + file);
    this.load.once('complete', finish);
    this.load.start();
  }
}
