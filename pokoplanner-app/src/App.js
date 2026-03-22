import { useState, useCallback, useEffect, useMemo } from 'react';
import data from './data/pokemon.json';
import AdventureMode from './components/AdventureMode';
import HabitatBuilder from './components/HabitatBuilder';
import PokemonDetail from './components/PokemonDetail';
import './App.css';

const STORAGE_KEY = 'pokoplanner-habitats';
const OWNED_KEY = 'pokoplanner-owned';
const LOCATIONS_KEY = 'pokoplanner-pokemon-locations';
const UNLOCKED_KEY = 'pokoplanner-unlocked-locations';

const DEFAULT_UNLOCKED = ['Withered Wastelands', 'Palette Town'];

function loadHabitats() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved).map((h) => ({
        ...h,
        customName: h.customName !== undefined ? h.customName : (h.name || null),
        location: h.location || null,
      }));
    }
  } catch {}
  return [];
}

function saveHabitats(habitats) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(habitats));
}

function loadOwned() {
  try {
    const saved = localStorage.getItem(OWNED_KEY);
    if (saved) return new Set(JSON.parse(saved));
  } catch {}
  return new Set();
}

function saveOwned(owned) {
  localStorage.setItem(OWNED_KEY, JSON.stringify([...owned]));
}

