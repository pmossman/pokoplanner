/**
 * Generate a display name for a habitat.
 * Shows custom name if set, otherwise joins Pokemon names (truncated at 30 chars).
 */
export function habitatDisplayName(h) {
  if (h.customName) return h.customName;
  if (h.pokemon.length === 0) return 'New Home';
  const names = h.pokemon.map((p) => p.name);
  const joined = names.join(', ');
  return joined.length > 30 ? joined.slice(0, 27) + '...' : joined;
}

/**
 * Compute per-pokemon compatibility warnings for a habitat group.
 * Returns { [pokemonId]: string[] } for pokemon with issues.
 */
export function computePokemonWarnings(habitatPokemon, dominantHabitat) {
  if (habitatPokemon.length < 2) return {};
  const domType = dominantHabitat?.type;
  const favTotals = {};
  for (const p of habitatPokemon) {
    for (const f of p.favorites) favTotals[f] = (favTotals[f] || 0) + 1;
  }
  // Scale the favorite-sharing threshold by group size:
  // With 2-3 Pokemon, sharing 1 favorite is fine — only warn at 0.
  // With 4+, warn at <= 1 shared.
  const favWarnThreshold = habitatPokemon.length <= 3 ? 0 : 1;
  const warnings = {};
  for (const p of habitatPokemon) {
    const issues = [];
    if (domType && p.idealHabitat !== domType && !dominantHabitat.tied) {
      issues.push(`Prefers ${p.idealHabitat} (group is ${domType})`);
    }
    const sharedCount = p.favorites.filter((f) => favTotals[f] > 1).length;
    if (sharedCount <= favWarnThreshold) {
      issues.push(`Shares ${sharedCount === 0 ? 'no' : 'only 1'} favorite${sharedCount === 1 ? '' : 's'} with the group`);
    }
    if (issues.length > 0) warnings[p.id] = issues;
  }
  return warnings;
}

/**
 * Compute circle positioning for a pokemon at index i of n total.
 */
export function circlePosition(i, total, opts = {}) {
  const { smallRadius = 70, largeRadius = 90, center = 140, spriteOffset = 28 } = opts;
  const angle = (i / total) * 2 * Math.PI - Math.PI / 2;
  const radius = total <= 3 ? smallRadius : largeRadius;
  return {
    x: center + Math.cos(angle) * radius - spriteOffset,
    y: center + Math.sin(angle) * radius - spriteOffset,
  };
}

/**
 * Classify a favorite count as top/mid/low tier.
 */
export function favTier(favorite, count, total, topFavorites, midFavorites) {
  if (topFavorites.has(favorite)) return 'top';
  const ratio = count / total;
  if (ratio >= 0.5 && !topFavorites.has(favorite)) return 'mid';
  return 'low';
}

/**
 * Compute top and mid favorite sets from favCounts.
 */
export function computeFavoriteTiers(favCounts, totalPokemon) {
  const topFavorites = new Set();
  if (favCounts.length > 0) {
    const cutoff = favCounts.length >= 3 ? favCounts[2].count : favCounts[favCounts.length - 1].count;
    for (const f of favCounts) {
      if (f.count >= cutoff) topFavorites.add(f.favorite);
    }
  }

  const midFavorites = new Set();
  if (totalPokemon > 0) {
    const halfCount = totalPokemon / 2;
    for (const f of favCounts) {
      if (f.count >= halfCount && !topFavorites.has(f.favorite)) {
        midFavorites.add(f.favorite);
      }
    }
  }

  return { topFavorites, midFavorites };
}
