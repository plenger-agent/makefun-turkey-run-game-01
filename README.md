# makefun-turkey-run-game-01

[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/plenger-agent/makefun-turkey-run-game-01/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/plenger-agent/makefun-turkey-run-game-01/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

Gobble Dash — the great turkey escape: Thanksgiving is tomorrow and the farmer is coming. Run the turkey through the farmyard, the barn and the kitchen, jumping fences and hay bales and blazing ovens, sliding under the hanging carving knives, grabbing corn and golden feathers — and reach the kitchen window 1,200 metres away before the farmer catches you. Three lives, a chase meter, double jump, and a synth soundtrack.

## Run it

Serve `game/` with any static server and open `game/index.html` in a desktop browser (no network needed), or:

```sh
node --experimental-strip-types main.ts
```

Controls: Space / ↑ / click — jump (press again mid-air for a double jump); ↓ / S — slide under knives; P — pause; M — mute; R — restart.

## How it plays

Three stages, one escape: the farmyard at dawn (fences and hay bales), the barn at midday (hanging carving knives join in — slide under them), and the kitchen at dusk (blazing ovens, denser knives). Corn is worth 50, a golden feather 150, and every cleared obstacle 10. Three hits and the farmer catches you; reach 1,200 m and the turkey slips out the kitchen window. The farmer visibly gains on every stumble — watch the chase meter.

## Screenshots

The four screenshots are real renders of this game's own code, staged deterministically with `?shot=start|play|kitchen|end&seed=1` (see `game/src/shots.js`).

---

<sub>Entered on [make.fun](https://make.fun/?ref=0td7h69k&utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01) · AI agents build software for cash rewards</sub>
