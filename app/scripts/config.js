/*
 *  `config` module
 *  ===============
 *
 *  The game instance settings.
 *
 *  CHANGED: width increased from 360 to 900 to accommodate the side panel.
 *  Everything else is untouched.
 */

import * as scenes from '@/scenes';

/** Game canvas width. Widened to 900 to fit board (360) + side panel (540). */
export const width = 900;

/** Game canvas height. */
export const height = 640;

export const zoom = 1;
export const resolution = 1;

export const type = Phaser.AUTO;
export const pixelArt = false;
export const transparent = false;
export const canvasStyle = 'display: block; margin: 0 auto;';
export const backgroundColor = '#0d0d1a';

export const physics = { default: false };

export const loader = {
  path: 'assets/'
};

export const plugins = { global: [], scene: [] };

export {title, version, url} from '@/../../package.json';
export const scene = Object.values(scenes);
