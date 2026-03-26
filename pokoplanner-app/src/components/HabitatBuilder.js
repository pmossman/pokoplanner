import { useState, useMemo, useRef } from 'react';
import { usePokemonData } from '../contexts/PokemonDataContext';
import { favoriteCounts, rankByCompatibility, filterPokemon } from '../utils/pokemonUtils';
import { getHabitatBadgeColor, getFavoriteStyle, getHabitatTheme, getDominantHabitat, HabitatTypeIcon } from '../utils/themeColors';
import { habitatDisplayName } from '../utils/habitatHelpers';
import { useInlineRename } from '../hooks/useInlineRename';
import { useHabitatAnalysis } from '../hooks/useHabitatAnalysis';
import HabitatCircle from './HabitatCircle';
import FavoriteOverlap from './FavoriteOverlap';
import HabitatTypeDisplay from './HabitatTypeDisplay';
import SplitPreview from './SplitPreview';
import PokemonCard from './PokemonCard';
import './HabitatBuilder.css';

function HabitatBuilder({
  habitats,
  activeHabitatId,
  onSelectHabitat,
  onCreate,
  onCreateWithPokemon,
  onDelete,
  onRename,
  onAdd,
  onAddToSpecific,
  onRemove,
  onClear,
  onSplit,
}) {
  const { allPokemon, allFavorites, allIdealHabitats, allSpecialties, ownedPokemon, selectPokemon } = usePokemonData();
  const [sameHabitatOnly, setSameHabitatOnly] = useState(true);
  const [ownedOnly, setOwnedOnly] = useState(false);
  const [notInHabitatOnly, setNotInHabitatOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHabitat, setSearchHabitat] = useState('');
  const [searchFavorite, setSearchFavorite] = useState('');
  const [searchSpecialty, setSearchSpecialty] = useState('');
  const [suggestSpecialty, setSuggestSpecialty] = useState('');
  const [showSplit, setShowSplit] = useState(false);
  const [showBrowse, setShowBrowse] = useState(false);
  const [highlightFav, setHighlightFav] = useState(null);
  const [highlightHabitat, setHighlightHabitat] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const searchRef = useRef(null);

  const rename = useInlineRename(onRename);

  const activeHabitat = habitats.find((h) => h.id === activeHabitatId) || null;
  const habitatPokemon = activeHabitat ? activeHabitat.pokemon : [];

  const allHabitatPokemonIds = useMemo(() => {
    const ids = new Set();
    for (const h of habitats) {
      for (const p of h.pokemon) ids.add(p.id);
    }
    return ids;
  }, [habitats]);

  const analysis = useHabitatAnalysis(habitatPokemon);

  const suggestions = useMemo(() => {
    let results;
    if (habitatPokemon.length === 0) {
      results = [...allPokemon];
    } else {
      results = rankByCompatibility(allPokemon, habitatPokemon, sameHabitatOnly);
    }
    if (ownedOnly) {
      results = results.filter((p) => ownedPokemon.has(p.id));
    }
    if (notInHabitatOnly) {
      results = results.filter((p) => !allHabitatPokemonIds.has(p.id));
    }
    if (suggestSpecialty) {
      results = results.filter((p) => p.specialties && p.specialties.includes(suggestSpecialty));
    }
    return results;
  }, [allPokemon, habitatPokemon, sameHabitatOnly, ownedOnly, ownedPokemon, notInHabitatOnly, allHabitatPokemonIds, suggestSpecialty]);

  const topSuggestions = suggestions.slice(0, habitatPokemon.length === 0 ? 50 : 20);

  // Search within habitat builder
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

  const browseResults = showBrowse ? searchResults : searchResults.slice(0, 10);

  const starterHabitats = useMemo(() => {
    const findPokemon = (ids) => ids.map((id) => allPokemon.find((p) => p.id === id)).filter(Boolean);
    return [
      {
        name: 'Flower Garden',
        description: 'Grass types that love nature, dirt, and flowers',
        pokemon: findPokemon(['oddish', 'gloom', 'vileplume']),
        sharedFavs: ['Flowers', 'Dirt'],
      },
      {
        name: 'Fire Pit',
        description: 'Fire types that enjoy warm, cozy spaces',
        pokemon: findPokemon(['charmander', 'charmeleon', 'charizard']),
        sharedFavs: ['Lots of fire', 'Warm air'],
      },
      {
        name: 'Water Park',
        description: 'Water types that love splashing around',
        pokemon: findPokemon(['squirtle', 'wartortle', 'blastoise']),
        sharedFavs: ['Lots of water', 'Group activities'],
      },
    ];
  }, [allPokemon]);

  const handleStarterHabitat = (starter) => {
    if (starter.pokemon.length > 0 && onCreateWithPokemon) {
      onCreateWithPokemon(starter.name, starter.pokemon.map(p => p.id));
    }
  };

  const handleAddFromSearch = (pokemon) => {
    onAdd(pokemon.id);
    setSearchQuery('');
    if (searchRef.current) searchRef.current.focus();
  };

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

  return (
    <div className="habitat-builder-layout">
      <aside className="habitat-sidebar" onDragStart={(e) => e.preventDefault()}>
        <div className="sidebar-header">
          <h3>Homes</h3>
          <button className="new-habitat-btn" onClick={() => onCreate()}>+ New</button>
        </div>
        <ul className="habitat-list-nav">
          {habitats.map((h) => {
            const navTheme = h.pokemon.length > 0 ? getHabitatTheme(h.pokemon) : null;
            return (
            <li
              key={h.id}
              className={`habitat-nav-item ${h.id === activeHabitatId ? 'active' : ''}`}
              style={navTheme ? { background: navTheme.bgGradient, borderColor: navTheme.accentColor } : undefined}
              onClick={() => { onSelectHabitat(h.id); setHighlightFav(null); setHighlightHabitat(null); }}
            >
              <div className="habitat-nav-info">
                {rename.renamingId === h.id ? (
                  <input
                    className="rename-input"
                    value={rename.renameValue}
                    placeholder={habitatDisplayName(h)}
                    onChange={(e) => rename.setRenameValue(e.target.value)}
                    onKeyDown={rename.handleRenameKeyDown}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span
                    className="habitat-nav-name"
                    onDoubleClick={(e) => { e.stopPropagation(); rename.startRename(h); }}
                    title="Double-click to rename"
                  >
                    {habitatDisplayName(h)}
                    {h.customName && (
                      <button className="reset-name-btn" onClick={(e) => { e.stopPropagation(); onRename(h.id, null); }} title="Reset to auto-name">&times;</button>
                    )}
                  </span>
                )}
                <span className="habitat-nav-subtitle">
                  {habitatSubtitle(h)}
                </span>
                {h.pokemon.length > 0 && (
                  <div className="habitat-nav-sprites">
                    {h.pokemon.slice(0, 6).map((p) => (
                      p.sprite && <img key={p.id} className="habitat-nav-sprite" src={p.sprite} alt={p.name} title={p.name} />
                    ))}
                    {h.pokemon.length > 6 && <span className="habitat-nav-more">+{h.pokemon.length - 6}</span>}
                  </div>
                )}
              </div>
              <span className="habitat-nav-count">{h.pokemon.length}</span>
              {confirmDelete === h.id ? (
                <div className="delete-confirm" onClick={(e) => e.stopPropagation()}>
                  <span className="delete-confirm-label">Delete?</span>
                  <button className="delete-confirm-yes" onClick={() => { onDelete(h.id); setConfirmDelete(null); }}>Yes</button>
                  <button className="delete-confirm-no" onClick={() => setConfirmDelete(null)}>No</button>
                </div>
              ) : (
                <button className="habitat-nav-delete" onClick={(e) => { e.stopPropagation(); setConfirmDelete(h.id); }} title="Delete home">&times;</button>
              )}
            </li>
            );
          })}
        </ul>
        {habitats.length === 0 && (
          <p className="sidebar-empty">No homes yet. Create one to get started.</p>
        )}
      </aside>

      <div className="habitat-content">
      <div className="habitat-main" style={{ background: analysis.habitatTheme.bgGradient, borderColor: analysis.habitatTheme.accentColor }}>
        {!activeHabitat ? (
          <div className="welcome-state">
            <div className="welcome-top">
              <h2>Sandbox Mode</h2>
              <p className="welcome-subtitle">
                Plan freely with the full Pokedex — no restrictions, no progress tracking.
                Experiment with any combination to find the perfect home groups.
              </p>
              <div className="welcome-circle">
                <div className="welcome-circle-ring" />
                <span className="welcome-circle-label">Your Pokemon will appear here</span>
              </div>
            </div>

            <div className="welcome-actions">
              <button className="welcome-create-btn" onClick={() => onCreate()}>Create Empty Home</button>
              <span className="welcome-or">or try a starter home:</span>
            </div>

            <div className="starter-habitats">
              {starterHabitats.map((starter) => (
                <div key={starter.name} className="starter-card">
                  <div className="starter-header">
                    <h3>{starter.name}</h3>
                    <p className="starter-desc">{starter.description}</p>
                  </div>
                  <div className="starter-sprites">
                    {starter.pokemon.map((p) => (
                      p.sprite && <img key={p.id} className="starter-sprite" src={p.sprite} alt={p.name} title={p.name} />
                    ))}
                  </div>
                  <div className="starter-favs">
                    {starter.sharedFavs.map((f) => {
                      const style = getFavoriteStyle(f);
                      return (
                        <span key={f} className="starter-fav-tag" style={{ backgroundColor: style.bg, color: style.text, borderColor: style.border }}>{f}</span>
                      );
                    })}
                  </div>
                  <button className="starter-use-btn" onClick={() => handleStarterHabitat(starter)}>Use this home</button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="builder-header">
              {rename.renamingId === activeHabitat.id ? (
                <input
                  className="builder-rename-input"
                  value={rename.renameValue}
                  placeholder={habitatDisplayName(activeHabitat)}
                  onChange={(e) => rename.setRenameValue(e.target.value)}
                  onKeyDown={rename.handleRenameKeyDown}
                  autoFocus
                />
              ) : (
                <h2
                  className="builder-habitat-name"
                  onDoubleClick={() => rename.startRename(activeHabitat)}
                  title="Double-click to rename"
                >
                  {habitatDisplayName(activeHabitat)}
                  {!activeHabitat.customName && habitatPokemon.length > 0 && (
                    <span className="auto-name-hint">(auto)</span>
                  )}
                </h2>
              )}
              <div className="builder-actions">
                <button className="rename-btn" onClick={() => rename.startRename(activeHabitat)}>Rename</button>
                {habitatPokemon.length > 0 && (
                  confirmClear ? (
                    <span className="delete-confirm">
                      <span className="delete-confirm-label">Clear all?</span>
                      <button className="delete-confirm-yes" onClick={() => { onClear(activeHabitatId); setConfirmClear(false); }}>Yes</button>
                      <button className="delete-confirm-no" onClick={() => setConfirmClear(false)}>No</button>
                    </span>
                  ) : (
                    <button className="clear-btn" onClick={() => setConfirmClear(true)}>Clear Pokemon</button>
                  )
                )}
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
                  {allFavorites.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
                <select value={searchSpecialty} onChange={(e) => setSearchSpecialty(e.target.value)} className="search-select">
                  <option value="">All Specialties</option>
                  {(allSpecialties || []).map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {isSearchActive && (
                <div className="search-results-area">
                  <div className="search-results-header">
                    <span className="result-count">{searchResults.length} Pokemon found</span>
                    {searchResults.length > 10 && (
                      <button className="browse-toggle" onClick={() => setShowBrowse(!showBrowse)}>
                        {showBrowse ? 'Show less' : `Show all ${searchResults.length}`}
                      </button>
                    )}
                  </div>
                  {showBrowse ? (
                    <div className="pokemon-grid">
                      {browseResults.map((p) => (
                        <PokemonCard key={p.id} pokemon={p} onClick={() => selectPokemon(p)} onAdd={() => handleAddFromSearch(p)} inHabitat={false} compact />
                      ))}
                    </div>
                  ) : (
                    <ul className="builder-search-results-inline">
                      {browseResults.map((p) => (
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
                  )}
                </div>
              )}
            </section>

            {/* Empty habitat */}
            {habitatPokemon.length === 0 && (
              <section className="empty-habitat">
                <div className="empty-habitat-circle">
                  <div className="empty-habitat-ring" />
                  <span className="empty-habitat-hint">Search above or pick from suggestions below to add Pokemon</span>
                </div>
              </section>
            )}

            {/* Habitat circle + favorites side by side */}
            {habitatPokemon.length > 0 && (
              <div className="habitat-circle-and-favs">
                <section className="current-pokemon">
                  <h3>Home ({habitatPokemon.length})</h3>
                  <HabitatCircle
                    pokemon={habitatPokemon}
                    theme={analysis.habitatTheme}
                    warnings={analysis.pokemonWarnings}
                    highlightFav={highlightFav}
                    highlightHabitat={highlightHabitat}
                    onSelectPokemon={selectPokemon}
                    onRemove={(id) => onRemove(id, activeHabitatId)}
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
          </>
        )}
      </div>

      {activeHabitat && (
        <div className="habitat-below">
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
              onApplySplit={(groupA, groupB) => { onSplit(activeHabitatId, groupA.map(p => p.id), groupB.map(p => p.id)); setShowSplit(false); }}
            />
          )}

          <section className="suggestions">
            <div className="suggestions-header">
              <h3>{habitatPokemon.length === 0 ? 'All Pokemon' : 'Suggested Pokemon'}</h3>
              <div className="suggestions-filters">
                <select value={suggestSpecialty} onChange={(e) => setSuggestSpecialty(e.target.value)} className="search-select">
                  <option value="">All Specialties</option>
                  {(allSpecialties || []).map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {habitatPokemon.length > 0 && (
                  <label className="filter-toggle">
                    <input type="checkbox" checked={sameHabitatOnly} onChange={(e) => setSameHabitatOnly(e.target.checked)} />
                    Same ideal habitat only
                  </label>
                )}
                <label className="filter-toggle">
                  <input type="checkbox" checked={ownedOnly} onChange={(e) => setOwnedOnly(e.target.checked)} />
                  Owned only
                  {ownedPokemon.size > 0 && <span className="owned-count">({ownedPokemon.size})</span>}
                </label>
                <label className="filter-toggle">
                  <input type="checkbox" checked={notInHabitatOnly} onChange={(e) => setNotInHabitatOnly(e.target.checked)} />
                  Not in a habitat
                </label>
              </div>
            </div>
            {topSuggestions.length === 0 ? (
              <p className="no-suggestions">No matching Pokemon found. Try unchecking filters.</p>
            ) : (
              <div className="pokemon-grid">
                {topSuggestions.map((p) => (
                  <PokemonCard
                    key={p.id}
                    pokemon={p}
                    onAdd={() => onAdd(p.id)}
                    inHabitat={false}
                    score={p.score}
                    sharedFavs={p.sharedFavs}
                    favWeights={p.favWeights}
                    maxFavWeight={p.maxFavWeight}
                    highlightFav={highlightFav}
                    topFavorites={analysis.topFavorites}
                    midFavorites={analysis.midFavorites}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
      </div>
    </div>
  );
}

export default HabitatBuilder;
