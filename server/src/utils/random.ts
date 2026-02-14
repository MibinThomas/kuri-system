import crypto from "crypto";

/**
 * Creates a reproducible PRNG from a seed.
 * (So you can later audit how the winner was derived from eligible list + seed)
 */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeSeed() {
  return crypto.randomBytes(16).toString("hex");
}

export function pickWinner<T>(items: T[], seedHex: string) {
  if (items.length === 0) throw new Error("No eligible items");
  // Use first 8 hex chars as 32-bit seed
  const seedInt = parseInt(seedHex.slice(0, 8), 16) || 1;
  const rand = mulberry32(seedInt);
  const index = Math.floor(rand() * items.length);
  return { winner: items[index], index };
}
