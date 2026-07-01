'use client';

import { Check } from 'lucide-react';

import { PASTELS } from '../_design/palette';

/** Selectable pastel swatches for choosing a recipe's color (idea.md §2). */
export function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (key: string) => void;
}): JSX.Element {
  return (
    <div className="swatch-grid" role="radiogroup" aria-label="Recipe color">
      {PASTELS.map((pastel) => {
        const selected = pastel.key === value;
        return (
          <button
            key={pastel.key}
            type="button"
            className={`swatch${selected ? ' swatch-selected' : ''}`}
            style={{ background: pastel.value, color: pastel.ink }}
            role="radio"
            aria-checked={selected}
            aria-label={pastel.label}
            title={pastel.label}
            onClick={() => onChange(pastel.key)}
          >
            {selected ? <Check size={18} strokeWidth={3} /> : ''}
          </button>
        );
      })}
    </div>
  );
}
