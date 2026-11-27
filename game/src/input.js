// Keyboard + mouse input. One job: turn keys and clicks into the few actions
// the game understands, and remember them until the loop asks.
export const ACTION_JUMP = 1;
export const ACTION_SLIDE = 2;
export const ACTION_CONFIRM = 4;
export const ACTION_PAUSE = 8;
export const ACTION_MUTE = 16;
export const ACTION_RESTART = 32;

const JUMP_KEYS = new Set(['Space', 'ArrowUp', 'KeyW']);
const SLIDE_KEYS = new Set(['ArrowDown', 'KeyS']);
const PAUSE_KEYS = new Set(['KeyP', 'Escape']);
const MUTE_KEYS = new Set(['KeyM']);
const RESTART_KEYS = new Set(['KeyR']);

export function createInput(canvas) {
  let queued = 0;
  let slideHeld = false;

  function press(action) {
    queued |= action;
  }

  function onKeyDown(event) {
    if (JUMP_KEYS.has(event.code)) {
      press(ACTION_JUMP);
      event.preventDefault();
    } else if (SLIDE_KEYS.has(event.code)) {
      slideHeld = true;
      press(ACTION_SLIDE);
      event.preventDefault();
    } else if (PAUSE_KEYS.has(event.code)) {
      press(ACTION_PAUSE);
    } else if (MUTE_KEYS.has(event.code)) {
      press(ACTION_MUTE);
    } else if (RESTART_KEYS.has(event.code)) {
      press(ACTION_RESTART);
    } else if (event.code === 'Enter') {
      press(ACTION_CONFIRM);
    }
  }

  function onKeyUp(event) {
    if (SLIDE_KEYS.has(event.code)) slideHeld = false;
  }

  function onPointerDown(event) {
    event.preventDefault();
    // Clicking the top half jumps; the bottom half slides — mouse-only players
    // get both moves without a keyboard.
    const rect = canvas.getBoundingClientRect();
    const y = (event.clientY - rect.top) / rect.height;
    if (y < 0.55) press(ACTION_JUMP);
    else press(ACTION_SLIDE);
    press(ACTION_CONFIRM);
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onPointerDown);

  function takeActions() {
    const actions = queued;
    queued = 0;
    return actions;
  }

  return { takeActions, isSliding: () => slideHeld };
}
