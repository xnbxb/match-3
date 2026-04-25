export default class SplashScreen extends Phaser.Scene {
  /**
   *  Loads game assets while showing the splash screen.
   *  After loading → transitions to Lobby (folder picker) instead of directly
   *  to Game, so the player can choose their gallery folder first.
   *
   *  @extends Phaser.Scene
   */
  constructor() {
    super({
      key: 'SplashScreen',
      pack: {
        files: [{
          key: 'splash-screen',
          type: 'image'
        }, {
          key: 'progress-bar',
          type: 'image'
        }]
      }
    });
  }

  preload() {
    this.showCover();
    this.showProgressBar();

    // Tile assets (unchanged)
    this.load.image('block1', 'images/bean_blue.png');
    this.load.image('block2', 'images/bean_green.png');
    this.load.image('block3', 'images/bean_orange.png');
    this.load.image('block4', 'images/bean_pink.png');
    this.load.image('block5', 'images/bean_purple.png');
    this.load.image('block6', 'images/bean_yellow.png');
    this.load.image('block7', 'images/bean_red.png');
    this.load.image('block8', 'images/bean_white.png');
    this.load.image('deadBlock', 'images/bean_dead.png');
    this.load.image('background', 'images/backyard2.png');
  }

  create() {
    // Go to the lobby (folder picker) rather than straight to Game.
    this.scene.start('Lobby');
  }

  showCover() {
    this.add.image(0, 0, 'splash-screen').setOrigin(0);
  }

  showProgressBar() {
    const {width: w, height: h} = this.textures.get('progress-bar').get();
    const img = this.add.sprite(82, 282, 'progress-bar').setOrigin(0);
    this.load.on('progress', v => img.setCrop(0, 0, Math.ceil(v * w), h));
  }
}
