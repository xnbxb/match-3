/**
 * DialogueManager.js
 * ------------------
 * Picks and delivers dialogue lines from scene data.
 * Pure JS — no Phaser dependency.
 *
 * The Game scene calls the appropriate `get*` method and passes the result
 * to SidePanel.showDialogue().
 */

export default class DialogueManager {
  constructor(sceneData) {
    this.sceneData = sceneData;
    this._usedIndices = {}; // tracks used lines per category to avoid repeats
  }

  /** Load a new scene's dialogue data. */
  loadScene(newSceneData) {
    this.sceneData = newSceneData;
    this._usedIndices = {};
  }

  /** Called when the scene/session first starts. */
  getOpeningLine() {
    return this._pickLine('dialoguefold');
  }

  /** Called when a hand/round is won (mid-game progress). */
  getWinHandLine() {
    return this._pickLine('dialoguewinhand');
  }

  /** Called when the final stage is reached. */
  getWinFinalLine() {
    return this._pickLine('dialoguewinfinal');
  }

  /**
   * Called when a stage advances.
   * Falls back to a generic line if handdialogue doesn't have the stage.
   * @param {number} stageIndex  0-based stage index.
   */
  getStageAdvanceLine(stageIndex) {
    const key = String(stageIndex + 1); // handdialogue keys are "1", "2", "3"...
    const pool = this.sceneData.handdialogue && this.sceneData.handdialogue[key];
    if (pool && pool.length > 0) {
      return this._pickFromPool(`handdialogue_${key}`, pool);
    }
    return this.getWinHandLine();
  }

  // -- private --

  _pickLine(category) {
    const pool = this.sceneData[category];
    if (!pool || pool.length === 0) return '';
    return this._pickFromPool(category, pool);
  }

  /** Non-repeating random pick. Resets when all lines exhausted. */
  _pickFromPool(key, pool) {
    if (!this._usedIndices[key]) this._usedIndices[key] = [];
    let available = pool
      .map((_, i) => i)
      .filter(i => !this._usedIndices[key].includes(i));

    if (available.length === 0) {
      this._usedIndices[key] = [];
      available = pool.map((_, i) => i);
    }

    const idx = available[Math.floor(Math.random() * available.length)];
    this._usedIndices[key].push(idx);
    return pool[idx];
  }
}
