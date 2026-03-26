const OLD_HABITATS_KEY = 'pokoplanner-habitats';
const SANDBOX_KEY = 'pokoplanner-sandbox-habitats';
const ADVENTURE_KEY = 'pokoplanner-adventure-habitats';

/**
 * One-time migration: split the old unified habitat list into separate
 * sandbox and adventure lists. Runs on app startup.
 */
export function migrateHabitats() {
  // Already migrated or fresh install
  if (localStorage.getItem(SANDBOX_KEY) !== null || localStorage.getItem(ADVENTURE_KEY) !== null) {
    return;
  }

  const raw = localStorage.getItem(OLD_HABITATS_KEY);
  if (!raw) return;

  try {
    const habitats = JSON.parse(raw);
    const sandbox = [];
    const adventure = [];

    for (const h of habitats) {
      if (h.location) {
        adventure.push(h);
      } else {
        // Strip location field from sandbox habitats
        const { location, ...rest } = h;
        sandbox.push(rest);
      }
    }

    localStorage.setItem(SANDBOX_KEY, JSON.stringify(sandbox));
    localStorage.setItem(ADVENTURE_KEY, JSON.stringify(adventure));
    localStorage.removeItem(OLD_HABITATS_KEY);
  } catch {
    // If parse fails, leave old data in place
  }
}
