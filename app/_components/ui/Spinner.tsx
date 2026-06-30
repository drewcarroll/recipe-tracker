/**
 * A small animated loading indicator for the "waiting on the backend" states
 * across the app (recipes, history, a single recipe). Pair it with a short
 * label. The spin animation and styling live in `globals.css` (`.spinner` /
 * `.loading-note`).
 */
export function Spinner({ label }: { label?: string }): JSX.Element {
  return (
    <p className="loading-note" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      {label && <span>{label}</span>}
    </p>
  );
}
