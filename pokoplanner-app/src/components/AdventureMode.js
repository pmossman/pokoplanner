import { useState, useMemo, useCallback, useEffect } from 'react';
import { usePokemonData } from '../contexts/PokemonDataContext';
import { habitatDisplayName } from '../utils/habitatHelpers';
import { getLocationInfo, getDominantHabitat, getHabitatBadgeColor, HabitatTypeIcon } from '../utils/themeColors';
import { filterPokemon } from '../utils/pokemonUtils';
import LocationView from './LocationView';
import AllPokemonView from './AllPokemonView';
import { TbBooks } from 'react-icons/tb';
import './AdventureMode.css';

const LOCATION_ORDER = [
  'Withered Wastelands',
  'Palette Town',
  'Bleak Beach',
  'Rocky Ridges',
  'Sparkling Skylands',
];

function AdventureMode({
  pokemonLocations,
  getPokemonLocation,
  onMovePokemon,
  habitats,
  onCreateHabitat,
  onCreateHabitatWithPokemon,
  onAddToHabitat,
  onDeleteHabitat,
  onRenameHabitat,
  onRemoveFromHabitat,
  onClearHabitat,
  onSplitHabitat,
  navigateTarget,
  onNavigateComplete,
}) {
  const { allPokemon, pokemonById, ownedPokemon, toggleOwned } = usePokemonData();

  const [selectedLocation, setSelectedLocation] = useState('Withered Wastelands');
  const [registerQuery, setRegisterQuery] = useState('');
  const [dragOverLocation, setDragOverLocation] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pendingLocationMove, setPendingLocationMove] = useState(null);

  const hasOwned = ownedPokemon.size > 0;

  // Handle navigation from PokemonDetail → habitat
  const [pendingExpandHabitatId, setPendingExpandHabitatId] = useState(null);
  useEffect(() => {
    if (!navigateTarget) return;
    setSelectedLocation(navigateTarget.location);
    setPendingExpandHabitatId(navigateTarget.habitatId);
    onNavigateComplete();
  }, [navigateTarget, onNavigateComplete]);

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
    setIsDragging(false);
    const pokemonId = e.dataTransfer.getData('text/pokemon-id');
    const sourceHabitatId = e.dataTransfer.getData('text/source-habitat-id');
    if (!pokemonId) return;
    // If already at this location, do nothing
    const currentLoc = getPokemonLocation(pokemonId);
    if (currentLoc === destLocation) return;

    const pokemon = pokemonById.get(pokemonId);
    if (!pokemon) return;

    if (sourceHabitatId) {
      // Moving from a habitat to a different location — needs confirmation
      const sourceHabitat = habitats.find(h => h.id === sourceHabitatId);
      setPendingLocationMove({
        pokemon,
        sourceHabitatId,
        sourceHabitat,
        sourceHabitatName: sourceHabitat ? habitatDisplayName(sourceHabitat) : 'home',
        targetLocation: destLocation,
      });
    } else {
      onMovePokemon(pokemonId, destLocation);
    }
  }, [onMovePokemon, getPokemonLocation, pokemonById, habitats]);

  const confirmLocationMove = useCallback(() => {
    if (!pendingLocationMove) return;
    const { pokemon, sourceHabitatId, sourceHabitat, targetLocation } = pendingLocationMove;
    onRemoveFromHabitat(pokemon.id, sourceHabitatId);
    onMovePokemon(pokemon.id, targetLocation);
    // Auto-delete habitat if it's now empty
    if (sourceHabitat && sourceHabitat.pokemon.length <= 1) {
      onDeleteHabitat(sourceHabitatId);
    }
    setPendingLocationMove(null);
  }, [pendingLocationMove, onRemoveFromHabitat, onMovePokemon, onDeleteHabitat]);

  const cancelLocationMove = useCallback(() => {
    setPendingLocationMove(null);
  }, []);

  const handleLocationDragOver = useCallback((e, loc) => {
    e.preventDefault();
    setDragOverLocation(loc);
  }, []);

  const squirtle = pokemonById.get('squirtle');

  // Onboarding — no owned Pokemon yet
  if (!hasOwned) {
    return (
      <div className="adventure-mode">
        <div className="adventure-onboarding">
          <h2>Your Pokopia Adventure</h2>
          <p className="onboarding-subtitle">
            As you meet Pokemon in Pokopia, add them here to track where they are
            and plan the perfect homes for each location.
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
                onClick={() => toggleOwned('squirtle')}
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
                      onClick={() => toggleOwned(p.id)}
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
      <p className="mode-description">
        Track your progress as you play — register Pokemon you've met and plan homes at each location.
      </p>

      {/* Location selector — also drop targets for moving Pokemon */}
      <div className="location-selector">
        <button
          className={`location-card all-pokemon-tab ${selectedLocation === null ? 'selected' : ''}`}
          style={{
            background: selectedLocation === null ? '#f0eee8' : '#faf9f6',
            borderColor: selectedLocation === null ? '#998' : 'transparent',
          }}
          onClick={() => setSelectedLocation(null)}
        >
          <div className="location-card-top">
            <TbBooks size={18} style={{ color: '#887' }} />
          </div>
          <span className="location-card-name" style={{ color: '#776' }}>My Pokédex</span>
          <span className="location-card-count">{ownedPokemon.size}/{allPokemon.length}</span>
        </button>

        {LOCATION_ORDER.map((loc) => {
          const info = getLocationInfo(loc);
          const Icon = info.Icon;
          const count = pokemonByLocation[loc]?.length || 0;
          const isSelected = selectedLocation === loc;
          const isDragOver = dragOverLocation === loc;

          return (
            <button
              key={loc}
              className={`location-card ${isSelected ? 'selected' : ''} ${isDragOver ? 'drag-over' : ''} ${isDragging && !isSelected ? 'drop-hint' : ''}`}
              style={{
                background: isSelected ? info.gradient : info.bg,
                borderColor: isSelected ? info.color : isDragOver ? info.color : 'transparent',
                '--loc-color': info.color,
              }}
              onClick={() => setSelectedLocation(loc)}
              onDragOver={(e) => handleLocationDragOver(e, loc)}
              onDragLeave={() => setDragOverLocation(null)}
              onDrop={(e) => handleLocationDrop(e, loc)}
            >
              {isDragOver ? (
                <div className="drop-prompt">
                  Move to {loc}
                </div>
              ) : (
                <>
                  <div className="location-card-top">
                    {Icon && <Icon size={18} style={{ color: info.color }} />}
                  </div>
                  <span className="location-card-name" style={{ color: info.color }}>{loc}</span>
                  {count > 0 && (
                    <span className="location-card-count">{count}</span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected location content */}
      {selectedLocation === null ? (
        <AllPokemonView
          getPokemonLocation={getPokemonLocation}
          ownedPokemon={ownedPokemon}
          toggleOwned={toggleOwned}
          onMovePokemon={onMovePokemon}
          habitats={habitats}
          onRemoveFromHabitat={onRemoveFromHabitat}
          onDeleteHabitat={onDeleteHabitat}
        />
      ) : (
        <LocationView
          location={selectedLocation}
          pokemonAtLocation={pokemonByLocation[selectedLocation] || []}
          getPokemonLocation={getPokemonLocation}
          onMovePokemon={onMovePokemon}

          habitats={locationHabitats}
          allHabitats={habitats}
          inHabitatIds={inHabitatIds}
          onCreateHabitat={onCreateHabitat}
          onCreateHabitatWithPokemon={onCreateHabitatWithPokemon}
          onAddToHabitat={onAddToHabitat}
          onDeleteHabitat={onDeleteHabitat}
          onRenameHabitat={onRenameHabitat}
          onRemoveFromHabitat={onRemoveFromHabitat}
          onClearHabitat={onClearHabitat}
          onSplitHabitat={onSplitHabitat}
          pendingExpandHabitatId={pendingExpandHabitatId}
          onExpandHandled={() => setPendingExpandHabitatId(null)}
        />
      )}

      {/* Confirmation modal for cross-location habitat moves */}
      {pendingLocationMove && (() => {
        const src = pendingLocationMove.sourceHabitat;
        const srcDom = src ? getDominantHabitat(src.pokemon) : null;
        const otherPokemon = src ? src.pokemon.filter(p => p.id !== pendingLocationMove.pokemon.id) : [];
        return (
          <div className="detail-overlay" onClick={cancelLocationMove}>
            <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
              {pendingLocationMove.pokemon.sprite && (
                <img className="confirm-sprite" src={pendingLocationMove.pokemon.sprite} alt={pendingLocationMove.pokemon.name} />
              )}
              <p className="confirm-text">
                Move <strong>{pendingLocationMove.pokemon.name}</strong> to <strong>{pendingLocationMove.targetLocation}</strong>?
              </p>
              {src && (
                <div className="confirm-habitat-summary">
                  <div className="confirm-habitat-header">
                    {srcDom && (
                      <span className="habitat-badge small" style={{ backgroundColor: getHabitatBadgeColor(srcDom.type) }}>
                        <HabitatTypeIcon type={srcDom.type} size={10} /> {srcDom.type}
                      </span>
                    )}
                    <span className="confirm-habitat-name">{pendingLocationMove.sourceHabitatName}</span>
                  </div>
                  {otherPokemon.length > 0 && (
                    <div className="confirm-habitat-sprites">
                      {otherPokemon.slice(0, 8).map(p => (
                        p.sprite && <img key={p.id} src={p.sprite} alt={p.name} title={p.name} />
                      ))}
                      {otherPokemon.length > 8 && <span className="confirm-habitat-more">+{otherPokemon.length - 8}</span>}
                    </div>
                  )}
                  {otherPokemon.length === 0 && (
                    <span className="confirm-habitat-empty">This will leave the home empty</span>
                  )}
                </div>
              )}
              <p className="confirm-subtext">This will remove them from their home and change their location.</p>
              <div className="confirm-actions">
                <button className="confirm-yes" onClick={confirmLocationMove}>Move</button>
                <button className="confirm-no" onClick={cancelLocationMove}>Cancel</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default AdventureMode;
