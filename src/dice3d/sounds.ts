// Dice clatter sounds: Kenney "Casino Audio" (CC0), converted to m4a so they
// play on iOS as well (assets/sounds/LICENSE-kenney-casino-audio.txt).
// Players are created on first use; on iOS they follow the silent switch.
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';

const SINGLE = [
  require('../../assets/sounds/die-throw-1.m4a'),
  require('../../assets/sounds/die-throw-2.m4a'),
  require('../../assets/sounds/die-throw-3.m4a'),
  require('../../assets/sounds/die-throw-4.m4a'),
];
const MANY = [
  require('../../assets/sounds/dice-throw-1.m4a'),
  require('../../assets/sounds/dice-throw-2.m4a'),
  require('../../assets/sounds/dice-throw-3.m4a'),
];

const players = new Map<number, AudioPlayer>();

function player(source: number): AudioPlayer {
  let p = players.get(source);
  if (!p) {
    p = createAudioPlayer(source);
    players.set(source, p);
  }
  return p;
}

/** Loads the clips ahead of time so the first roll isn't silent while they load. */
export function preloadDiceSounds() {
  try {
    [...SINGLE, ...MANY].forEach(player);
  } catch {
    // Audio unavailable (e.g. tests); rolls still work silently.
  }
}

/** Plays a random clatter: one die, or several dice together. */
export function playClatter(diceCount: number) {
  try {
    const set = diceCount > 1 ? MANY : SINGLE;
    const p = player(set[Math.floor(Math.random() * set.length)]);
    p.seekTo(0);
    p.play();
  } catch {
    // Never let a sound problem interrupt a roll.
  }
}
