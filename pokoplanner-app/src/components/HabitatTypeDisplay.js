import { getHabitatInfo, HabitatTypeIcon } from '../utils/themeColors';

/**
 * Displays the dominant habitat type tags with click-to-highlight.
 * Shared between HabitatBuilder and LocationView.
 */
function HabitatTypeDisplay({
  dominantHabitat,
  highlightHabitat,
  onHighlightHabitat,
  onHighlightFav,
}) {
  if (!dominantHabitat) return null;

  const handleClick = (type, isActive) => {
    onHighlightHabitat(isActive ? null : type);
    onHighlightFav(null);
  };

  if (dominantHabitat.tied) {
    return (
      <div className="habitat-type-display">
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
                onClick={() => handleClick(type, isActive)}
              >
                <HabitatTypeIcon type={type} /> {type}{' '}
                <span className="habitat-type-count">{typeCount}</span>
              </span>
            );
          })}
          {dominantHabitat.all
            .filter(({ type }) => !dominantHabitat.tied.includes(type))
            .map(({ type, count }) => {
              const info = getHabitatInfo(type);
              const isActive = highlightHabitat === type;
              return (
                <span
                  key={type}
                  className={`habitat-type-tag minor clickable ${isActive ? 'active' : ''}`}
                  style={{ backgroundColor: info.bg, color: info.color, borderColor: info.color, opacity: isActive ? 1 : 0.6 }}
                  onClick={() => handleClick(type, isActive)}
                >
                  <HabitatTypeIcon type={type} /> {type}{' '}
                  <span className="habitat-type-count">{count}</span>
                </span>
              );
            })}
        </div>
        <p className="habitat-type-hint">Tied ideal habitat type &mdash; consider splitting</p>
      </div>
    );
  }

  const minorityCount = dominantHabitat.all.length > 1
    ? dominantHabitat.all.slice(1).reduce((sum, a) => sum + a.count, 0)
    : 0;

  return (
    <div className="habitat-type-display">
      <div className="habitat-type-tags">
        {dominantHabitat.all.map(({ type, count }, i) => {
          const info = getHabitatInfo(type);
          const isDominant = i === 0;
          const isActive = highlightHabitat === type;
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
              onClick={isClickable ? () => handleClick(type, isActive) : undefined}
            >
              <HabitatTypeIcon type={type} size={isDominant ? 14 : 12} />{' '}
              {isDominant ? `${type}` : type}{' '}
              <span className="habitat-type-count">{count}</span>
            </span>
          );
        })}
      </div>
      {minorityCount > 0 && (
        <p className="habitat-type-hint">
          {minorityCount} Pokemon prefer{minorityCount === 1 ? 's' : ''} a different ideal habitat
        </p>
      )}
    </div>
  );
}

export default HabitatTypeDisplay;
