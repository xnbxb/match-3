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
 * All layout constants are at the top — change them to reposition everything.
 */

export const PANEL_X      = 370;
export const PANEL_WIDTH  = 520;
export const PANEL_HEIGHT = 640;
export const PANEL_PAD    = 20;

const PORTRAIT_HEIGHT     = 300;
const NAME_Y              = PORTRAIT_HEIGHT + 18;
const BIO_Y               = NAME_Y + 28;
const DIVIDER_Y           = BIO_Y + 46;
const PROGRESS_Y          = DIVIDER_Y + 18;
const PROGRESS_BAR_HEIGHT = 12;
const STAGE_LABEL_Y       = PROGRESS_Y + PROGRESS_BAR_HEIGHT + 10;
const DIALOGUE_Y          = STAGE_LABEL_Y + 32;
const DIALOGUE_HEIGHT     = 110;

const COLOR_PANEL_BG      = 0x1a1a2e;
const COLOR_DIVIDER       = 0x333355;
const COLOR_PROGRESS_BG   = 0x2a2a4a;
const COLOR_PROGRESS_FILL = 0xc96f84;
const COLOR_DIALOGUE_BG   = 0x12122a;
const COLOR_TEXT_PRIMARY  = '#e8e8f0';
const COLOR_TEXT_MUTED    = '#9090b0';
const COLOR_TEXT_ACCENT   = '#c96f84';

export default class SidePanel {
  /**
   * @param {Phaser.Scene}           scene
   * @param {object}                 sceneData
   * @param {SceneProgressManager}   progressManager
   */
  constructor(scene, sceneData, progressManager) {
    this.scene           = scene;
    this.sceneData       = sceneData;
    this.progressManager = progressManager;
    this._portraitImage  = null;  // currently displayed Phaser Image, if any

    this._buildPanel();
    this._buildPanelEntrance();
    this.refresh();
  }

  // ── Public API ────────────────────────────────────────────────────────────

  showDialogue(text) {
    this._dialogueText.setText(`"${text}"`);
    this._dialogueText.setAlpha(0);
    this.scene.tweens.add({
      targets:  this._dialogueText,
      alpha:    1,
      duration: 400,
      ease:     'Sine.easeIn'
    });
  }

  refresh() {
    const stageData   = this.progressManager.getCurrentStageData();
    const progress    = this.progressManager.getProgressToNextStage();
    const stageIdx    = this.progressManager.currentStage;
    const totalStages = this.progressManager.totalStages;

    this._refreshPortrait(stageData);

    this._stageLabel.setText(
      `${stageData.label}  ·  ${stageIdx + 1} / ${totalStages}`
    );

    const maxBarW = PANEL_WIDTH - PANEL_PAD * 2;
    this._progressFill.clear();
    this._progressFill.fillStyle(COLOR_PROGRESS_FILL, 1);
    this._progressFill.fillRoundedRect(
      PANEL_X + PANEL_PAD, PROGRESS_Y,
      Math.max(4, maxBarW * progress), PROGRESS_BAR_HEIGHT, 4
    );
  }

  loadScene(newSceneData) {
    this.sceneData = newSceneData;
    this._nameText.setText(`${newSceneData.name}  ·  ${newSceneData.location}`);
    this._bioText.setText(newSceneData.bio);
    this.refresh();
  }

  refreshStageDots() {
    const current    = this.progressManager.currentStage;
    const dotCount   = this.progressManager.totalStages;
    const dotSpacing = 18;
    const dotsStartX = PANEL_X + PANEL_WIDTH / 2 - ((dotCount - 1) * dotSpacing) / 2;
    this._stageDots.forEach((dot, i) => {
      dot.clear();
      dot.fillStyle(0xffffff, i <= current ? 1 : 0.3);
      dot.fillCircle(dotsStartX + i * dotSpacing, PORTRAIT_HEIGHT - 14, 5);
    });
  }

  // ── Private ───────────────────────────────────────────────────────────────

