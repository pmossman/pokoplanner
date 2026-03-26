import { useState, useCallback, useEffect, useMemo } from 'react';
import data from './data/pokemon.json';
import { migrateHabitats } from './utils/migration';
import { useHabitatState, resolveHabitats } from './hooks/useHabitatState';
import PokemonDataContext from './contexts/PokemonDataContext';
import AdventureMode from './components/AdventureMode';
import HabitatBuilder from './components/HabitatBuilder';
import PokemonDetail from './components/PokemonDetail';
import Settings from './components/Settings';
import { TbSettings } from 'react-icons/tb';
import './App.css';

// Run migration before any state initializes
migrateHabitats();

const OWNED_KEY = 'pokoplanner-owned';
const LOCATIONS_KEY = 'pokoplanner-pokemon-locations';

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


function App() {
  const [activeTab, setActiveTab] = useState('adventure');
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [navigateTarget, setNavigateTarget] = useState(null); // { location, habitatId }

  // Separate habitat state for each mode (stores only Pokemon IDs)
  const sandbox = useHabitatState('pokoplanner-sandbox-habitats');
  const adventure = useHabitatState('pokoplanner-adventure-habitats');

  // Adventure-specific state
  const [ownedPokemon, setOwnedPokemon] = useState(loadOwned);
  const [pokemonLocations, setPokemonLocations] = useState(loadPokemonLocations);

  const pokemonById = useMemo(
    () => new Map(data.pokemon.map((p) => [p.id, p])),
    []
  );

  // Resolve habitats: pokemonIds → full pokemon objects for display
  const resolvedAdventureHabitats = useMemo(
    () => resolveHabitats(adventure.habitats, pokemonById),
    [adventure.habitats, pokemonById]
  );
  const resolvedSandboxHabitats = useMemo(
    () => resolveHabitats(sandbox.habitats, pokemonById),
    [sandbox.habitats, pokemonById]
  );

  useEffect(() => { saveOwned(ownedPokemon); }, [ownedPokemon]);
  useEffect(() => { savePokemonLocations(pokemonLocations); }, [pokemonLocations]);


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

  const movePokemon = useCallback((pokemonId, newLocation) => {
    // Remove from any habitats at the old location before moving
    const oldLocation = getPokemonLocation(pokemonId);
    if (oldLocation !== newLocation) {
      const rawHabitats = activeTab === 'adventure' ? adventure.habitats : sandbox.habitats;
      for (const h of rawHabitats) {
        if (h.location === oldLocation && h.pokemonIds.includes(pokemonId)) {
          if (activeTab === 'adventure') {
            adventure.removeFromHabitat(pokemonId, h.id);
          } else {
            sandbox.removeFromHabitat(pokemonId, h.id);
          }
        }
      }
    }
    setPokemonLocations((prev) => {
      const pokemon = pokemonById.get(pokemonId);
      if (pokemon && pokemon.primaryLocation === newLocation) {
        const next = { ...prev };
        delete next[pokemonId];
        return next;
      }
      return { ...prev, [pokemonId]: newLocation };
    });
  }, [pokemonById, getPokemonLocation, activeTab, adventure, sandbox]);


  // Unregister a Pokemon — remove from owned, and from any habitats
  const unregisterPokemon = useCallback((pokemonId) => {
    // Remove from all habitats first
    const rawHabitats = activeTab === 'adventure' ? adventure.habitats : sandbox.habitats;
    for (const h of rawHabitats) {
      if (h.pokemonIds.includes(pokemonId)) {
        if (activeTab === 'adventure') {
          adventure.removeFromHabitat(pokemonId, h.id);
          if (h.pokemonIds.length <= 1) adventure.deleteHabitat(h.id);
        } else {
          sandbox.removeFromHabitat(pokemonId, h.id);
          if (h.pokemonIds.length <= 1) sandbox.deleteHabitat(h.id);
        }
      }
    }
    // Remove from owned
    setOwnedPokemon((prev) => {
      const next = new Set(prev);
      next.delete(pokemonId);
      return next;
    });
    // Clear custom location
    setPokemonLocations((prev) => {
      const next = { ...prev };
      delete next[pokemonId];
      return next;
    });
  }, [activeTab, adventure, sandbox]);

  // Check if a Pokemon is in any habitat
  const getUnregisterInfo = useCallback((pokemonId) => {
    const rawHabitats = activeTab === 'adventure' ? adventure.habitats : sandbox.habitats;
    const inHome = rawHabitats.some((h) => h.pokemonIds.includes(pokemonId));
    return { handler: unregisterPokemon, inHome };
  }, [activeTab, adventure, sandbox, unregisterPokemon]);

  // Find which habitat a Pokemon is in and navigate to it
  const navigateToHabitat = useCallback((pokemonId) => {
    const rawHabitats = activeTab === 'adventure' ? adventure.habitats : sandbox.habitats;
    const habitat = rawHabitats.find(h => h.pokemonIds.includes(pokemonId));
    if (!habitat) return;
    setSelectedPokemon(null);
    if (activeTab === 'adventure') {
      const loc = habitat.location || getPokemonLocation(pokemonId);
      setNavigateTarget({ location: loc, habitatId: habitat.id });
    }
  }, [activeTab, adventure.habitats, sandbox.habitats, getPokemonLocation]);

  // Get resolved habitat info for a Pokemon (for display in PokemonDetail)
  const getPokemonHabitat = useCallback((pokemonId) => {
    const resolved = activeTab === 'adventure' ? resolvedAdventureHabitats : resolvedSandboxHabitats;
    return resolved.find(h => h.pokemon.some(p => p.id === pokemonId)) || null;
  }, [activeTab, resolvedAdventureHabitats, resolvedSandboxHabitats]);

  // Reload all state from localStorage (after backup restore or reset)
  const reloadAllState = useCallback(() => {
    setOwnedPokemon(loadOwned());
    setPokemonLocations(loadPokemonLocations());
    sandbox.reloadFromStorage();
    adventure.reloadFromStorage();
  }, [sandbox, adventure]);

  const dataContext = useMemo(() => ({
    allPokemon: data.pokemon,
    allFavorites: data.allFavorites,
    allIdealHabitats: data.allIdealHabitats,
    allSpecialties: data.allSpecialties,
    pokemonById,
    ownedPokemon,
    toggleOwned,
    selectPokemon: setSelectedPokemon,
  }), [pokemonById, ownedPokemon, toggleOwned]);

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
            {resolvedSandboxHabitats.length > 0 && (
              <span className="tab-count">{resolvedSandboxHabitats.length}</span>
            )}
          </button>
        </nav>
        <button
          className="settings-gear"
          onClick={() => setShowSettings(true)}
          title="Settings"
        >
          <TbSettings size={20} />
        </button>
      </header>

      <PokemonDataContext.Provider value={dataContext}>
        <main className="app-main">
          {activeTab === 'adventure' && (
            <AdventureMode
              pokemonLocations={pokemonLocations}
              getPokemonLocation={getPokemonLocation}
              onMovePokemon={movePokemon}
              habitats={resolvedAdventureHabitats}
              onCreateHabitat={adventure.createHabitat}
              onCreateHabitatWithPokemon={adventure.createHabitatWithPokemon}
              onAddToHabitat={adventure.addToHabitat}
              onDeleteHabitat={adventure.deleteHabitat}
              onRenameHabitat={adventure.renameHabitat}
              onRemoveFromHabitat={adventure.removeFromHabitat}
              onClearHabitat={adventure.clearHabitat}
              onSplitHabitat={adventure.splitHabitat}
              navigateTarget={navigateTarget}
              onNavigateComplete={() => setNavigateTarget(null)}
            />
          )}

          {activeTab === 'builder' && (
            <HabitatBuilder
              habitats={resolvedSandboxHabitats}
              activeHabitatId={sandbox.activeHabitatId}
              onSelectHabitat={sandbox.setActiveHabitatId}
              onCreate={sandbox.createHabitat}
              onCreateWithPokemon={sandbox.createHabitatWithPokemon}
              onDelete={sandbox.deleteHabitat}
              onRename={sandbox.renameHabitat}
              onAdd={sandbox.addToActiveHabitat}
              onAddToSpecific={sandbox.addToHabitat}
              onRemove={sandbox.removeFromHabitat}
              onClear={sandbox.clearHabitat}
              onSplit={sandbox.splitHabitat}
            />
          )}
        </main>

        {selectedPokemon && (
          <PokemonDetail
            pokemon={selectedPokemon}
            onClose={() => setSelectedPokemon(null)}
            habitatPokemon={[]}
            mode={activeTab === 'adventure' ? 'adventure' : 'sandbox'}
            getPokemonLocation={activeTab === 'adventure' ? getPokemonLocation : null}
            onUnregister={getUnregisterInfo(selectedPokemon.id)}
            currentHabitat={getPokemonHabitat(selectedPokemon.id)}
            onNavigateToHabitat={navigateToHabitat}
          />
        )}
      </PokemonDataContext.Provider>

      {showSettings && (
        <Settings
          onClose={() => setShowSettings(false)}
          onReload={reloadAllState}
        />
      )}
    </div>
  );
}

export default App;
