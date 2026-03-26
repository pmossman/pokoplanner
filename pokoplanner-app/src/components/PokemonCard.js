import { getHabitatBadgeColor, getFavoriteStyle, HabitatTypeIcon } from '../utils/themeColors';
import './PokemonCard.css';

function PokemonCard({ pokemon, onClick, onAdd, inHabitat, compact, score, sharedFavs, favWeights, maxFavWeight, highlightFav, topFavorites, midFavorites }) {
  const habitatColor = getHabitatBadgeColor(pokemon.idealHabitat);

  // Sort favorites: top habitat favorites first, then by weight desc
  const sortedFavorites = [...pokemon.favorites].sort((a, b) => {
    const aTop = topFavorites && topFavorites.has(a) ? 1 : 0;
    const bTop = topFavorites && topFavorites.has(b) ? 1 : 0;
    if (aTop !== bTop) return bTop - aTop;
    if (favWeights) return (favWeights[b] || 0) - (favWeights[a] || 0);
    return 0;
  });

  const favTagStyle = (f) => {
    const base = getFavoriteStyle(f);
    const isTop = topFavorites && topFavorites.has(f);
    const isMid = !isTop && midFavorites && midFavorites.has(f);
    if (isTop) {
      return {
        backgroundColor: base.bg,
        color: base.text,
        borderColor: base.border,
        fontWeight: '700',
      };
    }
    if (isMid) {
      return {
        backgroundColor: base.bg,
        color: base.text,
        borderColor: base.border,
        fontWeight: '600',
        opacity: 0.6,
      };
    }
    return {
      backgroundColor: '#f5f5f3',
      color: '#bbb',
      borderColor: '#e8e8e6',
      fontWeight: '400',
    };
  };

  return (
    <div
      className={`pokemon-card ${compact ? 'compact' : ''} ${highlightFav && !pokemon.favorites.includes(highlightFav) ? 'dimmed' : ''}`}
      onClick={onClick}
    >
      <div className="card-header">
        <span className="dex-number">#{String(pokemon.number).padStart(3, '0')}</span>
        <span
          className="habitat-badge"
          style={{ backgroundColor: habitatColor }}
        >
          <HabitatTypeIcon type={pokemon.idealHabitat} /> {pokemon.idealHabitat}
        </span>
      </div>

      {pokemon.sprite && (
        <img
          className="pokemon-sprite"
          src={pokemon.sprite}
          alt={pokemon.name}
          loading="lazy"
        />
      )}

      <h3 className="pokemon-name">{pokemon.name}</h3>

      {!compact && (
        <div className="favorites-list">
          {sortedFavorites.map((f) => (
            <span
              key={f}
              className={`favorite-tag ${
                sharedFavs && sharedFavs.includes(f) ? 'shared' : ''
              } ${highlightFav === f ? 'highlighted' : ''}`}
              style={favTagStyle(f)}
            >
              {f}
            </span>
          ))}
        </div>
      )}

      {score !== undefined && score > 0 && favWeights && (
        <div className="score-tooltip-wrapper">
          <div className="score-display">
            Compatibility: {score}
          </div>
          <div className="score-breakdown">
            {Object.entries(favWeights)
              .sort((a, b) => b[1] - a[1])
              .map(([fav, weight]) => (
                <div key={fav} className="score-breakdown-row">
                  <span className="score-breakdown-fav">{fav}</span>
                  <span className="score-breakdown-weight">+{weight}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {onAdd && (
        <button
          className={`add-btn ${inHabitat ? 'added' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            if (!inHabitat) onAdd();
          }}
          disabled={inHabitat}
        >
          {inHabitat ? 'In Home' : '+ Add'}
        </button>
      )}
    </div>
  );
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

export default PokemonCard;
