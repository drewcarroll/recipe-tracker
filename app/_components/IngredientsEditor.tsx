'use client';

import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { useState } from 'react';

import type { Ingredient, IngredientInput } from '@application/types';

import { SaveControls, type SaveStatus } from './SaveControls';
import { Button } from './ui/Button';

/**
 * Editable Ingredients section (idea.md §2): each ingredient has a quantity,
 * unit, and name, with add / edit / remove / reorder (up/down buttons, matching
 * Steps — mobile-friendly, no drag). The whole list is saved at once via
 * `onSave` (the API replaces the recipe's ingredients), so the array order is
 * the stored order.
 */

interface Draft {
  key: string;
  quantity: string;
  unit: string;
  name: string;
}

function newKey(): string {
  return crypto.randomUUID();
}

function toDraft(ingredient: Ingredient): Draft {
  return {
    key: ingredient.id,
    quantity: ingredient.quantity,
    unit: ingredient.unit,
    name: ingredient.name,
  };
}

export function IngredientsEditor({
  initial,
  onSave,
}: {
  initial: Ingredient[];
  onSave: (items: IngredientInput[]) => Promise<void>;
}): JSX.Element {
  const [rows, setRows] = useState<Draft[]>(() => initial.map(toDraft));
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<SaveStatus>('idle');

  const mutate = (next: Draft[]): void => {
    setRows(next);
    setDirty(true);
    setStatus('idle');
  };

  const addRow = (): void => {
    mutate([...rows, { key: newKey(), quantity: '', unit: '', name: '' }]);
  };

  const removeRow = (key: string): void => {
    mutate(rows.filter((row) => row.key !== key));
  };

  const editRow = (key: string, field: keyof Omit<Draft, 'key'>, value: string): void => {
    mutate(rows.map((row) => (row.key === key ? { ...row, [field]: value } : row)));
  };

  const move = (index: number, delta: number): void => {
    const target = index + delta;
    if (target < 0 || target >= rows.length) {
      return;
    }
    const next = [...rows];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved as Draft);
    mutate(next);
  };

  const save = async (): Promise<void> => {
    setStatus('saving');
    const items: IngredientInput[] = rows
      .filter((row) => row.name.trim().length > 0)
      .map((row) => ({
        name: row.name.trim(),
        quantity: row.quantity.trim(),
        unit: row.unit.trim(),
      }));
    try {
      await onSave(items);
      setDirty(false);
      setStatus('saved');
    } catch {
      setStatus('error');
    }
  };

  return (
    <section className="editor-section">
      <header className="editor-section-head">
        <h2 className="editor-section-title">Ingredients</h2>
      </header>

      {rows.length === 0 ? (
        <p className="state-note">No ingredients yet.</p>
      ) : (
        <ul className="editor-list">
          {rows.map((row, index) => (
            <li key={row.key} className="ingredient-row">
              <input
                className="input input-qty"
                value={row.quantity}
                placeholder="1"
                aria-label="Quantity"
                onChange={(event) => editRow(row.key, 'quantity', event.target.value)}
              />
              <input
                className="input input-unit"
                value={row.unit}
                placeholder="cup"
                aria-label="Unit"
                onChange={(event) => editRow(row.key, 'unit', event.target.value)}
              />
              <input
                className="input"
                value={row.name}
                placeholder="Ingredient"
                aria-label="Ingredient name"
                onChange={(event) => editRow(row.key, 'name', event.target.value)}
              />
              <div className="reorder-buttons">
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Move up"
                  title="Move up"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ChevronUp size={16} strokeWidth={2.4} />
                </button>
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Move down"
                  title="Move down"
                  disabled={index === rows.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ChevronDown size={16} strokeWidth={2.4} />
                </button>
              </div>
              <button
                type="button"
                className="icon-button"
                aria-label="Remove ingredient"
                title="Remove"
                onClick={() => removeRow(row.key)}
              >
                <X size={16} strokeWidth={2.4} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="editor-section-foot">
        <Button variant="secondary" onClick={addRow}>
          + Add ingredient
        </Button>
        <SaveControls dirty={dirty} status={status} onSave={save} />
      </div>
    </section>
  );
}