  _refreshPortrait(stageData) {
    const px = PANEL_X + PANEL_PAD;
    const py = PANEL_PAD;
    const pw = PANEL_WIDTH - PANEL_PAD * 2;
    const ph = PORTRAIT_HEIGHT;

    if (stageData.objectURL) {
      const textureKey = `portrait_${this.progressManager.currentStage}_${this.sceneData.id}`;

      const applyImage = () => {
        if (this._portraitImage) {
          this._portraitImage.destroy();
          this._portraitImage = null;
        }
        this._portraitBg.clear();

        const img = this.scene.add.image(px + pw / 2, py + ph / 2, textureKey);
        const scaleX = pw / img.width;
        const scaleY = ph / img.height;
        img.setScale(Math.max(scaleX, scaleY));

        // Rounded rectangle mask so image respects border-radius
        const maskShape = this.scene.make.graphics({ add: false });
        maskShape.fillStyle(0xffffff);
        maskShape.fillRoundedRect(px, py, pw, ph, 8);
        img.setMask(maskShape.createGeometryMask());

        img.setAlpha(0);
        this.scene.tweens.add({ targets: img, alpha: 1, duration: 500, ease: 'Sine.easeIn' });
        this._portraitImage = img;
      };

      if (this.scene.textures.exists(textureKey)) {
        applyImage();
      } else {
        this.scene.load.image(textureKey, stageData.objectURL);
        this.scene.load.once('complete', applyImage);
        this.scene.load.start();
      }

    } else {
      // Fallback: coloured rectangle (mock data)
      if (this._portraitImage) {
        this._portraitImage.destroy();
        this._portraitImage = null;
      }
      const colorInt = parseInt((stageData.color || '#2a2a4a').replace('#', ''), 16);
      this._portraitBg.clear();
      this._portraitBg.fillStyle(colorInt, 1);
      this._portraitBg.fillRoundedRect(px, py, pw, ph, 8);
    }
  }

  _buildPanelEntrance() {
    const targets = [this._nameText, this._bioText, this._stageLabel, this._dialogueText];
    targets.forEach(t => t.setAlpha(0));
    this.scene.tweens.add({
      targets:  targets,
      alpha:    1,
      duration: 700,
      delay:    this.scene.tweens.stagger(80),
      ease:     'Sine.easeOut'
    });
  }

  _buildPanel() {
    const s   = this.scene;
    const px  = PANEL_X;
    const pw  = PANEL_WIDTH;
    const ph  = PANEL_HEIGHT;
    const pad = PANEL_PAD;

    // Panel background
    s.add.graphics().fillStyle(COLOR_PANEL_BG, 1).fillRect(px, 0, pw, ph);

    // Left-edge accent stripe
    s.add.graphics().fillStyle(COLOR_PROGRESS_FILL, 0.6).fillRect(px, 0, 2, ph);

    // Portrait placeholder (graphics; replaced by real image when available)
    this._portraitBg = s.add.graphics();

    // Portrait vignette overlay (static dark tint on top of image)
    s.add.graphics()
      .fillStyle(0x000000, 0.18)
      .fillRoundedRect(px + pad, pad, pw - pad * 2, PORTRAIT_HEIGHT, 8);

    // Stage dots
    this._stageDots  = [];
    const dotCount   = this.progressManager.totalStages;
    const dotSpacing = 18;
    const dotsStartX = px + pw / 2 - ((dotCount - 1) * dotSpacing) / 2;
    for (let i = 0; i < dotCount; i++) {
      const dot = s.add.graphics();
      dot.fillStyle(0xffffff, i === 0 ? 1 : 0.3);
      dot.fillCircle(dotsStartX + i * dotSpacing, PORTRAIT_HEIGHT - 14, 5);
      this._stageDots.push(dot);
    }

    // Name
    this._nameText = s.add.text(
      px + pad, NAME_Y,
      `${this.sceneData.name}  ·  ${this.sceneData.location}`,
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

    // Progress bar fill (redrawn on refresh)
    this._progressFill = s.add.graphics();

    // Stage label
    this._stageLabel = s.add.text(
      px + pad, STAGE_LABEL_Y, '',
      { fontFamily: 'Arial, sans-serif', fontSize: '11px', color: COLOR_TEXT_ACCENT }
    );

    // Dialogue box
    s.add.graphics()
      .fillStyle(COLOR_DIALOGUE_BG, 1)
      .fillRoundedRect(px + pad, DIALOGUE_Y, pw - pad * 2, DIALOGUE_HEIGHT, 8)
      .lineStyle(1, COLOR_DIVIDER, 1)
      .strokeRoundedRect(px + pad, DIALOGUE_Y, pw - pad * 2, DIALOGUE_HEIGHT, 8);

    s.add.text(px + pad + 10, DIALOGUE_Y + 10, 'SHE SAYS', {
      fontFamily:    'Arial, sans-serif',
      fontSize:      '9px',
      color:         COLOR_TEXT_ACCENT,
      letterSpacing: 2
    });

    this._dialogueText = s.add.text(
      px + pad + 10, DIALOGUE_Y + 28, '',
      { fontFamily: 'Georgia, serif', fontSize: '13px', color: COLOR_TEXT_PRIMARY,
        fontStyle: 'italic', wordWrap: { width: pw - pad * 2 - 20 }, lineSpacing: 4 }
    );
  }
}
