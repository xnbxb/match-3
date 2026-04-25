/**
 * SceneProgressManager.js
 * -----------------------
 * Tracks match progress and decides when to advance the reveal stage.
 *
 * Deliberately decoupled from Phaser — no scene reference needed.
 * The Game scene calls `recordMatches()` and listens to `onStageAdvance`.
 *
 * CONFIG values are the only knobs to tune pacing.
 */

// Number of matched tiles needed to advance one stage.
export const MATCHES_PER_STAGE = 15;

export default class SceneProgressManager {
  /**
   * @param {object} sceneData  - One entry from mock-scenes (or real data).
   * @param {Function} onStageAdvance - Called with (newStageIndex, sceneData) when stage advances.
   * @param {Function} onSceneComplete - Called when all stages are unlocked.
   */
  constructor(sceneData, onStageAdvance, onSceneComplete) {
    this.sceneData = sceneData;
    this.onStageAdvance = onStageAdvance;
    this.onSceneComplete = onSceneComplete;

    this.totalStages = sceneData.stages.length;
    this.currentStage = 0;       // 0 = first stage visible
    this.matchCount = 0;          // running tally of matched tiles
    this.totalMatchCount = 0;     // lifetime total for this scene
    this.isComplete = false;
  }

  /**
   * Call this after every successful chain clear.
   * @param {number} tilesCleared  Number of tiles removed this chain.
   */
  recordMatches(tilesCleared) {
    if (this.isComplete) return;

    this.matchCount += tilesCleared;
    this.totalMatchCount += tilesCleared;

    const targetStage = Math.min(
      Math.floor(this.totalMatchCount / MATCHES_PER_STAGE),
      this.totalStages - 1
    );

    if (targetStage > this.currentStage) {
      this.currentStage = targetStage;
      this.onStageAdvance(this.currentStage, this.sceneData);

      if (this.currentStage >= this.totalStages - 1) {
        this.isComplete = true;
        this.onSceneComplete(this.sceneData);
      }
    }
  }

  /** 0.0 – 1.0 fill progress toward the NEXT stage advance. */
  getProgressToNextStage() {
    if (this.isComplete) return 1;
    const matchesIntoCurrentStage = this.totalMatchCount % MATCHES_PER_STAGE;
    return matchesIntoCurrentStage / MATCHES_PER_STAGE;
  }

  getCurrentStageData() {
    return this.sceneData.stages[this.currentStage];
  }

  /** Replace sceneData at runtime when switching scenes. Resets progress. */
  loadScene(newSceneData) {
    this.sceneData = newSceneData;
    this.totalStages = newSceneData.stages.length;
    this.currentStage = 0;
    this.matchCount = 0;
    this.totalMatchCount = 0;
    this.isComplete = false;
  }
}
