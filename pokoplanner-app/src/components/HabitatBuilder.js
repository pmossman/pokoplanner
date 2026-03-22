import { useState, useMemo, useRef } from 'react';
import { favoriteCounts, rankByCompatibility, filterPokemon, suggestSplit, suggestHabitatTypeSplit } from '../utils/pokemonUtils';
import { getHabitatBadgeColor, getFavoriteStyle, getHabitatTheme, getHabitatInfo, getDominantHabitat, HabitatTypeIcon } from '../utils/themeColors';
import PokemonCard from './PokemonCard';
import './HabitatBuilder.css';

function HabitatBuilder({
  allPokemon,
  allFavorites,
  allIdealHabitats,
  habitats,
  activeHabitatId,
  onSelectHabitat,
  onCreate,
  onCreateWithPokemon,
  onDelete,
  onRename,
  onAdd,
  onRemove,
  onClear,
  onSplit,
  onSelectPokemon,
  ownedPokemon,
  onToggleOwned,
}) {
  const [sameHabitatOnly, setSameHabitatOnly] = useState(true);
  const [ownedOnly, setOwnedOnly] = useState(false);
  const [notInHabitatOnly, setNotInHabitatOnly] = useState(false);
  const [editingName, setEditingName] = useState(null);
  const [nameInput, setNameInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHabitat, setSearchHabitat] = useState('');
  const [searchFavorite, setSearchFavorite] = useState('');
  const [showSplit, setShowSplit] = useState(false);
  const [showBrowse, setShowBrowse] = useState(false);
  const [highlightFav, setHighlightFav] = useState(null);
  const [highlightHabitat, setHighlightHabitat] = useState(null);
  const searchRef = useRef(null);

  const activeHabitat = habitats.find((h) => h.id === activeHabitatId) || null;
  const habitatPokemon = activeHabitat ? activeHabitat.pokemon : [];

  const allHabitatPokemonIds = useMemo(() => {
    const ids = new Set();
    for (const h of habitats) {
      for (const p of h.pokemon) ids.add(p.id);
    }
    return ids;
  }, [habitats]);

  const favCounts = useMemo(
    () => favoriteCounts(habitatPokemon),
    [habitatPokemon]
  );

  const topFavorites = useMemo(() => {
    if (favCounts.length === 0) return new Set();
    // Take top 3 by count, but include ties with the 3rd
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

  const suggestions = useMemo(() => {
    let results;
    if (habitatPokemon.length === 0) {
      // Show all Pokemon when habitat is empty
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
    return results;
  }, [allPokemon, habitatPokemon, sameHabitatOnly, ownedOnly, ownedPokemon, notInHabitatOnly, allHabitatPokemonIds]);

  const topSuggestions = suggestions.slice(0, habitatPokemon.length === 0 ? 50 : 20);

  const splitResult = useMemo(
    () => suggestSplit(habitatPokemon),
    [habitatPokemon]
  );

  const habitatTypeSplit = useMemo(
    () => suggestHabitatTypeSplit(habitatPokemon),
    [habitatPokemon]
  );

  // Determine which splits to show:
  // - Always show habitat type split if there are mixed types
  // - Show favorite split if it improves on the habitat type split (or if types are uniform)
  const showHabitatTypeSplit = !!habitatTypeSplit;
  const showFavoriteSplit = splitResult && (
    !habitatTypeSplit ||
    splitResult.scoreAfter > habitatTypeSplit.scoreAfter
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

  const starterHabitats = useMemo(() => {
    const findPokemon = (ids) => ids.map((id) => allPokemon.find((p) => p.id === id)).filter(Boolean);
    return [
      {
        name: 'Flower Garden',
        description: 'Grass types that love nature, dirt, and flowers',
        pokemon: findPokemon(['oddish', 'gloom', 'vileplume']),
        sharedFavs: ['Lots of nature', 'Lots of dirt', 'Soft stuff', 'Pretty flowers'],
      },
      {
        name: 'Water Healers',
        description: 'Water types bonded by cleanliness and healing',
        pokemon: findPokemon(['squirtle', 'slowbro', 'slowking']),
        sharedFavs: ['Lots of water', 'Cleanliness', 'Healing', 'Group activities'],
      },
      {
        name: 'Hitmon Gym',
        description: 'A perfect match — all five favorites shared',
        pokemon: findPokemon(['tyrogue', 'hitmonlee', 'hitmonchan', 'hitmontop']),
        sharedFavs: ['Exercise', 'Group activities', 'Fabric', 'Stone stuff', 'Round stuff'],
      },
    ];
  }, [allPokemon]);

  const handleStarterHabitat = (starter) => {
    onCreateWithPokemon(starter.name, starter.pokemon);
  };

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

  const browseResults = showBrowse ? searchResults : searchResults.slice(0, 10);

  const habitatDisplayName = (h) => {
    if (h.customName) return h.customName;
    if (h.pokemon.length === 0) return 'New Habitat';
    const names = h.pokemon.map((p) => p.name);
    const joined = names.join(', ');
    return joined.length > 30 ? joined.slice(0, 27) + '...' : joined;
  };

  const startRename = (habitat) => {
    setEditingName(habitat.id);
    setNameInput(habitat.customName || '');
  };

  const commitRename = () => {
    if (editingName) {
      const trimmed = nameInput.trim();
      onRename(editingName, trimmed || null);
    }
    setEditingName(null);
  };

  const clearCustomName = (habitatId) => {
    onRename(habitatId, null);
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

  const handleAddFromSearch = (pokemon) => {
    onAdd(pokemon);
    setSearchQuery('');
    if (searchRef.current) searchRef.current.focus();
  };

  return (
    <div className="habitat-builder-layout">
      <aside className="habitat-sidebar">
        <div className="sidebar-header">
          <h3>Habitats</h3>
          <button
            className="new-habitat-btn"
            onClick={() => onCreate()}
          >
            + New
          </button>
        </div>
        <ul className="habitat-list-nav">
          {habitats.map((h) => {
            const navTheme = h.pokemon.length > 0 ? getHabitatTheme(h.pokemon) : null;
            return (
            <li
              key={h.id}
              className={`habitat-nav-item ${
                h.id === activeHabitatId ? 'active' : ''
              }`}
              style={navTheme ? { background: navTheme.bgGradient, borderColor: navTheme.accentColor } : undefined}
              onClick={() => { onSelectHabitat(h.id); setHighlightFav(null); setHighlightHabitat(null); }}
            >
              <div className="habitat-nav-info">
                {editingName === h.id ? (
                  <input
                    className="rename-input"
                    value={nameInput}
                    placeholder={habitatDisplayName(h)}
                    onChange={(e) => setNameInput(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename();
                      if (e.key === 'Escape') setEditingName(null);
                    }}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span
                    className="habitat-nav-name"
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      startRename(h);
                    }}
                    title="Double-click to rename"
                  >
                    {habitatDisplayName(h)}
                    {h.customName && (
                      <button
                        className="reset-name-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearCustomName(h.id);
                        }}
                        title="Reset to auto-name"
                      >
                        &times;
                      </button>
                    )}
                  </span>
                )}
                <span className="habitat-nav-subtitle">
                  {habitatSubtitle(h)}
                </span>
                {h.pokemon.length > 0 && (
                  <div className="habitat-nav-sprites">
                    {h.pokemon.slice(0, 6).map((p) => (
                      p.sprite && (
                        <img
                          key={p.id}
                          className="habitat-nav-sprite"
                          src={p.sprite}
                          alt={p.name}
                          title={p.name}
                        />
                      )
                    ))}
                    {h.pokemon.length > 6 && (
                      <span className="habitat-nav-more">+{h.pokemon.length - 6}</span>
                    )}
                  </div>
                )}
              </div>
              <span className="habitat-nav-count">
                {h.pokemon.length}
              </span>
              <button
                className="habitat-nav-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(h.id);
                }}
                title="Delete habitat"
              >
                &times;
              </button>
            </li>
            );
          })}
        </ul>
        {habitats.length === 0 && (
          <p className="sidebar-empty">
            No habitats yet. Create one to get started.
          </p>
        )}
      </aside>

      <div className="habitat-content">
      <div className="habitat-main" style={{ background: habitatTheme.bgGradient, borderColor: habitatTheme.accentColor }}>
        {!activeHabitat ? (
          <div className="welcome-state">
            <div className="welcome-top">
              <h2>Plan your perfect habitats</h2>
              <p className="welcome-subtitle">
                Group Pokemon by shared favorites to keep them happy together.
                The more favorites they share, the better the habitat.
              </p>
              <div className="welcome-circle">
                <div className="welcome-circle-ring" />
                <span className="welcome-circle-label">Your Pokemon will appear here</span>
              </div>
            </div>

            <div className="welcome-actions">
              <button className="welcome-create-btn" onClick={() => onCreate()}>
                Create Empty Habitat
              </button>
              <span className="welcome-or">or try a starter habitat:</span>
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
                      p.sprite && (
                        <img
                          key={p.id}
                          className="starter-sprite"
                          src={p.sprite}
                          alt={p.name}
                          title={p.name}
                        />
                      )
                    ))}
                  </div>
                  <div className="starter-favs">
                    {starter.sharedFavs.map((f) => {
                      const style = getFavoriteStyle(f);
                      return (
                        <span
                          key={f}
                          className="starter-fav-tag"
                          style={{ backgroundColor: style.bg, color: style.text, borderColor: style.border }}
                        >
                          {f}
                        </span>
                      );
                    })}
                  </div>
                  <button
                    className="starter-use-btn"
                    onClick={() => handleStarterHabitat(starter)}
                  >
                    Use this habitat
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="builder-header">
              {editingName === activeHabitat.id ? (
                <input
                  className="builder-rename-input"
                  value={nameInput}
                  placeholder={habitatDisplayName(activeHabitat)}
                  onChange={(e) => setNameInput(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename();
                    if (e.key === 'Escape') setEditingName(null);
                  }}
                  autoFocus
                />
              ) : (
                <h2
                  className="builder-habitat-name"
                  onDoubleClick={() => startRename(activeHabitat)}
                  title="Double-click to rename"
                >
                  {habitatDisplayName(activeHabitat)}
                  {!activeHabitat.customName && habitatPokemon.length > 0 && (
                    <span className="auto-name-hint">(auto)</span>
                  )}
                </h2>
              )}
              <div className="builder-actions">
                <button
                  className="rename-btn"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (editingName === activeHabitat.id) {
                      commitRename();
                    } else {
                      startRename(activeHabitat);
                    }
                  }}
                >
                  {editingName === activeHabitat.id ? 'Done' : 'Rename'}
                </button>
                {habitatPokemon.length > 0 && (
                  <button className="clear-btn" onClick={onClear}>
                    Clear Pokemon
                  </button>
                )}
              </div>
            </div>

            {/* Pokemon search and browse */}
            <section className="builder-search">
              <div className="search-controls">
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search Pokemon to add..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="builder-search-input"
                />
                <select
                  value={searchHabitat}
                  onChange={(e) => setSearchHabitat(e.target.value)}
                  className="search-select"
                >
                  <option value="">All Habitats</option>
                  {allIdealHabitats.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                <select
                  value={searchFavorite}
                  onChange={(e) => setSearchFavorite(e.target.value)}
                  className="search-select"
                >
                  <option value="">All Favorites</option>
                  {allFavorites.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              {isSearchActive && (
                <div className="search-results-area">
                  <div className="search-results-header">
                    <span className="result-count">
                      {searchResults.length} Pokemon found
                    </span>
                    {searchResults.length > 10 && (
                      <button
                        className="browse-toggle"
                        onClick={() => setShowBrowse(!showBrowse)}
                      >
                        {showBrowse ? 'Show less' : `Show all ${searchResults.length}`}
                      </button>
                    )}
                  </div>

                  {showBrowse ? (
                    <div className="pokemon-grid">
                      {browseResults.map((p) => (
                        <PokemonCard
                          key={p.id}
                          pokemon={p}
                          onClick={() => onSelectPokemon(p)}
                          onAdd={() => handleAddFromSearch(p)}
                          inHabitat={false}
                          compact
                        />
                      ))}
                    </div>
                  ) : (
                    <ul className="builder-search-results-inline">
                      {browseResults.map((p) => (
                        <li
                          key={p.id}
                          className="builder-search-item"
                          onClick={() => handleAddFromSearch(p)}
                        >
                          {p.sprite && (
                            <img
                              className="search-result-sprite"
                              src={p.sprite}
                              alt={p.name}
                            />
                          )}
                          <span className="search-result-name">{p.name}</span>
                          <span
                            className="habitat-badge"
                            style={{
                              backgroundColor: getHabitatBadgeColor(p.idealHabitat),
                            }}
                          >
                            <HabitatTypeIcon type={p.idealHabitat} /> {p.idealHabitat}
                          </span>
                          <button
                            className="inline-add-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddFromSearch(p);
                            }}
                          >
                            + Add
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </section>

            {habitatPokemon.length === 0 && (
              <section className="empty-habitat">
                <div className="empty-habitat-circle">
                  <div className="empty-habitat-ring" />
                  <span className="empty-habitat-hint">
                    Search above or pick from suggestions below to add Pokemon
                  </span>
                </div>
              </section>
            )}

            {habitatPokemon.length > 0 && (
              <>
                <section className="current-pokemon">
                  <h3>Habitat ({habitatPokemon.length})</h3>
                  <div className="habitat-space" style={{ background: habitatTheme.circleGradient }}>
                    {habitatPokemon.map((p, i) => {
                      const angle = (i / habitatPokemon.length) * 2 * Math.PI - Math.PI / 2;
                      const radius = habitatPokemon.length <= 3 ? 70 : 90;
                      const centerX = 140;
                      const centerY = 140;
                      const x = centerX + Math.cos(angle) * radius - 28;
                      const y = centerY + Math.sin(angle) * radius - 28;
                      const dimmed = (highlightFav && !p.favorites.includes(highlightFav))
                        || (highlightHabitat && p.idealHabitat !== highlightHabitat);
                      return (
                        <div
                          key={p.id}
                          className="habitat-space-pokemon"
                          style={{
                            left: `${x}px`,
                            top: `${y}px`,
                            opacity: dimmed ? 0.3 : 1,
                          }}
                          onClick={() => onSelectPokemon(p)}
                        >
                          {p.sprite && (
                            <img src={p.sprite} alt={p.name} />
                          )}
                          <span className="habitat-space-name">{p.name}</span>
                          <button
                            className="habitat-space-remove"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemove(p.id);
                            }}
                          >
                            &times;
                          </button>
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
                                <span
                                  key={type}
                                  className={`habitat-type-tag clickable ${isActive ? 'active' : ''}`}
                                  style={{ backgroundColor: info.bg, color: info.color, borderColor: info.color }}
                                  onClick={() => { setHighlightHabitat(isActive ? null : type); setHighlightFav(null); }}
                                >
                                  <HabitatTypeIcon type={type} /> {type} <span className="habitat-type-count">{typeCount}</span>
                                </span>
                              );
                            })}
                            {dominantHabitat.all.filter(({ type }) => !dominantHabitat.tied.includes(type)).map(({ type, count }) => {
                              const info = getHabitatInfo(type);
                              const isActive = highlightHabitat === type;
                              return (
                                <span
                                  key={type}
                                  className={`habitat-type-tag minor clickable ${isActive ? 'active' : ''}`}
                                  style={{ backgroundColor: info.bg, color: info.color, borderColor: info.color, opacity: isActive ? 1 : 0.6 }}
                                  onClick={() => { setHighlightHabitat(isActive ? null : type); setHighlightFav(null); }}
                                >
                                  <HabitatTypeIcon type={type} /> {type} <span className="habitat-type-count">{count}</span>
                                </span>
                              );
                            })}
                          </div>
                          <p className="habitat-type-hint">
                            Tied ideal habitat — consider splitting into separate habitats
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="habitat-type-tags">
                            {dominantHabitat.all.map(({ type, count }, i) => {
                              const info = getHabitatInfo(type);
                              const isDominant = i === 0;
                              const isActive = highlightHabitat === type;
                              // Only make tags clickable when there are multiple types
                              const isClickable = dominantHabitat.all.length > 1;
                              return (
                                <span
                                  key={type}
                                  className={`habitat-type-tag ${isDominant ? '' : 'minor'} ${isClickable ? 'clickable' : ''} ${isActive ? 'active' : ''}`}
                                  style={{
                                    backgroundColor: info.bg,
                                    color: info.color,
                                    borderColor: info.color,
                                    opacity: (isDominant || isActive) ? 1 : 0.55,
                                  }}
                                  onClick={isClickable ? () => { setHighlightHabitat(isActive ? null : type); setHighlightFav(null); } : undefined}
                                >
                                  <HabitatTypeIcon type={type} size={isDominant ? 14 : 12} /> {isDominant ? `${type} Habitat` : type} <span className="habitat-type-count">{count}</span>
                                </span>
                              );
                            })}
                          </div>
                          {dominantHabitat.all.length > 1 && (() => {
                            const minorityCount = dominantHabitat.all.slice(1).reduce((sum, a) => sum + a.count, 0);
                            return (
                              <p className="habitat-type-hint">
                                {minorityCount} Pokemon prefer{minorityCount === 1 ? 's' : ''} a different habitat type
                              </p>
                            );
                          })()}
                        </>
                      )}
                    </div>
                  )}
                </section>

                <section className="favorite-breakdown">
                  <h3>Favorite Overlap {highlightFav && <span className="highlight-label">— filtering: {highlightFav} <button className="clear-highlight" onClick={() => setHighlightFav(null)}>&times;</button></span>}{highlightHabitat && <span className="highlight-label">— showing: {highlightHabitat} <button className="clear-highlight" onClick={() => setHighlightHabitat(null)}>&times;</button></span>}</h3>
                  {!highlightFav && !highlightHabitat && <p className="fav-hint">Click a row to highlight Pokemon with that favorite</p>}
                  <div className="fav-bars">
                    {favCounts.map(({ favorite, count }, i) => {
                      const ratio = count / habitatPokemon.length;
                      const isTop = topFavorites.has(favorite);
                      const isMid = !isTop && ratio >= 0.5;
                      const favStyle = getFavoriteStyle(favorite);
                      const tier = isTop ? 'top' : isMid ? 'mid' : 'low';
                      const labelColor = isTop ? favStyle.text : isMid ? favStyle.text : '#bbb';
                      const trackBg = isTop ? favStyle.bg : isMid ? favStyle.bg : '#f0f0ee';
                      const fillBg = isTop ? favStyle.border : isMid ? favStyle.border : '#ddd';
                      return (
                        <div
                          key={favorite}
                          className={`fav-bar-row clickable ${highlightFav === favorite ? 'active' : ''} fav-bar-${tier}`}
                          onClick={() => { setHighlightFav(highlightFav === favorite ? null : favorite); setHighlightHabitat(null); }}
                        >
                          <span className="fav-label" style={{ color: labelColor }}>{favorite}</span>
                          <div className="fav-bar-track" style={{ backgroundColor: trackBg }}>
                            <div
                              className="fav-bar-fill"
                              style={{
                                width: `${ratio * 100}%`,
                                background: fillBg,
                              }}
                            />
                          </div>
                          <span className="fav-count">
                            {count}/{habitatPokemon.length}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </section>

              </>
            )}
          </>
        )}
      </div>

      {activeHabitat && (
        <div className="habitat-below">
            {habitatPokemon.length > 0 && (showHabitatTypeSplit || showFavoriteSplit) && (
                  <section className="split-section">
                    <div className="split-header">
                      <h3>Suggested Split</h3>
                      <button
                        className="split-toggle-btn"
                        onClick={() => setShowSplit(!showSplit)}
                      >
                        {showSplit ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    {showSplit && (
                      <div className="split-preview">
                        {/* Habitat Type Split */}
                        {showHabitatTypeSplit && (
                          <div className="split-variant">
                            <h4 className="split-variant-title">
                              <HabitatTypeIcon type={habitatTypeSplit.groups[0].type} size={16} /> Split by Ideal Habitat
                            </h4>
                            <p className="split-description">
                              This group has mixed ideal habitats. Splitting by type groups Pokemon that prefer the same environment.
                            </p>
                            <div className="split-groups" style={{ gridTemplateColumns: habitatTypeSplit.groups.length > 2 ? `repeat(${habitatTypeSplit.groups.length}, 1fr)` : '1fr 1fr' }}>
                              {habitatTypeSplit.groups.map(({ type, pokemon: groupPokemon }) => {
                                const info = getHabitatInfo(type);
                                const groupFavCounts = favoriteCounts(groupPokemon);
                                return (
                                  <div key={type} className="split-group" style={{ background: info.gradient || info.bg, borderColor: info.color }}>
                                    <h4 style={{ color: info.color }}>
                                      <HabitatTypeIcon type={type} size={14} /> {type} ({groupPokemon.length})
                                    </h4>
                                    <div className="split-pokemon-list">
                                      {groupPokemon.map((p) => (
                                        <div key={p.id} className="split-pokemon-item">
                                          {p.sprite && (
                                            <img className="habitat-item-sprite" src={p.sprite} alt={p.name} />
                                          )}
                                          <span>{p.name}</span>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="split-fav-bars">
                                      {groupFavCounts.slice(0, 5).map(({ favorite, count }) => {
                                        const favStyle = getFavoriteStyle(favorite);
                                        return (
                                          <div key={favorite} className="fav-bar-row">
                                            <span className="fav-label" style={{ color: favStyle.text }}>{favorite}</span>
                                            <div className="fav-bar-track" style={{ backgroundColor: favStyle.bg }}>
                                              <div className="fav-bar-fill" style={{ width: `${(count / groupPokemon.length) * 100}%`, background: favStyle.border }} />
                                            </div>
                                            <span className="fav-count">{count}/{groupPokemon.length}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <button
                              className="apply-split-btn"
                              onClick={() => {
                                // Split into first group vs rest combined, or handle multiple groups
                                const firstGroup = habitatTypeSplit.groups[0].pokemon;
                                const rest = habitatTypeSplit.groups.slice(1).flatMap(g => g.pokemon);
                                onSplit(firstGroup, rest);
                                setShowSplit(false);
                              }}
                            >
                              Apply Split ({habitatTypeSplit.groups.length > 2
                                ? `${habitatTypeSplit.groups[0].type} vs Rest`
                                : `${habitatTypeSplit.groups[0].type} / ${habitatTypeSplit.groups[1].type}`})
                            </button>
                          </div>
                        )}

                        {/* Favorite Overlap Split */}
                        {showFavoriteSplit && (
                          <div className="split-variant">
                            <h4 className="split-variant-title">
                              Split by Favorites
                            </h4>
                            <p className="split-description">
                              {showHabitatTypeSplit
                                ? 'This alternative split optimizes for favorite overlap regardless of habitat type.'
                                : 'Splitting this group would improve internal favorite overlap.'}
                            </p>
                            <div className="split-groups">
                              {[
                                { label: 'Group A', pokemon: splitResult.groupA, favCounts: splitFavCountsA },
                                { label: 'Group B', pokemon: splitResult.groupB, favCounts: splitFavCountsB },
                              ].map(({ label, pokemon: groupPokemon, favCounts: gFavCounts }) => {
                                const groupTheme = getHabitatTheme(groupPokemon);
                                const groupDom = getDominantHabitat(groupPokemon);
                                const domInfo = groupDom ? getHabitatInfo(groupDom.type) : null;
                                return (
                                  <div key={label} className="split-group" style={{ background: groupTheme.bgGradient, borderColor: groupTheme.accentColor }}>
                                    <h4>
                                      {label} ({groupPokemon.length})
                                      {domInfo && (
                                        <span className="split-group-habitat" style={{ color: domInfo.color }}>
                                          {' '}<HabitatTypeIcon type={groupDom.type} size={12} /> {groupDom.type}
                                        </span>
                                      )}
                                    </h4>
                                    <div className="split-pokemon-list">
                                      {groupPokemon.map((p) => (
                                        <div key={p.id} className="split-pokemon-item">
                                          {p.sprite && (
                                            <img className="habitat-item-sprite" src={p.sprite} alt={p.name} />
                                          )}
                                          <span>{p.name}</span>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="split-fav-bars">
                                      {gFavCounts.slice(0, 5).map(({ favorite, count }) => {
                                        const favStyle = getFavoriteStyle(favorite);
                                        return (
                                          <div key={favorite} className="fav-bar-row">
                                            <span className="fav-label" style={{ color: favStyle.text }}>{favorite}</span>
                                            <div className="fav-bar-track" style={{ backgroundColor: favStyle.bg }}>
                                              <div className="fav-bar-fill" style={{ width: `${(count / groupPokemon.length) * 100}%`, background: favStyle.border }} />
                                            </div>
                                            <span className="fav-count">{count}/{groupPokemon.length}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <button
                              className="apply-split-btn"
                              onClick={() => {
                                onSplit(splitResult.groupA, splitResult.groupB);
                                setShowSplit(false);
                              }}
                            >
                              Apply Favorite Split
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </section>
                )}

            <section className="suggestions">
              <div className="suggestions-header">
                <h3>{habitatPokemon.length === 0 ? 'All Pokemon' : 'Suggested Pokemon'}</h3>
                <div className="suggestions-filters">
                  {habitatPokemon.length > 0 && (
                    <label className="filter-toggle">
                      <input
                        type="checkbox"
                        checked={sameHabitatOnly}
                        onChange={(e) => setSameHabitatOnly(e.target.checked)}
                      />
                      Same ideal habitat only
                    </label>
                  )}
                  <label className="filter-toggle">
                    <input
                      type="checkbox"
                      checked={ownedOnly}
                      onChange={(e) => setOwnedOnly(e.target.checked)}
                    />
                    Owned only
                    {ownedPokemon.size > 0 && (
                      <span className="owned-count">({ownedPokemon.size})</span>
                    )}
                  </label>
                  <label className="filter-toggle">
                    <input
                      type="checkbox"
                      checked={notInHabitatOnly}
                      onChange={(e) => setNotInHabitatOnly(e.target.checked)}
                    />
                    Not in a habitat
                  </label>
                </div>
              </div>

              {topSuggestions.length === 0 ? (
                <p className="no-suggestions">
                  No matching Pokemon found. Try unchecking filters.
                </p>
              ) : (
                <div className="pokemon-grid">
                  {topSuggestions.map((p) => (
                    <PokemonCard
                      key={p.id}
                      pokemon={p}
                      onAdd={() => onAdd(p)}
                      inHabitat={false}
                      score={p.score}
                      sharedFavs={p.sharedFavs}
                      favWeights={p.favWeights}
                      maxFavWeight={p.maxFavWeight}
                      highlightFav={highlightFav}
                      topFavorites={topFavorites}
                      midFavorites={midFavorites}
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
