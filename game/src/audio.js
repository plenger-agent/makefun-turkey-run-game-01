// All sound is synthesised with WebAudio — no audio files, nothing fetched.
// One job: bleeps for jumps, corn, hits and fanfares, plus a small bass loop.
export function createAudio() {
  let context = null;
  let muted = false;
  let musicTimer = null;
  let musicStep = 0;

  // A minor-key bass walk that keeps the chase moving. Runs on a timer so the
  // game loop never waits on sound.
  const BASS = [110, 0, 130.8, 0, 98, 0, 146.8, 0, 110, 0, 130.8, 0, 164.8, 146.8, 130.8, 98];

  function ensure() {
    if (context === null) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      context = new AudioContext();
    }
    if (context.state === 'suspended') context.resume().catch(() => {});
    return context;
  }

  function tone(freq, dur, type, vol, slideTo) {
    if (muted) return;
    const ctx = ensure();
    if (ctx === null) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + dur);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  }

  function startMusic() {
    if (musicTimer !== null || muted) return;
    musicTimer = window.setInterval(() => {
      if (muted) return;
      const note = BASS[musicStep % BASS.length];
      musicStep += 1;
      if (note > 0) tone(note, 0.22, 'triangle', 0.05);
    }, 170);
  }

  function stopMusic() {
    if (musicTimer !== null) {
      window.clearInterval(musicTimer);
      musicTimer = null;
    }
  }

  return {
    unlock() {
      ensure();
      startMusic();
    },
    jump() {
      tone(280, 0.16, 'sine', 0.16, 560);
    },
    doubleJump() {
      tone(420, 0.14, 'sine', 0.14, 760);
    },
    corn() {
      tone(880, 0.09, 'square', 0.08);
      window.setTimeout(() => tone(1320, 0.12, 'square', 0.07), 70);
    },
    feather() {
      [660, 880, 1100, 1320].forEach((f, i) => window.setTimeout(() => tone(f, 0.12, 'sine', 0.1), i * 60));
    },
    hit() {
      tone(160, 0.3, 'sawtooth', 0.2, 60);
    },
    gobble() {
      // Two quick low blips: the turkey's opinion of the farmer.
      tone(220, 0.07, 'square', 0.1, 180);
      window.setTimeout(() => tone(200, 0.07, 'square', 0.1, 160), 90);
    },
    escaped() {
      stopMusic();
      [523, 659, 784, 1047].forEach((f, i) => window.setTimeout(() => tone(f, 0.28, 'triangle', 0.16), i * 130));
    },
    caught() {
      stopMusic();
      [392, 330, 262, 196].forEach((f, i) => window.setTimeout(() => tone(f, 0.3, 'sawtooth', 0.12), i * 150));
    },
    toggleMute() {
      muted = !muted;
      if (muted) stopMusic();
      else startMusic();
      return muted;
    },
    isMuted: () => muted,
  };
}
