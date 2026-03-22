/**
 * Calculate the number of shared favorites between two Pokemon.
 */
export function sharedFavorites(a, b) {
  return a.favorites.filter((f) => b.favorites.includes(f));
}

/**
 * Given a group of Pokemon, return a map of favorite -> count,
 * sorted by count descending.
 */
export function favoriteCounts(group) {
  const counts = {};
  for (const p of group) {
    for (const f of p.favorites) {
      counts[f] = (counts[f] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([favorite, count]) => ({ favorite, count }));
}

/**
 * Score a candidate Pokemon against an existing habitat group.
 * Higher = more compatible.
 * Each matching favorite is weighted by how many group members share it,
 * so matching a favorite that 4/5 members like scores higher than
 * matching one that only 1/5 likes.
 */
export function compatibilityScore(candidate, group) {
  const counts = {};
  for (const p of group) {
    for (const f of p.favorites) {
      counts[f] = (counts[f] || 0) + 1;
    }
  }
  let score = 0;
  for (const f of candidate.favorites) {
    if (counts[f]) {
      score += counts[f];
    }
  }
  return score;
}

/**
 * Rank all Pokemon by compatibility with an existing habitat group.
 * Optionally filter to same ideal habitat.
 */
export function rankByCompatibility(allPokemon, group, sameHabitatOnly = true) {
  const groupIds = new Set(group.map((p) => p.id));
  const idealHabitats = new Set(group.map((p) => p.idealHabitat));

  const counts = {};
  for (const p of group) {
    for (const f of p.favorites) {
      counts[f] = (counts[f] || 0) + 1;
    }
  }
  const maxCount = Math.max(...Object.values(counts), 1);

  return allPokemon
    .filter((p) => !groupIds.has(p.id))
    .filter((p) => !sameHabitatOnly || idealHabitats.has(p.idealHabitat))
    .map((p) => {
      const favWeights = {};
      for (const f of p.favorites) {
        if (counts[f]) favWeights[f] = counts[f];
      }
      return {
        ...p,
        score: compatibilityScore(p, group),
        sharedFavs: Object.keys(favWeights),
        favWeights,
        maxFavWeight: maxCount,
      };
    })
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

/**
 * Measure how well a group's favorites overlap internally.
 * Returns the average favorite frequency — higher means the group
 * shares more favorites in common.
 */
function groupCohesion(group) {
  if (group.length <= 1) return 0;
  const counts = {};
  for (const p of group) {
    for (const f of p.favorites) {
      counts[f] = (counts[f] || 0) + 1;
    }
  }
  // Sum of (count/groupSize) for each favorite, weighted by how many have it
  // This rewards favorites shared by many members
  let score = 0;
  for (const count of Object.values(counts)) {
    score += (count * count) / group.length;
  }
  return score;
}

/**
 * Suggest splitting a group of Pokemon into two subgroups
 * that each have better internal favorite overlap.
 *
 * Algorithm:
 * 1. Find the pair with least overlap to seed two groups
 * 2. Greedily assign remaining Pokemon to the best-fit group
 * 3. Refine with swaps that improve total cohesion
 *
 * Returns null if the group is too small to split,
 * or { groupA, groupB, scoreBefore, scoreAfter } with the suggested split.
 */
export function suggestSplit(group) {
  if (group.length < 4) return null;

  // Find the pair with the least overlap to use as seeds
  let minOverlap = Infinity;
  let seedA = 0;
  let seedB = 1;
  for (let i = 0; i < group.length; i++) {
    for (let j = i + 1; j < group.length; j++) {
      const overlap = sharedFavorites(group[i], group[j]).length;
      if (overlap < minOverlap) {
        minOverlap = overlap;
        seedA = i;
        seedB = j;
      }
    }
  }

  // Seed the two groups
  let a = [group[seedA]];
  let b = [group[seedB]];

  // Assign remaining Pokemon greedily
  const remaining = group.filter((_, i) => i !== seedA && i !== seedB);
  for (const p of remaining) {
    const scoreA = compatibilityScore(p, a);
    const scoreB = compatibilityScore(p, b);
    if (scoreA >= scoreB) {
      a.push(p);
    } else {
      b.push(p);
    }
  }

  // Refine: try swapping each Pokemon to the other group
  // Repeat until no improvement
  let improved = true;
  while (improved) {
    improved = false;
    const currentScore = groupCohesion(a) + groupCohesion(b);

    // Try moving each member of a to b
    for (let i = 0; i < a.length; i++) {
      if (a.length <= 1) break;
      const newA = [...a.slice(0, i), ...a.slice(i + 1)];
      const newB = [...b, a[i]];
      const newScore = groupCohesion(newA) + groupCohesion(newB);
      if (newScore > currentScore) {
        a = newA;
        b = newB;
        improved = true;
        break;
      }
    }
    if (improved) continue;

    // Try moving each member of b to a
    for (let i = 0; i < b.length; i++) {
      if (b.length <= 1) break;
      const newB = [...b.slice(0, i), ...b.slice(i + 1)];
      const newA = [...a, b[i]];
      const newScore = groupCohesion(newA) + groupCohesion(newB);
      if (newScore > currentScore) {
        a = newA;
        b = newB;
        improved = true;
        break;
      }
    }
  }

  const scoreBefore = groupCohesion(group);
  const scoreAfter = groupCohesion(a) + groupCohesion(b);

  // Only suggest if the split actually improves cohesion
  if (scoreAfter <= scoreBefore) return null;

  return {
    groupA: a,
    groupB: b,
    scoreBefore,
    scoreAfter,
  };
}

/**
 * Suggest splitting a group by ideal habitat type.
 * Returns null if all Pokemon share the same ideal habitat.
 * Returns { groups: [{ type, pokemon }], scoreBefore, scoreAfter }
 */
export function suggestHabitatTypeSplit(group) {
  if (group.length < 2) return null;

  const byType = {};
  for (const p of group) {
    if (!byType[p.idealHabitat]) byType[p.idealHabitat] = [];
    byType[p.idealHabitat].push(p);
  }

  const types = Object.keys(byType);
  if (types.length < 2) return null;

  const groups = types
    .map((type) => ({ type, pokemon: byType[type] }))
    .sort((a, b) => b.pokemon.length - a.pokemon.length);

  const scoreBefore = groupCohesion(group);
  const scoreAfter = groups.reduce((sum, g) => sum + groupCohesion(g.pokemon), 0);

  return { groups, scoreBefore, scoreAfter };
}

/**
 * Search/filter Pokemon list.
 */
export function filterPokemon(allPokemon, { query, idealHabitat, favorite }) {
  let results = allPokemon;

  if (query) {
    const q = query.toLowerCase();
    results = results.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        String(p.number).includes(q)
    );
  }

  if (idealHabitat) {
    results = results.filter((p) => p.idealHabitat === idealHabitat);
  }

  if (favorite) {
    results = results.filter((p) => p.favorites.includes(favorite));
  }

  return results;
}
