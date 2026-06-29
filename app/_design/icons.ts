/**
 * The curated, colorful/fun recipe icon set (idea.md §2). A recipe stores an
 * icon *key* (e.g. "pizza"); the UI resolves it to a glyph here. Like the
 * palette, the set of valid icons is a UI concern, so this is the single source
 * of truth and the backend keeps `icon` as a free-form string.
 */

export interface RecipeIconDef {
  /** Stable key persisted on the recipe. */
  key: string;
  /** Human-friendly name for the picker. */
  label: string;
  /** The emoji glyph rendered on cards. */
  glyph: string;
}

export const RECIPE_ICONS = [
  { key: 'pizza', label: 'Pizza', glyph: '🍕' },
  { key: 'pasta', label: 'Pasta', glyph: '🍝' },
  { key: 'salad', label: 'Salad', glyph: '🥗' },
  { key: 'taco', label: 'Taco', glyph: '🌮' },
  { key: 'sushi', label: 'Sushi', glyph: '🍣' },
  { key: 'burger', label: 'Burger', glyph: '🍔' },
  { key: 'soup', label: 'Soup', glyph: '🍲' },
  { key: 'bread', label: 'Bread', glyph: '🥖' },
  { key: 'pancakes', label: 'Pancakes', glyph: '🥞' },
  { key: 'egg', label: 'Egg', glyph: '🍳' },
  { key: 'chicken', label: 'Chicken', glyph: '🍗' },
  { key: 'steak', label: 'Steak', glyph: '🥩' },
  { key: 'fish', label: 'Fish', glyph: '🐟' },
  { key: 'rice', label: 'Rice', glyph: '🍚' },
  { key: 'noodles', label: 'Noodles', glyph: '🍜' },
  { key: 'curry', label: 'Curry', glyph: '🍛' },
  { key: 'dumpling', label: 'Dumpling', glyph: '🥟' },
  { key: 'cake', label: 'Cake', glyph: '🍰' },
  { key: 'cookie', label: 'Cookie', glyph: '🍪' },
  { key: 'fruit', label: 'Fruit', glyph: '🍓' },
  { key: 'veggies', label: 'Veggies', glyph: '🥦' },
  { key: 'drink', label: 'Drink', glyph: '🥤' },
] as const satisfies readonly RecipeIconDef[];

export type RecipeIconKey = (typeof RECIPE_ICONS)[number]['key'];

/** Default icon for new recipes. */
export const DEFAULT_ICON_KEY: RecipeIconKey = 'pasta';

/** Generic fallback glyph for an unknown key (a plate). */
const FALLBACK_GLYPH = '🍽️';

/** Resolve a (possibly unknown) key to its glyph, falling back to a plate. */
export function getRecipeIconGlyph(key: string): string {
  return RECIPE_ICONS.find((icon) => icon.key === key)?.glyph ?? FALLBACK_GLYPH;
}
