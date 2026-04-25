import Board from '@/objects/board';
import Block from '@/objects/block';
import { MOCK_SCENES } from '@/data/mock-scenes';
import SceneProgressManager, { MATCHES_PER_STAGE } from '@/managers/SceneProgressManager';
import DialogueManager from '@/managers/DialogueManager';
import SidePanel from '@/ui/SidePanel';

export default class Game extends Phaser.Scene {
  constructor() {
    super({ key: 'Game' });
  }

  create() {
    // Use gallery loaded in Lobby, or fall back to first mock scene.
    const gallery   = window.__gallery || MOCK_SCENES;
    const sceneData = gallery[0];

    // ── Board constants (unchanged) ──────────────────────────────────────────
    this.NUM_ROWS       = 8;
    this.NUM_COLS       = 8;
    this.NUM_VARIATIONS = 6;
    this.BLOCK_SIZE     = 35;
    this.ANIMATION_TIME = 300;

    // Background
    this.background = this.add.sprite(0, 0, 'background').setOrigin(0);

    // Board (logic unchanged)
    this.board    = new Board(this, this.NUM_ROWS, this.NUM_COLS, this.NUM_VARIATIONS);
    this.blocks   = this.add.group();
    this.graphics = this.make.graphics();
    this.drawBoard();

    // ── New systems ──────────────────────────────────────────────────────────
    this.progressManager = new SceneProgressManager(
      sceneData,
      (stageIdx) => this._onStageAdvance(stageIdx),
      ()         => this._onSceneComplete()
    );
    this.dialogueManager = new DialogueManager(sceneData);
    this.sidePanel       = new SidePanel(this, sceneData, this.progressManager);

    // ── Score display ────────────────────────────────────────────────────────
    this.score      = 0;
    this._scoreText = this.add.text(36, 16, 'SCORE  0', {
      fontFamily: 'Arial, sans-serif',
      fontSize:   '14px',
      color:      '#9090b0'
    });
    this._hintText = this.add.text(36, 36,
      `Next stage: 0 / ${MATCHES_PER_STAGE} tiles`, {
        fontFamily: 'Arial, sans-serif',
        fontSize:   '11px',
        color:      '#666688'
      }
    );

    // Pool for floating score pop-ups
    this._popupGroup = this.add.group();

    // Opening dialogue
    this.time.delayedCall(600, () => {
      this.sidePanel.showDialogue(this.dialogueManager.getOpeningLine());
    });
  }

  // ── Board drawing (unchanged) ─────────────────────────────────────────────

  drawBoard() {
    this.graphics.fillStyle(0x000, 0.2);
    this.graphics.fillRect(0, 0, this.BLOCK_SIZE + 4, this.BLOCK_SIZE + 4);
    this.graphics.generateTexture('cell', this.BLOCK_SIZE + 6, this.BLOCK_SIZE + 6);

    for (let i = 0; i < this.NUM_ROWS; i++) {
      for (let j = 0; j < this.NUM_COLS; j++) {
        const x = 36 + j * (this.BLOCK_SIZE + 6);
        const y = 150 + i * (this.BLOCK_SIZE + 6);
        this.add.image(x, y, 'cell');
        this.createBlock(x, y, { asset: 'block' + this.board.grid[i][j], row: i, col: j });
      }
    }
  }

  createBlock(x, y, data) {
    let block = this.blocks.getFirstDead(false, x, y);
    if (block == null) {
      block = new Block(this, x, y, data);
      this.blocks.add(block, true);
    } else {
      block.reset(x, y, data);
    }
    this.children.bringToTop(block);
    block.setActive(true);
    block.setVisible(true);
    return block;
  }

  getBlockFromColRow(block) {
    return this.blocks.getChildren().find(
      item => item.row == block.row && item.col == block.col
    );
  }

  dropBlock(sourceRow, targetRow, col) {
    const block   = this.getBlockFromColRow({ row: sourceRow, col: col });
    const targetY = 150 + targetRow * (this.BLOCK_SIZE + 6);
    block.row = targetRow;
    this.children.bringToTop(block);
    this.tweens.add({ targets: block, y: targetY, duration: this.ANIMATION_TIME, ease: 'Linear' });
  }

  dropReserveBlock(sourceRow, targetRow, col) {
    const x = 36 + col * (this.BLOCK_SIZE + 6);
    const y = -(this.BLOCK_SIZE + 6) * this.board.RESERVE_ROW + sourceRow * (this.BLOCK_SIZE + 6);
    const block = this.createBlock(x, y, {
      asset: 'block' + this.board.grid[targetRow][col],
      row:   targetRow,
      col:   col
    });
    const targetY = 150 + targetRow * (this.BLOCK_SIZE + 6);
    this.tweens.add({ targets: block, y: targetY, duration: this.ANIMATION_TIME, ease: 'Linear' });
  }

