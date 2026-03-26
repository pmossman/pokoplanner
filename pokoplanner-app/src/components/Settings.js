import { useState, useCallback, useRef } from 'react';
import { TbDownload, TbUpload, TbTrash, TbAlertTriangle } from 'react-icons/tb';
import './Settings.css';

const ALL_KEYS = [
  'pokoplanner-sandbox-habitats',
  'pokoplanner-adventure-habitats',
  'pokoplanner-owned',
  'pokoplanner-pokemon-locations',
  'pokoplanner-unlocked-locations',
];

const ADVENTURE_KEYS = [
  'pokoplanner-adventure-habitats',
  'pokoplanner-owned',
  'pokoplanner-pokemon-locations',
  'pokoplanner-unlocked-locations',
];

const SANDBOX_KEYS = [
  'pokoplanner-sandbox-habitats',
];

function Settings({ onClose, onReload }) {
  const [confirmAction, setConfirmAction] = useState(null); // 'adventure' | 'sandbox' | 'all'
  const [restoreError, setRestoreError] = useState(null);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const fileRef = useRef(null);

  const handleDownload = useCallback(() => {
    const backup = {};
    for (const key of ALL_KEYS) {
      const val = localStorage.getItem(key);
      if (val !== null) {
        try { backup[key] = JSON.parse(val); } catch { backup[key] = val; }
      }
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `pokoplanner-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleRestore = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoreError(null);
    setRestoreSuccess(false);

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        // Validate: must be an object with at least one known key
        const knownKeys = Object.keys(data).filter((k) => ALL_KEYS.includes(k));
        if (knownKeys.length === 0) {
          setRestoreError('This file doesn\'t look like a Pokoplanner backup.');
          return;
        }
        for (const key of knownKeys) {
          localStorage.setItem(key, JSON.stringify(data[key]));
        }
        setRestoreSuccess(true);
        onReload();
      } catch {
        setRestoreError('Could not read backup file. Make sure it\'s a valid JSON file.');
      }
    };
    reader.readAsText(file);
    // Reset file input so the same file can be selected again
    e.target.value = '';
  }, [onReload]);

  const handleReset = useCallback((scope) => {
    const keys = scope === 'adventure' ? ADVENTURE_KEYS
      : scope === 'sandbox' ? SANDBOX_KEYS
      : ALL_KEYS;
    for (const key of keys) {
      localStorage.removeItem(key);
    }
    setConfirmAction(null);
    onReload();
  }, [onReload]);

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="settings-close" onClick={onClose}>&times;</button>
        </div>

        <div className="settings-section">
          <h3>Backup & Restore</h3>
          <p className="settings-desc">
            Save a copy of all your data, or restore from a previous backup.
          </p>
          <div className="settings-actions">
            <button className="settings-btn primary" onClick={handleDownload}>
              <TbDownload size={16} />
              Download backup
            </button>
            <button className="settings-btn primary" onClick={() => fileRef.current?.click()}>
              <TbUpload size={16} />
              Restore from backup
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleRestore}
            />
          </div>
          {restoreError && <p className="settings-error">{restoreError}</p>}
          {restoreSuccess && <p className="settings-success">Backup restored successfully!</p>}
        </div>

        <div className="settings-section">
          <h3>Reset Data</h3>
          <p className="settings-desc">
            Clear your saved data. This cannot be undone — download a backup first if you want to keep it.
          </p>

          {confirmAction ? (
            <div className="settings-confirm">
              <TbAlertTriangle size={18} />
              <span>
                {confirmAction === 'adventure' && 'Reset all Adventure progress? This clears your registered Pokemon, locations, and adventure homes.'}
                {confirmAction === 'sandbox' && 'Reset all Sandbox homes? This clears every home you\'ve created in Sandbox mode.'}
                {confirmAction === 'all' && 'Reset everything? This clears ALL your data — Adventure progress, Sandbox homes, everything.'}
              </span>
              <div className="settings-confirm-actions">
                <button className="settings-btn danger" onClick={() => handleReset(confirmAction)}>
                  Yes, reset
                </button>
                <button className="settings-btn" onClick={() => setConfirmAction(null)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="settings-actions">
              <button className="settings-btn danger-outline" onClick={() => setConfirmAction('adventure')}>
                <TbTrash size={16} />
                Reset Adventure
              </button>
              <button className="settings-btn danger-outline" onClick={() => setConfirmAction('sandbox')}>
                <TbTrash size={16} />
                Reset Sandbox
              </button>
              <button className="settings-btn danger-outline" onClick={() => setConfirmAction('all')}>
                <TbTrash size={16} />
                Reset everything
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;
