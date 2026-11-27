// The screenshot scenes behind ?shot=start|play|kitchen|end. Each preset places
// the turkey, the farmer, the obstacles and the score exactly, so a headless
// capture is reproducible — the same seed always gives the same frame, and the
// frame is what a real run looks like at that moment.
import { FIELD, PLAYER } from './config.js';
import { KIND_FENCE, KIND_HAY, KIND_KNIFE, KIND_OVEN } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

/** Place one obstacle into a free slot of the world's pool. */
function placeObstacle(state, kind, x) {
  for (const o of state.obstacles) {
    if (o.active) continue;
    o.active = true;
    o.kind = kind;
    o.x = x;
    o.swing = 0.6;
    if (kind === KIND_FENCE) {
      o.width = 44;
      o.height = 92;
      o.y = FIELD.groundY - o.height;
    } else if (kind === KIND_HAY) {
      o.width = 74;
      o.height = 62;
      o.y = FIELD.groundY - o.height;
    } else if (kind === KIND_OVEN) {
      o.width = 100;
      o.height = 112;
      o.y = FIELD.groundY - o.height;
    } else {
      o.width = 26;
      o.height = 96;
      o.y = FIELD.groundY - 50 - 96;
    }
    return;
  }
}

function placeCorn(state, x, y) {
  for (const p of state.pickups) {
    if (p.active) continue;
    p.active = true;
    p.kind = 4; // KIND_CORN
    p.x = x;
    p.y = y;
    p.width = 36;
    p.height = 36;
    p.bob = 0;
    return;
  }
}

/**
 * Stage the named scene in `world` and return the screen to draw over it and
 * the best score to show. Names: start, play, kitchen, end; anything else
 * is start.
 */
export function stageShot(name, world) {
  const state = world.state;
  world.reset();
  if (name !== 'play' && name !== 'kitchen' && name !== 'end') {
    // Title: the farm scrolls behind the panel, a fence and hay in view.
    state.scrollX = 260;
    placeObstacle(state, KIND_FENCE, 980);
    placeObstacle(state, KIND_HAY, 1120);
    return { screen: SCREEN_TITLE, best: 1250 };
  }
  if (name === 'play') {
    // Mid-run in the farmyard: turkey mid-jump over a hay bale, farmer
    // closing in, corn ahead, fence coming up.
    state.distance = 210;
    state.score = 1480;
    state.stage = 0;
    state.turkey.y = FIELD.groundY - 130;
    state.turkey.vy = -220;
    state.farmer.x = 96;
    state.farmer.lunge = 0.4;
    placeObstacle(state, KIND_HAY, 340);
    placeObstacle(state, KIND_FENCE, 760);
    placeObstacle(state, KIND_KNIFE, 560);
    placeCorn(state, 620, FIELD.groundY - 150);
    placeCorn(state, 660, FIELD.groundY - 150);
    return { screen: SCREEN_PLAY, best: 2350 };
  }
  if (name === 'kitchen') {
    // Deep in the kitchen at dusk: oven blazing, knives overhead, the turkey
    // sliding under one, the farmer right behind.
    state.distance = 940;
    state.score = 3120;
    state.stage = 2;
    state.lives = 2;
    state.turkey.sliding = 0.5;
    state.farmer.x = 76;
    state.farmer.lunge = 0.6;
    placeObstacle(state, KIND_OVEN, 620);
    placeObstacle(state, KIND_KNIFE, 420);
    placeObstacle(state, KIND_OVEN, 1050);
    placeCorn(state, 820, FIELD.groundY - 40);
    return { screen: SCREEN_PLAY, best: 3120 };
  }
  // End: escaped through the kitchen window — the win panel over a quiet farm.
  state.distance = 1200;
  state.score = 4860;
  state.stage = 2;
  state.escaped = true;
  state.over = true;
  state.turkey.y = FIELD.groundY;
  return { screen: SCREEN_OVER, best: 4860 };
}
