import { circlePosition } from '../utils/habitatHelpers';

/**
 * Renders the circular habitat visualization with positioned Pokemon sprites.
 * Shared between HabitatBuilder and LocationView.
 */
function HabitatCircle({
  pokemon,
  theme,
  warnings,
  highlightFav,
  highlightHabitat,
  onSelectPokemon,
  onRemove,
  habitatId,
  // Drag-drop support (optional, used in LocationView)
  dragOverCircle,
  onDragOver,
  onDragLeave,
  onDrop,
  onPokemonDragStart,
  onPokemonDragEnd,
}) {
  const dragProps = onDragOver ? {
    onDragOver: (e) => { e.preventDefault(); onDragOver(); },
    onDragLeave: onDragLeave,
    onDrop: onDrop,
  } : {};

  return (
    <div
      className={`habitat-space ${dragOverCircle ? 'drag-over-circle' : ''}`}
      style={{ background: theme.circleGradient }}
      {...dragProps}
    >
      {pokemon.map((p, i) => {
        const { x, y } = circlePosition(i, pokemon.length);
        const dimmed = (highlightFav && !p.favorites.includes(highlightFav))
          || (highlightHabitat && p.idealHabitat !== highlightHabitat);
        const pWarnings = warnings[p.id];
        const isDraggable = !!onPokemonDragStart;
        return (
          <div
            key={p.id}
            className={`habitat-space-pokemon ${pWarnings ? 'has-warning' : ''}`}
            style={{ left: `${x}px`, top: `${y}px`, opacity: dimmed ? 0.3 : 1 }}
            onClick={() => onSelectPokemon(p)}
            draggable={isDraggable}
            onDragStart={isDraggable ? (e) => {
              e.stopPropagation();
              e.dataTransfer.setData('text/pokemon-id', p.id);
              e.dataTransfer.setData('text/source-habitat-id', habitatId || '');
              e.dataTransfer.effectAllowed = 'move';
              onPokemonDragStart(e, p);
            } : undefined}
            onDragEnd={isDraggable ? (e) => {
              onPokemonDragEnd?.(e);
            } : undefined}
          >
            {p.sprite && <img src={p.sprite} alt={p.name} />}
            <span className="habitat-space-name">{p.name}</span>
            {pWarnings && (
              <span className="habitat-warning-dot" title={pWarnings.join('\n')}>
                <span className="habitat-warning-tooltip">
                  {pWarnings.map((w, wi) => <span key={wi}>{w}</span>)}
                </span>
              </span>
            )}
            <button
              className="habitat-space-remove"
              onClick={(e) => { e.stopPropagation(); onRemove(p.id); }}
            >
              &times;
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default HabitatCircle;
