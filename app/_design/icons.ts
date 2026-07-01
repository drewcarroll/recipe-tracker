import {
  Beef,
  Cake,
  Carrot,
  Cherry,
  Cookie,
  CookingPot,
  Croissant,
  CupSoda,
  Donut,
  Drumstick,
  EggFried,
  Fish,
  FishSymbol,
  Hamburger,
  HandPlatter,
  type LucideIcon,
  Pizza,
  Salad,
  Sandwich,
  Shell,
  Soup,
  Utensils,
  Wheat,
} from 'lucide-react';

/**
 * The curated recipe icon set (idea.md §2). A recipe stores an icon *key*
 * (e.g. "pizza"); the UI resolves it to a line icon here. Like the palette, the
 * set of valid icons is a UI concern, so this is the single source of truth and
 * the backend keeps `icon` as a free-form string.
 *
 * Icons are drawn from the Lucide line-icon set for a clean, cohesive, modern
 * look (replacing the old emoji glyphs). Where Lucide has no exact match for a
 * cuisine, the closest food in the same family is used so the whole set stays
 * visually consistent.
 */

export interface RecipeIconDef {
  /** Stable key persisted on the recipe. */
  key: string;
  /** Human-friendly name for the picker. */
  label: string;
  /** The Lucide icon component rendered on cards and in the picker. */
  Icon: LucideIcon;
}

export const RECIPE_ICONS = [
  { key: 'pizza', label: 'Pizza', Icon: Pizza },
  { key: 'pasta', label: 'Pasta', Icon: Utensils },
  { key: 'salad', label: 'Salad', Icon: Salad },
  { key: 'taco', label: 'Taco', Icon: Sandwich },
  { key: 'sushi', label: 'Sushi', Icon: Fish },
  { key: 'burger', label: 'Burger', Icon: Hamburger },
  { key: 'soup', label: 'Soup', Icon: Soup },
  { key: 'bread', label: 'Bread', Icon: Croissant },
  { key: 'pancakes', label: 'Pancakes', Icon: Donut },
  { key: 'egg', label: 'Egg', Icon: EggFried },
  { key: 'chicken', label: 'Chicken', Icon: Drumstick },
  { key: 'steak', label: 'Steak', Icon: Beef },
  { key: 'fish', label: 'Fish', Icon: FishSymbol },
  { key: 'rice', label: 'Rice', Icon: Wheat },
  { key: 'noodles', label: 'Noodles', Icon: CookingPot },
  { key: 'curry', label: 'Curry', Icon: HandPlatter },
  { key: 'dumpling', label: 'Dumpling', Icon: Shell },
  { key: 'cake', label: 'Cake', Icon: Cake },
  { key: 'cookie', label: 'Cookie', Icon: Cookie },
  { key: 'fruit', label: 'Fruit', Icon: Cherry },
  { key: 'veggies', label: 'Veggies', Icon: Carrot },
  { key: 'drink', label: 'Drink', Icon: CupSoda },
] as const satisfies readonly RecipeIconDef[];

export type RecipeIconKey = (typeof RECIPE_ICONS)[number]['key'];

/** Default icon for new recipes. */
export const DEFAULT_ICON_KEY: RecipeIconKey = 'pasta';

/** Generic fallback icon for an unknown key. */
const FALLBACK_ICON: LucideIcon = Utensils;

/** Resolve a (possibly unknown) key to its Lucide icon component. */
export function getRecipeIcon(key: string): LucideIcon {
  return RECIPE_ICONS.find((icon) => icon.key === key)?.Icon ?? FALLBACK_ICON;
}
