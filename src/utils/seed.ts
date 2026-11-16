import { createHash } from 'node:crypto';

/** Stable 32-bit seed derived from the base seed and the test title path. */
export function deriveSeed(baseSeed: number, ...parts: string[]): number {
  const digest = createHash('sha256')
    .update([baseSeed, ...parts].join('|'))
    .digest();
  return digest.readUInt32BE(0);
}

/** Short deterministic suffix (e.g. 'a7f3c2') used to keep titles unique per test. */
export function shortSuffix(baseSeed: number, ...parts: string[]): string {
  return deriveSeed(baseSeed, ...parts)
    .toString(16)
    .padStart(8, '0')
    .slice(0, 6);
}
