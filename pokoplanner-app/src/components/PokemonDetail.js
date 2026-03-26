import { useState, useMemo } from 'react';
import { usePokemonData } from '../contexts/PokemonDataContext';
import { sharedFavorites } from '../utils/pokemonUtils';
import { getHabitatBadgeColor, getFavoriteStyle, getLocationInfo, HabitatTypeIcon, getDominantHabitat } from '../utils/themeColors';
import { habitatDisplayName } from '../utils/habitatHelpers';
import './PokemonDetail.css';

function PokemonDetail({ pokemon, onClose, habitatPokemon, mode, getPokemonLocation, onUnregister, currentHabitat, onNavigateToHabitat }) {
  const { allPokemon, ownedPokemon, toggleOwned, pokemonById } = usePokemonData();
  const [confirmUnregister, setConfirmUnregister] = useState(false);

  const { localCompat, otherCompat } = useMemo(() => {
    const pool = mode === 'adventure'
      ? allPokemon.filter((p) => ownedPokemon.has(p.id))
      : allPokemon;
    const sorted = pool
      .filter((p) => p.id !== pokemon.id)
      .map((p) => ({
        ...p,
        shared: sharedFavorites(pokemon, p),
      }))
      .filter((p) => p.shared.length > 0)
      .sort((a, b) => {
        const aHab = a.idealHabitat === pokemon.idealHabitat ? 1 : 0;
        const bHab = b.idealHabitat === pokemon.idealHabitat ? 1 : 0;
        if (bHab !== aHab) return bHab - aHab;
        return b.shared.length - a.shared.length;
      });

    if (mode !== 'adventure' || !getPokemonLocation) {
      return { localCompat: sorted.slice(0, 15), otherCompat: [] };
    }

    const pokemonLoc = getPokemonLocation(pokemon.id);
    const local = [];
    const other = [];
    for (const p of sorted) {
      const loc = getPokemonLocation(p.id);
      if (loc === pokemonLoc) {
        if (local.length < 10) local.push(p);
      } else {
        if (other.length < 10) other.push({ ...p, currentLocation: loc });
      }
      if (local.length >= 10 && other.length >= 10) break;
    }
    return { localCompat: local, otherCompat: other };
  }, [pokemon, allPokemon, ownedPokemon, mode, getPokemonLocation]);

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
        </div>

        {ownedPokemon.has(pokemon.id) ? (
          <div className="detail-registration">
            <span className="owned-badge">✓ Registered</span>
            {confirmUnregister ? (
              <span className="unregister-confirm">
                <span className="unregister-confirm-text">
                  {onUnregister?.inHome ? 'This will remove them from their home. Unregister?' : 'Unregister?'}
                </span>
                <button className="unregister-confirm-yes" onClick={() => { onUnregister?.handler(pokemon.id); onClose(); }}>Yes</button>
                <button className="unregister-confirm-no" onClick={() => setConfirmUnregister(false)}>Cancel</button>
              </span>
            ) : (
              <button className="unregister-btn" onClick={() => setConfirmUnregister(true)}>Unregister</button>
            )}
          </div>
        ) : (
          <button
            className="owned-btn"
            onClick={() => toggleOwned(pokemon.id)}
          >
            Register
          </button>
        )}

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
          <h3>Current Location</h3>
          <div className="detail-location">
            {(() => {
              const currentLoc = getPokemonLocation ? getPokemonLocation(pokemon.id) : pokemon.primaryLocation;
              const locInfo = getLocationInfo(currentLoc);
              const isAssigned = ownedPokemon.has(pokemon.id);
              return (
                <>
                  {isAssigned ? (
                    <span className="location-badge" style={{ backgroundColor: locInfo.bg, color: locInfo.color, borderColor: locInfo.color }}>
                      {locInfo.Icon && <locInfo.Icon size={14} />} {currentLoc}
                    </span>
                  ) : (
                    <span className="location-badge not-assigned">Not Assigned</span>
                  )}
                </>
              );
            })()}
          </div>
        </div>

        <div className="detail-section">
          <h3>Ideal Habitat</h3>
          <div className="detail-location">
            <span
              className="habitat-badge large"
              style={{ backgroundColor: getHabitatBadgeColor(pokemon.idealHabitat) }}
            >
              <HabitatTypeIcon type={pokemon.idealHabitat} /> {pokemon.idealHabitat}
            </span>
          </div>
        </div>

        {currentHabitat && (
          <div className="detail-section">
            <h3>Current Home</h3>
            <div
              className="detail-current-home"
              onClick={() => onNavigateToHabitat?.(pokemon.id)}
              title="Click to view this home"
            >
              {(() => {
                const dom = getDominantHabitat(currentHabitat.pokemon);
                return (
                  <>
                    {dom && (
                      <span className="habitat-badge small" style={{ backgroundColor: getHabitatBadgeColor(dom.type) }}>
                        <HabitatTypeIcon type={dom.type} size={10} /> {dom.type}
                      </span>
                    )}
                    <span className="detail-home-name">{habitatDisplayName(currentHabitat)}</span>
                    <span className="detail-home-count">{currentHabitat.pokemon.length} Pokemon</span>
                    <span className="detail-home-arrow">→</span>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        <div className="detail-section">
          <h3>Encounter Spots</h3>
          <ul className="habitat-list">
            {pokemon.habitats.map((h) => (
              <li key={h.name}>
                <strong>{h.name}</strong> — {h.rarity}
              </li>
            ))}
          </ul>
        </div>

        <div className="detail-section">
          <h3>{otherCompat.length > 0 ? 'Most Compatible — Same Location' : 'Most Compatible Pokemon'}</h3>
          {localCompat.length > 0 ? (
            <div className="compat-list">
              {localCompat.map((p) => (
                <div key={p.id} className="compat-item">
                  {p.sprite && (
                    <img className="compat-sprite" src={p.sprite} alt={p.name} />
                  )}
                  <span className="compat-name">{p.name}</span>
                  <span
                    className="habitat-badge small"
                    style={{ backgroundColor: getHabitatBadgeColor(p.idealHabitat) }}
                  >
                    <HabitatTypeIcon type={p.idealHabitat} /> {p.idealHabitat}
                  </span>
                  <span className="compat-count">
                    {p.shared.length} shared: {p.shared.join(', ')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="compat-empty">No compatible Pokemon at this location yet.</p>
          )}
        </div>

        {otherCompat.length > 0 && (
          <div className="detail-section">
            <h3>Most Compatible — Other Locations</h3>
            <div className="compat-list">
              {otherCompat.map((p) => {
                const locInfo = getLocationInfo(p.currentLocation);
                return (
                  <div key={p.id} className="compat-item">
                    {p.sprite && (
                      <img className="compat-sprite" src={p.sprite} alt={p.name} />
                    )}
                    <span className="compat-name">{p.name}</span>
                    <span className="compat-location" style={{ color: locInfo.color }}>
                      {locInfo.Icon && <locInfo.Icon size={11} />} {p.currentLocation}
                    </span>
                    <span
                      className="habitat-badge small"
                      style={{ backgroundColor: getHabitatBadgeColor(p.idealHabitat) }}
                    >
                      <HabitatTypeIcon type={p.idealHabitat} /> {p.idealHabitat}
                    </span>
                    <span className="compat-count">
                      {p.shared.length} shared: {p.shared.join(', ')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PokemonDetail;