function loadPokemonLocations() {
  try {
    const saved = localStorage.getItem(LOCATIONS_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return {};
}

function savePokemonLocations(locations) {
  localStorage.setItem(LOCATIONS_KEY, JSON.stringify(locations));
}

function loadUnlockedLocations() {
  try {
    const saved = localStorage.getItem(UNLOCKED_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULT_UNLOCKED;
}

function saveUnlockedLocations(unlocked) {
  localStorage.setItem(UNLOCKED_KEY, JSON.stringify(unlocked));
}

let nextId = Date.now();
function genId() {
  return String(nextId++);
}

function App() {
  const [activeTab, setActiveTab] = useState('adventure');
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [habitats, setHabitats] = useState(loadHabitats);
  const [ownedPokemon, setOwnedPokemon] = useState(loadOwned);
  const [pokemonLocations, setPokemonLocations] = useState(loadPokemonLocations);
  const [unlockedLocations, setUnlockedLocations] = useState(loadUnlockedLocations);
  const [activeHabitatId, setActiveHabitatId] = useState(() => {
    const saved = loadHabitats();
    return saved.length > 0 ? saved[0].id : null;
  });

  const pokemonById = useMemo(
    () => new Map(data.pokemon.map((p) => [p.id, p])),
    []
  );

  useEffect(() => { saveHabitats(habitats); }, [habitats]);
  useEffect(() => { saveOwned(ownedPokemon); }, [ownedPokemon]);
  useEffect(() => { savePokemonLocations(pokemonLocations); }, [pokemonLocations]);
  useEffect(() => { saveUnlockedLocations(unlockedLocations); }, [unlockedLocations]);

  const activeHabitat = habitats.find((h) => h.id === activeHabitatId) || null;

  const getPokemonLocation = useCallback((id) => {
    return pokemonLocations[id] || pokemonById.get(id)?.primaryLocation || 'Withered Wastelands';
  }, [pokemonLocations, pokemonById]);

  const toggleOwned = useCallback((pokemonId) => {
    setOwnedPokemon((prev) => {
      const next = new Set(prev);
      if (next.has(pokemonId)) {
        next.delete(pokemonId);
      } else {
        next.add(pokemonId);
      }
      return next;
    });
  }, []);

  const movePokemon = useCallback((pokemonId, location) => {
    setPokemonLocations((prev) => {
      const pokemon = pokemonById.get(pokemonId);
      // If moving to default location, remove the override
      if (pokemon && pokemon.primaryLocation === location) {
        const next = { ...prev };
        delete next[pokemonId];
        return next;
      }
      return { ...prev, [pokemonId]: location };
    });
  }, [pokemonById]);

  const toggleLocation = useCallback((location) => {
    setUnlockedLocations((prev) => {
      if (prev.includes(location)) {
        return prev.filter((l) => l !== location);
      }
      return [...prev, location];
    });
  }, []);

  const createHabitat = useCallback((location = null) => {
    const id = genId();
    setHabitats((prev) => [...prev, { id, customName: null, pokemon: [], location }]);
    setActiveHabitatId(id);
    return id;
  }, []);

  const createHabitatWithPokemon = useCallback((name, pokemon, location = null) => {
    const id = genId();
    setHabitats((prev) => [...prev, { id, customName: name, pokemon, location }]);
    setActiveHabitatId(id);
  }, []);

  const deleteHabitat = useCallback((id) => {
    setHabitats((prev) => prev.filter((h) => h.id !== id));
    setActiveHabitatId((prevActive) => {
      if (prevActive !== id) return prevActive;
      const remaining = habitats.filter((h) => h.id !== id);
      return remaining.length > 0 ? remaining[0].id : null;
    });
  }, [habitats]);

  const renameHabitat = useCallback((id, customName) => {
    setHabitats((prev) =>
      prev.map((h) => (h.id === id ? { ...h, customName } : h))
    );
  }, []);

  const setHabitatLocation = useCallback((id, location) => {
    setHabitats((prev) =>
      prev.map((h) => (h.id === id ? { ...h, location } : h))
    );
  }, []);

  const addToHabitat = useCallback((pokemon) => {
    setActiveHabitatId((currentId) => {
      let targetId = currentId;
      setHabitats((prev) => {
        if (prev.length === 0) {
          targetId = genId();
          return [{ id: targetId, customName: null, pokemon: [pokemon], location: null }];
        }
        if (!targetId) targetId = prev[0].id;
        return prev.map((h) => {
          if (h.id !== targetId) return h;
          if (h.pokemon.find((p) => p.id === pokemon.id)) return h;
          return { ...h, pokemon: [...h.pokemon, pokemon] };
        });
      });
      return targetId;
    });
    setActiveTab('builder');
  }, []);

  // Add a Pokemon to a specific habitat by ID (for adventure mode drag-drop)
  const addToSpecificHabitat = useCallback((pokemon, habitatId) => {
    setHabitats((prev) =>
      prev.map((h) => {
        if (h.id !== habitatId) return h;
        if (h.pokemon.find((p) => p.id === pokemon.id)) return h;
        return { ...h, pokemon: [...h.pokemon, pokemon] };
      })
    );
  }, []);

  const removeFromAnyHabitat = useCallback((pokemonId, habitatId) => {
    setHabitats((prev) =>
      prev.map((h) =>
        h.id === habitatId
          ? { ...h, pokemon: h.pokemon.filter((p) => p.id !== pokemonId) }
          : h
      )
    );
  }, []);

  const clearAnyHabitat = useCallback((habitatId) => {
    setHabitats((prev) =>
      prev.map((h) =>
        h.id === habitatId ? { ...h, pokemon: [] } : h
      )
    );
  }, []);

  const splitAnyHabitat = useCallback((habitatId, groupA, groupB) => {
    const newId = genId();
    setHabitats((prev) => {
      const current = prev.find((h) => h.id === habitatId);
      const location = current?.location || null;
      const updated = prev.map((h) => {
        if (h.id !== habitatId) return h;
        return { ...h, pokemon: groupA, customName: null };
      });
      updated.push({ id: newId, customName: null, pokemon: groupB, location });
      return updated;
    });
  }, []);

  const removeFromHabitat = useCallback((pokemonId) => {
    setHabitats((prev) =>
      prev.map((h) =>
        h.id === activeHabitatId
          ? { ...h, pokemon: h.pokemon.filter((p) => p.id !== pokemonId) }
          : h
      )
    );
  }, [activeHabitatId]);

  const clearHabitat = useCallback(() => {
    setHabitats((prev) =>
      prev.map((h) =>
        h.id === activeHabitatId ? { ...h, pokemon: [] } : h
      )
    );
  }, [activeHabitatId]);

  const splitHabitat = useCallback((groupA, groupB) => {
    const newId = genId();
    setHabitats((prev) => {
      const current = prev.find((h) => h.id === activeHabitatId);
      const location = current?.location || null;
      const updated = prev.map((h) => {
        if (h.id !== activeHabitatId) return h;
        return { ...h, pokemon: groupA, customName: null };
      });
      updated.push({ id: newId, customName: null, pokemon: groupB, location });
      return updated;
    });
  }, [activeHabitatId]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>
          <img className="logo-poko" src={`${process.env.PUBLIC_URL}/poko.png`} alt="Poko" />
          <span className="logo-planner">Planner</span>
        </h1>
        <nav className="tabs">
          <button
            className={activeTab === 'adventure' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('adventure')}
          >
            Adventure
            {ownedPokemon.size > 0 && (
              <span className="tab-count">{ownedPokemon.size}</span>
            )}
          </button>
          <button
            className={activeTab === 'builder' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('builder')}
          >
            Sandbox
            {habitats.length > 0 && (
              <span className="tab-count">{habitats.length}</span>
            )}
          </button>
        </nav>
      </header>

      <main className="app-main">
        {activeTab === 'adventure' && (
          <AdventureMode
            allPokemon={data.pokemon}
            allFavorites={data.allFavorites}
            allIdealHabitats={data.allIdealHabitats}
            allLocations={data.allLocations}
            pokemonById={pokemonById}
            ownedPokemon={ownedPokemon}
            onToggleOwned={toggleOwned}
            pokemonLocations={pokemonLocations}
            getPokemonLocation={getPokemonLocation}
            onMovePokemon={movePokemon}
            unlockedLocations={unlockedLocations}
            onToggleLocation={toggleLocation}
            habitats={habitats}
            onCreateHabitat={createHabitat}
            onCreateHabitatWithPokemon={createHabitatWithPokemon}
            onAddToHabitat={addToSpecificHabitat}
            onDeleteHabitat={deleteHabitat}
            onRenameHabitat={renameHabitat}
            onRemoveFromHabitat={removeFromAnyHabitat}
            onClearHabitat={clearAnyHabitat}
            onSplitHabitat={splitAnyHabitat}
            onSelectPokemon={setSelectedPokemon}
            allFavorites={data.allFavorites}
          />
        )}

        {activeTab === 'builder' && (
          <HabitatBuilder
            allPokemon={data.pokemon}
            allFavorites={data.allFavorites}
            allIdealHabitats={data.allIdealHabitats}
            habitats={habitats}
            activeHabitatId={activeHabitatId}
            onSelectHabitat={setActiveHabitatId}
            onCreate={createHabitat}
            onCreateWithPokemon={createHabitatWithPokemon}
            onDelete={deleteHabitat}
            onRename={renameHabitat}
            onAdd={addToHabitat}
            onRemove={removeFromHabitat}
            onClear={clearHabitat}
            onSplit={splitHabitat}
            onSelectPokemon={setSelectedPokemon}
            ownedPokemon={ownedPokemon}
            onToggleOwned={toggleOwned}
          />
        )}
      </main>

      {selectedPokemon && (
        <PokemonDetail
          pokemon={selectedPokemon}
          allPokemon={data.pokemon}
          onClose={() => setSelectedPokemon(null)}
          onAddToHabitat={addToHabitat}
          habitatPokemon={activeHabitat ? activeHabitat.pokemon : []}
          ownedPokemon={ownedPokemon}
          onToggleOwned={toggleOwned}
        />
      )}
    </div>
  );
}

export default App;
