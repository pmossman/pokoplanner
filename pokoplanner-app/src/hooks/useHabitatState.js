import { useState, useCallback, useEffect } from 'react';

let nextId = Date.now();
function genId() {
  return String(nextId++);
}

/**
 * Migrate old format (full pokemon objects) to new format (IDs only).
 * Also handles already-migrated data.
 */
function migrateHabitat(h) {
  const base = {
    ...h,
    customName: h.customName !== undefined ? h.customName : (h.name || null),
  };
  // Already migrated: has pokemonIds
  if (Array.isArray(h.pokemonIds)) {
    return { id: base.id, customName: base.customName, pokemonIds: h.pokemonIds, location: h.location || null };
  }
  // Old format: has pokemon array of objects
  if (Array.isArray(h.pokemon)) {
    return { id: base.id, customName: base.customName, pokemonIds: h.pokemon.map((p) => p.id || p), location: h.location || null };
  }
  return { id: base.id, customName: base.customName, pokemonIds: [], location: h.location || null };
}

function loadFromStorage(key) {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved).map(migrateHabitat);
    }
  } catch {}
  return [];
}

function saveToStorage(key, habitats) {
  localStorage.setItem(key, JSON.stringify(habitats));
}

/**
 * Resolve pokemonIds to full pokemon objects for display.
 * Called in App.js before passing habitats to components.
 */
export function resolveHabitats(habitats, pokemonById) {
  return habitats.map((h) => ({
    ...h,
    pokemon: h.pokemonIds
      .map((id) => pokemonById.get(id))
      .filter(Boolean),
  }));
}

/**
 * Encapsulates all habitat CRUD state and persistence for a single habitat list.
 * Stores only Pokemon IDs — full objects are resolved at render time via resolveHabitats().
 */
export function useHabitatState(storageKey) {
  const [habitats, setHabitats] = useState(() => loadFromStorage(storageKey));
  const [activeHabitatId, setActiveHabitatId] = useState(() => {
    const saved = loadFromStorage(storageKey);
    return saved.length > 0 ? saved[0].id : null;
  });

  useEffect(() => {
    saveToStorage(storageKey, habitats);
  }, [storageKey, habitats]);

  const activeHabitat = habitats.find((h) => h.id === activeHabitatId) || null;

  const createHabitat = useCallback((location = null) => {
    const id = genId();
    setHabitats((prev) => [...prev, { id, customName: null, pokemonIds: [], location }]);
    setActiveHabitatId(id);
    return id;
  }, []);

  const createHabitatWithPokemon = useCallback((name, pokemonIds, location = null) => {
    const id = genId();
    const idsToAdd = new Set(pokemonIds);
    setHabitats((prev) => {
      // Remove these Pokemon from any existing habitats first
      const cleaned = prev.map((h) => {
        if (h.pokemonIds.some((pid) => idsToAdd.has(pid))) {
          return { ...h, pokemonIds: h.pokemonIds.filter((pid) => !idsToAdd.has(pid)) };
        }
        return h;
      });
      return [...cleaned, { id, customName: name, pokemonIds, location }];
    });
    setActiveHabitatId(id);
  }, []);

  const deleteHabitat = useCallback((id) => {
    setHabitats((prev) => {
      const next = prev.filter((h) => h.id !== id);
      setActiveHabitatId((prevActive) => {
        if (prevActive !== id) return prevActive;
        return next.length > 0 ? next[0].id : null;
      });
      return next;
    });
  }, []);

  const renameHabitat = useCallback((id, customName) => {
    setHabitats((prev) =>
      prev.map((h) => (h.id === id ? { ...h, customName } : h))
    );
  }, []);

  const addToHabitat = useCallback((pokemonId, habitatId) => {
    setHabitats((prev) => {
      // First remove from any other habitat (enforce single-habitat rule)
      let updated = prev.map((h) => {
        if (h.id === habitatId) return h;
        if (h.pokemonIds.includes(pokemonId)) {
          return { ...h, pokemonIds: h.pokemonIds.filter((pid) => pid !== pokemonId) };
        }
        return h;
      });
      // Then add to target habitat
      return updated.map((h) => {
        if (h.id !== habitatId) return h;
        if (h.pokemonIds.includes(pokemonId)) return h;
        return { ...h, pokemonIds: [...h.pokemonIds, pokemonId] };
      });
    });
  }, []);

  const addToActiveHabitat = useCallback((pokemonId) => {
    setActiveHabitatId((currentId) => {
      let targetId = currentId;
      setHabitats((prev) => {
        if (prev.length === 0) {
          targetId = genId();
          return [{ id: targetId, customName: null, pokemonIds: [pokemonId], location: null }];
        }
        if (!targetId) targetId = prev[0].id;
        return prev.map((h) => {
          if (h.id !== targetId) return h;
          if (h.pokemonIds.includes(pokemonId)) return h;
          return { ...h, pokemonIds: [...h.pokemonIds, pokemonId] };
        });
      });
      return targetId;
    });
  }, []);

  const removeFromHabitat = useCallback((pokemonId, habitatId) => {
    setHabitats((prev) =>
      prev.map((h) =>
        h.id === habitatId
          ? { ...h, pokemonIds: h.pokemonIds.filter((pid) => pid !== pokemonId) }
          : h
      )
    );
  }, []);

  const clearHabitat = useCallback((habitatId) => {
    setHabitats((prev) =>
      prev.map((h) =>
        h.id === habitatId ? { ...h, pokemonIds: [] } : h
      )
    );
  }, []);

  const splitHabitat = useCallback((habitatId, groupAIds, groupBIds) => {
    const newId = genId();
    setHabitats((prev) => {
      const current = prev.find((h) => h.id === habitatId);
      const location = current?.location || null;
      const updated = prev.map((h) => {
        if (h.id !== habitatId) return h;
        return { ...h, pokemonIds: groupAIds, customName: null };
      });
      updated.push({ id: newId, customName: null, pokemonIds: groupBIds, location });
      return updated;
    });
  }, []);

  const resetAll = useCallback(() => {
    setHabitats([]);
    setActiveHabitatId(null);
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  // Allow full state reload (for backup restore)
  const reloadFromStorage = useCallback(() => {
    const loaded = loadFromStorage(storageKey);
    setHabitats(loaded);
    setActiveHabitatId(loaded.length > 0 ? loaded[0].id : null);
  }, [storageKey]);

  return {
    habitats,
    activeHabitatId,
    activeHabitat,
    setActiveHabitatId,
    createHabitat,
    createHabitatWithPokemon,
    deleteHabitat,
    renameHabitat,
    addToHabitat,
    addToActiveHabitat,
    removeFromHabitat,
    clearHabitat,
    splitHabitat,
    resetAll,
    reloadFromStorage,
  };
}
