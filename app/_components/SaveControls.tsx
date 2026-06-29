'use client';

import { Button } from './ui/Button';

/** Save status shared by the editable sections (idea.md §2). */
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/** Save button + status text used by every editable section. */
export function SaveControls({
  dirty,
  status,
  onSave,
}: {
  dirty: boolean;
  status: SaveStatus;
  onSave: () => void;
}): JSX.Element {
  return (
    <div className="save-controls">
      {status === 'saved' && !dirty && <span className="save-status">Saved ✓</span>}
      {status === 'error' && <span className="save-status save-status-error">Save failed</span>}
      <Button onClick={onSave} disabled={!dirty || status === 'saving'}>
        {status === 'saving' ? 'Saving…' : 'Save'}
      </Button>
    </div>
  );
}
