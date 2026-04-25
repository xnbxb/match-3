/**
 * SidePanel.js
 * ------------
 * Draws and updates the right-side character/scene panel inside Phaser.
 *
 * Layout (within a 540px wide right panel on a 900x640 canvas):
 *   - Portrait area    : top section, filled with stage color (placeholder for real image)
 *   - Name / location  : text below portrait
 *   - Bio              : small text
 *   - Divider
 *   - Progress meter   : bar showing advance toward next stage
 *   - Stage label      : e.g. "Stage 2 / 4"
 *   - Dialogue box     : rounded rect + animated text at bottom
 *
 * All x/y values use PANEL_* constants — change those to reposition everything.
 */

// Panel layout constants — adjust these to reposition the entire panel.
export const PANEL_X = 370;         // left edge of the panel (pixels from canvas left)
export const PANEL_WIDTH = 520;     // total panel width
export const PANEL_HEIGHT = 640;    // matches canvas height
export const PANEL_PAD = 20;        // internal padding

const PORTRAIT_HEIGHT = 300;
const NAME_Y = PORTRAIT_HEIGHT + 18;
const BIO_Y = NAME_Y + 28;
const DIVIDER_Y = BIO_Y + 46;
const PROGRESS_Y = DIVIDER_Y + 18;
const PROGRESS_BAR_HEIGHT = 12;
const STAGE_LABEL_Y = PROGRESS_Y + PROGRESS_BAR_HEIGHT + 10;
const DIALOGUE_Y = STAGE_LABEL_Y + 32;
const DIALOGUE_HEIGHT = 110;

// Palette
const COLOR_PANEL_BG     = 0x1a1a2e;
const COLOR_PORTRAIT_BG  = 0x2a2a4a;
const COLOR_DIVIDER      = 0x333355;
const COLOR_PROGRESS_BG  = 0x2a2a4a;
const COLOR_PROGRESS_FILL= 0xc96f84;
const COLOR_DIALOGUE_BG  = 0x12122a;
const COLOR_TEXT_PRIMARY = '#e8e8f0';
const COLOR_TEXT_MUTED   = '#9090b0';
const COLOR_TEXT_ACCENT  = '#c96f84';

export default class SidePanel {
  /**
   * @param {Phaser.Scene} scene
   * @param {object} sceneData       Initial scene data from mock-scenes.
   * @param {SceneProgressManager} progressManager
   */
  constructor(scene, sceneData, progressManager) {
    this.scene = scene;
    this.sceneData = sceneData;
    this.progressManager = progressManager;

    this._buildPanel();
    this.refresh();
  }

  // ---- Public API ----

  /** Show a new dialogue line with a simple fade-in. */
  showDialogue(text) {
    this._dialogueText.setText(`"${text}"`);
    this._dialogueText.setAlpha(0);
    this.scene.tweens.add({
      targets: this._dialogueText,
      alpha: 1,
      duration: 400,
      ease: 'Sine.easeIn'
    });
  }

  /** Redraw the portrait color and progress bar for the current stage. */
  refresh() {
    const stageData = this.progressManager.getCurrentStageData();
    const progress  = this.progressManager.getProgressToNextStage();
    const stageIdx  = this.progressManager.currentStage;
    const totalStages = this.progressManager.totalStages;

    // Update portrait placeholder color
    const colorInt = parseInt(stageData.color.replace('#', ''), 16);
    this._portraitBg.clear();
    this._portraitBg.fillStyle(colorInt, 1);
    this._portraitBg.fillRoundedRect(
      PANEL_X + PANEL_PAD, PANEL_PAD,
      PANEL_WIDTH - PANEL_PAD * 2, PORTRAIT_HEIGHT,
      8
    );

    // Update stage label
    this._stageLabel.setText(
      `${stageData.label}  ·  ${stageIdx + 1} / ${totalStages}`
    );

    // Update progress bar fill
    const maxBarW = PANEL_WIDTH - PANEL_PAD * 2;
    this._progressFill.clear();
    this._progressFill.fillStyle(COLOR_PROGRESS_FILL, 1);
    this._progressFill.fillRoundedRect(
      PANEL_X + PANEL_PAD, PROGRESS_Y,
      Math.max(4, maxBarW * progress), PROGRESS_BAR_HEIGHT,
      4
    );
  }

  /** Update displayed scene (name, bio, portrait) without resetting layout. */
  loadScene(newSceneData) {
    this.sceneData = newSceneData;
    this._nameText.setText(`${newSceneData.name}  ·  ${newSceneData.location}`);
    this._bioText.setText(newSceneData.bio);
    this.refresh();
  }

  // ---- Private builders ----

