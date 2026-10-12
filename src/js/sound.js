// sound.js — background music and sound effects, synthesised with Web Audio (no audio files).
import { SET } from './core.js';

let Sound;


export function init() {
/* ---------- sound: everything synthesized with Web Audio, no audio files ---------- */
Sound = (() => {
  const MUTE_KEY = 'soba-ketto.muted';
  let muted = (() => { try { return localStorage.getItem(MUTE_KEY) === '1'; } catch (e) { return false; } })();
  let ctx = null, master, music, sfx, noiseBuf;
  let playing = false, timer = 0, nextTime = 0;
  const MUSIC_BASE = 0.34, DUCK_BASE = 0.3;
  let volM = SET.music / 100, volS = SET.sfx / 100;
  const MV = () => MUSIC_BASE * volM, DV = () => DUCK_BASE * volM;
  const hz = (base, semi) => base * Math.pow(2, semi / 12);
  const D2 = 73.42, D3 = 146.83, D4 = 293.66;

  function ensure() {
    if (!ctx && navigator.userActivation && !navigator.userActivation.hasBeenActive) return null; // wait for a tap before creating audio
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = muted ? 0 : 0.9;
      const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
      master.connect(comp).connect(ctx.destination);
      music = ctx.createGain(); music.gain.value = MV(); music.connect(master);
      sfx = ctx.createGain(); sfx.gain.value = 0.7 * volS; sfx.connect(master);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function env(g, t, peak, attack, dur) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }
  function osc(t, { type = 'sine', freq = 440, freqEnd, dur = 0.3, gain = 0.2, attack = 0.005, dest = sfx, cutoff }) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    env(g, t, gain, attack, dur);
    let node = o;
    if (cutoff) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cutoff; o.connect(f); node = f; }
    node.connect(g).connect(dest); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(t, { dur = 0.2, gain = 0.3, type = 'bandpass', freq = 1200, freqEnd, q = 1, attack = 0.005, dest = sfx }) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; f.type = type; f.Q.value = q; f.frequency.setValueAtTime(freq, t);
    if (freqEnd) f.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    env(g, t, gain, attack, dur);
    s.connect(f).connect(g).connect(dest); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }
  /* instruments */
  function taiko(t, dest, big = false) {
    osc(t, { freq: big ? 120 : 160, freqEnd: big ? 42 : 60, dur: big ? 0.7 : 0.35, gain: big ? 0.9 : 0.6, dest });
    noise(t, { dur: 0.07, gain: big ? 0.35 : 0.2, type: 'lowpass', freq: 900, dest });
  }
  function koto(t, freq, dest, dur = 0.7, gain = 0.16) {
    const f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = 'lowpass'; f.Q.value = 3; f.frequency.setValueAtTime(5200, t); f.frequency.exponentialRampToValueAtTime(Math.max(freq * 1.6, 300), t + 0.25);
    env(g, t, gain, 0.003, dur);
    [['sawtooth', 1], ['triangle', 1.003]].forEach(([type, mul]) => { const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq * mul; o.connect(f); o.start(t); o.stop(t + dur + 0.05); });
    f.connect(g).connect(dest);
  }
  function bass(t, freq, dest, len = 2.4, gain = 0.12) { osc(t, { type: 'square', freq, dur: stepLen() * len, gain, cutoff: 380, dest }); }
  function shaker(t, dest, accent) { noise(t, { dur: 0.045, gain: accent ? 0.07 : 0.035, type: 'highpass', freq: 7000, dest }); }
  function gong(t, dest = sfx, gain = 0.25) {
    [[98, 1], [196.5, 0.5], [262, 0.35], [311, 0.25], [523, 0.12]].forEach(([f, k]) => osc(t, { freq: f, freqEnd: f * 0.99, dur: 2.6, gain: gain * k, attack: 0.01, dest }));
  }
  /* shamisen: bright plucked string with a small pitch scoop and a bachi click */
  function shamisen(t, freq, dest, dur = 0.4, gain = 0.12) {
    const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(freq * 1.03, t); o.frequency.exponentialRampToValueAtTime(freq, t + 0.04);
    f.type = 'bandpass'; f.frequency.value = Math.min(freq * 3, 6000); f.Q.value = 1.1;
    env(g, t, gain, 0.002, dur);
    o.connect(f).connect(g).connect(dest); o.start(t); o.stop(t + dur + 0.05);
    noise(t, { dur: 0.025, gain: gain * 0.5, type: 'highpass', freq: 3500, dest });
  }
  /* shakuhachi-like flute: sine with breath noise and slow vibrato */
  function flute(t, freq, dest, dur = 1.2, gain = 0.07) {
    const o = ctx.createOscillator(), lfo = ctx.createOscillator(), lg = ctx.createGain(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    lfo.frequency.value = 5; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(freq * 0.008, t + dur * 0.6);
    lfo.connect(lg).connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + Math.min(0.25, dur * 0.3));
    g.gain.setValueAtTime(gain, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(dest); o.start(t); lfo.start(t); o.stop(t + dur + 0.05); lfo.stop(t + dur + 0.05);
    noise(t, { dur: dur * 0.8, gain: gain * 0.3, type: 'bandpass', freq: freq * 2, q: 4, attack: 0.15, dest });
  }
  function pad(t, freqs, dur, dest, gain = 0.03) {
    freqs.forEach(f => [1, 1.005].forEach(m => osc(t, { type: 'triangle', freq: f * m, dur, gain, attack: dur * 0.35, dest })));
  }

  /* ---------- adaptive BGM ----------
     Phrases are generated from short motifs in the Japanese In scale (D Eb G A Bb), so the music never loops verbatim.
     Four section types rotate: A main theme (koto), B contrast (shamisen + counter-line), C breakdown (shakuhachi + drone),
     D climax (double taiko, unison lead). Mood follows the duel: ally / foe turn, low-funds danger, and a quiet "thinking"
     layer while a question is open. */
  let bpm = 128, mood = 'ally', danger = false, thinking = false;
  const stepLen = () => 60 / bpm / 4;
  const SC = [0, 1, 5, 7, 8];
  const deg = d => { const o = Math.floor(d / 5), m = ((d % 5) + 5) % 5; return SC[m] + 12 * o; };
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const MOTIFS = [
    [[0, 5, 2], [2, 4, 2], [4, 3, 2], [6, 4, 2]],
    [[0, 0, 1], [1, 1, 1], [2, 2, 2], [4, 3, 3], [7, 2, 1]],
    [[0, 3, 3], [3, 4, 1], [4, 5, 4]],
    [[0, 4, 1], [1, 3, 1], [2, 4, 2], [4, 2, 2], [6, 1, 2]],
    [[0, 2, 4], [4, 1, 2], [6, 0, 2]],
    [[0, 5, 1], [2, 5, 1], [3, 4, 1], [4, 5, 2], [6, 7, 2]],
    [[0, 0, 2], [4, 0, 1], [5, 1, 1], [6, 2, 2]],
    [[0, 3, 2], [2, 2, 1], [3, 3, 1], [4, 4, 4]],
    [],
  ];
  const HALF_CAD = [[0, 3, 2], [2, 2, 2], [4, 3, 4]];
  const CADENCE = [[0, 2, 2], [2, 1, 2], [4, 0, 4]];
  const TAIKO_PAT = {
    A: { 0: 2, 6: 1, 8: 2, 12: 1, 14: 1 },
    B: { 0: 2, 3: 1, 6: 1, 8: 2, 10: 1, 12: 1, 13: 1, 14: 1 },
    C: { 0: 1 },
    D: { 0: 2, 2: 1, 4: 2, 6: 1, 8: 2, 10: 1, 12: 2, 14: 1, 15: 1 },
    foe: { 0: 2, 4: 1, 6: 2, 8: 2, 11: 1, 12: 2, 14: 1 },
  };
  const FILLS = [[8, 10, 12, 14], [12, 13, 14, 15], [8, 11, 12, 14, 15], [10, 12, 13, 14, 15]];
  const ROOTS = { A: [0, 0, -4, -5], B: [5, 5, 0, -5], C: [0, -4, 0, -5], D: [0, 1, -4, -5] };
  const BASS_STEPS = { A: [0, 3, 6, 8, 11, 14], B: [0, 2, 4, 6, 8, 10, 12, 14], D: [0, 3, 6, 8, 10, 11, 14] };
  let cur = null, step = 0, history = [];
  function genPhrase(type) {
    const notes = new Map(), stretch = type === 'C';
    const a = pick(MOTIFS), b = pick(MOTIFS), c = pick(MOTIFS), tr = pick([0, 0, 1, 2]);
    const plan = [[a, b, tr], [c, HALF_CAD, 0], [a, b, tr + 1], [pick(MOTIFS), CADENCE, 0]];
    plan.forEach(([m1, m2, t], bar) => {
      (stretch ? [m1] : [m1, m2]).forEach((m, half) => m.forEach(([o, d, l]) => {
        const at = bar * 16 + (stretch ? o * 2 : half * 8 + o);
        if (at < bar * 16 + 16) notes.set(at, { semi: deg(d + t), len: stretch ? l * 2 : l, grace: !stretch && Math.random() < 0.18 });
      }));
    });
    return notes;
  }
  function nextType() {
    if (!history.length) return 'A';
    const n = history.length, last2 = history.slice(-2);
    if (mood !== 'foe' && n % 5 === 4 && !history.slice(-4).includes('C')) return 'C';
    const pool = mood === 'foe' ? ['B', 'D', 'A', 'B', 'D'] : danger ? ['D', 'B', 'A', 'D'] : ['A', 'A', 'B', 'B', 'D', 'C'];
    let t, guard = 0;
    do { t = pick(pool); } while (last2.length === 2 && last2[0] === t && last2[1] === t && guard++ < 10);
    return t;
  }
  function newSection(t) {
    const type = nextType(); history.push(type); if (history.length > 12) history.shift();
    const voice = type === 'C' ? 'flute' : type === 'B' ? 'shamisen' : type === 'D' ? 'unison' : (mood === 'foe' ? 'shamisen' : 'koto');
    cur = { type, voice, notes: genPhrase(type), fill: pick(FILLS), counter: type === 'B' || (type === 'A' && Math.random() < 0.4) };
    if (type === 'D') gong(t, music, 0.12);
  }
  function playNote(n, t) {
    const lift = cur.type === 'D' ? 12 : 0, low = mood === 'foe' && cur.voice === 'shamisen' ? -12 : 0;
    const f = hz(D4, n.semi + lift + low), dur = n.len * stepLen();
    if (n.grace) koto(t - stepLen() * 0.35, hz(D4, n.semi + lift + low + 2), music, 0.25, 0.05);
    if (cur.voice === 'koto') koto(t, f, music, dur * 1.4 + 0.25, 0.15);
    else if (cur.voice === 'shamisen') shamisen(t, f, music, Math.min(0.5, dur + 0.15), 0.12);
    else if (cur.voice === 'flute') flute(t, f, music, dur + 0.3, 0.075);
    else { koto(t, f, music, dur * 1.4 + 0.25, 0.12); shamisen(t, f / 2, music, Math.min(0.45, dur + 0.1), 0.08); }
  }
  function playStep(t) {
    const inSec = step % 64, bar = inSec >> 4, s16 = inSec % 16;
    if (inSec === 0) newSection(t);
    if (s16 === 0) bpm = danger ? 142 : mood === 'foe' ? 134 : 128;
    const type = cur.type, root = ROOTS[type][bar];
    if (thinking) {
      // question open: soft drone and a sparse koto so the player can concentrate
      if (s16 === 0) pad(t, [hz(D3, root), hz(D3, root + 7), hz(D4, root)], stepLen() * 16, music, 0.07);
      if (s16 === 8 && bar % 2 === 0) koto(t, hz(D4, deg(pick([0, 2, 3, 4, 5]))), music, 1.6, 0.14);
      if (s16 % 4 === 0) noise(t, { dur: 0.03, gain: 0.05, freq: 1800, q: 8, dest: music });
      step++; return;
    }
    const pat = mood === 'foe' && type !== 'C' ? TAIKO_PAT.foe : TAIKO_PAT[type];
    if (bar === 3 && type !== 'C' && cur.fill.includes(s16)) taiko(t, music, s16 === cur.fill[cur.fill.length - 1]);
    else if (pat[s16]) taiko(t, music, pat[s16] === 2);
    if (type !== 'C') {
      if (s16 % 2 === 0) shaker(t, music, s16 % 4 === 2);
      if (danger && s16 % 2 === 1) shaker(t, music, false);
    }
    if (type === 'C') { if (s16 === 0) pad(t, [hz(D3, root), hz(D3, root + 7), hz(D4, root)], stepLen() * 16, music, 0.03); }
    else if (BASS_STEPS[type].includes(s16)) bass(t, hz(D2, root + (mood === 'foe' ? -12 : 0) + (s16 === 14 ? 12 : 0)), music);
    if (danger && s16 % 4 === 0) osc(t, { type: 'sine', freq: hz(D2, root - 12), freqEnd: hz(D2, root - 14), dur: stepLen() * 3, gain: 0.12, dest: music });
    const n = cur.notes.get(inSec); if (n) playNote(n, t);
    if (cur.counter && (bar === 1 || bar === 3) && s16 % 4 === 2) koto(t, hz(D3, deg(pick([0, 2, 3, 4]))), music, 0.4, 0.05);
    step++;
  }
  function schedule() {
    if (!playing || !ctx) return;
    while (nextTime < ctx.currentTime + 0.15) { playStep(nextTime); nextTime += stepLen(); }
  }
  function startBGM() {
    if (!ensure()) return;
    if (playing) return;
    playing = true; step = 0; history = []; mood = 'ally'; danger = false; thinking = false; bpm = 128;
    music.gain.cancelScheduledValues(ctx.currentTime); music.gain.setValueAtTime(MV(), ctx.currentTime);
    nextTime = ctx.currentTime + 0.08;
    clearInterval(timer); timer = setInterval(schedule, 25); schedule();
  }
  function stopBGM() {
    playing = false; clearInterval(timer);
    if (ctx) { music.gain.cancelScheduledValues(ctx.currentTime); music.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.12); setTimeout(() => { if (!playing && ctx) music.gain.setValueAtTime(MV(), ctx.currentTime); }, 900); }
  }
  function duck(on) {
    thinking = !!on;
    if (!ctx || !playing) return;
    music.gain.cancelScheduledValues(ctx.currentTime); music.gain.setTargetAtTime(on ? DV() : MV(), ctx.currentTime, 0.3);
  }
  function setVolume(m, x) {
    volM = Math.max(0, Math.min(1, m)); volS = Math.max(0, Math.min(1, x));
    if (!ctx) return;
    sfx.gain.setTargetAtTime(0.7 * volS, ctx.currentTime, 0.05);
    if (playing) { music.gain.cancelScheduledValues(ctx.currentTime); music.gain.setTargetAtTime(thinking ? DV() : MV(), ctx.currentTime, 0.05); }
  }
  function setMood(m) { mood = m === 'foe' ? 'foe' : 'ally'; }
  function setDanger(on) { danger = !!on; }
  const _debug = () => ({ step, bpm, mood, danger, thinking, section: cur && cur.type, history: history.slice() });
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend();
    else { ctx.resume(); if (playing) nextTime = Math.max(nextTime, ctx.currentTime + 0.05); }
  });

  /* sound effects */
  const run = fn => { if (!ensure()) return; fn(ctx.currentTime + 0.01); };
  const fx = {
    trans: tone => run(t => {
      noise(t, { dur: 0.45, gain: 0.35, freq: 300, freqEnd: 4500, q: 0.8, attack: 0.15 });
      if (tone === 'foe') { taiko(t + 0.36, sfx, true); osc(t + 0.36, { type: 'sawtooth', freq: 73, dur: 0.6, gain: 0.08, cutoff: 300 }); }
      else if (tone === 'gold' || tone === 'lose') gong(t + 0.36, sfx, tone === 'lose' ? 0.18 : 0.25);
      else { taiko(t + 0.36, sfx, true); koto(t + 0.4, hz(D4, 12), sfx, 0.5, 0.12); }
    }),
    select: () => run(t => koto(t, hz(D4, 7), sfx, 0.25, 0.1)),
    skill: () => run(t => {
      [12, 17, 19, 24].forEach((s, i) => koto(t + i * 0.045, hz(D4, s), sfx, 0.6, 0.1));
      noise(t, { dur: 0.5, gain: 0.12, type: 'highpass', freq: 5000, freqEnd: 10000, attack: 0.05 });
      osc(t + 0.18, { type: 'sine', freq: hz(D4, 31), dur: 0.8, gain: 0.05 });
    }),
    summon: () => run(t => {
      noise(t, { dur: 0.35, gain: 0.18, type: 'highpass', freq: 2000, freqEnd: 8000, attack: 0.05 });
      [0, 5, 7, 12].forEach((s, i) => koto(t + i * 0.055, hz(D4, s), sfx, 0.4, 0.11));
    }),
    open: () => run(t => { osc(t, { type: 'triangle', freq: hz(D4, 12), dur: 0.5, gain: 0.12 }); osc(t + 0.08, { type: 'triangle', freq: hz(D4, 19), dur: 0.5, gain: 0.08 }); }),
    tick: () => run(t => { noise(t, { dur: 0.04, gain: 0.25, freq: 2600, q: 6 }); osc(t, { type: 'square', freq: 1320, dur: 0.05, gain: 0.04 }); }),
    correct: () => run(t => { koto(t, hz(D4, 12), sfx, 0.5, 0.16); koto(t + 0.09, hz(D4, 19), sfx, 0.8, 0.16); osc(t + 0.09, { type: 'sine', freq: hz(D4, 31), dur: 0.9, gain: 0.05 }); }),
    wrong: () => run(t => { osc(t, { type: 'sawtooth', freq: 110, freqEnd: 70, dur: 0.45, gain: 0.18, cutoff: 600 }); osc(t, { type: 'square', freq: 116, freqEnd: 74, dur: 0.45, gain: 0.08, cutoff: 500 }); }),
    swing: () => run(t => noise(t, { dur: 0.32, gain: 0.4, freq: 600, freqEnd: 3000, q: 1.5, attack: 0.12 })),
    hit: amt => run(t => {
      const big = amt >= 1500;
      taiko(t, sfx, true);
      noise(t, { dur: big ? 0.5 : 0.3, gain: big ? 0.5 : 0.35, type: 'lowpass', freq: 2400, freqEnd: 200 });
      if (big) osc(t, { type: 'sawtooth', freq: 60, freqEnd: 30, dur: 0.6, gain: 0.15, cutoff: 200 });
    }),
    shatter: () => run(t => { noise(t, { dur: 0.5, gain: 0.3, type: 'highpass', freq: 3000, freqEnd: 9000 }); [0, 1, 2].forEach(i => osc(t + i * 0.04, { type: 'triangle', freq: 1800 + Math.random() * 1600, dur: 0.18, gain: 0.05 })); }),
    jingle: win => run(t => {
      if (win) { [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => koto(t + i * 0.09, hz(D4, s), sfx, 1.2, 0.14)); taiko(t, sfx, true); taiko(t + 0.63, sfx, true); }
      else { [12, 8, 7, 1, 0].forEach((s, i) => koto(t + i * 0.32, hz(D3, s), sfx, 1.4, 0.15)); taiko(t + 1.3, sfx, true); }
    }),
  };

  function setMuted(m) {
    muted = m;
    try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch (e) {}
    if (ctx) master.gain.setTargetAtTime(m ? 0 : 0.9, ctx.currentTime, 0.05);
  }
  return { ...fx, startBGM, stopBGM, duck, setVolume, get vol() { return { music: volM, sfx: volS }; }, setMood, setDanger, _debug, setMuted, get muted() { return muted; } };
})();
}

export { Sound };
