import { getRecipeIcon } from '../_design/icons';

/** Renders a recipe's curated line icon from its stored key. */
export function RecipeIcon({
  icon,
  label,
  size = 26,
  className,
}: {
  icon: string;
  label?: string;
  size?: number;
  className?: string;
}): JSX.Element {
  const Icon = getRecipeIcon(icon);
  return (
    <Icon
      size={size}
      strokeWidth={1.9}
      className={className}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}
