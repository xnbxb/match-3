/**
 * SidePanel.js
 * ------------
 * Right-side character/scene panel.
 *
 * PORTRAIT RENDERING
 *   - If the current stage has an `objectURL` (real image from GalleryLoader),
 *     a Phaser Image is displayed and crossfaded on stage advance.
 *   - If only a `color` exists (mock data), falls back to a coloured rectangle.
 *
 * Layout constants are at the top — change them to reposition everything.
 */

var PANEL_X      = 370;
var PANEL_WIDTH  = 520;
var PANEL_HEIGHT = 640;
var PANEL_PAD    = 20;

var PORTRAIT_HEIGHT     = 300;
var NAME_Y              = PORTRAIT_HEIGHT + 18;
var BIO_Y               = NAME_Y + 28;
var DIVIDER_Y           = BIO_Y + 46;
var PROGRESS_Y          = DIVIDER_Y + 18;
var PROGRESS_BAR_HEIGHT = 12;
var STAGE_LABEL_Y       = PROGRESS_Y + PROGRESS_BAR_HEIGHT + 10;
var DIALOGUE_Y          = STAGE_LABEL_Y + 32;
var DIALOGUE_HEIGHT     = 110;

var COLOR_PANEL_BG      = 0x1a1a2e;
var COLOR_DIVIDER       = 0x333355;
var COLOR_PROGRESS_BG   = 0x2a2a4a;
var COLOR_PROGRESS_FILL = 0xc96f84;
var COLOR_DIALOGUE_BG   = 0x12122a;
var COLOR_TEXT_PRIMARY  = '#e8e8f0';
var COLOR_TEXT_MUTED    = '#9090b0';
var COLOR_TEXT_ACCENT   = '#c96f84';

export var PANEL_X_EXPORT      = PANEL_X;
export var PANEL_WIDTH_EXPORT  = PANEL_WIDTH;
export var PANEL_HEIGHT_EXPORT = PANEL_HEIGHT;
export var PANEL_PAD_EXPORT    = PANEL_PAD;

export default class SidePanel {
  constructor(scene, sceneData, progressManager) {
    this.scene           = scene;
    this.sceneData       = sceneData;
    this.progressManager = progressManager;
    this._portraitImage  = null;

    this._buildPanel();
    this._buildPanelEntrance();
    this.refresh();
  }

  // ── Public API ────────────────────────────────────────────────────────────

  showDialogue(text) {
    this._dialogueText.setText('"' + text + '"');
    this._dialogueText.setAlpha(0);
    this.scene.tweens.add({
      targets:  this._dialogueText,
      alpha:    1,
      duration: 400,
      ease:     'Sine.easeIn'
    });
  }

  refresh() {
    var stageData   = this.progressManager.getCurrentStageData();
    var progress    = this.progressManager.getProgressToNextStage();
    var stageIdx    = this.progressManager.currentStage;
    var totalStages = this.progressManager.totalStages;

    this._refreshPortrait(stageData);

    this._stageLabel.setText(
      stageData.label + '  \u00b7  ' + (stageIdx + 1) + ' / ' + totalStages
    );

    var maxBarW = PANEL_WIDTH - PANEL_PAD * 2;
    this._progressFill.clear();
    this._progressFill.fillStyle(COLOR_PROGRESS_FILL, 1);
    this._progressFill.fillRoundedRect(
      PANEL_X + PANEL_PAD, PROGRESS_Y,
      Math.max(4, maxBarW * progress), PROGRESS_BAR_HEIGHT, 4
    );
  }

  loadScene(newSceneData) {
    this.sceneData = newSceneData;
    this._nameText.setText(newSceneData.name + '  \u00b7  ' + newSceneData.location);
    this._bioText.setText(newSceneData.bio);
    this.refresh();
  }

  refreshStageDots() {
    var current    = this.progressManager.currentStage;
    var dotCount   = this.progressManager.totalStages;
    var dotSpacing = 18;
    var dotsStartX = PANEL_X + PANEL_WIDTH / 2 - ((dotCount - 1) * dotSpacing) / 2;
    for (var i = 0; i < this._stageDots.length; i++) {
      var dot = this._stageDots[i];
      dot.clear();
      dot.fillStyle(0xffffff, i <= current ? 1 : 0.3);
      dot.fillCircle(dotsStartX + i * dotSpacing, PORTRAIT_HEIGHT - 14, 5);
    }
  }

  // ── Private ───────────────────────────────────────────────────────────────

  _refreshPortrait(stageData) {
    var px = PANEL_X + PANEL_PAD;
    var py = PANEL_PAD;
    var pw = PANEL_WIDTH - PANEL_PAD * 2;
    var ph = PORTRAIT_HEIGHT;

    if (stageData.objectURL) {
      var textureKey = 'portrait_' + this.progressManager.currentStage + '_' + this.sceneData.id;
      var self = this;

      var applyImage = function() {
        if (self._portraitImage) {
          self._portraitImage.destroy();
          self._portraitImage = null;
        }
        self._portraitBg.clear();

        var img    = self.scene.add.image(px + pw / 2, py + ph / 2, textureKey);
        var scaleX = pw / img.width;
        var scaleY = ph / img.height;
        img.setScale(Math.max(scaleX, scaleY));

        var maskShape = self.scene.make.graphics({ add: false });
        maskShape.fillStyle(0xffffff);
        maskShape.fillRoundedRect(px, py, pw, ph, 8);
        img.setMask(maskShape.createGeometryMask());

        img.setAlpha(0);
        self.scene.tweens.add({ targets: img, alpha: 1, duration: 500, ease: 'Sine.easeIn' });
        self._portraitImage = img;
      };

      if (this.scene.textures.exists(textureKey)) {
        applyImage();
      } else {
        this.scene.load.image(textureKey, stageData.objectURL);
        this.scene.load.once('complete', applyImage);
        this.scene.load.start();
      }

    } else {
      if (this._portraitImage) {
        this._portraitImage.destroy();
        this._portraitImage = null;
      }
      var colorInt = parseInt((stageData.color || '#2a2a4a').replace('#', ''), 16);
      this._portraitBg.clear();
      this._portraitBg.fillStyle(colorInt, 1);
      this._portraitBg.fillRoundedRect(px, py, pw, ph, 8);
    }
  }

