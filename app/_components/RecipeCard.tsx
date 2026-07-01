import { getPastel } from '../_design/palette';
import { RecipeIcon } from './RecipeIcon';

/**
 * A recipe summary card (idea.md §2): colored icon tile + name + "Times cooked".
 * Purely presentational and theme-driven — it resolves the stored color/icon
 * keys through the design tokens. Renders as a button when `onClick` is given.
 */
export function RecipeCard({
  name,
  color,
  icon,
  timesCooked,
  onClick,
}: {
  name: string;
  color: string;
  icon: string;
  timesCooked: number;
  onClick?: () => void;
}): JSX.Element {
  const pastel = getPastel(color);

  const body = (
    <>
      <span
        className="recipe-card-icon"
        style={{ background: pastel.value, color: pastel.ink }}
        aria-hidden="true"
      >
        <RecipeIcon icon={icon} size={28} />
      </span>
      <span className="recipe-card-body">
        <span className="recipe-card-name">{name}</span>
        <span className="recipe-card-meta">Times cooked: {timesCooked}</span>
      </span>
    </>
  );

  if (onClick) {
    return (
      <button className="recipe-card recipe-card-button" type="button" onClick={onClick}>
        {body}
      </button>
    );
  }
  return <div className="recipe-card">{body}</div>;
}
