import './style.css';
import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import HomeScene from './scenes/HomeScene.js';
import WorldScene from './scenes/WorldScene.js';

export const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#FFF6E9',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: 720, height: 1280 },
  scene: [BootScene, HomeScene, WorldScene],
});

// Temporary scene switcher until the HUD is wired (next step).
window.mochiGame = game;
