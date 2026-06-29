/**
 * The fixed pastel palette (idea.md §2). A recipe stores a palette *key*
 * (e.g. "mint"); the UI resolves it to the actual colors here. Palette
 * membership is a UI concern, so this is the single source of truth and the
 * backend keeps `color` as a free-form string.
 *
 * The same keys/values are mirrored as CSS custom properties (`--pastel-*`) in
 * `globals.css`, so the palette is available both as TypeScript tokens and as
 * CSS tokens.
 */

export interface Pastel {
  /** Stable key persisted on the recipe. */
  key: string;
  /** Human-friendly name for pickers. */
  label: string;
  /** The pastel fill color. */
  value: string;
  /** A readable foreground (text/icon) color to use on top of `value`. */
  ink: string;
}

export const PASTELS = [
  { key: 'blush', label: 'Blush', value: '#fcdcdc', ink: '#7a2e2e' },
  { key: 'peach', label: 'Peach', value: '#ffe3c9', ink: '#8a4b1e' },
  { key: 'butter', label: 'Butter', value: '#fbf0c0', ink: '#73600a' },
  { key: 'mint', label: 'Mint', value: '#d4f0dd', ink: '#1f6b43' },
  { key: 'sky', label: 'Sky', value: '#d6e8fb', ink: '#1d4e7a' },
  { key: 'lavender', label: 'Lavender', value: '#e6dcfb', ink: '#523a85' },
  { key: 'rose', label: 'Rose', value: '#fbd9ec', ink: '#8a2f63' },
  { key: 'sage', label: 'Sage', value: '#e4ebd4', ink: '#4f5f30' },
] as const satisfies readonly Pastel[];

export type PastelKey = (typeof PASTELS)[number]['key'];

/** Default pastel for new recipes. */
export const DEFAULT_PASTEL_KEY: PastelKey = 'blush';

/** Resolve a (possibly unknown) key to a Pastel, falling back to the default. */
export function getPastel(key: string): Pastel {
  return PASTELS.find((pastel) => pastel.key === key) ?? PASTELS[0];
}
