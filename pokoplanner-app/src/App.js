import { useState, useCallback, useEffect } from 'react';
import data from './data/pokemon.json';
import Collection from './components/Collection';
import HabitatBuilder from './components/HabitatBuilder';
import PokemonDetail from './components/PokemonDetail';
import './App.css';

const STORAGE_KEY = 'pokoplanner-habitats';
const OWNED_KEY = 'pokoplanner-owned';

function loadHabitats() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved).map((h) => ({
        ...h,
        customName: h.customName !== undefined ? h.customName : (h.name || null),
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

let nextId = Date.now();
function genId() {
  return String(nextId++);
}

function App() {
  const [activeTab, setActiveTab] = useState('builder');
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [habitats, setHabitats] = useState(loadHabitats);
  const [ownedPokemon, setOwnedPokemon] = useState(loadOwned);
  const [activeHabitatId, setActiveHabitatId] = useState(() => {
    const saved = loadHabitats();
    return saved.length > 0 ? saved[0].id : null;
  });

  useEffect(() => {
    saveHabitats(habitats);
  }, [habitats]);

  useEffect(() => {
    saveOwned(ownedPokemon);
  }, [ownedPokemon]);

  const activeHabitat = habitats.find((h) => h.id === activeHabitatId) || null;

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

  const createHabitat = useCallback(() => {
    const id = genId();
    setHabitats((prev) => [...prev, { id, customName: null, pokemon: [] }]);
    setActiveHabitatId(id);
    return id;
  }, []);

  const createHabitatWithPokemon = useCallback((name, pokemon) => {
    const id = genId();
    setHabitats((prev) => [...prev, { id, customName: name, pokemon }]);
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

  const addToHabitat = useCallback((pokemon) => {
    setActiveHabitatId((currentId) => {
      let targetId = currentId;
      setHabitats((prev) => {
        if (prev.length === 0) {
          targetId = genId();
          return [{ id: targetId, customName: null, pokemon: [pokemon] }];
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
      const updated = prev.map((h) => {
        if (h.id !== activeHabitatId) return h;
        return { ...h, pokemon: groupA, customName: null };
      });
      updated.push({ id: newId, customName: null, pokemon: groupB });
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
            className={activeTab === 'collection' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('collection')}
          >
            My Collection
            <span className="tab-count">{ownedPokemon.size}/{data.pokemon.length}</span>
          </button>
          <button
            className={activeTab === 'builder' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('builder')}
          >
            Habitat Builder
            {habitats.length > 0 && (
              <span className="tab-count">{habitats.length}</span>
            )}
          </button>
        </nav>
      </header>

      <main className="app-main">
        {activeTab === 'collection' && (
          <Collection
            allPokemon={data.pokemon}
            allFavorites={data.allFavorites}
            allIdealHabitats={data.allIdealHabitats}
            ownedPokemon={ownedPokemon}
            onToggleOwned={toggleOwned}
            onSelectPokemon={setSelectedPokemon}
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