  _buildPanelEntrance() {
    // tweens.stagger() was added after Phaser 3.16 — use manual delays instead.
    var targets  = [this._nameText, this._bioText, this._stageLabel, this._dialogueText];
    var scene    = this.scene;
    for (var i = 0; i < targets.length; i++) {
      targets[i].setAlpha(0);
      scene.tweens.add({
        targets:  targets[i],
        alpha:    1,
        duration: 700,
        delay:    i * 80,
        ease:     'Sine.easeOut'
      });
    }
  }

  _buildPanel() {
    var s   = this.scene;
    var px  = PANEL_X;
    var pw  = PANEL_WIDTH;
    var ph  = PANEL_HEIGHT;
    var pad = PANEL_PAD;

    // Panel background
    s.add.graphics().fillStyle(COLOR_PANEL_BG, 1).fillRect(px, 0, pw, ph);

    // Left-edge accent stripe
    s.add.graphics().fillStyle(COLOR_PROGRESS_FILL, 0.6).fillRect(px, 0, 2, ph);

    // Portrait area (graphics object; replaced by real image when objectURL exists)
    this._portraitBg = s.add.graphics();

    // Portrait vignette overlay
    s.add.graphics()
      .fillStyle(0x000000, 0.18)
      .fillRoundedRect(px + pad, pad, pw - pad * 2, PORTRAIT_HEIGHT, 8);

    // Stage dots
    this._stageDots  = [];
    var dotCount     = this.progressManager.totalStages;
    var dotSpacing   = 18;
    var dotsStartX   = px + pw / 2 - ((dotCount - 1) * dotSpacing) / 2;
    for (var i = 0; i < dotCount; i++) {
      var dot = s.add.graphics();
      dot.fillStyle(0xffffff, i === 0 ? 1 : 0.3);
      dot.fillCircle(dotsStartX + i * dotSpacing, PORTRAIT_HEIGHT - 14, 5);
      this._stageDots.push(dot);
    }

    // Name
    this._nameText = s.add.text(
      px + pad, NAME_Y,
      this.sceneData.name + '  \u00b7  ' + this.sceneData.location,
      { fontFamily: 'Georgia, serif', fontSize: '18px', color: COLOR_TEXT_PRIMARY, fontStyle: 'bold' }
    );

    // Bio
    this._bioText = s.add.text(
      px + pad, BIO_Y,
      this.sceneData.bio,
      { fontFamily: 'Arial, sans-serif', fontSize: '12px', color: COLOR_TEXT_MUTED,
        wordWrap: { width: pw - pad * 2 } }
    );

    // Divider
    s.add.graphics().fillStyle(COLOR_DIVIDER, 1).fillRect(px + pad, DIVIDER_Y, pw - pad * 2, 1);

    // Progress bar background
    s.add.graphics().fillStyle(COLOR_PROGRESS_BG, 1)
      .fillRoundedRect(px + pad, PROGRESS_Y, pw - pad * 2, PROGRESS_BAR_HEIGHT, 4);

    // Progress bar fill (redrawn on every refresh())
    this._progressFill = s.add.graphics();

    // Stage label
    this._stageLabel = s.add.text(
      px + pad, STAGE_LABEL_Y, '',
      { fontFamily: 'Arial, sans-serif', fontSize: '11px', color: COLOR_TEXT_ACCENT }
    );

    // Dialogue box background
    s.add.graphics()
      .fillStyle(COLOR_DIALOGUE_BG, 1)
      .fillRoundedRect(px + pad, DIALOGUE_Y, pw - pad * 2, DIALOGUE_HEIGHT, 8)
      .lineStyle(1, COLOR_DIVIDER, 1)
      .strokeRoundedRect(px + pad, DIALOGUE_Y, pw - pad * 2, DIALOGUE_HEIGHT, 8);

    // "SHE SAYS" label
    s.add.text(px + pad + 10, DIALOGUE_Y + 10, 'SHE SAYS', {
      fontFamily:    'Arial, sans-serif',
      fontSize:      '9px',
      color:         COLOR_TEXT_ACCENT,
      letterSpacing: 2
    });

    // Dialogue text
    this._dialogueText = s.add.text(
      px + pad + 10, DIALOGUE_Y + 28, '',
      { fontFamily: 'Georgia, serif', fontSize: '13px', color: COLOR_TEXT_PRIMARY,
        fontStyle: 'italic', wordWrap: { width: pw - pad * 2 - 20 }, lineSpacing: 4 }
    );
  }
}
