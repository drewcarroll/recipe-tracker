/**
 * Presentation-only theming for recipe cards.
 *
 * A recipe's pastel colour and colourful icon are pure UI affordances — they
 * are not business data, so they live in the presentation layer and are
 * derived deterministically from the recipe id. The same recipe therefore
 * always renders with the same colour and icon.
 */

const PASTELS = [
  '#ffd6e0', // pink
  '#ffe9c7', // peach
  '#fff5ba', // butter
  '#d6f5d6', // mint
  '#c7ecff', // sky
  '#e0d6ff', // lavender
  '#ffd6c7', // coral
  '#d6fff2', // aqua
] as const;

const ICONS = ['🍝', '🥗', '🍲', '🍜', '🥘', '🍱', '🌮', '🍛', '🥧', '🧁'] as const;

/** Stable, well-distributed hash for a string (djb2). */
function hash(value: string): number {
  let h = 5381;
  for (let i = 0; i < value.length; i += 1) {
    h = (h * 33) ^ value.charCodeAt(i);
  }
  return h >>> 0;
}

export interface RecipeTheme {
  color: string;
  icon: string;
}

export function themeForRecipe(id: string): RecipeTheme {
  const h = hash(id);
  return {
    color: PASTELS[h % PASTELS.length]!,
    icon: ICONS[Math.floor(h / PASTELS.length) % ICONS.length]!,
  };
}
