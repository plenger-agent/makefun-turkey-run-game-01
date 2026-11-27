// The game's rules and state, with no drawing and no browser in it: the
// turkey's run, the farmer's chase, obstacles, pickups, stages and scoring.
// step() advances one fixed step and returns what happened as bit flags.
import {
  CORN_EVERY,
  CORN_POINTS,
  DOUBLE_JUMP_SPEED,
  ESCAPE_DISTANCE,
  FEATHER_EVERY,
  FEATHER_POINTS,
  FIELD,
  GRAVITY,
  JUMP_SPEED,
  LIVES,
  PLAYER,
  SLIDE_TIME,
  SPAWN,
  STAGES,
} from './config.js';

export const KIND_FENCE = 0;
export const KIND_HAY = 1;
export const KIND_OVEN = 2;
export const KIND_KNIFE = 3;
export const KIND_CORN = 4;
export const KIND_FEATHER = 5;

export const EVENT_HIT = 1;
export const EVENT_CORN = 2;
export const EVENT_FEATHER = 4;
export const EVENT_DODGE = 8;
export const EVENT_OVER = 16;
export const EVENT_ESCAPED = 32;

const POOL_OBSTACLES = 14;
const POOL_PICKUPS = 10;
// A hanging knife's blade tip ends this far above the ground: a standing
// turkey (78 px tall) runs into it, a sliding one (44 px tall) ducks under.
const KNIFE_CLEARANCE = 50;
// The blade itself is this tall; the rope above it is just a line.
const KNIFE_BLADE = 96;