  swapBlocks(block1, block2) {
    this.tweens.add({
      targets:  block1,
      x:        block2.x,
      y:        block2.y,
      duration: this.ANIMATION_TIME,
      ease:     'Linear',
      onComplete: () => {
        this.children.bringToTop(block1);
        this.board.swap(block1, block2);
        if (!this.isReversingSwap) {
          const chains = this.board.findAllChains();
          if (chains.length > 0) {
            this.updateBoard();
          } else {
            this.isReversingSwap = true;
            this.swapBlocks(block1, block2);
          }
        } else {
          this.isReversingSwap = false;
          this.clearSelection();
        }
      }
    });
    this.tweens.add({
      targets:  block2,
      x:        block1.x,
      y:        block1.y,
      duration: this.ANIMATION_TIME,
      ease:     'Linear',
      onComplete: () => { this.children.bringToTop(block2); }
    });
  }

  pickBlock(block) {
    if (this.isBoardBlocked) return;
    if (!this.selectedBlock) {
      block.setScale(1.5);
      this.selectedBlock = block;
    } else {
      this.targetBlock = block;
      if (this.board.checkAdjacent(this.selectedBlock, this.targetBlock)) {
        this.isBoardBlocked = true;
        this.swapBlocks(this.selectedBlock, this.targetBlock);
      } else {
        this.clearSelection();
      }
    }
  }

  clearSelection() {
    this.isBoardBlocked = false;
    if (this.selectedBlock) this.selectedBlock.setScale(1);
    this.selectedBlock = null;
    this.targetBlock   = null;
  }

  updateBoard() {
    const chains       = this.board.findAllChains();
    const tilesCleared = chains.length;

    this._flashClearedTiles(chains);

    this.board.clearChains();
    this.board.updateGrid();

    const gained   = tilesCleared * 10;
    this.score    += gained;
    this._scoreText.setText(`SCORE  ${this.score}`);
    if (tilesCleared > 0) this._spawnScorePopup(gained);

    this.progressManager.recordMatches(tilesCleared);
    const filled = this.progressManager.totalMatchCount % MATCHES_PER_STAGE;
    this._hintText.setText(`Next stage: ${filled} / ${MATCHES_PER_STAGE} tiles`);
    this.sidePanel.refresh();

    this.time.delayedCall(this.ANIMATION_TIME, () => {
      const newChains = this.board.findAllChains();
      if (newChains.length > 0) {
        this.updateBoard();
      } else {
        this.clearSelection();
      }
    });
  }

  // ── Visual polish ─────────────────────────────────────────────────────────

  _flashClearedTiles(chains) {
    chains.forEach(({ row, col }) => {
      const block = this.getBlockFromColRow({ row, col });
      if (!block) return;
      this.tweens.add({
        targets:  block,
        scaleX:   1.3,
        scaleY:   1.3,
        alpha:    0,
        duration: this.ANIMATION_TIME * 0.7,
        ease:     'Sine.easeIn'
      });
    });
  }

  _spawnScorePopup(points) {
    const x = 36 + (this.NUM_COLS / 2) * (this.BLOCK_SIZE + 6);
    const y = 150;

    let popup = this._popupGroup.getFirstDead(false);
    if (!popup) {
      popup = this.add.text(x, y, '', {
        fontFamily:      'Arial Black, sans-serif',
        fontSize:        '22px',
        color:           '#f0d060',
        stroke:          '#000000',
        strokeThickness: 3
      });
      this._popupGroup.add(popup, true);
    }
    popup.setPosition(x, y);
    popup.setText(`+${points}`);
    popup.setAlpha(1);
    popup.setScale(1);
    popup.setActive(true).setVisible(true);

    this.tweens.add({
      targets:  popup,
      y:        y - 60,
      alpha:    0,
      scaleX:   1.4,
      scaleY:   1.4,
      duration: 800,
      ease:     'Sine.easeOut',
      onComplete: () => { popup.setActive(false).setVisible(false); }
    });
  }

  // ── Progression callbacks ─────────────────────────────────────────────────

  _onStageAdvance(newStageIndex) {
    this.sidePanel.refresh();
    this.sidePanel.refreshStageDots();
    this.sidePanel.showDialogue(
      this.dialogueManager.getStageAdvanceLine(newStageIndex)
    );
    this.cameras.main.shake(200, 0.005);
  }

  _onSceneComplete() {
    this.sidePanel.showDialogue(this.dialogueManager.getWinFinalLine());
  }
}
