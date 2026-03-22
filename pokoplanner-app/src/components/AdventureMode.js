import { useState, useMemo, useCallback } from 'react';
import { getLocationInfo } from '../utils/themeColors';
import { filterPokemon } from '../utils/pokemonUtils';
import LocationView from './LocationView';
import './AdventureMode.css';

const LOCATION_ORDER = [
  'Withered Wastelands',
  'Palette Town',
  'Bleak Beach',
  'Rocky Ridges',
  'Sparkling Skylands',
];

function AdventureMode({
  allPokemon,
  allFavorites,
  allIdealHabitats,
  allLocations,
  pokemonById,
  ownedPokemon,
  onToggleOwned,
  pokemonLocations,
  getPokemonLocation,
  onMovePokemon,
  unlockedLocations,
  onToggleLocation,
  habitats,
  onCreateHabitat,
  onCreateHabitatWithPokemon,
  onAddToHabitat,
  onDeleteHabitat,
  onRenameHabitat,
  onRemoveFromHabitat,
  onClearHabitat,
  onSplitHabitat,
  onSelectPokemon,
}) {
  const [selectedLocation, setSelectedLocation] = useState('Withered Wastelands');
  const [registerQuery, setRegisterQuery] = useState('');
  const [dragOverLocation, setDragOverLocation] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const hasOwned = ownedPokemon.size > 0;

  // Group owned Pokemon by their current location
  const pokemonByLocation = useMemo(() => {
    const byLoc = {};
    for (const loc of LOCATION_ORDER) {
      byLoc[loc] = [];
    }
    for (const id of ownedPokemon) {
      const pokemon = pokemonById.get(id);
      if (!pokemon) continue;
      const loc = getPokemonLocation(id);
      if (!byLoc[loc]) byLoc[loc] = [];
      byLoc[loc].push(pokemon);
    }
    return byLoc;
  }, [ownedPokemon, pokemonById, getPokemonLocation]);

  // Location habitats
  const locationHabitats = useMemo(() => {
    return habitats.filter((h) => h.location === selectedLocation);
  }, [habitats, selectedLocation]);

  // IDs of Pokemon currently in a habitat at the selected location
  const inHabitatIds = useMemo(() => {
    const ids = new Set();
    for (const h of locationHabitats) {
      for (const p of h.pokemon) ids.add(p.id);
    }
    return ids;
  }, [locationHabitats]);

  // Drag-drop: drop onto a location card to move pokemon
  const handleLocationDrop = useCallback((e, destLocation) => {
    e.preventDefault();
    setDragOverLocation(null);
    const pokemonId = e.dataTransfer.getData('text/pokemon-id');
    if (pokemonId && destLocation !== selectedLocation) {
      onMovePokemon(pokemonId, destLocation);
    }
  }, [onMovePokemon, selectedLocation]);

  const handleLocationDragOver = useCallback((e, loc) => {
    e.preventDefault();
    if (loc !== selectedLocation) {
      setDragOverLocation(loc);
    }
  }, [selectedLocation]);

  const squirtle = pokemonById.get('squirtle');

  // Onboarding — no owned Pokemon yet
  if (!hasOwned) {
    return (
      <div className="adventure-mode">
        <div className="adventure-onboarding">
          <h2>Your Pokopia Adventure</h2>
          <p className="onboarding-subtitle">
            As you meet Pokemon in Pokopia, add them here to track where they are
            and plan the perfect habitats for each location.
          </p>

          <div className="onboarding-squirtle">
            {squirtle?.sprite && (
              <img
                className="onboarding-sprite"
                src={squirtle.sprite}
                alt="Squirtle"
              />
            )}
            <div className="onboarding-squirtle-text">
              <p className="onboarding-meet">
                Met your first Pokemon? Everyone starts with <strong>Squirtle</strong> in the Withered Wastelands.
              </p>
              <button
                className="onboarding-register-btn"
                onClick={() => onToggleOwned('squirtle')}
              >
                I've met Squirtle!
              </button>
            </div>
          </div>

          <div className="onboarding-divider">
            <span>or find a different Pokemon</span>
          </div>

          <div className="onboarding-search">
            <input
              type="text"
              placeholder="Search by name..."
              value={registerQuery}
              onChange={(e) => setRegisterQuery(e.target.value)}
              className="register-search-input"
            />
            {registerQuery.trim() && (
              <div className="register-results">
                {filterPokemon(allPokemon, { query: registerQuery }).slice(0, 8).map((p) => {
                  const isOwned = ownedPokemon.has(p.id);
                  return (
                    <div
                      key={p.id}
                      className={`register-result-item ${isOwned ? 'owned' : ''}`}
                      onClick={() => onToggleOwned(p.id)}
                    >
                      {p.sprite && (
                        <img className="register-result-sprite" src={p.sprite} alt={p.name} />
                      )}
                      <span className="register-result-name">{p.name}</span>
                      <span className="register-result-location">{p.primaryLocation}</span>
                      {isOwned && <span className="register-check">✓</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main adventure view
  return (
    <div
      className={`adventure-mode ${isDragging ? 'is-dragging' : ''}`}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setIsDragging(true); }}
      onDragEnd={() => setIsDragging(false)}
      onDrop={() => setIsDragging(false)}
    >
      {/* Location selector — also drop targets for moving Pokemon */}
      <div className="location-selector">
        {LOCATION_ORDER.map((loc) => {
          const info = getLocationInfo(loc);
          const Icon = info.Icon;
          const count = pokemonByLocation[loc]?.length || 0;
          const isUnlocked = unlockedLocations.includes(loc);
          const isSelected = selectedLocation === loc;
          const isDragOver = dragOverLocation === loc;

          return (
            <button
              key={loc}
              className={`location-card ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''} ${isDragOver ? 'drag-over' : ''} ${isDragging && isUnlocked && !isSelected ? 'drop-hint' : ''}`}
              style={{
                background: isSelected ? info.gradient : info.bg,
                borderColor: isSelected ? info.color : isDragOver ? info.color : 'transparent',
                '--loc-color': info.color,
              }}
              onClick={() => {
                if (isUnlocked) setSelectedLocation(loc);
              }}
              onDragOver={(e) => isUnlocked && handleLocationDragOver(e, loc)}
              onDragLeave={() => setDragOverLocation(null)}
              onDrop={(e) => isUnlocked && handleLocationDrop(e, loc)}
            >
              {isDragOver ? (
                <div className="drop-prompt">
                  Move to {loc}
                </div>
              ) : (
                <>
                  <div className="location-card-top">
                    {Icon && <Icon size={18} style={{ color: info.color }} />}
                    {!isUnlocked && <span className="lock-icon">🔒</span>}
                  </div>
                  <span className="location-card-name" style={{ color: info.color }}>{loc}</span>
                  {isUnlocked && count > 0 && (
                    <span className="location-card-count">{count}</span>
                  )}
                  {!isUnlocked && (
                    <button
                      className="unlock-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleLocation(loc);
                      }}
                    >
                      Unlock
                    </button>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected location content */}
      <LocationView
        location={selectedLocation}
        allPokemon={allPokemon}
        allFavorites={allFavorites}
        allIdealHabitats={allIdealHabitats}
        pokemonById={pokemonById}
        pokemonAtLocation={pokemonByLocation[selectedLocation] || []}
        allOwnedPokemon={ownedPokemon}
        onToggleOwned={onToggleOwned}
        getPokemonLocation={getPokemonLocation}
        onMovePokemon={onMovePokemon}
        unlockedLocations={unlockedLocations}
        habitats={locationHabitats}
        inHabitatIds={inHabitatIds}
        onCreateHabitat={onCreateHabitat}
        onCreateHabitatWithPokemon={onCreateHabitatWithPokemon}
        onAddToHabitat={onAddToHabitat}
        onDeleteHabitat={onDeleteHabitat}
        onRenameHabitat={onRenameHabitat}
        onRemoveFromHabitat={onRemoveFromHabitat}
        onClearHabitat={onClearHabitat}
        onSplitHabitat={onSplitHabitat}
        onSelectPokemon={onSelectPokemon}
        allFavorites={allFavorites}
      />
    </div>
  );
}

export default AdventureMode;