function overlaps(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function stageFor(distance) {
  let stage = 0;
  for (let i = 0; i < STAGES.length; i += 1) if (distance >= STAGES[i].from) stage = i;
  return stage;
}

export function createWorld(random) {
  const turkey = {
    x: PLAYER.x,
    y: FIELD.groundY, // feet
    vy: 0,
    jumps: 0,
    sliding: 0,
    invulnerable: 0,
    runPhase: 0,
  };
  const obstacles = [];
  for (let i = 0; i < POOL_OBSTACLES; i += 1) {
    obstacles.push({ active: false, kind: KIND_FENCE, x: 0, y: 0, width: 0, height: 0, swing: 0 });
  }
  const pickups = [];
  for (let i = 0; i < POOL_PICKUPS; i += 1) {
    pickups.push({ active: false, kind: KIND_CORN, x: 0, y: 0, width: 0, height: 0, bob: 0 });
  }
  const farmer = { x: 30, lunge: 0 };
  const state = {
    turkey,
    obstacles,
    pickups,
    farmer,
    distance: 0,
    score: 0,
    lives: LIVES,
    stage: 0,
    speed: PLAYER.speed,
    elapsed: 0,
    spawnTimer: 1.2,
    cornTimer: 1.6,
    featherTimer: 9,
    scrollX: 0,
    escaped: false,
    over: false,
    lastSpawnKind: -1,
  };

  function reset() {
    turkey.y = FIELD.groundY;
    turkey.vy = 0;
    turkey.jumps = 0;
    turkey.sliding = 0;
    turkey.invulnerable = 0;
    turkey.runPhase = 0;
    for (const o of obstacles) o.active = false;
    for (const p of pickups) p.active = false;
    farmer.x = 30;
    farmer.lunge = 0;
    state.distance = 0;
    state.score = 0;
    state.lives = LIVES;
    state.stage = 0;
    state.speed = PLAYER.speed;
    state.elapsed = 0;
    state.spawnTimer = 1.2;
    state.cornTimer = 1.6;
    state.featherTimer = 9;
    state.scrollX = 0;
    state.escaped = false;
    state.over = false;
    state.lastSpawnKind = -1;
  }

  function freeObstacle() {
    for (const o of obstacles) if (!o.active) return o;
    return null;
  }

  function freePickup() {
    for (const p of pickups) if (!p.active) return p;
    return null;
  }

  function spawnObstacle() {
    const o = freeObstacle();
    if (o === null) return;
    const stage = state.stage;
    const roll = random();
    let kind = KIND_FENCE;
    if (stage === 0) kind = roll < 0.6 ? KIND_FENCE : KIND_HAY;
    else if (stage === 1) kind = roll < 0.35 ? KIND_FENCE : roll < 0.65 ? KIND_HAY : KIND_KNIFE;
    else kind = roll < 0.25 ? KIND_FENCE : roll < 0.45 ? KIND_HAY : roll < 0.75 ? KIND_OVEN : KIND_KNIFE;
    o.active = true;
    o.kind = kind;
    o.counted = false;
    state.lastSpawnKind = kind;
    o.x = FIELD.width + 40 + random() * 120;
    o.swing = random() * Math.PI * 2;
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
      // Hanging knife: a short blade on a rope, its tip just above the
      // ground. A standing turkey runs into the blade; a sliding one ducks
      // underneath it (see KNIFE_CLEARANCE).
      o.width = 26;
      o.height = KNIFE_BLADE;
      o.y = FIELD.groundY - KNIFE_CLEARANCE - KNIFE_BLADE;
    }
  }

  function spawnPickup(kind) {
    const p = freePickup();
    if (p === null) return;
    p.active = true;
    p.kind = kind;
    p.x = FIELD.width + 40;
    p.bob = random() * Math.PI * 2;
    if (kind === KIND_CORN) {
      p.width = 36;
      p.height = 36;
      // Corn sits on the ground or floats at jump height.
      p.y = random() < 0.5 ? FIELD.groundY - 40 : FIELD.groundY - 150;
    } else {
      p.width = 42;
      p.height = 42;
      p.y = FIELD.groundY - 190; // a golden feather is worth a good jump
    }
  }

  function turkeyBox() {
    const height = turkey.sliding > 0 ? PLAYER.slideHeight : PLAYER.height;
    return { x: turkey.x, y: turkey.y - height, width: PLAYER.width, height };
  }

  /**
   * One fixed step. `jump` is a fresh jump press this step; `slideHeld` is the
   * slide key/button held down. With `attract` set (the title screen's
   * backdrop) things scroll but nothing can hit the turkey and nothing scores.
   */
  function step(dt, jump, slideHeld, attract) {
    let events = 0;
    state.elapsed += dt;
    state.speed = Math.min(PLAYER.maxSpeed, PLAYER.speed + state.distance * 0.9);
    state.scrollX += state.speed * dt;
    if (!attract) {
      state.distance += (state.speed * dt) / 50;
      state.score += (state.speed * dt) / 50;
      state.stage = stageFor(state.distance);
    }

    // Turkey physics: jump, double jump, slide, land.
    if (jump && !attract) {
      if (turkey.y >= FIELD.groundY) {
        turkey.vy = -JUMP_SPEED;
        turkey.jumps = 1;
        turkey.sliding = 0;
      } else if (turkey.jumps < 2) {
        turkey.vy = -DOUBLE_JUMP_SPEED;
        turkey.jumps = 2;
      }
    }
    if (slideHeld && turkey.y >= FIELD.groundY && !attract) turkey.sliding = SLIDE_TIME;
    else if (turkey.sliding > 0) turkey.sliding = Math.max(0, turkey.sliding - dt);
    turkey.vy += GRAVITY * dt;
    turkey.y = Math.min(FIELD.groundY, turkey.y + turkey.vy * dt);
    if (turkey.y >= FIELD.groundY) {
      turkey.vy = 0;
      turkey.jumps = 0;
    }
    turkey.runPhase += (state.speed * dt) / 38;
    if (turkey.invulnerable > 0) turkey.invulnerable = Math.max(0, turkey.invulnerable - dt);

    // The farmer gains on every stumble and eases back while the turkey runs clean.
    const farmerTarget = 30 + (LIVES - state.lives) * 52;
    farmer.x += (farmerTarget - farmer.x) * Math.min(1, dt * 1.2);
    if (farmer.lunge > 0) farmer.lunge = Math.max(0, farmer.lunge - dt);

    if (!attract) {
      state.spawnTimer -= dt;
      if (state.spawnTimer <= 0) {
        const previousKind = state.lastSpawnKind;
        spawnObstacle();
        const interval = Math.max(SPAWN.min, SPAWN.start - state.distance * SPAWN.tightenPerMetre);
        // Fairness floor: two ground obstacles in a row must leave room to
        // land from clearing the first and jump the second. A jump lasts
        // ~0.85 s of travel, plus 300 px to react in — anything tighter can
        // strand the turkey mid-landing with no move left. A hanging knife
        // needs no airtime (slide instead), so it is exempt.
        const groundPair =
          previousKind !== KIND_KNIFE &&
          state.lastSpawnKind !== KIND_KNIFE &&
          previousKind !== -1;
        const floor = groundPair ? (state.speed * 0.85 + 300) / state.speed : SPAWN.min;
        state.spawnTimer = Math.max(interval * (0.85 + random() * 0.4), floor);
      }
      state.cornTimer -= dt;
      if (state.cornTimer <= 0) {
        spawnPickup(KIND_CORN);
        state.cornTimer = CORN_EVERY * (0.8 + random() * 0.5);
      }
      state.featherTimer -= dt;
      if (state.featherTimer <= 0) {
        spawnPickup(KIND_FEATHER);
        state.featherTimer = FEATHER_EVERY * (0.8 + random() * 0.4);
      }
    }

    const box = turkeyBox();
    for (const o of obstacles) {
      if (!o.active) continue;
      o.x -= state.speed * dt;
      o.swing += dt * 2.2;
      if (o.x + o.width < -20) {
        o.active = false;
        continue;
      }
      if (attract || turkey.invulnerable > 0) continue;
      // A dodged obstacle is worth a little: clearing it cleanly.
      if (o.x + o.width < turkey.x && !o.counted) {
        o.counted = true;
        state.score += 10;
        events |= EVENT_DODGE;
      }
      if (overlaps(box, o)) {
        o.active = false;
        state.lives -= 1;
        turkey.invulnerable = PLAYER.invulnerable;
        farmer.lunge = 0.7;
        events |= EVENT_HIT;
        if (state.lives <= 0) {
          state.over = true;
          events |= EVENT_OVER;
          return events;
        }
      }
    }
    for (const p of pickups) {
      if (!p.active) continue;
      p.x -= state.speed * dt;
      p.bob += dt * 5;
      if (p.x + p.width < -20) {
        p.active = false;
        continue;
      }
      if (attract) continue;
      if (overlaps(box, p)) {
        p.active = false;
        if (p.kind === KIND_CORN) {
          state.score += CORN_POINTS;
          events |= EVENT_CORN;
        } else {
          state.score += FEATHER_POINTS;
          events |= EVENT_FEATHER;
        }
      }
    }

    if (!attract && state.distance >= ESCAPE_DISTANCE) {
      state.escaped = true;
      state.over = true;
      events |= EVENT_ESCAPED | EVENT_OVER;
    }
    return events;
  }

  reset();
  return { state, reset, step };
}
