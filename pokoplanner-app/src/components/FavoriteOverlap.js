import { useState } from 'react';
import { getFavoriteStyle } from '../utils/themeColors';

/**
 * Favorite overlap bar chart with expandable low-overlap favorites.
 * Hover a row to highlight Pokemon with that favorite in the circle.
 */
function FavoriteOverlap({
  favCounts,
  totalPokemon,
  topFavorites,
  highlightFav,
  highlightHabitat,
  onHighlightFav,
  onHighlightHabitat,
}) {
  const [showAll, setShowAll] = useState(false);
  const displayedFavs = showAll ? favCounts : favCounts.slice(0, 5);

  return (
    <section className="favorite-breakdown">
      <h3>Favorite Overlap</h3>
      <div className="fav-bars">
        {displayedFavs.map(({ favorite, count }) => {
          const ratio = count / totalPokemon;
          const isTop = topFavorites.has(favorite);
          const isMid = !isTop && ratio >= 0.5;
          const favStyle = getFavoriteStyle(favorite);
          const tier = isTop ? 'top' : isMid ? 'mid' : 'low';
          const labelColor = isTop || isMid ? favStyle.text : '#888';
          const trackBg = isTop || isMid ? favStyle.bg : '#e8e8e4';
          const fillBg = isTop || isMid ? favStyle.border : '#bbb';
          return (
            <div
              key={favorite}
              className={`fav-bar-row hoverable ${highlightFav === favorite ? 'active' : ''} fav-bar-${tier}`}
              onMouseEnter={() => {
                onHighlightFav(favorite);
                onHighlightHabitat(null);
              }}
              onMouseLeave={() => {
                onHighlightFav(null);
              }}
            >
              <span className="fav-label" style={{ color: labelColor }}>{favorite}</span>
              <div className="fav-bar-track" style={{ backgroundColor: trackBg }}>
                <div className="fav-bar-fill" style={{ width: `${ratio * 100}%`, background: fillBg }} />
              </div>
              <span className="fav-count">{count}/{totalPokemon}</span>
            </div>
          );
        })}
        {favCounts.length > 5 && (
          <button className="fav-more-toggle" onClick={() => setShowAll(!showAll)}>
            {showAll ? 'Show less' : `${favCounts.length - 5} more with low overlap`}
          </button>
        )}
      </div>
    </section>
  );
}

export default FavoriteOverlap;
