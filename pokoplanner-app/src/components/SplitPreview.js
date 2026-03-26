import { favoriteCounts } from '../utils/pokemonUtils';
import { getHabitatInfo, getHabitatTheme, getDominantHabitat, HabitatTypeIcon, getFavoriteStyle } from '../utils/themeColors';

/**
 * Split suggestion preview with habitat-type and favorite-based splits.
 * Shared between HabitatBuilder and LocationView.
 */
function SplitPreview({
  showSplit,
  onToggleSplit,
  showHabitatTypeSplit,
  habitatTypeSplit,
  showFavoriteSplit,
  splitResult,
  splitFavCountsA,
  splitFavCountsB,
  onApplySplit,
}) {
  return (
    <section className="split-section">
      <div className="split-header">
        <h3>Suggested Split</h3>
        <button className="split-toggle-btn" onClick={onToggleSplit}>
          {showSplit ? 'Hide' : 'Show'}
        </button>
      </div>
      {showSplit && (
        <div className="split-preview">
          {showHabitatTypeSplit && (
            <SplitByType
              habitatTypeSplit={habitatTypeSplit}
              onApply={(firstGroup, rest) => onApplySplit(firstGroup, rest)}
            />
          )}
          {showFavoriteSplit && (
            <SplitByFavorites
              splitResult={splitResult}
              splitFavCountsA={splitFavCountsA}
              splitFavCountsB={splitFavCountsB}
              showHabitatTypeSplit={showHabitatTypeSplit}
              onApply={(groupA, groupB) => onApplySplit(groupA, groupB)}
            />
          )}
        </div>
      )}
    </section>
  );
}

function FavBars({ favCounts, total }) {
  return (
    <div className="split-fav-bars">
      {favCounts.slice(0, 5).map(({ favorite, count }) => {
        const favStyle = getFavoriteStyle(favorite);
        return (
          <div key={favorite} className="fav-bar-row">
            <span className="fav-label" style={{ color: favStyle.text }}>{favorite}</span>
            <div className="fav-bar-track" style={{ backgroundColor: favStyle.bg }}>
              <div
                className="fav-bar-fill"
                style={{ width: `${(count / total) * 100}%`, background: favStyle.border }}
              />
            </div>
            <span className="fav-count">{count}/{total}</span>
          </div>
        );
      })}
    </div>
  );
}

function PokemonList({ pokemon }) {
  return (
    <div className="split-pokemon-list">
      {pokemon.map((p) => (
        <div key={p.id} className="split-pokemon-item">
          {p.sprite && <img className="habitat-item-sprite" src={p.sprite} alt={p.name} />}
          <span>{p.name}</span>
        </div>
      ))}
    </div>
  );
}

function SplitByType({ habitatTypeSplit, onApply }) {
  const groups = habitatTypeSplit.groups;
  return (
    <div className="split-variant">
      <h4 className="split-variant-title">
        <HabitatTypeIcon type={groups[0].type} size={16} /> Split by Ideal Habitat Type
      </h4>
      <p className="split-description">
        Mixed ideal habitat types. Splitting by type groups Pokemon that prefer the same environment.
      </p>
      <div
        className="split-groups"
        style={{ gridTemplateColumns: groups.length > 2 ? `repeat(${groups.length}, 1fr)` : '1fr 1fr' }}
      >
        {groups.map(({ type, pokemon }) => {
          const info = getHabitatInfo(type);
          const gfc = favoriteCounts(pokemon);
          return (
            <div key={type} className="split-group" style={{ background: info.gradient || info.bg, borderColor: info.color }}>
              <h4 style={{ color: info.color }}>
                <HabitatTypeIcon type={type} size={14} /> {type} ({pokemon.length})
              </h4>
              <PokemonList pokemon={pokemon} />
              <FavBars favCounts={gfc} total={pokemon.length} />
            </div>
          );
        })}
      </div>
      <button
        className="apply-split-btn"
        onClick={() => onApply(groups[0].pokemon, groups.slice(1).flatMap(g => g.pokemon))}
      >
        Apply Split ({groups.length > 2
          ? `${groups[0].type} vs Rest`
          : `${groups[0].type} / ${groups[1].type}`})
      </button>
    </div>
  );
}

function SplitByFavorites({ splitResult, splitFavCountsA, splitFavCountsB, showHabitatTypeSplit, onApply }) {
  const groupData = [
    { label: 'Group A', pokemon: splitResult.groupA, favCounts: splitFavCountsA },
    { label: 'Group B', pokemon: splitResult.groupB, favCounts: splitFavCountsB },
  ];
  return (
    <div className="split-variant">
      <h4 className="split-variant-title">Split by Favorites</h4>
      <p className="split-description">
        {showHabitatTypeSplit
          ? 'Alternative split optimizing for favorite overlap.'
          : 'Splitting would improve internal favorite overlap.'}
      </p>
      <div className="split-groups">
        {groupData.map(({ label, pokemon, favCounts: gfc }) => {
          const groupTheme = getHabitatTheme(pokemon);
          const groupDom = getDominantHabitat(pokemon);
          const domInfo = groupDom ? getHabitatInfo(groupDom.type) : null;
          return (
            <div key={label} className="split-group" style={{ background: groupTheme.bgGradient, borderColor: groupTheme.accentColor }}>
              <h4>
                {label} ({pokemon.length})
                {domInfo && (
                  <span className="split-group-habitat" style={{ color: domInfo.color }}>
                    {' '}<HabitatTypeIcon type={groupDom.type} size={12} /> {groupDom.type}
                  </span>
                )}
              </h4>
              <PokemonList pokemon={pokemon} />
              <FavBars favCounts={gfc} total={pokemon.length} />
            </div>
          );
        })}
      </div>
      <button className="apply-split-btn" onClick={() => onApply(splitResult.groupA, splitResult.groupB)}>
        Apply Favorite Split
      </button>
    </div>
  );
}

export default SplitPreview;
