// Gobble Dash — tuning, palette and stages. One job: every number the game
// balances on, in one place, so the world and the renderer agree.
export const FIELD = { width: 1280, height: 720, groundY: 620 };

export const STEP = 1 / 60;
export const BEST_KEY = 'gobble-dash-best';
export const ESCAPE_DISTANCE = 1200; // metres to the kitchen window: reach it and you are free
export const GRAVITY = 2400;
export const JUMP_SPEED = 1050;
export const DOUBLE_JUMP_SPEED = 900;
export const SLIDE_TIME = 0.55;

export const PLAYER = {
  x: 220,
  width: 60, // hitbox is a touch narrower than the drawing: near misses feel fair
  height: 78,
  slideHeight: 44,
  speed: 340, // world scroll speed at the start, px/s
  maxSpeed: 620,
  invulnerable: 1.6,
};

export const LIVES = 3;
export const CORN_POINTS = 50;
export const FEATHER_POINTS = 150;
export const METRE_POINTS = 1;

// Spawn pacing, in seconds between obstacles; tightens as the run goes on.
export const SPAWN = { start: 1.35, min: 0.62, tightenPerMetre: 0.00045 };
export const CORN_EVERY = 2.1; // seconds between corn chances
export const FEATHER_EVERY = 14; // seconds between golden-feather chances

export const FONT = '"Trebuchet MS", Verdana, sans-serif';
export const FONT_DISPLAY = '"Trebuchet MS", "Comic Sans MS", Verdana, sans-serif';

// Three stages of the escape, by distance. Each stage changes the sky, the
// ground and which dangers appear.
export const STAGES = [
  {
    name: 'THE FARMYARD',
    from: 0,
    skyTop: '#ffb347',
    skyBottom: '#ffe3a3',
    sun: '#fff3c4',
    ground: '#8a5a2b',
    groundDark: '#6e4520',
    grass: '#7fae4c',
    far: '#c98a4b',
    label: 'Dawn — the farmer is up',
  },
  {
    name: 'THE BARN',
    from: 400,
    skyTop: '#7ec8e3',
    skyBottom: '#dff3fa',
    sun: '#fffbe0',
    ground: '#9c6b33',
    groundDark: '#7d5426',
    grass: '#8fae4c',
    far: '#a9805a',
    label: 'Midday — knives in the rafters',
  },
  {
    name: 'THE KITCHEN',
    from: 800,
    skyTop: '#5a3d6e',
    skyBottom: '#e08a4b',
    sun: '#ffd9a0',
    ground: '#7a4a30',
    groundDark: '#5f3823',
    grass: '#6e8a3c',
    far: '#8a5a6e',
    label: 'Dusk — the oven is hot',
  },
];

export const PALETTE = {
  backdrop: '#2b1d16',
  panel: 'rgba(43, 29, 22, 0.88)',
  panelEdge: '#e8a13c',
  text: '#fff6e0',
  muted: '#f2d5a0',
  accent: '#ffb02e',
  danger: '#ff5a3c',
  turkey: '#8a5a2b',
  turkeyDark: '#6e4520',
  tail: ['#c96a1e', '#e8a13c', '#a03d1e'],
  head: '#e8d8b0',
  wattle: '#d92b1f',
  beak: '#f2a007',
  farmerShirt: '#4a7ec2',
  farmerOveralls: '#3a5a8a',
  farmerHat: '#e8c85a',
  farmerSkin: '#f2c89a',
  knife: '#dfe6ea',
  knifeEdge: '#ffffff',
  oven: '#4a4a52',
  ovenFire: '#ff7a1e',
  corn: '#ffd23c',
  feather: '#ffd700',
  heart: '#ff4d6d',
  heartEmpty: 'rgba(255, 255, 255, 0.25)',
};