  _buildPanel() {
    const s = this.scene;
    const px = PANEL_X;
    const pw = PANEL_WIDTH;
    const ph = PANEL_HEIGHT;
    const pad = PANEL_PAD;

    // Panel background
    const bg = s.add.graphics();
    bg.fillStyle(COLOR_PANEL_BG, 1);
    bg.fillRect(px, 0, pw, ph);

    // Thin left-edge accent line
    const accent = s.add.graphics();
    accent.fillStyle(COLOR_PROGRESS_FILL, 0.6);
    accent.fillRect(px, 0, 2, ph);

    // Portrait placeholder (graphics, refreshed each update)
    this._portraitBg = s.add.graphics();

    // Portrait overlay gradient hint (static)
    const portraitOverlay = s.add.graphics();
    portraitOverlay.fillStyle(0x000000, 0.25);
    portraitOverlay.fillRoundedRect(px + pad, pad, pw - pad * 2, PORTRAIT_HEIGHT, 8);

    // Stage indicator dots across portrait bottom
    this._stageDots = [];
    const dotCount = this.progressManager.totalStages;
    const dotSpacing = 18;
    const dotsStartX = px + pw / 2 - ((dotCount - 1) * dotSpacing) / 2;
    for (let i = 0; i < dotCount; i++) {
      const dot = s.add.graphics();
      dot.fillStyle(0xffffff, i === 0 ? 1 : 0.3);
      dot.fillCircle(dotsStartX + i * dotSpacing, PORTRAIT_HEIGHT - 14, 5);
      this._stageDots.push(dot);
    }

    // Name text
    this._nameText = s.add.text(
      px + pad, NAME_Y,
      `${this.sceneData.name}  ·  ${this.sceneData.location}`,
      { fontFamily: 'Georgia, serif', fontSize: '18px', color: COLOR_TEXT_PRIMARY, fontStyle: 'bold' }
    );

    // Bio text
    this._bioText = s.add.text(
      px + pad, BIO_Y,
      this.sceneData.bio,
      {
        fontFamily: 'Arial, sans-serif', fontSize: '12px',
        color: COLOR_TEXT_MUTED,
        wordWrap: { width: pw - pad * 2 }
      }
    );

    // Divider
    const divider = s.add.graphics();
    divider.fillStyle(COLOR_DIVIDER, 1);
    divider.fillRect(px + pad, DIVIDER_Y, pw - pad * 2, 1);

    // Progress bar background
    const progressBg = s.add.graphics();
    progressBg.fillStyle(COLOR_PROGRESS_BG, 1);
    progressBg.fillRoundedRect(px + pad, PROGRESS_Y, pw - pad * 2, PROGRESS_BAR_HEIGHT, 4);

    // Progress bar fill (refreshed)
    this._progressFill = s.add.graphics();

    // Stage label
    this._stageLabel = s.add.text(
      px + pad, STAGE_LABEL_Y,
      '',
      { fontFamily: 'Arial, sans-serif', fontSize: '11px', color: COLOR_TEXT_ACCENT }
    );

    // Dialogue box background
    const dialogBg = s.add.graphics();
    dialogBg.fillStyle(COLOR_DIALOGUE_BG, 1);
    dialogBg.fillRoundedRect(px + pad, DIALOGUE_Y, pw - pad * 2, DIALOGUE_HEIGHT, 8);
    dialogBg.lineStyle(1, COLOR_DIVIDER, 1);
    dialogBg.strokeRoundedRect(px + pad, DIALOGUE_Y, pw - pad * 2, DIALOGUE_HEIGHT, 8);

    // Dialogue label
    s.add.text(
      px + pad + 10, DIALOGUE_Y + 10,
      'SHE SAYS',
      { fontFamily: 'Arial, sans-serif', fontSize: '9px', color: COLOR_TEXT_ACCENT,
        letterSpacing: 2 }
    );

    // Dialogue text
    this._dialogueText = s.add.text(
      px + pad + 10, DIALOGUE_Y + 28,
      '',
      {
        fontFamily: 'Georgia, serif', fontSize: '13px',
        color: COLOR_TEXT_PRIMARY,
        fontStyle: 'italic',
        wordWrap: { width: pw - pad * 2 - 20 },
        lineSpacing: 4
      }
    );
  }

  /** Refresh stage dots to show which stages are unlocked. */
  refreshStageDots() {
    const current = this.progressManager.currentStage;
    this._stageDots.forEach((dot, i) => {
      dot.clear();
      dot.fillStyle(0xffffff, i <= current ? 1 : 0.3);
      const dotCount = this.progressManager.totalStages;
      const dotSpacing = 18;
      const dotsStartX = PANEL_X + PANEL_WIDTH / 2 - ((dotCount - 1) * dotSpacing) / 2;
      dot.fillCircle(dotsStartX + i * dotSpacing, PORTRAIT_HEIGHT - 14, 5);
    });
  }
}
