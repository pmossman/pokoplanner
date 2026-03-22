import { useState, useMemo, useCallback, useRef } from 'react';
import { getLocationInfo, getHabitatBadgeColor, getHabitatTheme, getHabitatInfo, getDominantHabitat, HabitatTypeIcon, getFavoriteStyle } from '../utils/themeColors';
import { filterPokemon, favoriteCounts, rankByCompatibility, suggestSplit, suggestHabitatTypeSplit, suggestHabitatGroupings } from '../utils/pokemonUtils';
import PokemonCard from './PokemonCard';
import './HabitatBuilder.css';

function LocationView({
  location,
  allPokemon,
  allFavorites,
  allIdealHabitats,
  pokemonById,
  pokemonAtLocation,
  allOwnedPokemon,
  onToggleOwned,
  getPokemonLocation,
  onMovePokemon,
  habitats,
  inHabitatIds,
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
  // Registration state
  const [showRegister, setShowRegister] = useState(false);
  const [registerQuery, setRegisterQuery] = useState('');
  const [registerHabitat, setRegisterHabitat] = useState('');

  // Habitat builder state
  const [activeHabitatId, setActiveHabitatId] = useState(null);
  const [dragOverHabitat, setDragOverHabitat] = useState(null);
  const [dragOverCircle, setDragOverCircle] = useState(false);
  const [draggingPokemon, setDraggingPokemon] = useState(null);
  const [showUnplaced, setShowUnplaced] = useState(true);
  const [showPlaced, setShowPlaced] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHabitat, setSearchHabitat] = useState('');
  const [searchFavorite, setSearchFavorite] = useState('');
  const [sameHabitatOnly, setSameHabitatOnly] = useState(true);
  const [showSplit, setShowSplit] = useState(false);
  const [highlightFav, setHighlightFav] = useState(null);
  const [highlightHabitat, setHighlightHabitat] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAllFavs, setShowAllFavs] = useState(false);
  const [poolSearch, setPoolSearch] = useState('');
  const [collapsedTypes, setCollapsedTypes] = useState(new Set());
  const searchRef = useRef(null);

  const locInfo = getLocationInfo(location);

  // Resolve active habitat (null means no habitat selected)
  const activeHabitat = useMemo(() => {
    if (!activeHabitatId) return null;
    return habitats.find((h) => h.id === activeHabitatId) || null;
  }, [habitats, activeHabitatId]);

  const effectiveActiveId = activeHabitat?.id;
  const habitatPokemon = activeHabitat ? activeHabitat.pokemon : [];

  // Register search results
  const registerResults = useMemo(() => {
    if (!showRegister && !registerQuery.trim()) return [];
    let results = filterPokemon(allPokemon, {
      query: registerQuery,
      idealHabitat: registerHabitat,
    });
    results = [...results].sort((a, b) => {
      const aMatch = a.primaryLocation === location ? 0 : 1;
      const bMatch = b.primaryLocation === location ? 0 : 1;
      if (aMatch !== bMatch) return aMatch - bMatch;
      return a.number - b.number;
    });
    return results;
  }, [allPokemon, registerQuery, registerHabitat, location, showRegister]);

  // Builder computations
  const favCounts = useMemo(
    () => favoriteCounts(habitatPokemon),
    [habitatPokemon]
  );

  const topFavorites = useMemo(() => {
    if (favCounts.length === 0) return new Set();
    const cutoff = favCounts.length >= 3 ? favCounts[2].count : favCounts[favCounts.length - 1].count;
    return new Set(favCounts.filter((f) => f.count >= cutoff).map((f) => f.favorite));
  }, [favCounts]);

  const midFavorites = useMemo(() => {
    if (habitatPokemon.length === 0) return new Set();
    const halfCount = habitatPokemon.length / 2;
    return new Set(
      favCounts
        .filter((f) => f.count >= halfCount && !topFavorites.has(f.favorite))
        .map((f) => f.favorite)
    );
  }, [favCounts, habitatPokemon.length, topFavorites]);

  // Suggestions: prioritize Pokemon at this location
  const suggestions = useMemo(() => {
    if (habitatPokemon.length === 0) return [];
    const habitatIds = new Set(habitatPokemon.map((p) => p.id));
    const localPool = pokemonAtLocation.filter((p) => !habitatIds.has(p.id));
    return rankByCompatibility(localPool, habitatPokemon, sameHabitatOnly);
  }, [pokemonAtLocation, habitatPokemon, sameHabitatOnly]);

  // Out-of-area suggestions
  const outOfAreaSuggestions = useMemo(() => {
    if (habitatPokemon.length === 0) return [];
    const habitatIds = new Set(habitatPokemon.map((p) => p.id));
    const otherOwned = [...allOwnedPokemon]
      .map((id) => pokemonById.get(id))
      .filter((p) => p && !habitatIds.has(p.id) && getPokemonLocation(p.id) !== location);
    return rankByCompatibility(otherOwned, habitatPokemon, sameHabitatOnly)
      .filter((p) => p.score > 0)
      .slice(0, 10);
  }, [habitatPokemon, allOwnedPokemon, pokemonById, getPokemonLocation, location, sameHabitatOnly]);

  const splitResult = useMemo(
    () => suggestSplit(habitatPokemon),
    [habitatPokemon]
  );

  const habitatTypeSplit = useMemo(
    () => suggestHabitatTypeSplit(habitatPokemon),
    [habitatPokemon]
  );

  const showHabitatTypeSplit = !!habitatTypeSplit;
  const showFavoriteSplit = splitResult && (
    !habitatTypeSplit || splitResult.scoreAfter > habitatTypeSplit.scoreAfter
  );

  const splitFavCountsA = useMemo(
    () => (splitResult ? favoriteCounts(splitResult.groupA) : []),
    [splitResult]
  );
  const splitFavCountsB = useMemo(
    () => (splitResult ? favoriteCounts(splitResult.groupB) : []),
    [splitResult]
  );

  const habitatTheme = useMemo(
    () => getHabitatTheme(habitatPokemon),
    [habitatPokemon]
  );

  const dominantHabitat = useMemo(
    () => getDominantHabitat(habitatPokemon),
    [habitatPokemon]
  );

  // Per-pokemon compatibility warnings
  const pokemonWarnings = useMemo(() => {
    if (habitatPokemon.length < 2) return {};
    const dom = dominantHabitat;
    const domType = dom?.type;
    // Count how often each favorite appears across the group
    const favTotals = {};
    for (const p of habitatPokemon) {
      for (const f of p.favorites) favTotals[f] = (favTotals[f] || 0) + 1;
    }
    const warnings = {};
    for (const p of habitatPokemon) {
      const issues = [];
      // Mismatched ideal habitat
      if (domType && p.idealHabitat !== domType && !dom.tied) {
        issues.push(`Prefers ${p.idealHabitat} habitat (group is ${domType})`);
      }
      // Low favorite overlap: count how many of this pokemon's favorites are shared by at least one other
      const sharedCount = p.favorites.filter((f) => favTotals[f] > 1).length;
      if (sharedCount <= 1) {
        issues.push(`Shares ${sharedCount === 0 ? 'no' : 'only 1'} favorite${sharedCount === 1 ? '' : 's'} with the group`);
      }
      if (issues.length > 0) warnings[p.id] = issues;
    }
    return warnings;
  }, [habitatPokemon, dominantHabitat]);

  // Search within habitat builder
  const isSearchActive = searchQuery.trim() || searchHabitat || searchFavorite;

  const searchResults = useMemo(() => {
    if (!isSearchActive) return [];
    const habitatIds = new Set(habitatPokemon.map((p) => p.id));
    return filterPokemon(allPokemon, {
      query: searchQuery,
      idealHabitat: searchHabitat,
      favorite: searchFavorite,
    }).filter((p) => !habitatIds.has(p.id));
  }, [searchQuery, searchHabitat, searchFavorite, allPokemon, habitatPokemon, isSearchActive]);

  // Drag handlers
  const handleDragStart = useCallback((e, pokemon) => {
    e.dataTransfer.setData('text/pokemon-id', pokemon.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingPokemon(pokemon);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingPokemon(null);
  }, []);

  const handleHabitatTabDrop = useCallback((e, habitat) => {
    e.preventDefault();
    setDragOverHabitat(null);
    const pokemonId = e.dataTransfer.getData('text/pokemon-id');
    if (!pokemonId) return;
    const pokemon = pokemonById.get(pokemonId);
    if (!pokemon) return;
    if (habitat.pokemon.some((p) => p.id === pokemonId)) return;
    onAddToHabitat(pokemon, habitat.id);
  }, [pokemonById, onAddToHabitat]);

  const handleCircleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOverCircle(false);
    setDraggingPokemon(null);
    if (!activeHabitat) return;
    const pokemonId = e.dataTransfer.getData('text/pokemon-id');
    if (!pokemonId) return;
    const pokemon = pokemonById.get(pokemonId);
    if (!pokemon) return;
    if (activeHabitat.pokemon.some((p) => p.id === pokemonId)) return;
    onAddToHabitat(pokemon, activeHabitat.id);
  }, [pokemonById, onAddToHabitat, activeHabitat]);

  // Naming
  const habitatDisplayName = (h) => {
    if (h.customName) return h.customName;
    if (h.pokemon.length === 0) return 'New Habitat';
    const names = h.pokemon.map((p) => p.name);
    const joined = names.join(', ');
    return joined.length > 30 ? joined.slice(0, 27) + '...' : joined;
  };

  const handleRename = (habitat) => {
    setRenamingId(habitat.id);
    setRenameValue(habitat.customName || '');
  };

  const commitRename = () => {
    if (renamingId) {
      const trimmed = renameValue.trim();
      onRenameHabitat(renamingId, trimmed || null);
    }
    setRenamingId(null);
    setRenameValue('');
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameValue('');
  };

  const handleAddFromSearch = useCallback((pokemon) => {
    if (!activeHabitat) return;
    onAddToHabitat(pokemon, activeHabitat.id);
    setSearchQuery('');
    if (searchRef.current) searchRef.current.focus();
  }, [activeHabitat, onAddToHabitat]);

  const habitatSubtitle = (h) => {
    if (h.pokemon.length === 0) return 'Empty';
    const dom = getDominantHabitat(h.pokemon);
    const types = dom.tied || [dom.type];
    const topFavs = favoriteCounts(h.pokemon).slice(0, 2).map((f) => f.favorite);
    return (
      <>
        {types.map((t, i) => (
          <span key={t}>
            {i > 0 && ' / '}
            <HabitatTypeIcon type={t} size={12} /> {t}
          </span>
        ))}
        {topFavs.length > 0 && ` · ${topFavs.join(', ')}`}
      </>
    );
  };

  // Group Pokemon by ideal habitat type, split into unplaced/placed
  const { unplacedGroups, placedPokemon, placedGroups } = useMemo(() => {
    const unplaced = [];
    const placed = [];
    for (const p of pokemonAtLocation) {
      if (inHabitatIds.has(p.id)) {
        placed.push(p);
      } else {
        unplaced.push(p);
      }
    }
    // Group unplaced by ideal habitat type
    const byType = {};
    for (const p of unplaced) {
      if (!byType[p.idealHabitat]) byType[p.idealHabitat] = [];
      byType[p.idealHabitat].push(p);
    }
    // Group placed by ideal habitat type too
    const placedByType = {};
    for (const p of placed) {
      if (!placedByType[p.idealHabitat]) placedByType[p.idealHabitat] = [];
      placedByType[p.idealHabitat].push(p);
    }
    // Sort: dominant habitat type of active habitat first, then by count
    const activeType = activeHabitat ? getDominantHabitat(activeHabitat.pokemon)?.type : null;
    const groups = Object.entries(byType)
      .sort((a, b) => {
        if (activeType) {
          if (a[0] === activeType && b[0] !== activeType) return -1;
          if (b[0] === activeType && a[0] !== activeType) return 1;
        }
        return b[1].length - a[1].length;
      })
      .map(([type, pokemon]) => ({ type, pokemon }));
    const pGroups = Object.entries(placedByType)
      .sort((a, b) => b[1].length - a[1].length)
      .map(([type, pokemon]) => ({ type, pokemon }));
    return { unplacedGroups: groups, placedPokemon: placed, placedGroups: pGroups };
  }, [pokemonAtLocation, inHabitatIds, activeHabitat]);

  // Compute habitat compatibility for drag highlighting
  const habitatCompatibility = useMemo(() => {
    if (!draggingPokemon) return {};
    const compat = {};
    for (const h of habitats) {
      if (h.pokemon.length === 0) { compat[h.id] = 0; continue; }
      // Check ideal habitat match
      const habitatTypes = new Set(h.pokemon.map((p) => p.idealHabitat));
      const typeMatch = habitatTypes.has(draggingPokemon.idealHabitat);
      // Count shared favorites
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

  const unplacedCount = unplacedGroups.reduce((sum, g) => sum + g.pokemon.length, 0);

  const handleSuggestHabitats = useCallback(() => {
    const unplaced = unplacedGroups.flatMap((g) => g.pokemon);
    if (unplaced.length === 0) return;
    const recs = suggestHabitatGroupings(unplaced);
    setRecommendations(recs);
  }, [unplacedGroups]);

  const handleCreateRecommendation = useCallback((rec, index) => {
    onCreateHabitatWithPokemon(null, rec.pokemon, location);
    // Remove this recommendation from the list
    setRecommendations((prev) => {
      if (!prev) return null;
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : null;
    });
  }, [onCreateHabitatWithPokemon, location]);

  const handleCreateAllRecommendations = useCallback(() => {
    if (!recommendations) return;
    for (const rec of recommendations) {
      onCreateHabitatWithPokemon(null, rec.pokemon, location);
    }
    setRecommendations(null);
  }, [recommendations, onCreateHabitatWithPokemon, location]);

  const isEmpty = pokemonAtLocation.length === 0;

  return (
    <div
      className={`location-view ${draggingPokemon ? 'is-dragging' : ''}`}
      onDragOver={draggingPokemon ? (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; } : undefined}
    >
      <div className="location-view-header" style={{ borderColor: locInfo.color }}>
        <div className="location-view-title">
          {locInfo.Icon && <locInfo.Icon size={22} style={{ color: locInfo.color }} />}
          <h2 style={{ color: locInfo.color }}>{location}</h2>
          <span className="location-pokemon-count">
            {pokemonAtLocation.length} Pokemon
          </span>
        </div>
        <div className="location-view-actions">
          <button
            className={`register-toggle-btn ${showRegister ? 'active' : ''}`}
            onClick={() => { setShowRegister(!showRegister); setRegisterQuery(''); }}
          >
            {showRegister ? 'Done' : '+ Add Pokemon'}
          </button>
        </div>
      </div>

      {/* Registration panel */}
      {showRegister && (
        <div className="register-panel">
          <p className="register-hint">Mark Pokemon you've encountered in the game. They'll appear at their default location.</p>
          <div className="register-controls">
            <input
              type="text"
              placeholder="Search by name or number..."
              value={registerQuery}
              onChange={(e) => setRegisterQuery(e.target.value)}
              className="register-search-input"
              autoFocus
            />
            <select
              value={registerHabitat}
              onChange={(e) => setRegisterHabitat(e.target.value)}
              className="register-select"
            >
              <option value="">All Habitats</option>
              {allIdealHabitats.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
          <div className="register-results">
            {(showRegister && !registerQuery.trim()
              ? allPokemon.filter((p) => p.primaryLocation === location)
              : registerResults
            ).slice(0, 30).map((p) => {
              const isOwned = allOwnedPokemon.has(p.id);
              const isHere = p.primaryLocation === location;
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
                  {!isHere && (
                    <span className="register-result-location">{p.primaryLocation}</span>
                  )}
                  <span
                    className="habitat-badge small"
                    style={{ backgroundColor: getHabitatBadgeColor(p.idealHabitat) }}
                  >
                    <HabitatTypeIcon type={p.idealHabitat} size={10} /> {p.idealHabitat}
                  </span>
                  {isOwned && <span className="register-check">✓</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {isEmpty && !showRegister && (
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
            Add Pokemon you've met in {location} — then drag them into habitats to plan your builds.
          </p>
          <button
            className="register-toggle-btn"
            onClick={() => setShowRegister(true)}
          >
            + Add Pokemon
          </button>
        </div>
      )}

      {/* Recommendations panel — full width above the builder */}
      {recommendations && (
        <div className="recommendations-panel">
          <div className="recommendations-header">
            <h3>Recommended Habitats</h3>
            <div className="recommendations-actions">
              <button className="rec-create-all-btn" onClick={handleCreateAllRecommendations}>
                Create All ({recommendations.length})
              </button>
              <button className="rec-dismiss-btn" onClick={() => setRecommendations(null)}>
                Dismiss
              </button>
            </div>
          </div>
          <div className="recommendations-grid">
            {recommendations.map((rec, i) => {
              const theme = getHabitatTheme(rec.pokemon);
              const info = getHabitatInfo(rec.type);
              return (
                <div
                  key={i}
                  className="recommendation-card"
                  style={{ background: theme.bgGradient, borderColor: theme.accentColor }}
                >
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
                        <div key={p.id} className="rec-card-pokemon" style={{ left: `${x}px`, top: `${y}px` }} onClick={() => onSelectPokemon(p)}>
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
                  <button className="rec-create-btn" onClick={() => handleCreateRecommendation(rec, i)}>
                    Create Habitat
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Side-by-side builder layout ── */}
      {!isEmpty && (
        <div className={`location-builder-layout ${!activeHabitat ? 'pool-focused' : ''} ${draggingPokemon ? 'is-dragging' : ''}`}>
          {/* Left panel: Pokemon pool */}
          <div className="location-pool-panel">
            <div className="pool-header">
              <input
                type="text"
                className="pool-search-input"
                placeholder="Filter Pokemon..."
                value={poolSearch}
                onChange={(e) => setPoolSearch(e.target.value)}
              />
              <span className="pool-header-count">{pokemonAtLocation.length} total</span>
            </div>

            <div className="pool-scroll">
              {unplacedCount > 0 && (
                <div className="pool-unplaced-section">
                  <button className="pool-placed-toggle" onClick={() => setShowUnplaced(!showUnplaced)}>
                    <span>Not in habitats ({unplacedCount})</span>
                    <span className="pool-placed-arrow">{showUnplaced ? '▾' : '▸'}</span>
                  </button>
                  {showUnplaced && (
                    <div className="pool-type-groups-wrap">
                      {unplacedGroups.map(({ type, pokemon }) => {
                        const typeInfo = getHabitatInfo(type);
                        const filtered = poolSearch.trim()
                          ? pokemon.filter((p) => p.name.toLowerCase().includes(poolSearch.trim().toLowerCase()))
                          : pokemon;
                        if (filtered.length === 0) return null;
                        const isCollapsed = collapsedTypes.has('unplaced-' + type);
                        const isRecommended = activeHabitat && getDominantHabitat(activeHabitat.pokemon)?.type === type;
                        return (
                        <div key={type} className={`pool-type-group ${isRecommended ? 'recommended' : ''}`} style={{ backgroundColor: typeInfo.bg, borderColor: typeInfo.color + '33' }}>
                          <button className="pool-type-header" onClick={() => setCollapsedTypes((prev) => { const next = new Set(prev); const key = 'unplaced-' + type; next.has(key) ? next.delete(key) : next.add(key); return next; })}>
                            <span className="habitat-badge small" style={{ backgroundColor: getHabitatBadgeColor(type) }}>
                              <HabitatTypeIcon type={type} size={10} /> {type}
                            </span>
                            {isRecommended && <span className="pool-type-recommended">best match</span>}
                            <span className="pool-type-count">{filtered.length}</span>
                            <span className="pool-placed-arrow">{isCollapsed ? '▸' : '▾'}</span>
                          </button>
                          {!isCollapsed && (
                            <div className="pool-grid">
                              {filtered.map((p) => (
                                <div key={p.id} className="location-pokemon" draggable onDragStart={(e) => handleDragStart(e, p)} onDragEnd={handleDragEnd}>
                                  <div className="location-pokemon-sprite" onClick={() => onSelectPokemon(p)}>
                                    {p.sprite && <img src={p.sprite} alt={p.name} />}
                                  </div>
                                  <span className="location-pokemon-name">{p.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {unplacedCount === 0 && pokemonAtLocation.length > 0 && (
                <p className="pool-all-placed">All Pokemon are in habitats</p>
              )}

              {placedPokemon.length > 0 && (
                <div className="pool-placed-section">
                  <button className="pool-placed-toggle" onClick={() => setShowPlaced(!showPlaced)}>
                    <span>In habitats ({placedPokemon.length})</span>
                    <span className="pool-placed-arrow">{showPlaced ? '▾' : '▸'}</span>
                  </button>
                  {showPlaced && (
                    <div className="pool-type-groups-wrap">
                      {placedGroups.map(({ type, pokemon }) => {
                        const typeInfo = getHabitatInfo(type);
                        const filtered = poolSearch.trim()
                          ? pokemon.filter((p) => p.name.toLowerCase().includes(poolSearch.trim().toLowerCase()))
                          : pokemon;
                        if (filtered.length === 0) return null;
                        const isCollapsed = collapsedTypes.has('placed-' + type);
                        return (
                        <div key={type} className="pool-type-group" style={{ backgroundColor: typeInfo.bg, borderColor: typeInfo.color + '33', opacity: 0.6 }}>
                          <button className="pool-type-header" onClick={() => setCollapsedTypes((prev) => { const next = new Set(prev); const key = 'placed-' + type; next.has(key) ? next.delete(key) : next.add(key); return next; })}>
                            <span className="habitat-badge small" style={{ backgroundColor: getHabitatBadgeColor(type) }}>
                              <HabitatTypeIcon type={type} size={10} /> {type}
                            </span>
                            <span className="pool-type-count">{filtered.length}</span>
                            <span className="pool-placed-arrow">{isCollapsed ? '▸' : '▾'}</span>
                          </button>
                          {!isCollapsed && (
                            <div className="pool-grid">
                              {filtered.map((p) => (
                                <div key={p.id} className="location-pokemon in-habitat">
                                  <div className="location-pokemon-sprite" onClick={() => onSelectPokemon(p)}>
                                    {p.sprite && <img src={p.sprite} alt={p.name} />}
                                  </div>
                                  <span className="location-pokemon-name">{p.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Center: active habitat detail */}
          {activeHabitat && (
              <div className="habitat-content">
                <div className="habitat-main" style={{ background: habitatTheme.bgGradient, borderColor: habitatTheme.accentColor }}>
                  <div className="builder-header">
                    {renamingId === activeHabitat.id ? (
                      <input
                        className="builder-rename-input"
                        value={renameValue}
                        placeholder={habitatDisplayName(activeHabitat)}
                        onChange={(e) => setRenameValue(e.target.value)}
                        
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitRename();
                          if (e.key === 'Escape') cancelRename();
                        }}
                        autoFocus
                      />
                    ) : (
                      <h2
                        className="builder-habitat-name"
                        onDoubleClick={() => handleRename(activeHabitat)}
                        title="Double-click to rename"
                      >
                        {habitatDisplayName(activeHabitat)}
                        {!activeHabitat.customName && habitatPokemon.length > 0 && (
                          <span className="auto-name-hint">(auto)</span>
                        )}
                      </h2>
                    )}
                    <div className="builder-actions">
                      <button className="rename-btn" onClick={() => handleRename(activeHabitat)}>
                        Rename
                      </button>
                      {habitatPokemon.length > 0 && (
                        confirmClear ? (
                          <span className="delete-confirm">
                            <span className="delete-confirm-label">Clear all?</span>
                            <button className="delete-confirm-yes" onClick={() => { onClearHabitat(effectiveActiveId); setConfirmClear(false); }}>Yes</button>
                            <button className="delete-confirm-no" onClick={() => setConfirmClear(false)}>No</button>
                          </span>
                        ) : (
                          <button className="clear-btn" onClick={() => setConfirmClear(true)}>Clear</button>
                        )
                      )}
                      <button className="close-habitat-btn" onClick={() => setActiveHabitatId(null)} title="Close habitat">&times;</button>
                    </div>
                  </div>

                  {/* Search */}
                  <section className="builder-search">
                    <div className="search-controls">
                      <input ref={searchRef} type="text" placeholder="Search Pokemon to add..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="builder-search-input" />
                      <select value={searchHabitat} onChange={(e) => setSearchHabitat(e.target.value)} className="search-select">
                        <option value="">All Habitats</option>
                        {allIdealHabitats.map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                      <select value={searchFavorite} onChange={(e) => setSearchFavorite(e.target.value)} className="search-select">
                        <option value="">All Favorites</option>
                        {(allFavorites || []).map((f) => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    {isSearchActive && (
                      <div className="search-results-area">
                        <div className="search-results-header">
                          <span className="result-count">{searchResults.length} found</span>
                        </div>
                        <ul className="builder-search-results-inline">
                          {searchResults.slice(0, 10).map((p) => (
                            <li key={p.id} className="builder-search-item" onClick={() => handleAddFromSearch(p)}>
                              {p.sprite && <img className="search-result-sprite" src={p.sprite} alt={p.name} />}
                              <span className="search-result-name">{p.name}</span>
                              <span className="habitat-badge" style={{ backgroundColor: getHabitatBadgeColor(p.idealHabitat) }}>
                                <HabitatTypeIcon type={p.idealHabitat} /> {p.idealHabitat}
                              </span>
                              <button className="inline-add-btn" onClick={(e) => { e.stopPropagation(); handleAddFromSearch(p); }}>+ Add</button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </section>

                  {/* Empty habitat */}
                  {habitatPokemon.length === 0 && (
                    <section className="empty-habitat">
                      <div
                        className={`empty-habitat-circle ${dragOverCircle ? 'drag-over-circle' : ''}`}
                        onDragOver={(e) => { e.preventDefault(); setDragOverCircle(true); }}
                        onDragLeave={() => setDragOverCircle(false)}
                        onDrop={handleCircleDrop}
                      >
                        <div className="empty-habitat-ring" />
                        <span className="empty-habitat-hint">Drag Pokemon here or search above</span>
                      </div>
                    </section>
                  )}

                  {/* Habitat circle + favorite overlap side by side */}
                  {habitatPokemon.length > 0 && (
                    <div className="habitat-circle-and-favs">
                      <section className="current-pokemon">
                        <div
                          className={`habitat-space ${dragOverCircle ? 'drag-over-circle' : ''}`}
                          style={{ background: habitatTheme.circleGradient }}
                          onDragOver={(e) => { e.preventDefault(); setDragOverCircle(true); }}
                          onDragLeave={() => setDragOverCircle(false)}
                          onDrop={handleCircleDrop}
                        >
                          {habitatPokemon.map((p, i) => {
                            const angle = (i / habitatPokemon.length) * 2 * Math.PI - Math.PI / 2;
                            const radius = habitatPokemon.length <= 3 ? 70 : 90;
                            const centerX = 140, centerY = 140;
                            const x = centerX + Math.cos(angle) * radius - 28;
                            const y = centerY + Math.sin(angle) * radius - 28;
                            const dimmed = (highlightFav && !p.favorites.includes(highlightFav))
                              || (highlightHabitat && p.idealHabitat !== highlightHabitat);
                            const warnings = pokemonWarnings[p.id];
                            return (
                              <div key={p.id} className={`habitat-space-pokemon ${warnings ? 'has-warning' : ''}`} style={{ left: `${x}px`, top: `${y}px`, opacity: dimmed ? 0.3 : 1 }} onClick={() => onSelectPokemon(p)}>
                                {p.sprite && <img src={p.sprite} alt={p.name} />}
                                <span className="habitat-space-name">{p.name}</span>
                                {warnings && (
                                  <span className="habitat-warning-dot" title={warnings.join('\n')}>
                                    <span className="habitat-warning-tooltip">{warnings.map((w, wi) => <span key={wi}>{w}</span>)}</span>
                                  </span>
                                )}
                                <button className="habitat-space-remove" onClick={(e) => { e.stopPropagation(); onRemoveFromHabitat(p.id, effectiveActiveId); }}>&times;</button>
                              </div>
                            );
                          })}
                        </div>

                        {dominantHabitat && (
                          <div className="habitat-type-display">
                            {dominantHabitat.tied ? (
                              <>
                                <div className="habitat-type-tags">
                                  {dominantHabitat.tied.map((type) => {
                                    const info = getHabitatInfo(type);
                                    const typeCount = dominantHabitat.all.find(a => a.type === type)?.count;
                                    const isActive = highlightHabitat === type;
                                    return (
                                      <span key={type} className={`habitat-type-tag clickable ${isActive ? 'active' : ''}`} style={{ backgroundColor: info.bg, color: info.color, borderColor: info.color }} onClick={() => { setHighlightHabitat(isActive ? null : type); setHighlightFav(null); }}>
                                        <HabitatTypeIcon type={type} /> {type} <span className="habitat-type-count">{typeCount}</span>
                                      </span>
                                    );
                                  })}
                                  {dominantHabitat.all.filter(({ type }) => !dominantHabitat.tied.includes(type)).map(({ type, count }) => {
                                    const info = getHabitatInfo(type);
                                    const isActive = highlightHabitat === type;
                                    return (
                                      <span key={type} className={`habitat-type-tag minor clickable ${isActive ? 'active' : ''}`} style={{ backgroundColor: info.bg, color: info.color, borderColor: info.color, opacity: isActive ? 1 : 0.6 }} onClick={() => { setHighlightHabitat(isActive ? null : type); setHighlightFav(null); }}>
                                        <HabitatTypeIcon type={type} /> {type} <span className="habitat-type-count">{count}</span>
                                      </span>
                                    );
                                  })}
                                </div>
                                <p className="habitat-type-hint">Tied ideal habitat — consider splitting</p>
                              </>
                            ) : (
                              <>
                                <div className="habitat-type-tags">
                                  {dominantHabitat.all.map(({ type, count }, i) => {
                                    const info = getHabitatInfo(type);
                                    const isDominant = i === 0;
                                    const isActive = highlightHabitat === type;
                                    const isClickable = dominantHabitat.all.length > 1;
                                    return (
                                      <span key={type} className={`habitat-type-tag ${isDominant ? '' : 'minor'} ${isClickable ? 'clickable' : ''} ${isActive ? 'active' : ''}`} style={{ backgroundColor: info.bg, color: info.color, borderColor: info.color, opacity: (isDominant || isActive) ? 1 : 0.55 }} onClick={isClickable ? () => { setHighlightHabitat(isActive ? null : type); setHighlightFav(null); } : undefined}>
                                        <HabitatTypeIcon type={type} size={isDominant ? 14 : 12} /> {isDominant ? `${type} Habitat` : type} <span className="habitat-type-count">{count}</span>
                                      </span>
                                    );
                                  })}
                                </div>
                                {dominantHabitat.all.length > 1 && (() => {
                                  const minorityCount = dominantHabitat.all.slice(1).reduce((sum, a) => sum + a.count, 0);
                                  return <p className="habitat-type-hint">{minorityCount} Pokemon prefer{minorityCount === 1 ? 's' : ''} a different habitat type</p>;
                                })()}
                              </>
                            )}
                          </div>
                        )}
                      </section>

                      <section className="favorite-breakdown">
                        <h3>
                          Favorite Overlap
                          {highlightFav && <span className="highlight-label"> — {highlightFav} <button className="clear-highlight" onClick={() => setHighlightFav(null)}>&times;</button></span>}
                          {highlightHabitat && <span className="highlight-label"> — {highlightHabitat} <button className="clear-highlight" onClick={() => setHighlightHabitat(null)}>&times;</button></span>}
                        </h3>
                        {!highlightFav && !highlightHabitat && <p className="fav-hint">Click a row to highlight Pokemon with that favorite</p>}
                        <div className="fav-bars">
                          {(showAllFavs ? favCounts : favCounts.slice(0, 5)).map(({ favorite, count }) => {
                            const ratio = count / habitatPokemon.length;
                            const isTop = topFavorites.has(favorite);
                            const isMid = !isTop && ratio >= 0.5;
                            const favStyle = getFavoriteStyle(favorite);
                            const tier = isTop ? 'top' : isMid ? 'mid' : 'low';
                            return (
                              <div key={favorite} className={`fav-bar-row clickable ${highlightFav === favorite ? 'active' : ''} fav-bar-${tier}`} onClick={() => { setHighlightFav(highlightFav === favorite ? null : favorite); setHighlightHabitat(null); }}>
                                <span className="fav-label" style={{ color: isTop || isMid ? favStyle.text : '#888' }}>{favorite}</span>
                                <div className="fav-bar-track" style={{ backgroundColor: isTop || isMid ? favStyle.bg : '#e8e8e4' }}>
                                  <div className="fav-bar-fill" style={{ width: `${ratio * 100}%`, background: isTop || isMid ? favStyle.border : '#bbb' }} />
                                </div>
                                <span className="fav-count">{count}/{habitatPokemon.length}</span>
                              </div>
                            );
                          })}
                          {favCounts.length > 5 && (
                            <button className="fav-more-toggle" onClick={() => setShowAllFavs(!showAllFavs)}>
                              {showAllFavs ? 'Show less' : `${favCounts.length - 5} more with low overlap`}
                            </button>
                          )}
                        </div>
                      </section>
                    </div>
                  )}
                </div>

                {/* Below: splits + suggestions */}
                <div className="habitat-below">
                  {habitatPokemon.length > 0 && (showHabitatTypeSplit || showFavoriteSplit) && (
                    <section className="split-section">
                      <div className="split-header">
                        <h3>Suggested Split</h3>
                        <button className="split-toggle-btn" onClick={() => setShowSplit(!showSplit)}>{showSplit ? 'Hide' : 'Show'}</button>
                      </div>
                      {showSplit && (
                        <div className="split-preview">
                          {showHabitatTypeSplit && (
                            <div className="split-variant">
                              <h4 className="split-variant-title"><HabitatTypeIcon type={habitatTypeSplit.groups[0].type} size={16} /> Split by Ideal Habitat</h4>
                              <p className="split-description">Mixed ideal habitats. Splitting by type groups Pokemon that prefer the same environment.</p>
                              <div className="split-groups" style={{ gridTemplateColumns: habitatTypeSplit.groups.length > 2 ? `repeat(${habitatTypeSplit.groups.length}, 1fr)` : '1fr 1fr' }}>
                                {habitatTypeSplit.groups.map(({ type, pokemon: gp }) => {
                                  const info = getHabitatInfo(type);
                                  const gfc = favoriteCounts(gp);
                                  return (
                                    <div key={type} className="split-group" style={{ background: info.gradient || info.bg, borderColor: info.color }}>
                                      <h4 style={{ color: info.color }}><HabitatTypeIcon type={type} size={14} /> {type} ({gp.length})</h4>
                                      <div className="split-pokemon-list">{gp.map((p) => <div key={p.id} className="split-pokemon-item">{p.sprite && <img className="habitat-item-sprite" src={p.sprite} alt={p.name} />}<span>{p.name}</span></div>)}</div>
                                      <div className="split-fav-bars">{gfc.slice(0, 5).map(({ favorite, count }) => { const fs = getFavoriteStyle(favorite); return <div key={favorite} className="fav-bar-row"><span className="fav-label" style={{ color: fs.text }}>{favorite}</span><div className="fav-bar-track" style={{ backgroundColor: fs.bg }}><div className="fav-bar-fill" style={{ width: `${(count / gp.length) * 100}%`, background: fs.border }} /></div><span className="fav-count">{count}/{gp.length}</span></div>; })}</div>
                                    </div>
                                  );
                                })}
                              </div>
                              <button className="apply-split-btn" onClick={() => { onSplitHabitat(effectiveActiveId, habitatTypeSplit.groups[0].pokemon, habitatTypeSplit.groups.slice(1).flatMap(g => g.pokemon)); setShowSplit(false); }}>
                                Apply Split ({habitatTypeSplit.groups.length > 2 ? `${habitatTypeSplit.groups[0].type} vs Rest` : `${habitatTypeSplit.groups[0].type} / ${habitatTypeSplit.groups[1].type}`})
                              </button>
                            </div>
                          )}
                          {showFavoriteSplit && (
                            <div className="split-variant">
                              <h4 className="split-variant-title">Split by Favorites</h4>
                              <p className="split-description">{showHabitatTypeSplit ? 'Alternative split optimizing for favorite overlap.' : 'Splitting would improve internal favorite overlap.'}</p>
                              <div className="split-groups">
                                {[{ label: 'Group A', pokemon: splitResult.groupA, favCounts: splitFavCountsA }, { label: 'Group B', pokemon: splitResult.groupB, favCounts: splitFavCountsB }].map(({ label, pokemon: gp, favCounts: gfc }) => {
                                  const gt = getHabitatTheme(gp);
                                  const gd = getDominantHabitat(gp);
                                  const di = gd ? getHabitatInfo(gd.type) : null;
                                  return (
                                    <div key={label} className="split-group" style={{ background: gt.bgGradient, borderColor: gt.accentColor }}>
                                      <h4>{label} ({gp.length}){di && <span className="split-group-habitat" style={{ color: di.color }}> <HabitatTypeIcon type={gd.type} size={12} /> {gd.type}</span>}</h4>
                                      <div className="split-pokemon-list">{gp.map((p) => <div key={p.id} className="split-pokemon-item">{p.sprite && <img className="habitat-item-sprite" src={p.sprite} alt={p.name} />}<span>{p.name}</span></div>)}</div>
                                      <div className="split-fav-bars">{gfc.slice(0, 5).map(({ favorite, count }) => { const fs = getFavoriteStyle(favorite); return <div key={favorite} className="fav-bar-row"><span className="fav-label" style={{ color: fs.text }}>{favorite}</span><div className="fav-bar-track" style={{ backgroundColor: fs.bg }}><div className="fav-bar-fill" style={{ width: `${(count / gp.length) * 100}%`, background: fs.border }} /></div><span className="fav-count">{count}/{gp.length}</span></div>; })}</div>
                                    </div>
                                  );
                                })}
                              </div>
                              <button className="apply-split-btn" onClick={() => { onSplitHabitat(effectiveActiveId, splitResult.groupA, splitResult.groupB); setShowSplit(false); }}>Apply Favorite Split</button>
                            </div>
                          )}
                        </div>
                      )}
                    </section>
                  )}

                  {habitatPokemon.length > 0 && !showSuggestions && (
                    <button className="suggest-btn" onClick={() => setShowSuggestions(true)}>
                      ✦ Suggest Pokemon
                    </button>
                  )}
                  {habitatPokemon.length > 0 && showSuggestions && (
                    <section className="suggestions">
                      <div className="suggestions-header">
                        <h3>Suggested Pokemon</h3>
                        <div className="suggestions-filters">
                          <label className="filter-toggle">
                            <input type="checkbox" checked={sameHabitatOnly} onChange={(e) => setSameHabitatOnly(e.target.checked)} />
                            Same ideal habitat only
                          </label>
                          <button className="rec-dismiss-btn" onClick={() => setShowSuggestions(false)}>Hide</button>
                        </div>
                      </div>
                      {suggestions.length === 0 ? (
                        <p className="no-suggestions">No compatible Pokemon at this location. Try unchecking the filter.</p>
                      ) : (
                        <div className="pokemon-grid">
                          {suggestions.slice(0, 12).map((p) => (
                            <PokemonCard key={p.id} pokemon={p} onClick={() => onSelectPokemon(p)} onAdd={() => onAddToHabitat(p, effectiveActiveId)} inHabitat={false} score={p.score} sharedFavs={p.sharedFavs} favWeights={p.favWeights} maxFavWeight={p.maxFavWeight} highlightFav={highlightFav} topFavorites={topFavorites} midFavorites={midFavorites} />
                          ))}
                        </div>
                      )}
                      {outOfAreaSuggestions.length > 0 && (
                        <>
                          <h3 style={{ marginTop: '1.25rem' }}>Worth Moving Here</h3>
                          <p className="fav-hint">These Pokemon from other locations would be great fits</p>
                          <div className="pokemon-grid">
                            {outOfAreaSuggestions.slice(0, 6).map((p) => (
                              <PokemonCard key={p.id} pokemon={p} onClick={() => onSelectPokemon(p)} onAdd={() => { onMovePokemon(p.id, location); onAddToHabitat(p, effectiveActiveId); }} inHabitat={false} score={p.score} sharedFavs={p.sharedFavs} favWeights={p.favWeights} maxFavWeight={p.maxFavWeight} highlightFav={highlightFav} topFavorites={topFavorites} midFavorites={midFavorites} />
                            ))}
                          </div>
                        </>
                      )}
                    </section>
                  )}
                </div>
              </div>
            )}

          {/* Right: Habitat picker sidebar */}
          <div className="location-habitat-sidebar">
            <div className="sidebar-header">
              <h3>Habitats</h3>
              <button className="new-habitat-btn" onClick={() => onCreateHabitat(location)}>+ New</button>
            </div>
            <ul className="habitat-list-nav">
              {habitats.map((h) => {
                const navTheme = h.pokemon.length > 0 ? getHabitatTheme(h.pokemon) : null;
                const isActive = h.id === effectiveActiveId;
                const isDragOver = dragOverHabitat === h.id;
                const compat = habitatCompatibility[h.id] || 0;
                const isGoodFit = draggingPokemon && compat >= 10;
                return (
                  <li
                    key={h.id}
                    className={`habitat-nav-item ${isActive ? 'active' : ''} ${isDragOver ? 'drag-over' : ''} ${isGoodFit ? 'good-fit-nav' : ''}`}
                    style={navTheme ? { background: navTheme.bgGradient, ...(!draggingPokemon ? { borderColor: isActive ? navTheme.accentColor : isDragOver ? navTheme.accentColor : 'transparent' } : {}) } : undefined}
                    onClick={() => { setActiveHabitatId(isActive ? null : h.id); setHighlightFav(null); setHighlightHabitat(null); setShowSplit(false); }}
                    onDragOver={(e) => { e.preventDefault(); setDragOverHabitat(h.id); }}
                    onDragLeave={() => setDragOverHabitat(null)}
                    onDrop={(e) => { handleHabitatTabDrop(e, h); setDraggingPokemon(null); }}
                  >
                    {isDragOver && draggingPokemon ? (
                      <div className="drop-prompt">
                        Add {draggingPokemon.name} to {habitatDisplayName(h)}
                      </div>
                    ) : (
                      <>
                        <div className="habitat-nav-info">
                          {renamingId === h.id ? (
                            <input
                              className="rename-input"
                              value={renameValue}
                              placeholder={habitatDisplayName(h)}
                              onChange={(e) => setRenameValue(e.target.value)}

                              onKeyDown={(e) => {
                                if (e.key === 'Enter') commitRename();
                                if (e.key === 'Escape') cancelRename();
                              }}
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <span
                              className="habitat-nav-name"
                              onDoubleClick={(e) => { e.stopPropagation(); handleRename(h); }}
                              title="Double-click to rename"
                            >
                              {habitatDisplayName(h)}
                            </span>
                          )}
                          <span className="habitat-nav-subtitle">{habitatSubtitle(h)}</span>
                          {h.pokemon.length > 0 && (
                            <div className="habitat-nav-sprites">
                              {h.pokemon.slice(0, 6).map((p) => (
                                p.sprite && <img key={p.id} className="habitat-nav-sprite" src={p.sprite} alt={p.name} title={p.name} />
                              ))}
                              {h.pokemon.length > 6 && <span className="habitat-nav-more">+{h.pokemon.length - 6}</span>}
                            </div>
                          )}
                        </div>
                        {isGoodFit && <span className="tab-fit-indicator">✦</span>}
                        <span className="habitat-nav-count">{h.pokemon.length}</span>
                      </>
                    )}
                    {confirmDelete === h.id ? (
                      <div className="delete-confirm" onClick={(e) => e.stopPropagation()}>
                        <span className="delete-confirm-label">Delete?</span>
                        <button className="delete-confirm-yes" onClick={() => { onDeleteHabitat(h.id); if (h.id === effectiveActiveId) setActiveHabitatId(null); setConfirmDelete(null); }}>Yes</button>
                        <button className="delete-confirm-no" onClick={() => setConfirmDelete(null)}>No</button>
                      </div>
                    ) : (
                      <button
                        className="habitat-nav-delete"
                        onClick={(e) => { e.stopPropagation(); setConfirmDelete(h.id); }}
                        title="Delete habitat"
                      >
                        &times;
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
            {habitats.length === 0 && (
              <p className="sidebar-empty">No habitats yet. Create one or use Suggest.</p>
            )}
            {unplacedCount >= 2 && (
              <button className="suggest-btn" onClick={handleSuggestHabitats}>
                ✦ Suggest Habitats
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default LocationView;
