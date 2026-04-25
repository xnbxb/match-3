/**
 * lobby.js
 * --------
 * Pre-game lobby screen.
 * Shows a folder-picker button so the player can load their gallery.
 * Also provides a "Play with mock data" fallback for quick testing.
 *
 * On success it stores the loaded scenes array on the global `window.__gallery`
 * and transitions to Game.
 *
 * NOTE: Camera.setAlpha tweening is unreliable in Phaser 3.16.
 * We instead fade a full-screen rectangle from opaque → transparent to
 * simulate an entrance fade.
 */
import { pickAndLoadGallery } from '@/data/GalleryLoader';
import { MOCK_SCENES }        from '@/data/mock-scenes';

export default class Lobby extends Phaser.Scene {
  constructor() {
    super({ key: 'Lobby' });
  }

  create() {
    const W  = this.scale.width;
    const H  = this.scale.height;
    const cx = W / 2;

    // ── Background ──────────────────────────────────────────────────────────
    this.add.rectangle(0, 0, W, H, 0x0d0d1a).setOrigin(0);

    // Subtle grid lines for depth
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x1a1a3a, 0.5);
    for (var x = 0; x < W; x += 60) { grid.lineBetween(x, 0, x, H); }
    for (var y = 0; y < H; y += 60) { grid.lineBetween(0, y, W, y); }

    // ── Title ───────────────────────────────────────────────────────────────
    this.add.text(cx, 120, 'MATCH \u25c6 REVEAL', {
      fontFamily:      'Georgia, serif',
      fontSize:        '38px',
      color:           '#e8e8f0',
      fontStyle:       'bold',
      stroke:          '#c96f84',
      strokeThickness: 1
    }).setOrigin(0.5);

    this.add.text(cx, 168, 'Choose a gallery folder to begin', {
      fontFamily: 'Arial, sans-serif',
      fontSize:   '14px',
      color:      '#9090b0'
    }).setOrigin(0.5);

    // ── Buttons ─────────────────────────────────────────────────────────────
    this._makePrimaryButton(cx, 280, '\u25b6  Choose Folder', () => {
      this._setStatus('Reading folder\u2026');
      pickAndLoadGallery().then((scenes) => {
        if (scenes.length === 0) {
          this._setStatus('No valid scenes found. Try another folder.');
          return;
        }
        window.__gallery = scenes;
        this.scene.start('Game');
      });
    });

    this._makeSecondaryButton(cx, 360, 'Play with demo data', () => {
      window.__gallery = MOCK_SCENES;
      this.scene.start('Game');
    });

    // ── Status line ─────────────────────────────────────────────────────────
    this._statusText = this.add.text(cx, 440, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize:   '12px',
      color:      '#c96f84'
    }).setOrigin(0.5);

    // ── Footer ──────────────────────────────────────────────────────────────
    this.add.text(cx, H - 30,
      'Chrome only \u00b7 Files never leave your computer',
      { fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#444466' }
    ).setOrigin(0.5);

    // ── Entrance fade ───────────────────────────────────────────────────────
    // Draw an opaque overlay on top of everything, then tween its alpha to 0.
    // This is the safe cross-version way to do a scene fade-in in Phaser 3.
    var fadeRect = this.add.rectangle(0, 0, W, H, 0x0d0d1a, 1).setOrigin(0);
    this.tweens.add({
      targets:  fadeRect,
      alpha:    0,
      duration: 600,
      ease:     'Sine.easeOut',
      onComplete: function() { fadeRect.setVisible(false); }
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  _setStatus(msg) {
    if (this._statusText) { this._statusText.setText(msg); }
  }

  _makePrimaryButton(x, y, label, onClick) {
    var BW = 280;
    var BH = 54;
    var bg  = this.add.graphics();

    var drawBtn = (over) => {
      bg.clear();
      bg.fillStyle(over ? 0xd97f94 : 0xc96f84, 1);
      bg.fillRoundedRect(x - BW / 2, y - BH / 2, BW, BH, 10);
    };
    drawBtn(false);

    var txt = this.add.text(x, y, label, {
      fontFamily: 'Arial, sans-serif',
      fontSize:   '16px',
      color:      '#ffffff',
      fontStyle:  'bold'
    }).setOrigin(0.5);

    var zone = this.add.zone(x, y, BW, BH).setInteractive({ cursor: 'pointer' });
    zone.on('pointerover',  () => { drawBtn(true);  txt.setColor('#ffffff'); });
    zone.on('pointerout',   () => { drawBtn(false); txt.setColor('#ffffff'); });
    zone.on('pointerup',    () => onClick());
  }

  _makeSecondaryButton(x, y, label, onClick) {
    var BW = 220;
    var BH = 38;
    var bg  = this.add.graphics();

    var drawBtn = (over) => {
      bg.clear();
      bg.lineStyle(1, over ? 0x9090b0 : 0x444466, 1);
      bg.strokeRoundedRect(x - BW / 2, y - BH / 2, BW, BH, 8);
    };
    drawBtn(false);

    var txt = this.add.text(x, y, label, {
      fontFamily: 'Arial, sans-serif',
      fontSize:   '13px',
      color:      '#9090b0'
    }).setOrigin(0.5);

    var zone = this.add.zone(x, y, BW, BH).setInteractive({ cursor: 'pointer' });
    zone.on('pointerover',  () => { drawBtn(true);  txt.setColor('#c0c0d0'); });
    zone.on('pointerout',   () => { drawBtn(false); txt.setColor('#9090b0'); });
    zone.on('pointerup',    () => onClick());
  }
}
