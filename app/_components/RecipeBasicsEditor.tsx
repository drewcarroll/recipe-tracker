'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { RecipeBasics } from '@application/types';

import { ColorPicker } from './ColorPicker';
import { IconPicker } from './IconPicker';
import { RecipeIcon } from './RecipeIcon';
import { Button } from './ui/Button';
import { getPastel } from '../_design/palette';

/**
 * Recipe basic-info header with Edit and Delete actions (idea.md §2). In view
 * mode it shows the colored icon tile + name; Edit reveals a name field plus
 * the color and icon pickers; Delete asks for inline confirmation, then removes
 * the recipe and returns to the list. All writes go through `/api/recipes/[id]`.
 */
export function RecipeBasicsEditor({
  recipeId,
  username,
  name,
  color,
  icon,
  onSaved,
}: {
  recipeId: string;
  username: string | null;
  name: string;
  color: string;
  icon: string;
  onSaved: (basics: RecipeBasics) => void;
}): JSX.Element {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(name);
  const [draftColor, setDraftColor] = useState(color);
  const [draftIcon, setDraftIcon] = useState(icon);
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pastel = getPastel(color);
  const trimmedName = draftName.trim();

  const startEditing = (): void => {
    setDraftName(name);
    setDraftColor(color);
    setDraftIcon(icon);
    setError(null);
    setEditing(true);
  };

  const save = async (): Promise<void> => {
    if (trimmedName.length === 0 || saving) {
      return;
    }
    setSaving(true);
    setError(null);
    const basics: RecipeBasics = { name: trimmedName, color: draftColor, icon: draftIcon };
    try {
      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, ...basics }),
      });
      if (!response.ok) {
        throw new Error('Save failed');
      }
      onSaved(basics);
      setEditing(false);
    } catch {
      setError('We couldn’t save your changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (): Promise<void> => {
    setDeleting(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/recipes/${recipeId}?username=${encodeURIComponent(username ?? '')}`,
        { method: 'DELETE' },
      );
      if (!response.ok) {
        throw new Error('Delete failed');
      }
      router.replace('/recipes');
    } catch {
      setError('We couldn’t delete this recipe. Please try again.');
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  if (editing) {
    return (
      <section className="editor-section">
        <div className="field">
          <label className="field-label" htmlFor="edit-recipe-name">
            Name
          </label>
          <input
            id="edit-recipe-name"
            className="input"
            value={draftName}
            maxLength={120}
            onChange={(event) => setDraftName(event.target.value)}
          />
        </div>
        <div className="field">
          <span className="field-label">Color</span>
          <ColorPicker value={draftColor} onChange={setDraftColor} />
        </div>
        <div className="field">
          <span className="field-label">Icon</span>
          <IconPicker value={draftIcon} onChange={setDraftIcon} />
        </div>

        {error && <p className="error">{error}</p>}

        <div className="editor-section-foot">
          <Button variant="secondary" onClick={() => setEditing(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={trimmedName.length === 0 || saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </section>
    );
  }

  return (
    <div className="recipe-basics">
      <div className="recipe-detail-title">
        <span
          className="recipe-card-icon"
          style={{ background: pastel.value, color: pastel.ink }}
          aria-hidden="true"
        >
          <RecipeIcon icon={icon} />
        </span>
        <h1 className="recipes-title">{name}</h1>
      </div>

      {error && <p className="error">{error}</p>}

      {confirmingDelete ? (
        <div className="recipe-basics-actions">
          <span className="state-note">Delete this recipe? This can’t be undone.</span>
          <Button
            variant="secondary"
            onClick={() => setConfirmingDelete(false)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button className="button-danger" onClick={remove} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      ) : (
        <div className="recipe-basics-actions">
          <Button variant="secondary" onClick={startEditing}>
            Edit
          </Button>
          <Button variant="ghost" onClick={() => setConfirmingDelete(true)}>
            Delete
          </Button>
        </div>
      )}
    </div>
  );
}
