import { useState, useCallback } from 'react';

/**
 * Hook for inline rename UI state.
 * Returns rename state and handlers for starting, committing, and cancelling renames.
 */
export function useInlineRename(onRenameCallback) {
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  const startRename = useCallback((habitat) => {
    setRenamingId(habitat.id);
    setRenameValue(habitat.customName || '');
  }, []);

  const commitRename = useCallback(() => {
    if (renamingId) {
      const trimmed = renameValue.trim();
      onRenameCallback(renamingId, trimmed || null);
    }
    setRenamingId(null);
    setRenameValue('');
  }, [renamingId, renameValue, onRenameCallback]);

  const cancelRename = useCallback(() => {
    setRenamingId(null);
    setRenameValue('');
  }, []);

  const handleRenameKeyDown = useCallback((e) => {
    if (e.key === 'Enter') commitRename();
    if (e.key === 'Escape') cancelRename();
  }, [commitRename, cancelRename]);

  return {
    renamingId,
    renameValue,
    setRenameValue,
    startRename,
    commitRename,
    cancelRename,
    handleRenameKeyDown,
  };
}
