'use client';

import { RECIPE_ICONS } from '../_design/icons';

/** Selectable grid of the curated recipe icons (idea.md §2). */
export function IconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (key: string) => void;
}): JSX.Element {
  return (
    <div className="icon-grid" role="radiogroup" aria-label="Recipe icon">
      {RECIPE_ICONS.map((icon) => {
        const selected = icon.key === value;
        return (
          <button
            key={icon.key}
            type="button"
            className={`icon-option${selected ? ' icon-option-selected' : ''}`}
            role="radio"
            aria-checked={selected}
            aria-label={icon.label}
            title={icon.label}
            onClick={() => onChange(icon.key)}
          >
            <icon.Icon size={24} strokeWidth={1.9} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
