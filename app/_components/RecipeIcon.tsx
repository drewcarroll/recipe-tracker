import { getRecipeIconGlyph } from '../_design/icons';

/** Renders a recipe's curated icon glyph from its stored key. */
export function RecipeIcon({
  icon,
  label,
  className,
}: {
  icon: string;
  label?: string;
  className?: string;
}): JSX.Element {
  return (
    <span className={className} role="img" aria-label={label ?? `${icon} icon`}>
      {getRecipeIconGlyph(icon)}
    </span>
  );
}
