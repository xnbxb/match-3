/**
 * DialogueManager.js
 * ------------------
 * Picks and delivers dialogue lines from scene data.
 * Pure JS — no Phaser dependency.
 */

export default class DialogueManager {
  constructor(sceneData) {
    this.sceneData    = sceneData;
    this._usedIndices = {};
  }

  loadScene(newSceneData) {
    this.sceneData    = newSceneData;
    this._usedIndices = {};
  }

  getOpeningLine() {
    return this._pickLine('dialoguefold');
  }

  getWinHandLine() {
    return this._pickLine('dialoguewinhand');
  }

  getWinFinalLine() {
    return this._pickLine('dialoguewinfinal');
  }

  getStageAdvanceLine(stageIndex) {
    var key  = String(stageIndex + 1);
    var pool = this.sceneData.handdialogue && this.sceneData.handdialogue[key];
    if (pool && pool.length > 0) {
      return this._pickFromPool('handdialogue_' + key, pool);
    }
    return this.getWinHandLine();
  }

  _pickLine(category) {
    var pool = this.sceneData[category];
    if (!pool || pool.length === 0) return '';
    return this._pickFromPool(category, pool);
  }

  _pickFromPool(key, pool) {
    if (!this._usedIndices[key]) { this._usedIndices[key] = []; }

    var used      = this._usedIndices[key];
    var available = [];
    for (var i = 0; i < pool.length; i++) {
      if (used.indexOf(i) === -1) { available.push(i); }
    }

    if (available.length === 0) {
      this._usedIndices[key] = [];
      available = [];
      for (var j = 0; j < pool.length; j++) { available.push(j); }
    }

    var idx = available[Math.floor(Math.random() * available.length)];
    this._usedIndices[key].push(idx);
    return pool[idx];
  }
}
