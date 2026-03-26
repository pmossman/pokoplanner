import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { usePokemonData } from '../contexts/PokemonDataContext';
import { getHabitatBadgeColor, getHabitatInfo, getDominantHabitat, HabitatTypeIcon, getHabitatTheme, getFavoriteStyle, getLocationInfo } from '../utils/themeColors';
import { suggestHabitatGroupings } from '../utils/pokemonUtils';
import { TbPlus } from 'react-icons/tb';

const SHORT_LOCATION = {
  'Withered Wastelands': 'Withered',
  'Sparkling Skylands': 'Skylands',
  'Rocky Ridges': 'Ridges',
  'Bleak Beach': 'Beach',
  'Palette Town': 'Palette',
};

function UnhousedSection({
  pokemonAtLocation,
  inHabitatIds,
  poolSearch,
  onPoolSearchChange,
  // Drag — outgoing (unhoused pokemon being dragged)
  onDragStart,
  onDragEnd,
  // Drop target — for removing from habitat
  draggingFromHabitat,
  draggingFromHabitatRef,
  draggingPokemon,
  dragOverPool,
  onDragOverPool,
  onDragLeavePool,
  onPoolDrop,
  // Recommendations
  recommendations,
  onSuggestHabitats,
  onCreateRecommendation,
  onCreateAllRecommendations,
  onDismissRecommendations,
  location,
  // Add Pokemon selector
  allPokemon,
  ownedPokemon,
  pokemonById,
  getPokemonLocation,
  onMovePokemon,
  allHabitats,
  onRemoveFromHabitat,
}) {
  const { selectPokemon } = usePokemonData();
  const [detailedView, setDetailedView] = useState(false);
  const [showAddPokemon, setShowAddPokemon] = useState(false);
  const [addQuery, setAddQuery] = useState('');
  const [confirmMove, setConfirmMove] = useState(null);
  const addPanelRef = useRef(null);

  const unplacedPokemon = useMemo(() => {
    const unplaced = pokemonAtLocation.filter((p) => !inHabitatIds.has(p.id));
    const search = poolSearch.trim().toLowerCase();
    if (search) {
      return unplaced.filter((p) => p.name.toLowerCase().includes(search));
    }
    return unplaced;
  }, [pokemonAtLocation, inHabitatIds, poolSearch]);

  const unplacedCount = pokemonAtLocation.filter((p) => !inHabitatIds.has(p.id)).length;

  const handleSuggestHabitats = useCallback(() => {
    const unplaced = pokemonAtLocation.filter((p) => !inHabitatIds.has(p.id));
    if (unplaced.length === 0) return;
    onSuggestHabitats(suggestHabitatGroupings(unplaced));
  }, [pokemonAtLocation, inHabitatIds, onSuggestHabitats]);

  // Close add panel when clicking outside
  useEffect(() => {
    if (!showAddPokemon) return;
    const handleClick = (e) => {
      if (addPanelRef.current && !addPanelRef.current.contains(e.target)) {
        setShowAddPokemon(false);
        setAddQuery('');
        setConfirmMove(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showAddPokemon]);

  // Pokemon available to add: registered but not at this location
  const addPokemonLists = useMemo(() => {
    if (!showAddPokemon) return { unassigned: [], otherLocation: [] };
    const search = addQuery.trim().toLowerCase();
    const registered = allPokemon.filter(p => ownedPokemon.has(p.id));
    const atThisLocation = new Set(pokemonAtLocation.map(p => p.id));

    const unassigned = [];
    const otherLocation = [];

    for (const p of registered) {
      if (atThisLocation.has(p.id)) continue;
      const currentLoc = getPokemonLocation(p.id);
      if (search && !p.name.toLowerCase().includes(search) && !String(p.number).includes(search)) continue;
      if (currentLoc === location) continue; // already here
      // Check if they have no custom location and their primary is different
      const inAHome = allHabitats.some(h => h.pokemon.some(hp => hp.id === p.id));
      const entry = { ...p, currentLocation: currentLoc, inHome: inAHome };
      // "Unassigned" = pokemon whose current location matches their primaryLocation (never moved)
      // Actually let's just check: if they're at this location already, skip. Otherwise group by whether they're at another named location
      if (currentLoc === p.primaryLocation && currentLoc !== location) {
        // They're at their default location — treat as available
        unassigned.push(entry);
      } else {
        otherLocation.push(entry);
      }
    }

    unassigned.sort((a, b) => a.number - b.number);
    otherLocation.sort((a, b) => a.number - b.number);
    return { unassigned, otherLocation };
  }, [showAddPokemon, addQuery, allPokemon, ownedPokemon, pokemonAtLocation, getPokemonLocation, location, allHabitats]);

  const handleAddPokemonToLocation = useCallback((pokemon) => {
    onMovePokemon(pokemon.id, location);
    // Don't close — let user add more
  }, [onMovePokemon, location]);

  const handleConfirmMoveToLocation = useCallback((pokemon) => {
    // Pokemon is at another location, possibly in a home — confirm first
    setConfirmMove(pokemon);
  }, []);

  const handleConfirmMoveYes = useCallback(() => {
    if (!confirmMove) return;
    // Remove from any home at their current location
    for (const h of allHabitats) {
      if (h.pokemon.some(p => p.id === confirmMove.id)) {
        onRemoveFromHabitat(confirmMove.id, h.id);
      }
    }
    onMovePokemon(confirmMove.id, location);
    setConfirmMove(null);
  }, [confirmMove, onMovePokemon, onRemoveFromHabitat, location, allHabitats]);

  const isDropTarget = !!draggingFromHabitat;

  return (
    <div
      className={`unhoused-section ${isDropTarget ? 'is-drop-target' : ''} ${dragOverPool ? 'drag-over-pool' : ''}`}
      onDragOver={(e) => { if (!draggingFromHabitatRef.current) return; e.preventDefault(); onDragOverPool(); }}
      onDragLeave={onDragLeavePool}
      onDrop={(e) => { if (!draggingFromHabitatRef.current) return; onPoolDrop(e); }}
    >
      <div className="unhoused-header">
        <h3>Without a Home</h3>
        <div className="unhoused-header-right">
          <input
            type="text"
            className="pool-search-input"
            placeholder="Filter..."
            value={poolSearch}
            onChange={(e) => onPoolSearchChange(e.target.value)}
          />
          <span className="pool-header-count">{unplacedCount} without a home</span>
          <button
            className={`view-toggle-btn ${detailedView ? 'active' : ''}`}
            onClick={() => setDetailedView(!detailedView)}
          >
            {detailedView ? '▦ Compact' : '▤ Detailed'}
          </button>
        </div>
      </div>

      {!detailedView && (
        <div className="pool-grid">
          {/* Add Pokemon tile */}
          <div className="location-pokemon add-pokemon-tile" onClick={() => { setShowAddPokemon(!showAddPokemon); setAddQuery(''); setConfirmMove(null); }}>
            <div className="location-pokemon-sprite add-pokemon-sprite">
              <TbPlus size={32} />
            </div>
            <span className="location-pokemon-name">Add Pokemon</span>
          </div>
          {unplacedPokemon.map((p) => (
            <div
              key={p.id}
              className="location-pokemon"
              draggable
              onDragStart={(e) => onDragStart(e, p)}
              onDragEnd={onDragEnd}
            >
              <div className="location-pokemon-sprite" onClick={() => selectPokemon(p)}>
                {p.sprite && <img src={p.sprite} alt={p.name} />}
              </div>
              <span className="location-pokemon-name">
                {p.name}
              </span>
            </div>
          ))}
        </div>
      )}

      {detailedView && (
        <div className="pool-grid">
          {/* Add Pokemon tile */}
          <div className="location-pokemon add-pokemon-tile" onClick={() => { setShowAddPokemon(!showAddPokemon); setAddQuery(''); setConfirmMove(null); }}>
            <div className="location-pokemon-sprite add-pokemon-sprite">
              <TbPlus size={32} />
            </div>
            <span className="location-pokemon-name">Add Pokemon</span>
          </div>
        </div>
      )}

      {/* Add Pokemon selector popup */}
      {showAddPokemon && (
        <div className="add-pokemon-panel" ref={addPanelRef}>
          <div className="add-pokemon-panel-header">
            <h4>Add Pokemon to {location}</h4>
            <button className="add-pokemon-close" onClick={() => { setShowAddPokemon(false); setAddQuery(''); setConfirmMove(null); }}>&times;</button>
          </div>
          <input
            type="text"
            className="add-pokemon-search"
            placeholder="Search by name or number..."
            value={addQuery}
            onChange={(e) => setAddQuery(e.target.value)}
            autoFocus
          />
          {addPokemonLists.unassigned.length > 0 && (
            <div className="add-pokemon-group">
              <h5>Available Pokemon</h5>
              <div className="add-pokemon-list">
                {addPokemonLists.unassigned.slice(0, 20).map((p) => {
                  const locInfo = getLocationInfo(p.currentLocation);
                  return (
                    <div key={p.id} className="add-pokemon-item" onClick={() => handleAddPokemonToLocation(p)}>
                      {p.sprite && <img className="add-pokemon-sprite" src={p.sprite} alt={p.name} />}
                      <span className="add-pokemon-name">{p.name}</span>
                      <span className="add-pokemon-loc" style={{ color: locInfo.color }}>
                        {SHORT_LOCATION[p.currentLocation] || p.currentLocation}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {addPokemonLists.otherLocation.length > 0 && (
            <div className="add-pokemon-group">
              <h5>At Other Locations</h5>
              <div className="add-pokemon-list">
                {addPokemonLists.otherLocation.slice(0, 20).map((p) => {
                  const locInfo = getLocationInfo(p.currentLocation);
                  return (
                    <div key={p.id} className="add-pokemon-item other-location" onClick={() => handleConfirmMoveToLocation(p)}>
                      {p.sprite && <img className="add-pokemon-sprite" src={p.sprite} alt={p.name} />}
                      <span className="add-pokemon-name">{p.name}</span>
                      <span className="add-pokemon-loc" style={{ color: locInfo.color }}>
                        {SHORT_LOCATION[p.currentLocation] || p.currentLocation}
                      </span>
                      {p.inHome && <span className="add-pokemon-home-badge">In a home</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {addPokemonLists.unassigned.length === 0 && addPokemonLists.otherLocation.length === 0 && (
            <p className="add-pokemon-empty">
              {addQuery.trim() ? 'No matches found.' : 'All registered Pokemon are already here.'}
            </p>
          )}
          {/* Confirm move dialog */}
          {confirmMove && (
            <div className="add-pokemon-confirm">
              <p>
                Move <strong>{confirmMove.name}</strong> from <strong>{SHORT_LOCATION[confirmMove.currentLocation] || confirmMove.currentLocation}</strong> to <strong>{SHORT_LOCATION[location] || location}</strong>?
                {confirmMove.inHome && <> This will remove them from their home.</>}
              </p>
              <div className="add-pokemon-confirm-actions">
                <button className="confirm-yes" onClick={handleConfirmMoveYes}>Move</button>
                <button className="confirm-no" onClick={() => setConfirmMove(null)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      {unplacedPokemon.length > 0 && detailedView && (
        <div className="pool-detail-grid">
          {unplacedPokemon.map((p) => {
            const habitatInfo = getHabitatInfo(p.idealHabitat);
            return (
              <div
                key={p.id}
                className="pool-detail-card"
                style={{ backgroundColor: habitatInfo.bg, borderColor: habitatInfo.color + '44' }}
                draggable
                onDragStart={(e) => onDragStart(e, p)}
                onDragEnd={onDragEnd}
              >
                <div className="pool-detail-top" onClick={() => selectPokemon(p)}>
                  {p.sprite && <img className="pool-detail-sprite" src={p.sprite} alt={p.name} />}
                  <div className="pool-detail-info">
                    <span className="pool-detail-name">{p.name}</span>
                  </div>
                </div>
                <div className="pool-detail-favs">
                  {p.favorites.map((f) => {
                    const style = getFavoriteStyle(f);
                    return (
                      <span key={f} className="pool-detail-fav" style={{ backgroundColor: style.bg, color: style.text, borderColor: style.border }}>
                        {f}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {unplacedCount === 0 && pokemonAtLocation.length > 0 && (
        <p className="pool-all-placed">All Pokemon are in homes!</p>
      )}

      {poolSearch.trim() && unplacedPokemon.length === 0 && unplacedCount > 0 && (
        <p className="pool-all-placed">No matches</p>
      )}

      {dragOverPool && draggingPokemon && (
        <p className="pool-drop-message">Remove {draggingPokemon.name} from their home</p>
      )}

      {/* Recommendations */}
      {recommendations && (
        <div className="recommendations-panel">
          <div className="recommendations-header">
            <h3>Recommended Homes</h3>
            <div className="recommendations-actions">
              <button className="rec-create-all-btn" onClick={onCreateAllRecommendations}>
                Create All ({recommendations.length})
              </button>
              <button className="rec-dismiss-btn" onClick={onDismissRecommendations}>Dismiss</button>
            </div>
          </div>
          <div className="recommendations-grid">
            {recommendations.map((rec, i) => {
              const theme = getHabitatTheme(rec.pokemon);
              const info = getHabitatInfo(rec.type);
              return (
                <div key={i} className="recommendation-card" style={{ background: theme.bgGradient, borderColor: theme.accentColor }}>
                  <div className="rec-card-header">
                    <span className="habitat-type-tag" style={{ backgroundColor: info.bg, color: info.color, borderColor: info.color }}>
                      <HabitatTypeIcon type={rec.type} size={12} /> {rec.type}
                    </span>
                    <span className="rec-card-count">{rec.pokemon.length} Pokemon</span>
                  </div>
                  <div className="rec-card-circle" style={{ background: theme.circleGradient }}>
                    {rec.pokemon.map((p, j) => {
                      const angle = (j / rec.pokemon.length) * 2 * Math.PI - Math.PI / 2;
                      const radius = rec.pokemon.length <= 3 ? 50 : 60;
                      const cx = 80, cy = 80;
                      const x = cx + Math.cos(angle) * radius - 20;
                      const y = cy + Math.sin(angle) * radius - 20;
                      return (
                        <div key={p.id} className="rec-card-pokemon" style={{ left: `${x}px`, top: `${y}px` }} onClick={() => selectPokemon(p)}>
                          {p.sprite && <img src={p.sprite} alt={p.name} />}
                          <span className="rec-pokemon-name">{p.name}</span>
                        </div>
                      );
                    })}
                  </div>
                  {rec.topFavorites.length > 0 && (
                    <div className="rec-card-favs">
                      {rec.topFavorites.map(({ favorite, count }) => {
                        const style = getFavoriteStyle(favorite);
                        return (
                          <span key={favorite} className="location-habitat-fav-tag" style={{ backgroundColor: style.bg, color: style.text, borderColor: style.border }}>
                            {favorite} {count}/{rec.pokemon.length}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  <button className="rec-create-btn" onClick={() => onCreateRecommendation(rec, i)}>Create Home</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {unplacedCount >= 2 && !recommendations && (
        <button className="suggest-btn" onClick={handleSuggestHabitats}>✦ Suggest Homes</button>
      )}
    </div>
  );
}

export default UnhousedSection;
