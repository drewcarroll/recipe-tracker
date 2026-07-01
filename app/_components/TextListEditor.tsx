'use client';

import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';

import { SaveControls, type SaveStatus } from './SaveControls';
import { Button } from './ui/Button';

/**
 * Editable list of single-text items, used for the Prep and Steps sections
 * (idea.md §2). Supports add / edit / remove, and — for Steps — reorder via
 * up/down buttons (mobile-friendly, no drag) and a sequential number. The whole
 * list is saved at once via `onSave`, so the array order is the stored order.
 *
 * Each item is edited in an auto-growing textarea so that long text wraps and
 * the field grows in vertical length instead of clipping the overflow.
 */

/**
 * A textarea that grows to fit its content (no inner scrollbar), so long step
 * or prep text stays fully visible instead of being hidden on overflow.
 */
function AutoGrowTextarea({
  value,
  onChange,
  placeholder,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
}): JSX.Element {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      className="input input-grow"
      rows={1}
      value={value}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

interface Draft {
  key: string;
  text: string;
}

interface TextItem {
  id: string;
  text: string;
}

function newKey(): string {
  return crypto.randomUUID();
}

export function TextListEditor({
  title,
  initial,
  onSave,
  addLabel,
  placeholder,
  ordered = false,
  reorderable = false,
  emptyNote,
}: {
  title: string;
  initial: TextItem[];
  onSave: (items: { text: string }[]) => Promise<void>;
  addLabel: string;
  placeholder: string;
  ordered?: boolean;
  reorderable?: boolean;
  emptyNote: string;
}): JSX.Element {
  const [rows, setRows] = useState<Draft[]>(() =>
    initial.map((item) => ({ key: item.id, text: item.text })),
  );
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<SaveStatus>('idle');

  const mutate = (next: Draft[]): void => {
    setRows(next);
    setDirty(true);
    setStatus('idle');
  };

  const addRow = (): void => {
    mutate([...rows, { key: newKey(), text: '' }]);
  };

  const removeRow = (key: string): void => {
    mutate(rows.filter((row) => row.key !== key));
  };

  const editRow = (key: string, text: string): void => {
    mutate(rows.map((row) => (row.key === key ? { ...row, text } : row)));
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
    const items = rows
      .filter((row) => row.text.trim().length > 0)
      .map((row) => ({ text: row.text.trim() }));
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
        <h2 className="editor-section-title">{title}</h2>
      </header>

      {rows.length === 0 ? (
        <p className="state-note">{emptyNote}</p>
      ) : (
        <ul className="editor-list">
          {rows.map((row, index) => (
            <li key={row.key} className="text-row">
              {ordered && <span className="text-row-number">{index + 1}</span>}
              <AutoGrowTextarea
                value={row.text}
                placeholder={placeholder}
                ariaLabel={`${title} item ${index + 1}`}
                onChange={(value) => editRow(row.key, value)}
              />
              {reorderable && (
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
              )}
              <button
                type="button"
                className="icon-button"
                aria-label={`Remove ${title} item`}
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
          {addLabel}
        </Button>
        <SaveControls dirty={dirty} status={status} onSave={save} />
      </div>
    </section>
  );
}
