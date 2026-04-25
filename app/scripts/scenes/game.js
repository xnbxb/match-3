import Board from '@/objects/board';
import Block from '@/objects/block';
import { getDefaultScene } from '@/data/mock-scenes';
import SceneProgressManager, { MATCHES_PER_STAGE } from '@/managers/SceneProgressManager';
import DialogueManager from '@/managers/DialogueManager';
import SidePanel from '@/ui/SidePanel';

export default class Game extends Phaser.Scene {
  constructor() {
    super({ key: 'Game' });
  }

  create(/* data */) {
    // --- Board constants (unchanged from original) ---
    this.NUM_ROWS = 8;
    this.NUM_COLS = 8;
    this.NUM_VARIATIONS = 6;
    this.BLOCK_SIZE = 35;
    this.ANIMATION_TIME = 300;

    // Background covers the full widened canvas
    this.background = this.add.sprite(0, 0, 'background');
    this.background.setOrigin(0);

    // Board (logic unchanged)
    this.board = new Board(this, this.NUM_ROWS, this.NUM_COLS, this.NUM_VARIATIONS);
    this.blocks = this.add.group();
    this.graphics = this.make.graphics();
    this.drawBoard();

    // --- New systems ---
    const sceneData = getDefaultScene();

    this.progressManager = new SceneProgressManager(
      sceneData,
      (newStageIndex, data) => this._onStageAdvance(newStageIndex, data),
      (data) => this._onSceneComplete(data)
    );

    this.dialogueManager = new DialogueManager(sceneData);

    this.sidePanel = new SidePanel(this, sceneData, this.progressManager);

    // Score display (top-left of board area)
    this.score = 0;
    this._scoreText = this.add.text(36, 16, 'SCORE  0', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#9090b0'
    });

    // Progress hint (below score)
    this._hintText = this.add.text(36, 36, `Next stage: 0 / ${MATCHES_PER_STAGE} tiles`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      color: '#666688'
    });

    // Show opening dialogue after a short delay
    this.time.delayedCall(600, () => {
      const line = this.dialogueManager.getOpeningLine();
      this.sidePanel.showDialogue(line);
    });
  }

  // ---- Board drawing (unchanged from original) ----

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
    const block = this.getBlockFromColRow({ row: sourceRow, col: col });
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
      row: targetRow,
      col: col
    });
    const targetY = 150 + targetRow * (this.BLOCK_SIZE + 6);
    this.tweens.add({ targets: block, y: targetY, duration: this.ANIMATION_TIME, ease: 'Linear' });
  }

  swapBlocks(block1, block2) {
    this.tweens.add({
      targets: block1,
      x: block2.x,
      y: block2.y,
      duration: this.ANIMATION_TIME,
      ease: 'Linear',
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
      targets: block2,
      x: block1.x,
      y: block1.y,
      duration: this.ANIMATION_TIME,
      ease: 'Linear',
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
    this.targetBlock = null;
  }

  updateBoard() {
    // Count tiles being cleared for progression tracking
    const chains = this.board.findAllChains();
    const tilesCleared = chains.length;

    this.board.clearChains();
    this.board.updateGrid();

    // Update score
    this.score += tilesCleared * 10;
    this._scoreText.setText(`SCORE  ${this.score}`);

    // Feed cleared tile count into progress manager
    this.progressManager.recordMatches(tilesCleared);

    // Update progress hint
    const filled = Math.floor(
      (this.progressManager.totalMatchCount % MATCHES_PER_STAGE)
    );
    this._hintText.setText(`Next stage: ${filled} / ${MATCHES_PER_STAGE} tiles`);

    // Refresh the progress bar in the side panel
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

  // ---- Progression callbacks ----

  _onStageAdvance(newStageIndex, sceneData) {
    // Refresh portrait color + stage dots + progress bar
    this.sidePanel.refresh();
    this.sidePanel.refreshStageDots();

    // Show appropriate dialogue
    const line = this.dialogueManager.getStageAdvanceLine(newStageIndex);
    this.sidePanel.showDialogue(line);

    // Brief camera shake for juice
    this.cameras.main.shake(200, 0.005);
  }

  _onSceneComplete(sceneData) {
    const line = this.dialogueManager.getWinFinalLine();
    this.sidePanel.showDialogue(line);
    // Future: trigger win screen or scene transition here
  }
}
