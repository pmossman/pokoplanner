import { getHabitatBadgeColor, getFavoriteStyle } from '../utils/themeColors';
import './PokemonCard.css';

function PokemonCard({ pokemon, onClick, onAdd, inHabitat, compact, score, sharedFavs, favWeights, maxFavWeight, highlightFav }) {
  const habitatColor = getHabitatBadgeColor(pokemon.idealHabitat);

  // Sort favorites: weighted ones first (by weight desc), then unweighted
  const sortedFavorites = favWeights
    ? [...pokemon.favorites].sort((a, b) => (favWeights[b] || 0) - (favWeights[a] || 0))
    : pokemon.favorites;

  const favTagStyle = (f) => {
    const base = getFavoriteStyle(f);
    if (favWeights && favWeights[f] && maxFavWeight) {
      const intensity = favWeights[f] / maxFavWeight;
      // Boost saturation based on weight
      const opacity = 0.4 + intensity * 0.6;
      return {
        backgroundColor: base.bg,
        color: base.text,
        borderColor: base.border,
        boxShadow: `inset 0 0 0 100px rgba(${hexToRgb(base.border)}, ${opacity * 0.3})`,
        fontWeight: intensity > 0.3 ? '700' : '400',
      };
    }
    return {
      backgroundColor: base.bg,
      color: base.text,
      borderColor: base.border,
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
          {pokemon.idealHabitat}
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
          {inHabitat ? 'In Habitat' : '+ Add'}
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
