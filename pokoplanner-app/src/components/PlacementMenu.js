import { useMemo, useState } from 'react';
import { compatibilityScore, rankByCompatibility } from '../utils/pokemonUtils';
import { getDominantHabitat, getHabitatBadgeColor, HabitatTypeIcon, getFavoriteStyle } from '../utils/themeColors';
import { habitatDisplayName } from '../utils/habitatHelpers';

/**
 * Contextual menu for placing a Pokemon into an existing home
 * or creating a new home with compatible companions.
 *
 * Designed as tap-first UX — works on both mobile and desktop.
 */
function PlacementMenu({
  pokemon,
  habitats,
  unhoused,
  onAddToHabitat,
  onCreateHabitatWithPokemon,
  onClose,
  location,
}) {
  const [selectedCompanions, setSelectedCompanions] = useState(new Set());

  // Rank existing homes by compatibility with this Pokemon
  const rankedHomes = useMemo(() => {
    return habitats
      .map((h) => {
        if (h.pokemon.length === 0) return { ...h, score: 0, sharedFavs: [] };
        const score = compatibilityScore(pokemon, h.pokemon);
        const dom = getDominantHabitat(h.pokemon);
        const typeMatch = dom && dom.type === pokemon.idealHabitat;

        // Find which favorites are shared
        const groupFavs = {};
        for (const p of h.pokemon) {
          for (const f of p.favorites) groupFavs[f] = (groupFavs[f] || 0) + 1;
        }
        const sharedFavs = pokemon.favorites.filter(f => groupFavs[f]);

        return {
          ...h,
          score: typeMatch ? score + 10 : score,
          rawScore: score,
          typeMatch,
          sharedFavs,
          dominant: dom,
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [pokemon, habitats]);

  // Suggest compatible unhoused Pokemon to create a new home with
  const companions = useMemo(() => {
    const others = unhoused.filter(p => p.id !== pokemon.id);
    if (others.length === 0) return [];
    return rankByCompatibility(others, [pokemon], false)
      .filter(p => p.score > 0)
      .slice(0, 8);
  }, [pokemon, unhoused]);

  const toggleCompanion = (id) => {
    setSelectedCompanions(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreateNew = () => {
    const ids = [pokemon.id, ...selectedCompanions];
    onCreateHabitatWithPokemon(null, ids, location);
    onClose();
  };

  const handleAddToHome = (habitatId) => {
    onAddToHabitat(pokemon.id, habitatId);
    onClose();
  };

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="placement-menu" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="placement-header">
          <div className="placement-pokemon">
            {pokemon.sprite && <img className="placement-sprite" src={pokemon.sprite} alt={pokemon.name} />}
            <div className="placement-pokemon-info">
              <span className="placement-pokemon-name">{pokemon.name}</span>
              <span className="habitat-badge small" style={{ backgroundColor: getHabitatBadgeColor(pokemon.idealHabitat) }}>
                <HabitatTypeIcon type={pokemon.idealHabitat} size={10} /> {pokemon.idealHabitat}
              </span>
            </div>
          </div>
          <button className="placement-close" onClick={onClose}>&times;</button>
        </div>

        {/* Existing homes */}
        {rankedHomes.length > 0 && (
          <div className="placement-section">
            <h4>Add to Home</h4>
            <div className="placement-homes">
              {rankedHomes.map((h) => (
                <button
                  key={h.id}
                  className={`placement-home-row ${h.score > 0 ? 'compatible' : ''}`}
                  onClick={() => handleAddToHome(h.id)}
                >
                  <div className="placement-home-left">
                    {h.dominant && (
                      <span className="habitat-badge small" style={{ backgroundColor: getHabitatBadgeColor(h.dominant.type) }}>
                        <HabitatTypeIcon type={h.dominant.type} size={9} />
                      </span>
                    )}
                    <span className="placement-home-name">{habitatDisplayName(h)}</span>
                    <span className="placement-home-count">{h.pokemon.length}</span>
                  </div>
                  <div className="placement-home-right">
                    {h.sharedFavs.length > 0 && (
                      <span className="placement-shared-count">{h.sharedFavs.length} shared fav{h.sharedFavs.length !== 1 ? 's' : ''}</span>
                    )}
                    {h.typeMatch && <span className="placement-type-match">✓ type</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Create new home */}
        <div className="placement-section">
          <h4>Create New Home</h4>
          {companions.length > 0 ? (
            <>
              <p className="placement-hint">Select compatible housemates:</p>
              <div className="placement-companions">
                {companions.map((p) => {
                  const selected = selectedCompanions.has(p.id);
                  return (
                    <button
                      key={p.id}
                      className={`placement-companion ${selected ? 'selected' : ''}`}
                      onClick={() => toggleCompanion(p.id)}
                    >
                      {p.sprite && <img className="placement-companion-sprite" src={p.sprite} alt={p.name} />}
                      <span className="placement-companion-name">{p.name}</span>
                      <div className="placement-companion-favs">
                        {p.sharedFavs.slice(0, 3).map(f => {
                          const style = getFavoriteStyle(f);
                          return (
                            <span key={f} className="placement-fav-tag" style={{ backgroundColor: style.bg, color: style.text, borderColor: style.border }}>
                              {f}
                            </span>
                          );
                        })}
                      </div>
                      <span className={`placement-check ${selected ? 'checked' : ''}`}>
                        {selected ? '✓' : '+'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="placement-hint">No other unhoused Pokemon to group with.</p>
          )}
          <button
            className="placement-create-btn"
            onClick={handleCreateNew}
          >
            {selectedCompanions.size > 0
              ? `Create Home with ${selectedCompanions.size + 1} Pokemon`
              : 'Create Home (just this Pokemon)'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PlacementMenu;
