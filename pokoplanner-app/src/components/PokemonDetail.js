import { useMemo } from 'react';
import { sharedFavorites } from '../utils/pokemonUtils';
import { getHabitatBadgeColor, getFavoriteStyle } from '../utils/themeColors';
import './PokemonDetail.css';

function PokemonDetail({ pokemon, allPokemon, onClose, onAddToHabitat, habitatPokemon, ownedPokemon, onToggleOwned }) {
  const compatiblePokemon = useMemo(() => {
    return allPokemon
      .filter((p) => p.id !== pokemon.id)
      .map((p) => ({
        ...p,
        shared: sharedFavorites(pokemon, p),
      }))
      .filter((p) => p.shared.length > 0)
      .sort((a, b) => {
        // Prefer same habitat, then by shared count
        const aHab = a.idealHabitat === pokemon.idealHabitat ? 1 : 0;
        const bHab = b.idealHabitat === pokemon.idealHabitat ? 1 : 0;
        if (bHab !== aHab) return bHab - aHab;
        return b.shared.length - a.shared.length;
      })
      .slice(0, 15);
  }, [pokemon, allPokemon]);

  const inHabitat = habitatPokemon.some((p) => p.id === pokemon.id);

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-panel" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          &times;
        </button>

        <div className="detail-header">
          {pokemon.sprite && (
            <img
              className="detail-sprite"
              src={pokemon.sprite}
              alt={pokemon.name}
            />
          )}
          <div className="detail-title">
            <span className="dex-number">
              #{String(pokemon.number).padStart(3, '0')}
            </span>
            <h2>{pokemon.name}</h2>
          </div>
          <span
            className="habitat-badge large"
            style={{ backgroundColor: getHabitatBadgeColor(pokemon.idealHabitat) }}
          >
            {pokemon.idealHabitat}
          </span>
        </div>

        <button
          className={`owned-btn ${ownedPokemon.has(pokemon.id) ? 'is-owned' : ''}`}
          onClick={() => onToggleOwned(pokemon.id)}
        >
          {ownedPokemon.has(pokemon.id) ? '\u2713 Owned' : 'Mark as Owned'}
        </button>

        <div className="detail-section">
          <h3>Favorites</h3>
          <div className="favorites-list">
            {pokemon.favorites.map((f) => (
              <span key={f} className="favorite-tag" style={{
                backgroundColor: getFavoriteStyle(f).bg,
                color: getFavoriteStyle(f).text,
                borderColor: getFavoriteStyle(f).border,
              }}>
                {f}
              </span>
            ))}
          </div>
        </div>

        <div className="detail-section">
          <h3>Specialties</h3>
          <div className="specialties-list">
            {pokemon.specialties.map((s) => (
              <span key={s} className="specialty-tag">
                {s}
              </span>
            ))}
          </div>
        </div>

        <div className="detail-section">
          <h3>Habitats</h3>
          <ul className="habitat-list">
            {pokemon.habitats.map((h) => (
              <li key={h.name}>
                <strong>{h.name}</strong> — {h.rarity}
              </li>
            ))}
          </ul>
        </div>

        <button
          className={`add-btn large ${inHabitat ? 'added' : ''}`}
          onClick={() => !inHabitat && onAddToHabitat(pokemon)}
          disabled={inHabitat}
        >
          {inHabitat ? 'Already in Habitat' : '+ Add to Habitat Builder'}
        </button>

        <div className="detail-section">
          <h3>Most Compatible Pokemon</h3>
          <div className="compat-list">
            {compatiblePokemon.map((p) => (
              <div key={p.id} className="compat-item">
                {p.sprite && (
                  <img className="compat-sprite" src={p.sprite} alt={p.name} />
                )}
                <span className="compat-name">{p.name}</span>
                <span
                  className="habitat-badge small"
                  style={{ backgroundColor: getHabitatBadgeColor(p.idealHabitat) }}
                >
                  {p.idealHabitat}
                </span>
                <span className="compat-count">
                  {p.shared.length} shared: {p.shared.join(', ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PokemonDetail;
