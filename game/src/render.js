// Drawing only: the world's state and the current screen in, pixels out. The
// 1280x720 playfield is scaled to fit the window and centred. All art is
// drawn with canvas shapes — no image files, nothing fetched.
import { FIELD, FONT, FONT_DISPLAY, LIVES, PALETTE, PLAYER, STAGES } from './config.js';
import { KIND_CORN, KIND_FENCE, KIND_FEATHER, KIND_HAY, KIND_KNIFE, KIND_OVEN } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

const PANEL = { width: 640, top: 150, line: 34, bottom: 76 };

function cachedLabel(prefix) {
  let value = -1;
  let text = '';
  return function label(next) {
    const rounded = Math.floor(next);
    if (rounded !== value) {
      value = rounded;
      text = prefix + rounded;
    }
    return text;
  };
}

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  const scoreLabel = cachedLabel('SCORE ');
  const finalLabel = cachedLabel('SCORE ');
  const bestLabel = cachedLabel('BEST ');

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  const fonts = new Map();
  function text(value, x, y, size, color, align, font) {
    const key = size + (font || '');
    if (!fonts.has(key)) fonts.set(key, `${size}px ${font || FONT}`);
    context.font = fonts.get(key);
    context.fillStyle = color;
    context.textAlign = align;
    context.fillText(value, x, y);
  }

  function ellipse(x, y, rx, ry) {
    context.beginPath();
    context.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    context.fill();
  }

  // ---- background: sky, sun, clouds, distant farm, fence, ground ----
  function drawSky(state, stage) {
    const gradient = context.createLinearGradient(0, 0, 0, FIELD.groundY);
    gradient.addColorStop(0, stage.skyTop);
    gradient.addColorStop(1, stage.skyBottom);
    context.fillStyle = gradient;
    context.fillRect(0, 0, FIELD.width, FIELD.groundY);
    // Low sun (or moon in the kitchen dusk).
    context.fillStyle = stage.sun;
    context.beginPath();
    context.arc(1080, 110, 46, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = 'rgba(255, 255, 255, 0.55)';
    for (let i = 0; i < 4; i += 1) {
      const cx = ((i * 340 - state.scrollX * 0.12) % 1500 + 1500) % 1500 - 110;
      const cy = 70 + i * 52;
      ellipse(cx, cy, 62, 20);
      ellipse(cx + 44, cy + 8, 44, 16);
    }
    // Distant silhouettes: a barn and trees, drifting slower than the ground.
    const far = stage.far;
    context.fillStyle = far;
    const barnX = ((420 - state.scrollX * 0.25) % 1600 + 1600) % 1600 - 160;
    context.fillRect(barnX, 420, 150, 120);
    context.beginPath();
    context.moveTo(barnX - 12, 420);
    context.lineTo(barnX + 75, 350);
    context.lineTo(barnX + 162, 420);
    context.closePath();
    context.fill();
    for (let i = 0; i < 5; i += 1) {
      const tx = ((i * 300 + 180 - state.scrollX * 0.35) % 1500 + 1500) % 1500 - 110;
      context.fillRect(tx + 8, 480, 10, 60);
      context.beginPath();
      context.arc(tx + 13, 470, 42, 0, Math.PI * 2);
      context.fill();
    }
  }

  function drawGround(state, stage) {
    context.fillStyle = stage.ground;
    context.fillRect(0, FIELD.groundY, FIELD.width, FIELD.height - FIELD.groundY);
    context.fillStyle = stage.groundDark;
    context.fillRect(0, FIELD.groundY, FIELD.width, 10);
    // Fence posts scrolling past, and grass tufts.
    context.fillStyle = '#5a3a1e';
    for (let x = -((state.scrollX * 1) % 120); x < FIELD.width; x += 120) {
      context.fillRect(x, FIELD.groundY - 46, 10, 46);
    }
    context.fillRect(0, FIELD.groundY - 40, FIELD.width, 6);
    context.strokeStyle = stage.grass;
    context.lineWidth = 3;
    for (let x = -((state.scrollX) % 90); x < FIELD.width; x += 90) {
      context.beginPath();
      context.moveTo(x, FIELD.groundY + 26);
      context.lineTo(x + 5, FIELD.groundY + 12);
      context.moveTo(x + 10, FIELD.groundY + 26);
      context.lineTo(x + 14, FIELD.groundY + 14);
      context.stroke();
    }
  }

  // ---- the turkey: fan tail, brown body, head, wattle, running legs ----
  function drawTurkey(turkey, sliding) {
    const cx = turkey.x + PLAYER.width / 2;
    const feet = turkey.y;
    const bob = turkey.y >= FIELD.groundY ? Math.sin(turkey.runPhase * 2) * 2 : 0;
    const bodyY = feet - 34 + bob;
    const blink = turkey.invulnerable > 0 && Math.floor(turkey.invulnerable * 10) % 2 === 0;
    if (blink) return; // blink while invulnerable after a hit
    // Tail fan, fluttering as it runs.
    const flutter = Math.sin(turkey.runPhase * 3) * 0.12;
    for (let i = 0; i < 5; i += 1) {
      const angle = -Math.PI / 2 + (i - 2) * 0.34 + flutter;
      context.fillStyle = PALETTE.tail[i % 3];
      context.beginPath();
      context.moveTo(cx - 14, bodyY + 6);
      context.lineTo(cx - 14 + Math.cos(angle) * 52, bodyY + 6 + Math.sin(angle) * 52);
      context.lineTo(cx + 2 + Math.cos(angle + 0.28) * 52, bodyY + 6 + Math.sin(angle + 0.28) * 52);
      context.closePath();
      context.fill();
    }
    if (sliding) {
      // Low slide: body stretched forward, tail up behind.
      context.fillStyle = PALETTE.turkey;
      ellipse(cx + 4, feet - 18, 40, 18);
      context.fillStyle = PALETTE.head;
      ellipse(cx + 38, feet - 26, 12, 11);
      context.fillStyle = PALETTE.beak;
      context.beginPath();
      context.moveTo(cx + 48, feet - 28);
      context.lineTo(cx + 60, feet - 24);
      context.lineTo(cx + 48, feet - 20);
      context.closePath();
      context.fill();
      return;
    }
    // Legs: two sticks alternating with the run phase.
    const legSwing = Math.sin(turkey.runPhase) * 10;
    context.strokeStyle = '#e8a13c';
    context.lineWidth = 5;
    context.beginPath();
    context.moveTo(cx - 8, feet - 12);
    context.lineTo(cx - 8 + legSwing, feet);
    context.moveTo(cx + 8, feet - 12);
    context.lineTo(cx + 8 - legSwing, feet);
    context.stroke();
    // Body.
    context.fillStyle = PALETTE.turkey;
    ellipse(cx, bodyY, 34, 30);
    context.fillStyle = PALETTE.turkeyDark;
    ellipse(cx - 6, bodyY + 8, 22, 18);
    // Wing.
    context.fillStyle = PALETTE.turkeyDark;
    ellipse(cx - 4, bodyY + 2, 18, 12);
    // Head, beak, wattle.
    context.fillStyle = PALETTE.head;
    ellipse(cx + 26, bodyY - 26, 13, 13);
    context.fillStyle = PALETTE.beak;
    context.beginPath();
    context.moveTo(cx + 36, bodyY - 28);
    context.lineTo(cx + 50, bodyY - 23);
    context.lineTo(cx + 36, bodyY - 19);
    context.closePath();
    context.fill();
    context.fillStyle = PALETTE.wattle;
    ellipse(cx + 30, bodyY - 12, 5, 8);
    context.fillStyle = '#222';
    ellipse(cx + 30, bodyY - 28, 2.5, 2.5);
  }

  // ---- the farmer: straw hat, overalls, pitchfork, gaining on the turkey ----
  function drawFarmer(state) {
    const x = state.farmer.x + state.farmer.lunge * 46;
    const feet = FIELD.groundY;
    const swing = Math.sin(state.turkey.runPhase * 1.4) * 12;
    // Pitchfork, held high.
    context.strokeStyle = '#7a5a2b';
    context.lineWidth = 5;
    context.beginPath();
    context.moveTo(x + 52, feet - 96);
    context.lineTo(x + 66, feet - 8);
    context.stroke();
    context.strokeStyle = '#c8c8c8';
    context.lineWidth = 3;
    for (let i = -1; i <= 1; i += 1) {
      context.beginPath();
      context.moveTo(x + 52 + i * 8, feet - 96);
      context.lineTo(x + 52 + i * 8, feet - 112);
      context.stroke();
    }
    // Legs.
    context.strokeStyle = PALETTE.farmerOveralls;
    context.lineWidth = 9;
    context.beginPath();
    context.moveTo(x + 18, feet - 52);
    context.lineTo(x + 18 + swing, feet);
    context.moveTo(x + 34, feet - 52);
    context.lineTo(x + 34 - swing, feet);
    context.stroke();
    // Body: shirt and overalls.
    context.fillStyle = PALETTE.farmerShirt;
    context.fillRect(x + 6, feet - 96, 44, 48);
    context.fillStyle = PALETTE.farmerOveralls;
    context.fillRect(x + 10, feet - 62, 36, 26);
    // Head and straw hat.
    context.fillStyle = PALETTE.farmerSkin;
    ellipse(x + 28, feet - 106, 15, 15);
    context.fillStyle = PALETTE.farmerHat;
    ellipse(x + 28, feet - 116, 26, 7);
    context.fillRect(x + 12, feet - 132, 32, 16);
    // Angry eyes, fixed on the turkey.
    context.fillStyle = '#222';
    context.fillRect(x + 32, feet - 110, 4, 4);
    context.fillRect(x + 42, feet - 110, 4, 4);
  }

  // ---- obstacles and pickups ----
  function drawObstacle(o) {
    if (o.kind === KIND_FENCE) {
      context.fillStyle = '#5a3a1e';
      context.fillRect(o.x, o.y, 8, o.height);
      context.fillRect(o.x + o.width - 8, o.y, 8, o.height);
      context.fillRect(o.x, o.y + 12, o.width, 8);
      context.fillRect(o.x, o.y + 44, o.width, 8);
      context.fillRect(o.x, o.y + 76, o.width, 8);
    } else if (o.kind === KIND_HAY) {
      context.fillStyle = '#d8a93c';
      context.beginPath();
      context.arc(o.x + o.width / 2, o.y + o.height / 2, o.width / 2, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = '#a87c1e';
      context.lineWidth = 3;
      context.beginPath();
      context.arc(o.x + o.width / 2, o.y + o.height / 2, o.width / 2 - 8, 0, Math.PI * 2);
      context.stroke();
      context.beginPath();
      context.arc(o.x + o.width / 2, o.y + o.height / 2, o.width / 2 - 18, 0, Math.PI * 2);
      context.stroke();
    } else if (o.kind === KIND_OVEN) {
      context.fillStyle = PALETTE.oven;
      context.fillRect(o.x, o.y, o.width, o.height);
      context.fillStyle = '#33333a';
      context.fillRect(o.x + 12, o.y + 18, o.width - 24, 56);
      // Fire glow in the oven door, flickering.
      const flicker = 0.7 + Math.random() * 0.3;
      context.fillStyle = `rgba(255, 122, 30, ${flicker})`;
      context.beginPath();
      context.moveTo(o.x + 22, o.y + 66);
      context.lineTo(o.x + 34, o.y + 30);
      context.lineTo(o.x + 48, o.y + 58);
      context.lineTo(o.x + 62, o.y + 28);
      context.lineTo(o.x + 76, o.y + 66);
      context.closePath();
      context.fill();
      context.fillStyle = '#22222a';
      context.fillRect(o.x + 8, o.y + 82, o.width - 16, 8);
      context.fillStyle = '#c8c8c8';
      context.fillRect(o.x + 30, o.y + 6, 40, 6);
    } else if (o.kind === KIND_KNIFE) {
      const sway = Math.sin(o.swing) * 18;
      const topX = o.x + o.width / 2;
      const bladeTop = o.y;
      // Rope from the top of the screen down to the blade.
      context.strokeStyle = '#3a2a1a';
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(topX, 0);
      context.lineTo(topX + sway, bladeTop + 6);
      context.stroke();
      // Handle, then a short blade with a glint.
      context.fillStyle = '#5a3a1e';
      context.fillRect(topX + sway - 6, bladeTop, 12, 24);
      context.fillStyle = PALETTE.knife;
      context.beginPath();
      context.moveTo(topX + sway - 12, bladeTop + 24);
      context.lineTo(topX + sway + 12, bladeTop + 24);
      context.lineTo(topX + sway, bladeTop + o.height);
      context.closePath();
      context.fill();
      context.strokeStyle = PALETTE.knifeEdge;
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(topX + sway - 12, bladeTop + 24);
      context.lineTo(topX + sway, bladeTop + o.height);
      context.stroke();
    }
  }

  function drawPickup(p, time) {
    const bobY = Math.sin(p.bob) * 5;
    if (p.kind === KIND_CORN) {
      const cx = p.x + p.width / 2;
      const cy = p.y + p.height / 2 + bobY;
      // Cob with kernels, husk leaves at the bottom.
      context.fillStyle = '#7fae4c';
      context.beginPath();
      context.moveTo(cx - 12, cy + 8);
      context.lineTo(cx - 16, cy + 20);
      context.lineTo(cx - 4, cy + 16);
      context.closePath();
      context.fill();
      context.beginPath();
      context.moveTo(cx + 12, cy + 8);
      context.lineTo(cx + 16, cy + 20);
      context.lineTo(cx + 4, cy + 16);
      context.closePath();
      context.fill();
      context.fillStyle = PALETTE.corn;
      ellipse(cx, cy, 13, 17);
      context.fillStyle = '#e8a91e';
      for (let r = -1; r <= 1; r += 1) {
        for (let c = -1; c <= 1; c += 1) {
          ellipse(cx + c * 6, cy + r * 9, 2, 2.5);
        }
      }
    } else {
      // Golden feather, spinning gently.
      context.save();
      context.translate(p.x + p.width / 2, p.y + p.height / 2 + bobY);
      context.rotate(Math.sin(time * 2) * 0.3);
      context.fillStyle = PALETTE.feather;
      context.beginPath();
      context.ellipse(0, 0, 9, 20, 0.5, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = '#b8860b';
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(-6, 14);
      context.lineTo(6, -14);
      context.stroke();
      context.restore();
    }
  }

  // ---- HUD and panels ----
  function drawHud(state, muted) {
    context.textBaseline = 'top';
    text(scoreLabel(state.score), 24, 18, 30, PALETTE.text, 'left');
    text(`${Math.floor(state.distance)}m  ·  ${STAGES[state.stage].name}`, FIELD.width / 2, 20, 26, PALETTE.text, 'center');
    const heartSize = 24;
    const firstHeart = FIELD.width - 24 - LIVES * (heartSize + 8) + 8;
    for (let i = 0; i < LIVES; i += 1) {
      const hx = firstHeart + i * (heartSize + 8);
      context.fillStyle = i < state.lives ? PALETTE.heart : PALETTE.heartEmpty;
      context.beginPath();
      context.moveTo(hx + 12, 50);
      context.bezierCurveTo(hx - 2, 36, hx + 2, 26, hx + 12, 34);
      context.bezierCurveTo(hx + 22, 26, hx + 26, 36, hx + 12, 50);
      context.fill();
    }
    text(muted ? 'MUTED (M)' : 'M — sound', FIELD.width - 24, 84, 16, PALETTE.muted, 'right');
    // Chase meter: how close the farmer is.
    const chase = Math.min(1, (state.farmer.x - 30) / 130);
    context.fillStyle = 'rgba(0, 0, 0, 0.35)';
    context.fillRect(24, 56, 180, 14);
    context.fillStyle = chase > 0.6 ? PALETTE.danger : PALETTE.accent;
    context.fillRect(24, 56, 180 * chase, 14);
    text('FARMER', 24, 72, 14, PALETTE.muted, 'left');
  }

  function drawPanel(title, lines, prompt, accent) {
    const height = PANEL.top + lines.length * PANEL.line + PANEL.bottom;
    const x = (FIELD.width - PANEL.width) / 2;
    const y = (FIELD.height - height) / 2;
    context.fillStyle = PALETTE.panel;
    context.fillRect(x, y, PANEL.width, height);
    context.strokeStyle = accent || PALETTE.panelEdge;
    context.lineWidth = 4;
    context.strokeRect(x, y, PANEL.width, height);
    context.textBaseline = 'alphabetic';
    text(title, FIELD.width / 2, y + 82, 52, PALETTE.text, 'center', FONT_DISPLAY);
    for (let index = 0; index < lines.length; index += 1) {
      text(lines[index], FIELD.width / 2, y + PANEL.top + index * PANEL.line, 22, PALETTE.muted, 'center');
    }
    text(prompt, FIELD.width / 2, y + height - 38, 24, PALETTE.accent, 'center');
  }

  const TITLE_LINES = [
    'Thanksgiving is tomorrow. The farmer is coming.',
    'Run, jump and slide your way to the kitchen window.',
    'Space / ↑ / click — jump (twice for a double jump)',
    '↓ / S — slide under the hanging knives · P — pause',
    '',
  ];
  const PAUSED_LINES = ['The farmer waits. The oven stays hot.'];
  const OVER_CAUGHT = ['The farmer got you. Dinner is served.'];
  const OVER_ESCAPED = ['Through the kitchen window — free at last!'];

  /** Paint one frame: the farm, then the HUD or a panel for the screen. */
  function draw(state, screen, best, time, muted) {
    const stage = STAGES[state.stage];
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.backdrop;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    drawSky(state, stage);
    drawGround(state, stage);
    for (const p of state.pickups) if (p.active) drawPickup(p, time);
    for (const o of state.obstacles) if (o.active) drawObstacle(o);
    drawFarmer(state);
    drawTurkey(state.turkey, state.turkey.sliding > 0);
    if (screen === SCREEN_TITLE) {
      TITLE_LINES[4] = bestLabel(best);
      drawPanel('GOBBLE DASH', TITLE_LINES, 'Press Space or click to run for it');
      return;
    }
    drawHud(state, Boolean(muted));
    if (screen === SCREEN_PAUSED) {
      drawPanel('PAUSED', PAUSED_LINES, 'Press P to keep running');
    } else if (screen === SCREEN_OVER) {
      const lines = state.escaped ? OVER_ESCAPED.slice() : OVER_CAUGHT.slice();
      lines.push(`Distance ${Math.floor(state.distance)}m · ${finalLabel(state.score)}`);
      lines.push(bestLabel(best));
      drawPanel(
        state.escaped ? 'ESCAPED!' : 'CAUGHT!',
        lines,
        'Press Space or click to run again',
        state.escaped ? '#7fd86a' : PALETTE.danger,
      );
    }
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw };
}
