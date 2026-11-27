// Boot and the one loop: input is read every frame, the world advances in
// fixed 1/60 s steps (several in a slow frame, none in a fast one), and the
// renderer paints what is there. The game moves between four screens: title,
// play, paused and game over.
//
// ?seed=N fixes the spawn pattern. ?shot=start|play|kitchen|end (with
// &seed=N) stages that scene instead of running the loop, paints it twice
// and sets window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_CORN, EVENT_ESCAPED, EVENT_FEATHER, EVENT_HIT, EVENT_OVER } from './world.js';
import { ACTION_CONFIRM, ACTION_JUMP, ACTION_MUTE, ACTION_PAUSE, ACTION_RESTART, ACTION_SLIDE, createInput } from './input.js';
import { createAudio } from './audio.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best, world.state.elapsed);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  // A jump press is queued here and spent on the next world step, so a press
  // is never lost between frames and never fires twice.
  let pendingJump = false;

  // Screen readers (and anyone watching the page's text) hear the screen changes and each hit.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    audio.unlock();
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce('Playing. Three lives. Run for the kitchen window.');
  }

  function endGame(escaped) {
    screen = SCREEN_OVER;
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
    if (escaped) {
      audio.escaped();
      announce(`Escaped! Score ${world.state.score}. Best ${best}.`);
    } else {
      audio.caught();
      announce(`Caught. Score ${world.state.score}. Best ${best}.`);
    }
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_JUMP) {
      pendingJump = true;
      audio.unlock();
    }
    if (actions & ACTION_MUTE) {
      const muted = audio.toggleMute();
      announce(muted ? 'Sound off.' : 'Sound on.');
    }
    if (actions & ACTION_RESTART && screen !== SCREEN_TITLE) {
      startGame();
      return;
    }
    // Space / Up / click all start the game from the title or end screens:
    // the panels promise "Press Space or click to start", so a jump press
    // must count as a confirm there.
    if (actions & (ACTION_CONFIRM | ACTION_JUMP) && (screen === SCREEN_TITLE || screen === SCREEN_OVER)) startGame();
    else if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
    }
  }

  function step() {
    if (screen === SCREEN_TITLE) {
      world.step(STEP, false, false, true);
      pendingJump = false;
      return;
    }
    const jump = pendingJump;
    pendingJump = false;
    const jumpsBefore = world.state.turkey.jumps;
    const events = world.step(STEP, jump, input.isSliding(), false);
    if (jump && world.state.turkey.jumps !== jumpsBefore) {
      if (world.state.turkey.jumps === 2) audio.doubleJump();
      else audio.jump();
    }
    if (events & EVENT_OVER) endGame(Boolean(events & EVENT_ESCAPED));
    else if (events & EVENT_HIT) {
      audio.hit();
      announce(world.state.lives === 1 ? 'Hit. 1 life left.' : `Hit. ${world.state.lives} lives left.`);
    } else if (events & EVENT_CORN) audio.corn();
    else if (events & EVENT_FEATHER) audio.feather();
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best, world.state.elapsed, audio.isMuted());
  }

  // Leaving the tab pauses a running game rather than letting the farmer catch the turkey unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Gobble Dash. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
