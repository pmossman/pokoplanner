import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { usePokemonData } from '../contexts/PokemonDataContext';
import { getLocationInfo, getHabitatBadgeColor, getDominantHabitat, HabitatTypeIcon } from '../utils/themeColors';
import { habitatDisplayName } from '../utils/habitatHelpers';
import { TbInfoCircle } from 'react-icons/tb';
import HabitatCard from './HabitatCard';
import UnhousedSection from './UnhousedSection';
import PlacementMenu from './PlacementMenu';
import './HabitatBuilder.css';

function LocationView({
  location,
  pokemonAtLocation,
  getPokemonLocation,
  onMovePokemon,
  habitats,
  allHabitats,
  inHabitatIds,
  onCreateHabitat,
  onCreateHabitatWithPokemon,
  onAddToHabitat,
  onDeleteHabitat,
  onRenameHabitat,
  onRemoveFromHabitat,
  onClearHabitat,
  onSplitHabitat,
  pendingExpandHabitatId,
  onExpandHandled,
}) {
  const { allPokemon, pokemonById, ownedPokemon } = usePokemonData();

  // (registration moved to UnhousedSection)

  // Expand/collapse habitat
  const [expandedHabitatId, setExpandedHabitatId] = useState(null);

  // Drag state
  const [draggingPokemon, setDraggingPokemon] = useState(null);
  const [draggingFromHabitat, _setDraggingFromHabitat] = useState(null);
  const draggingFromHabitatRef = useRef(null);
  const setDraggingFromHabitat = useCallback((val) => {
    draggingFromHabitatRef.current = val;
    _setDraggingFromHabitat(val);
  }, []);
  const [dragOverHabitat, setDragOverHabitat] = useState(null);
  const [dragOverPool, setDragOverPool] = useState(false);
  const [dragOverNewHabitat, setDragOverNewHabitat] = useState(false);

  // Confirmation modal
  const [pendingMove, setPendingMove] = useState(null);

  // Placement menu
  const [placementPokemon, setPlacementPokemon] = useState(null);

  // Pool state
  const [poolSearch, setPoolSearch] = useState('');
  const [recommendations, setRecommendations] = useState(null);

  // Handle pending expand from navigation
  useEffect(() => {
    if (pendingExpandHabitatId) {
      setExpandedHabitatId(pendingExpandHabitatId);
      onExpandHandled?.();
    }
  }, [pendingExpandHabitatId, onExpandHandled]);

  // Clear drag state on location change
  useEffect(() => {
    setDraggingPokemon(null);
    setDraggingFromHabitat(null);
    setDragOverHabitat(null);
    setDragOverPool(false);
    setDragOverNewHabitat(false);
  }, [location]);

  useEffect(() => {
    if (draggingPokemon && !pokemonAtLocation.some(p => p.id === draggingPokemon.id)) {
      setDraggingPokemon(null);
      setDraggingFromHabitat(null);
      setDragOverHabitat(null);
      setDragOverPool(false);
      setDragOverNewHabitat(false);
    }
  }, [draggingPokemon, pokemonAtLocation]);

  const locInfo = getLocationInfo(location);

  const expandedHabitat = useMemo(() => {
    if (!expandedHabitatId) return null;
    return habitats.find((h) => h.id === expandedHabitatId) || null;
  }, [habitats, expandedHabitatId]);


  // Reverse lookup: Pokemon ID → habitat ID
  const pokemonToHabitatId = useMemo(() => {
    const map = {};
    for (const h of habitats) {
      for (const p of h.pokemon) {
        map[p.id] = h.id;
      }
    }
    return map;
  }, [habitats]);

  // Habitat compatibility for drag highlighting
  const habitatCompatibility = useMemo(() => {
    if (!draggingPokemon) return {};
    const compat = {};
    for (const h of habitats) {
      if (h.pokemon.length === 0) { compat[h.id] = 0; continue; }
      const habitatTypes = new Set(h.pokemon.map((p) => p.idealHabitat));
      const typeMatch = habitatTypes.has(draggingPokemon.idealHabitat);
      const favSet = {};
      for (const p of h.pokemon) {
        for (const f of p.favorites) favSet[f] = (favSet[f] || 0) + 1;
      }
      let favScore = 0;
      for (const f of draggingPokemon.favorites) {
        if (favSet[f]) favScore += favSet[f];
      }
      compat[h.id] = typeMatch ? favScore + 10 : favScore;
    }
    return compat;
  }, [draggingPokemon, habitats]);

  // Drag handlers — unhoused Pokemon
  const handleDragStart = useCallback((e, pokemon) => {
    e.dataTransfer.setData('text/pokemon-id', pokemon.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingPokemon(pokemon);
    setDraggingFromHabitat(null);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingPokemon(null);
    setDraggingFromHabitat(null);
    setDragOverPool(false);
    setDragOverHabitat(null);
    setDragOverNewHabitat(false);
  }, []);

  // Drag handlers — habitat circle sprites (or collapsed card sprites)
  const handleCircleDragStart = useCallback((e, pokemon, habitatId) => {
    e.dataTransfer.setData('text/pokemon-id', pokemon.id);
    e.dataTransfer.setData('text/source-habitat-id', habitatId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingPokemon(pokemon);
    setDraggingFromHabitat(habitatId);
  }, []);

  // Confirm + execute a pending move
  const confirmPendingMove = useCallback(() => {
    if (!pendingMove) return;
    const { pokemon, sourceHabitatId, sourceHabitat, action, targetHabitatId } = pendingMove;
    onRemoveFromHabitat(pokemon.id, sourceHabitatId);
    if (action === 'move-habitat') {
      onAddToHabitat(pokemon.id, targetHabitatId);
    } else if (action === 'move-location') {
      onMovePokemon(pokemon.id, pendingMove.targetLocation);
    }
    // Auto-delete habitat if it's now empty
    if (sourceHabitat && sourceHabitat.pokemon.length <= 1) {
      onDeleteHabitat(sourceHabitatId);
      if (expandedHabitatId === sourceHabitatId) {
        setExpandedHabitatId(null);
      }
    }
    setPendingMove(null);
  }, [pendingMove, onRemoveFromHabitat, onAddToHabitat, onMovePokemon, onDeleteHabitat, expandedHabitatId]);

  const cancelPendingMove = useCallback(() => {
    setPendingMove(null);
  }, []);

  // Drop on habitat card
  const handleHabitatDrop = useCallback((e, habitat) => {
    e.preventDefault();
    setDragOverHabitat(null);
    setDraggingPokemon(null);
    setDraggingFromHabitat(null);
    const pokemonId = e.dataTransfer.getData('text/pokemon-id');
    const sourceHabitatId = e.dataTransfer.getData('text/source-habitat-id');
    if (!pokemonId) return;
    const pokemon = pokemonById.get(pokemonId);
    if (!pokemon) return;
    if (habitat.pokemon.some((p) => p.id === pokemonId)) return;

    if (sourceHabitatId && sourceHabitatId !== habitat.id) {
      const sourceHabitat = habitats.find(h => h.id === sourceHabitatId);
      setPendingMove({
        pokemon,
        sourceHabitatId,
        sourceHabitat,
        sourceHabitatName: sourceHabitat ? habitatDisplayName(sourceHabitat) : 'home',
        action: 'move-habitat',
        targetHabitatId: habitat.id,
        targetHabitatName: habitatDisplayName(habitat),
      });
    } else if (!sourceHabitatId) {
      onAddToHabitat(pokemonId, habitat.id);
    }
  }, [pokemonById, onAddToHabitat, habitats]);

  // Drop onto pool — remove from habitat
  const handlePoolDrop = useCallback((e) => {
    e.preventDefault();
    setDragOverPool(false);
    setDraggingPokemon(null);
    setDraggingFromHabitat(null);
    const pokemonId = e.dataTransfer.getData('text/pokemon-id');
    const sourceHabitatId = e.dataTransfer.getData('text/source-habitat-id');
    if (!pokemonId || !sourceHabitatId) return;
    const pokemon = pokemonById.get(pokemonId);
    if (!pokemon) return;
    const sourceHabitat = habitats.find(h => h.id === sourceHabitatId);
    setPendingMove({
      pokemon,
      sourceHabitatId,
      sourceHabitat,
      sourceHabitatName: sourceHabitat ? habitatDisplayName(sourceHabitat) : 'home',
      action: 'remove',
    });
  }, [pokemonById, habitats]);

  // Drop onto "new habitat" zone
  const handleNewHabitatDrop = useCallback((e) => {
    e.preventDefault();
    setDragOverNewHabitat(false);
    setDraggingPokemon(null);
    setDraggingFromHabitat(null);
    const pokemonId = e.dataTransfer.getData('text/pokemon-id');
    const sourceHabitatId = e.dataTransfer.getData('text/source-habitat-id');
    if (!pokemonId) return;
    const pokemon = pokemonById.get(pokemonId);
    if (!pokemon) return;

    if (sourceHabitatId) {
      onRemoveFromHabitat(pokemonId, sourceHabitatId);
    }
    onCreateHabitatWithPokemon(null, [pokemonId], location);
  }, [pokemonById, onRemoveFromHabitat, onCreateHabitatWithPokemon, location]);

  const handleToggleExpand = useCallback((habitatId) => {
    setExpandedHabitatId((prev) => (prev === habitatId ? null : habitatId));
  }, []);



  const handleCreateRecommendation = useCallback((rec, index) => {
    onCreateHabitatWithPokemon(null, rec.pokemon.map(p => p.id), location);
    setRecommendations((prev) => {
      if (!prev) return null;
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : null;
    });
  }, [onCreateHabitatWithPokemon, location]);

  const handleCreateAllRecommendations = useCallback(() => {
    if (!recommendations) return;
    for (const rec of recommendations) {
      onCreateHabitatWithPokemon(null, rec.pokemon.map(p => p.id), location);
    }
    setRecommendations(null);
  }, [recommendations, onCreateHabitatWithPokemon, location]);

  const isEmpty = pokemonAtLocation.length === 0;

  // Separate expanded habitat from collapsed ones for layout
  const expandedHab = expandedHabitatId ? habitats.find(h => h.id === expandedHabitatId) : null;
  const collapsedHabitats = habitats.filter(h => h.id !== expandedHabitatId);

  return (
    <div
      className={`location-view ${draggingPokemon ? 'is-dragging' : ''}`}
      onDragOver={draggingPokemon ? (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; } : undefined}
    >
      <div className="location-view-header" style={{ borderColor: locInfo.color }}>
        <div className="location-view-title">
          {locInfo.Icon && <locInfo.Icon size={22} style={{ color: locInfo.color }} />}
          <h2 style={{ color: locInfo.color }}>{location}</h2>
          <span className="location-pokemon-count">{pokemonAtLocation.length} Pokemon</span>
        </div>
      </div>

      {/* Empty state */}
      {isEmpty && (
        <div className="location-empty">
          <div className="location-empty-visual">
            <div className="location-empty-circle">
              <span className="location-empty-icon" style={{ color: locInfo.color }}>
                {locInfo.Icon && <locInfo.Icon size={40} />}
              </span>
            </div>
          </div>
          <p className="location-empty-title">No Pokemon here yet</p>
          <p className="location-empty-hint">
            Register Pokemon in the My Pokédex tab, then they'll appear at their default location.
          </p>
        </div>
      )}

      {/* Two-column layout: unhoused left, habitats right */}
      {!isEmpty && (
        <div className="location-two-col">
          {/* Left column: info box + unhoused Pokemon */}
          <div className="location-col-left">
            <div className="location-info-box">
              <TbInfoCircle className="info-icon" size={18} />
              <span>
                {(() => {
                  const unplacedCount = pokemonAtLocation.filter(p => !inHabitatIds.has(p.id)).length;
                  if (pokemonAtLocation.length <= 1) {
                    return <>Register more Pokemon in the <strong>My Pokédex</strong> tab to start planning homes here.</>;
                  }
                  if (habitats.length === 0 && unplacedCount >= 2) {
                    return <>Drag Pokemon to <strong>+ New Home</strong> to the right, or use <strong>✦ Suggest Homes</strong> for automatic grouping.</>;
                  }
                  if (habitats.length === 0) {
                    return <>Click <strong>+ New Home</strong> or drag a Pokemon there to start building.</>;
                  }
                  if (unplacedCount > 0) {
                    return <>Drag Pokemon into homes on the right. Pokemon with shared favorites make great housemates!</>;
                  }
                  return <>All Pokemon are in homes! Expand a home to see compatibility details and suggestions.</>;
                })()}
              </span>
            </div>

            <UnhousedSection
              pokemonAtLocation={pokemonAtLocation}
              inHabitatIds={inHabitatIds}
              poolSearch={poolSearch}
              onPoolSearchChange={setPoolSearch}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              draggingFromHabitat={draggingFromHabitat}
              draggingFromHabitatRef={draggingFromHabitatRef}
              draggingPokemon={draggingPokemon}
              dragOverPool={dragOverPool}
              onDragOverPool={() => setDragOverPool(true)}
              onDragLeavePool={() => setDragOverPool(false)}
              onPoolDrop={handlePoolDrop}
              recommendations={recommendations}
              onSuggestHabitats={setRecommendations}
              onCreateRecommendation={handleCreateRecommendation}
              onCreateAllRecommendations={handleCreateAllRecommendations}
              onDismissRecommendations={() => setRecommendations(null)}
              location={location}
              allPokemon={allPokemon}
              ownedPokemon={ownedPokemon}
              pokemonById={pokemonById}
              getPokemonLocation={getPokemonLocation}
              onMovePokemon={onMovePokemon}
              allHabitats={allHabitats || habitats}
              onRemoveFromHabitat={onRemoveFromHabitat}
              onPlacePokemon={setPlacementPokemon}
            />
          </div>

          {/* Right column: habitats */}
          <div className="location-col-right">
            {/* Expanded habitat */}
            {expandedHab && (
              <HabitatCard
                key={expandedHab.id}
                habitat={expandedHab}
                isExpanded
                onToggleExpand={handleToggleExpand}
                onRenameHabitat={onRenameHabitat}
                onDeleteHabitat={onDeleteHabitat}
                onRemoveFromHabitat={onRemoveFromHabitat}
                onClearHabitat={onClearHabitat}
                onSplitHabitat={onSplitHabitat}
                onAddToHabitat={onAddToHabitat}
                onMovePokemon={onMovePokemon}
                draggingPokemon={draggingPokemon}
                draggingFromHabitat={draggingFromHabitat}
                dragOver={dragOverHabitat === expandedHab.id}
                onDragOver={(id) => setDragOverHabitat(id)}
                onDragLeave={() => setDragOverHabitat(null)}
                onDrop={handleHabitatDrop}
                habitatCompatScore={habitatCompatibility[expandedHab.id] || 0}
                pokemonAtLocation={pokemonAtLocation}
                location={location}
                getPokemonLocation={getPokemonLocation}
                onCircleDragStart={handleCircleDragStart}
                onCircleDragEnd={handleDragEnd}
              />
            )}

            {/* Collapsed habitat cards */}
            {collapsedHabitats.length > 0 && (
              <div className="habitat-cards-grid">
                {collapsedHabitats.map((h) => (
                  <HabitatCard
                    key={h.id}
                    habitat={h}
                    isExpanded={false}
                    onToggleExpand={handleToggleExpand}
                    onRenameHabitat={onRenameHabitat}
                    onDeleteHabitat={onDeleteHabitat}
                    onRemoveFromHabitat={onRemoveFromHabitat}
                    onClearHabitat={onClearHabitat}
                    onSplitHabitat={onSplitHabitat}
                    onAddToHabitat={onAddToHabitat}
                    onMovePokemon={onMovePokemon}
                    draggingPokemon={draggingPokemon}
                    draggingFromHabitat={draggingFromHabitat}
                    dragOver={dragOverHabitat === h.id}
                    onDragOver={(id) => setDragOverHabitat(id)}
                    onDragLeave={() => setDragOverHabitat(null)}
                    onDrop={handleHabitatDrop}
                    habitatCompatScore={habitatCompatibility[h.id] || 0}
                    pokemonAtLocation={pokemonAtLocation}
                    location={location}
                    getPokemonLocation={getPokemonLocation}
                    onCircleDragStart={handleCircleDragStart}
                    onCircleDragEnd={handleDragEnd}
                  />
                ))}
              </div>
            )}

            {/* New habitat button / drop zone */}
            {draggingPokemon ? (
              <div
                className={`new-habitat-drop ${dragOverNewHabitat ? 'drag-over' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragOverNewHabitat(true); }}
                onDragLeave={() => setDragOverNewHabitat(false)}
                onDrop={handleNewHabitatDrop}
              >
                {dragOverNewHabitat
                  ? `Create home with ${draggingPokemon.name}`
                  : 'Drop here to create new home'}
              </div>
            ) : (
              <button className="new-habitat-btn-full" onClick={() => onCreateHabitat(location)}>
                + New Home
              </button>
            )}
          </div>
        </div>
      )}

      {/* Placement menu */}
      {placementPokemon && (
        <PlacementMenu
          pokemon={placementPokemon}
          habitats={habitats}
          unhoused={pokemonAtLocation.filter(p => !inHabitatIds.has(p.id))}
          onAddToHabitat={onAddToHabitat}
          onCreateHabitatWithPokemon={onCreateHabitatWithPokemon}
          onClose={() => setPlacementPokemon(null)}
          location={location}
        />
      )}

      {/* Confirmation modal */}
      {pendingMove && (() => {
        const src = pendingMove.sourceHabitat;
        const srcDom = src ? getDominantHabitat(src.pokemon) : null;
        const otherPokemon = src ? src.pokemon.filter(p => p.id !== pendingMove.pokemon.id) : [];
        return (
          <div className="detail-overlay" onClick={cancelPendingMove}>
            <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
              {pendingMove.pokemon.sprite && (
                <img className="confirm-sprite" src={pendingMove.pokemon.sprite} alt={pendingMove.pokemon.name} />
              )}
              <p className="confirm-text">
                {pendingMove.action === 'remove' && (
                  <>Remove <strong>{pendingMove.pokemon.name}</strong> from their home?</>
                )}
                {pendingMove.action === 'move-habitat' && (
                  <>Move <strong>{pendingMove.pokemon.name}</strong> to <strong>{pendingMove.targetHabitatName}</strong>?</>
                )}
                {pendingMove.action === 'move-location' && (
                  <>Move <strong>{pendingMove.pokemon.name}</strong> to <strong>{pendingMove.targetLocation}</strong>?</>
                )}
              </p>
              {src && (
                <div className="confirm-habitat-summary">
                  <div className="confirm-habitat-header">
                    {srcDom && (
                      <span className="habitat-badge small" style={{ backgroundColor: getHabitatBadgeColor(srcDom.type) }}>
                        <HabitatTypeIcon type={srcDom.type} size={10} /> {srcDom.type}
                      </span>
                    )}
                    <span className="confirm-habitat-name">{pendingMove.sourceHabitatName}</span>
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
              {pendingMove.action === 'move-location' && (
                <p className="confirm-subtext">This will remove them from their home and change their location.</p>
              )}
              {pendingMove.action === 'move-habitat' && (
                <p className="confirm-subtext">This will remove them from their current home.</p>
              )}
              <div className="confirm-actions">
                <button className="confirm-yes" onClick={confirmPendingMove}>
                  {pendingMove.action === 'remove' ? 'Remove' : 'Move'}
                </button>
                <button className="confirm-no" onClick={cancelPendingMove}>Cancel</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default LocationView;
