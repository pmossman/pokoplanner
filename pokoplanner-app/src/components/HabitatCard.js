import { useState, useMemo, useCallback, useRef } from 'react';
import { usePokemonData } from '../contexts/PokemonDataContext';
import { getHabitatBadgeColor, getHabitatTheme, getHabitatInfo, getDominantHabitat, HabitatTypeIcon, getFavoriteStyle } from '../utils/themeColors';
import { filterPokemon, favoriteCounts, rankByCompatibility } from '../utils/pokemonUtils';
import { habitatDisplayName, circlePosition } from '../utils/habitatHelpers';
import { useInlineRename } from '../hooks/useInlineRename';
import { useHabitatAnalysis } from '../hooks/useHabitatAnalysis';
import HabitatCircle from './HabitatCircle';
import FavoriteOverlap from './FavoriteOverlap';
import HabitatTypeDisplay from './HabitatTypeDisplay';
import SplitPreview from './SplitPreview';
import PokemonCard from './PokemonCard';

function HabitatCard({
  habitat,
  isExpanded,
  onToggleExpand,
  onRenameHabitat,
  onDeleteHabitat,
  onRemoveFromHabitat,
  onClearHabitat,
  onSplitHabitat,
  onAddToHabitat,
  onMovePokemon,
  // Drag state from parent
  draggingPokemon,
  draggingFromHabitat,
  dragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  habitatCompatScore,
  // Location context for suggestions
  pokemonAtLocation,
  location,
  getPokemonLocation,
  // Circle drag handlers
  onCircleDragStart,
  onCircleDragEnd,
}) {
  const { allPokemon, allFavorites, allIdealHabitats, allSpecialties, pokemonById, ownedPokemon, selectPokemon } = usePokemonData();

  // Internal state — resets on collapse
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHabitat, setSearchHabitat] = useState('');
  const [searchFavorite, setSearchFavorite] = useState('');
  const [searchSpecialty, setSearchSpecialty] = useState('');
  const [sameHabitatOnly, setSameHabitatOnly] = useState(true);
  const [showSplit, setShowSplit] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightFav, setHighlightFav] = useState(null);
  const [highlightHabitat, setHighlightHabitat] = useState(null);
  const [suggestSpecialty, setSuggestSpecialty] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [dragOverCircle, setDragOverCircle] = useState(false);
  const searchRef = useRef(null);

  const rename = useInlineRename(onRenameHabitat);

  const habitatPokemon = habitat.pokemon;
  const analysis = useHabitatAnalysis(habitatPokemon);

  // Suggestions
  const suggestions = useMemo(() => {
    if (!isExpanded || habitatPokemon.length === 0) return [];
    const habitatIds = new Set(habitatPokemon.map((p) => p.id));
    let localPool = pokemonAtLocation.filter((p) => !habitatIds.has(p.id));
    if (suggestSpecialty) {
      localPool = localPool.filter((p) => p.specialties && p.specialties.includes(suggestSpecialty));
    }
    return rankByCompatibility(localPool, habitatPokemon, sameHabitatOnly);
  }, [isExpanded, pokemonAtLocation, habitatPokemon, sameHabitatOnly, suggestSpecialty]);

  const outOfAreaSuggestions = useMemo(() => {
    if (!isExpanded || habitatPokemon.length === 0) return [];
    const habitatIds = new Set(habitatPokemon.map((p) => p.id));
    let otherOwned = [...ownedPokemon]
      .map((id) => pokemonById.get(id))
      .filter((p) => p && !habitatIds.has(p.id) && getPokemonLocation(p.id) !== location);
    if (suggestSpecialty) {
      otherOwned = otherOwned.filter((p) => p.specialties && p.specialties.includes(suggestSpecialty));
    }
    return rankByCompatibility(otherOwned, habitatPokemon, sameHabitatOnly)
      .filter((p) => p.score > 0)
      .slice(0, 10);
  }, [isExpanded, habitatPokemon, ownedPokemon, pokemonById, getPokemonLocation, location, sameHabitatOnly, suggestSpecialty]);

  // Search
  const isSearchActive = searchQuery.trim() || searchHabitat || searchFavorite || searchSpecialty;
  const searchResults = useMemo(() => {
    if (!isSearchActive) return [];
    const habitatIds = new Set(habitatPokemon.map((p) => p.id));
    return filterPokemon(allPokemon, {
      query: searchQuery,
      idealHabitat: searchHabitat,
      favorite: searchFavorite,
      specialty: searchSpecialty,
    }).filter((p) => !habitatIds.has(p.id));
  }, [searchQuery, searchHabitat, searchFavorite, searchSpecialty, allPokemon, habitatPokemon, isSearchActive]);

  const handleAddFromSearch = useCallback((pokemon) => {
    onAddToHabitat(pokemon.id, habitat.id);
    setSearchQuery('');
    if (searchRef.current) searchRef.current.focus();
  }, [habitat.id, onAddToHabitat]);

  const handleCircleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOverCircle(false);
    if (onDrop) onDrop(e, habitat);
  }, [onDrop, habitat]);

  const handleToggle = useCallback(() => {
    // Reset internal state on collapse
    if (isExpanded) {
      setHighlightFav(null);
      setHighlightHabitat(null);
      setShowSplit(false);
      setShowSuggestions(false);
      setSearchQuery('');
      setSearchHabitat('');
      setSearchFavorite('');
    }
    onToggleExpand(habitat.id);
  }, [isExpanded, onToggleExpand, habitat.id]);

  const isGoodFit = draggingPokemon && habitatCompatScore >= 10;
  const isDragSource = draggingFromHabitat === habitat.id;

  // Top favorites for collapsed view
  const topFavs = useMemo(() => {
    if (habitatPokemon.length === 0) return [];
    return analysis.favCounts.slice(0, 3).map((f) => ({
      favorite: f.favorite,
      count: f.count,
      style: getFavoriteStyle(f.favorite),
    }));
  }, [habitatPokemon.length, analysis.favCounts]);

  // Collapsed view
  if (!isExpanded) {
    const miniCircleSize = 170;
    const miniCenter = miniCircleSize / 2;
    const miniSpriteSize = habitatPokemon.length <= 4 ? 44 : 32;
    const miniSpriteOffset = miniSpriteSize / 2;
    const miniRadius = habitatPokemon.length <= 3 ? 42 : (habitatPokemon.length <= 6 ? 54 : 60);

    return (
      <div
        className={`habitat-card ${isGoodFit ? 'good-fit' : ''} ${isDragSource ? 'drag-source' : ''}`}
        style={{ background: habitatPokemon.length > 0 ? analysis.habitatTheme.bgGradient : undefined, borderColor: habitatPokemon.length > 0 ? analysis.habitatTheme.accentColor + '44' : undefined }}
        onClick={handleToggle}
      >
        <div className="habitat-card-top-row">
          <span className="habitat-card-name">{habitatDisplayName(habitat)}</span>
          <div className="habitat-card-top-actions">
            {isGoodFit && <span className="tab-fit-indicator">✦</span>}
            {draggingPokemon && habitatCompatScore > 0 && (
              <span className={`compat-score ${isGoodFit ? 'good' : ''}`}>{habitatCompatScore}</span>
            )}
            {confirmDelete ? (
              <div className="delete-confirm" onClick={(e) => e.stopPropagation()}>
                <span className="delete-confirm-label">Delete?</span>
                <button className="delete-confirm-yes" onClick={() => { onDeleteHabitat(habitat.id); setConfirmDelete(false); }}>Yes</button>
                <button className="delete-confirm-no" onClick={() => setConfirmDelete(false)}>No</button>
              </div>
            ) : (
              <button className="habitat-card-delete" onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }} title="Delete home">&times;</button>
            )}
          </div>
        </div>

        {/* Mini circle — acts as drop target */}
        {habitatPokemon.length > 0 ? (
          <div
            className={`habitat-card-mini-circle ${dragOver ? 'drag-over-circle' : ''} ${draggingPokemon && !isDragSource ? 'is-drop-target' : ''}`}
            style={{ width: miniCircleSize, height: miniCircleSize, background: analysis.habitatTheme.circleGradient }}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); if (onDragOver) onDragOver(habitat.id); }}
            onDragLeave={(e) => { e.stopPropagation(); if (onDragLeave) onDragLeave(); }}
            onDrop={(e) => { e.stopPropagation(); if (onDrop) onDrop(e, habitat); }}
          >
            {dragOver && draggingPokemon ? (
              <span className="mini-circle-drop-text">+ {draggingPokemon.name}</span>
            ) : (
              <>
                {habitatPokemon.slice(0, 10).map((p, i) => {
                  const pos = circlePosition(i, Math.min(habitatPokemon.length, 10), {
                    smallRadius: miniRadius,
                    largeRadius: miniRadius,
                    center: miniCenter,
                    spriteOffset: miniSpriteOffset,
                  });
                  return (
                    <img
                      key={p.id}
                      className="mini-circle-sprite"
                      src={p.sprite}
                      alt={p.name}
                      title={p.name}
                      style={{ left: pos.x, top: pos.y, width: miniSpriteSize, height: miniSpriteSize }}
                      draggable
                      onDragStart={(e) => { e.stopPropagation(); if (onCircleDragStart) onCircleDragStart(e, p, habitat.id); }}
                      onDragEnd={onCircleDragEnd}
                      onClick={(e) => { e.stopPropagation(); selectPokemon(p); }}
                    />
                  );
                })}
                {habitatPokemon.length > 10 && (
                  <span className="mini-circle-more">+{habitatPokemon.length - 10}</span>
                )}
              </>
            )}
          </div>
        ) : (
          <div
            className={`habitat-card-empty-circle ${dragOver ? 'drag-over-circle' : ''} ${draggingPokemon ? 'is-drop-target' : ''}`}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); if (onDragOver) onDragOver(habitat.id); }}
            onDragLeave={(e) => { e.stopPropagation(); if (onDragLeave) onDragLeave(); }}
            onDrop={(e) => { e.stopPropagation(); if (onDrop) onDrop(e, habitat); }}
          >
            {dragOver && draggingPokemon ? (
              <span className="mini-circle-drop-text">+ {draggingPokemon.name}</span>
            ) : (
              <span>Empty</span>
            )}
          </div>
        )}

        {/* Type badge + top favorites */}
        <div className="habitat-card-meta">
          {analysis.dominantHabitat && (
            <span className="habitat-badge small" style={{ backgroundColor: getHabitatBadgeColor(analysis.dominantHabitat.type) }}>
              <HabitatTypeIcon type={analysis.dominantHabitat.type} size={10} /> {analysis.dominantHabitat.type}
            </span>
          )}
          <span className="habitat-card-count">{habitatPokemon.length}</span>
        </div>
        {topFavs.length > 0 && (
          <div className="habitat-card-favs">
            {topFavs.map((f) => (
              <span key={f.favorite} className="habitat-card-fav-tag" style={{ backgroundColor: f.style.bg, color: f.style.text, borderColor: f.style.border }}>
                {f.favorite} <span className="fav-tag-count">{f.count}/{habitatPokemon.length}</span>
              </span>
            ))}
          </div>
        )}
        <span className="habitat-card-expand-hint">Click to expand ▾</span>
      </div>
    );
  }

  // Expanded view
  return (
    <div
      className={`habitat-card expanded ${dragOver ? 'drag-over' : ''}`}
      style={{ background: analysis.habitatTheme.bgGradient, borderColor: analysis.habitatTheme.accentColor }}
    >
      <div className="builder-header">
        {rename.renamingId === habitat.id ? (
          <input
            className="builder-rename-input"
            value={rename.renameValue}
            placeholder={habitatDisplayName(habitat)}
            onChange={(e) => rename.setRenameValue(e.target.value)}
            onKeyDown={rename.handleRenameKeyDown}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <h2
            className="builder-habitat-name"
            onDoubleClick={() => rename.startRename(habitat)}
            title="Double-click to rename"
          >
            {habitatDisplayName(habitat)}
            {!habitat.customName && habitatPokemon.length > 0 && (
              <span className="auto-name-hint">(auto)</span>
            )}
          </h2>
        )}
        <div className="builder-actions">
          <button className="rename-btn" onClick={() => rename.startRename(habitat)}>Rename</button>
          {habitatPokemon.length > 0 && (
            confirmClear ? (
              <span className="delete-confirm">
                <span className="delete-confirm-label">Clear all?</span>
                <button className="delete-confirm-yes" onClick={() => { onClearHabitat(habitat.id); setConfirmClear(false); }}>Yes</button>
                <button className="delete-confirm-no" onClick={() => setConfirmClear(false)}>No</button>
              </span>
            ) : (
              <button className="clear-btn" onClick={() => setConfirmClear(true)}>Clear</button>
            )
          )}
          {confirmDelete ? (
            <span className="delete-confirm">
              <span className="delete-confirm-label">Delete?</span>
              <button className="delete-confirm-yes" onClick={() => { onDeleteHabitat(habitat.id); setConfirmDelete(false); }}>Yes</button>
              <button className="delete-confirm-no" onClick={() => setConfirmDelete(false)}>No</button>
            </span>
          ) : (
            <button className="clear-btn danger" onClick={() => setConfirmDelete(true)}>Delete</button>
          )}
          <button className="collapse-btn" onClick={handleToggle}>▴ Collapse</button>
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
          <select value={searchSpecialty} onChange={(e) => setSearchSpecialty(e.target.value)} className="search-select">
            <option value="">All Specialties</option>
            {(allSpecialties || []).map((s) => <option key={s} value={s}>{s}</option>)}
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

      {/* Habitat circle + favorites side by side */}
      {habitatPokemon.length > 0 && (
        <div className="habitat-circle-and-favs">
          <section className="current-pokemon">
            <HabitatCircle
              pokemon={habitatPokemon}
              theme={analysis.habitatTheme}
              warnings={analysis.pokemonWarnings}
              highlightFav={highlightFav}
              highlightHabitat={highlightHabitat}
              onSelectPokemon={selectPokemon}
              onRemove={(id) => onRemoveFromHabitat(id, habitat.id)}
              habitatId={habitat.id}
              dragOverCircle={dragOverCircle}
              onDragOver={() => setDragOverCircle(true)}
              onDragLeave={() => setDragOverCircle(false)}
              onDrop={handleCircleDrop}
              onPokemonDragStart={(e, p) => { if (onCircleDragStart) onCircleDragStart(e, p, habitat.id); }}
              onPokemonDragEnd={onCircleDragEnd}
            />
            <HabitatTypeDisplay
              dominantHabitat={analysis.dominantHabitat}
              highlightHabitat={highlightHabitat}
              onHighlightHabitat={setHighlightHabitat}
              onHighlightFav={setHighlightFav}
            />
          </section>

          <FavoriteOverlap
            favCounts={analysis.favCounts}
            totalPokemon={habitatPokemon.length}
            topFavorites={analysis.topFavorites}
            highlightFav={highlightFav}
            highlightHabitat={highlightHabitat}
            onHighlightFav={setHighlightFav}
            onHighlightHabitat={setHighlightHabitat}
          />
        </div>
      )}

      {/* Below: splits + suggestions */}
      {habitatPokemon.length > 0 && (analysis.showHabitatTypeSplit || analysis.showFavoriteSplit) && (
        <SplitPreview
          showSplit={showSplit}
          onToggleSplit={() => setShowSplit(!showSplit)}
          showHabitatTypeSplit={analysis.showHabitatTypeSplit}
          habitatTypeSplit={analysis.habitatTypeSplit}
          showFavoriteSplit={analysis.showFavoriteSplit}
          splitResult={analysis.splitResult}
          splitFavCountsA={analysis.splitFavCountsA}
          splitFavCountsB={analysis.splitFavCountsB}
          onApplySplit={(groupA, groupB) => { onSplitHabitat(habitat.id, groupA.map(p => p.id), groupB.map(p => p.id)); setShowSplit(false); }}
        />
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
              <select value={suggestSpecialty} onChange={(e) => setSuggestSpecialty(e.target.value)} className="search-select">
                <option value="">All Specialties</option>
                {(allSpecialties || []).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
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
                <PokemonCard key={p.id} pokemon={p} onClick={() => selectPokemon(p)} onAdd={() => onAddToHabitat(p.id, habitat.id)} inHabitat={false} score={p.score} sharedFavs={p.sharedFavs} favWeights={p.favWeights} maxFavWeight={p.maxFavWeight} highlightFav={highlightFav} topFavorites={analysis.topFavorites} midFavorites={analysis.midFavorites} />
              ))}
            </div>
          )}
          {outOfAreaSuggestions.length > 0 && (
            <>
              <h3 style={{ marginTop: '1.25rem' }}>Worth Moving Here</h3>
              <p className="fav-hint">These Pokemon from other locations would be great fits</p>
              <div className="pokemon-grid">
                {outOfAreaSuggestions.slice(0, 6).map((p) => (
                  <PokemonCard key={p.id} pokemon={p} onClick={() => selectPokemon(p)} onAdd={() => { onMovePokemon(p.id, location); onAddToHabitat(p.id, habitat.id); }} inHabitat={false} score={p.score} sharedFavs={p.sharedFavs} favWeights={p.favWeights} maxFavWeight={p.maxFavWeight} highlightFav={highlightFav} topFavorites={analysis.topFavorites} midFavorites={analysis.midFavorites} />
                ))}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}

export default HabitatCard;
