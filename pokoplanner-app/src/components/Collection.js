import { useState, useMemo } from 'react';
import { filterPokemon } from '../utils/pokemonUtils';
import { getHabitatBadgeColor, HabitatTypeIcon } from '../utils/themeColors';
import './Collection.css';

function Collection({
  allPokemon,
  allFavorites,
  allIdealHabitats,
  ownedPokemon,
  onToggleOwned,
  onSelectPokemon,
}) {
  const [query, setQuery] = useState('');
  const [idealHabitat, setIdealHabitat] = useState('');
  const [favorite, setFavorite] = useState('');
  const [showFilter, setShowFilter] = useState('all'); // 'all', 'owned', 'unowned'

  const results = useMemo(() => {
    let filtered = filterPokemon(allPokemon, { query, idealHabitat, favorite });
    if (showFilter === 'owned') {
      filtered = filtered.filter((p) => ownedPokemon.has(p.id));
    } else if (showFilter === 'unowned') {
      filtered = filtered.filter((p) => !ownedPokemon.has(p.id));
    }
    return filtered;
  }, [allPokemon, query, idealHabitat, favorite, showFilter, ownedPokemon]);

  const ownedCount = ownedPokemon.size;

  return (
    <div className="collection">
      <div className="collection-header">
        <h2>My Collection</h2>
        <span className="collection-count">
          {ownedCount} / {allPokemon.length} owned
        </span>
      </div>

      <div className="collection-controls">
        <input
          type="text"
          placeholder="Search by name or number..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="collection-search"
        />
        <select
          value={idealHabitat}
          onChange={(e) => setIdealHabitat(e.target.value)}
          className="collection-select"
        >
          <option value="">All Habitats</option>
          {allIdealHabitats.map((h) => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
        <select
          value={favorite}
          onChange={(e) => setFavorite(e.target.value)}
          className="collection-select"
        >
          <option value="">All Favorites</option>
          {allFavorites.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
        <div className="show-filter">
          {['all', 'owned', 'unowned'].map((val) => (
            <button
              key={val}
              className={`show-filter-btn ${showFilter === val ? 'active' : ''}`}
              onClick={() => setShowFilter(val)}
            >
              {val === 'all' ? 'All' : val === 'owned' ? 'Owned' : 'Not Owned'}
            </button>
          ))}
        </div>
      </div>

      <p className="collection-result-count">{results.length} Pokemon shown</p>

      <div className="collection-grid">
        {results.map((p) => {
          const isOwned = ownedPokemon.has(p.id);
          return (
            <div
              key={p.id}
              className={`collection-card ${isOwned ? 'owned' : 'unowned'}`}
              onClick={() => onToggleOwned(p.id)}
            >
              <button
                className="collection-info-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPokemon(p);
                }}
                title="View details"
              >
                i
              </button>
              <div className={`collection-owned-indicator ${isOwned ? 'is-owned' : ''}`}>
                {isOwned ? '\u2713' : ''}
              </div>
              {p.sprite && (
                <img
                  className="collection-sprite"
                  src={p.sprite}
                  alt={p.name}
                  loading="lazy"
                />
              )}
              <span className="collection-name">{p.name}</span>
              <span
                className="habitat-badge"
                style={{ backgroundColor: getHabitatBadgeColor(p.idealHabitat) }}
              >
                <HabitatTypeIcon type={p.idealHabitat} /> {p.idealHabitat}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Collection;
