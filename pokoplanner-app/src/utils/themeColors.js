/**
 * Color mappings for favorites and habitat types.
 * Each favorite gets a color that evokes its theme.
 * Each habitat type gets a primary color and a background gradient.
 */

export const FAVORITE_COLORS = {
  // Water / Ocean
  'Lots of water':   { bg: '#d0e8f8', text: '#1a5a8a', border: '#90c4e4' },
  'Ocean vibes':     { bg: '#b8daf0', text: '#1a4a7a', border: '#80b8d8' },

  // Fire / Warm
  'Lots of fire':    { bg: '#fce0d0', text: '#a03010', border: '#f0a880' },

  // Nature / Plants
  'Lots of nature':  { bg: '#d4f0c4', text: '#2a6a1a', border: '#a0d48e' },
  'Pretty flowers':  { bg: '#f4d0e8', text: '#8a2060', border: '#e0a0c8' },
  'Lots of dirt':    { bg: '#e4d4c0', text: '#6a4a20', border: '#c8b090' },
  'Wooden stuff':    { bg: '#e8d8c0', text: '#6a4820', border: '#c8b490' },

  // Metal / Stone / Hard
  'Metal stuff':     { bg: '#dce0e4', text: '#4a5060', border: '#b0b8c4' },
  'Stone stuff':     { bg: '#d8d4d0', text: '#5a5048', border: '#b8b0a8' },
  'Hard stuff':      { bg: '#d4d0cc', text: '#5a5450', border: '#b0a8a0' },
  'Sharp stuff':     { bg: '#e0d8d4', text: '#6a4840', border: '#c0a898' },

  // Shiny / Glass / Luxury
  'Shiny stuff':     { bg: '#fef4c8', text: '#8a7010', border: '#f0d860' },
  'Glass stuff':     { bg: '#d8ecf4', text: '#2a5a7a', border: '#a0d0e8' },
  'Luxury':          { bg: '#f0e0f4', text: '#6a2a7a', border: '#d0a8e0' },

  // Cute / Soft / Fabric
  'Cute stuff':      { bg: '#fce0e8', text: '#a03050', border: '#f0a0b8' },
  'Soft stuff':      { bg: '#f4e8f0', text: '#7a4a6a', border: '#d8c0d0' },
  'Fabric':          { bg: '#e8dce8', text: '#6a4a6a', border: '#c8b0c8' },

  // Round / Wobbly / Spinning
  'Round stuff':     { bg: '#fce8d0', text: '#8a5a20', border: '#f0c888' },
  'Wobbly stuff':    { bg: '#e0f0e4', text: '#3a6a40', border: '#a8d4b0' },
  'Spinning stuff':  { bg: '#d8e4f4', text: '#3a4a7a', border: '#a0b8e0' },

  // Construction / Blocky / Containers
  'Construction':    { bg: '#f0dcc0', text: '#7a5020', border: '#d8b880' },
  'Blocky stuff':    { bg: '#e4dcd0', text: '#6a5a40', border: '#c4b8a0' },
  'Containers':      { bg: '#dce0d4', text: '#4a5a3a', border: '#b0b8a0' },

  // Tech / Complicated / Electronics
  'Electronics':     { bg: '#d0e4f0', text: '#2a4a6a', border: '#90b8d4' },
  'Complicated stuff': { bg: '#d8dce8', text: '#4a4a6a', border: '#a8b0c8' },

  // Social / Group
  'Group activities': { bg: '#fce4c8', text: '#8a5a10', border: '#f0c480' },
  'Gatherings':      { bg: '#f8e0c8', text: '#7a5020', border: '#e8c090' },
  'Play spaces':     { bg: '#d8f0e0', text: '#2a6a3a', border: '#a0d8b0' },

  // Spooky / Dark / Strange
  'Spooky stuff':    { bg: '#dcd0e8', text: '#4a2a6a', border: '#b8a0d0' },
  'Strange stuff':   { bg: '#d8d0e0', text: '#5a3a6a', border: '#b0a0c0' },

  // Clean / Healing
  'Cleanliness':     { bg: '#d0f0f4', text: '#1a6a7a', border: '#90d4e0' },
  'Healing':         { bg: '#d0f4e0', text: '#1a6a3a', border: '#90d8b0' },

  // Air / Weather
  'Nice breezes':    { bg: '#d8eef8', text: '#2a5a8a', border: '#a0d0e8' },

  // Food
  'Looks like food': { bg: '#fce8d4', text: '#8a5420', border: '#f0c890' },

  // Noise
  'Noisy stuff':     { bg: '#f0e0d0', text: '#7a5830', border: '#d8c0a0' },

  // Misc
  'Colorful stuff':  { bg: '#f0e4f8', text: '#6a3a8a', border: '#d0b0e0' },
  'Exercise':        { bg: '#d4e8d0', text: '#3a6a2a', border: '#a0c890' },
  'Rides':           { bg: '#e0e0f0', text: '#4a4a7a', border: '#b0b0d0' },
  'Symbols':         { bg: '#e8e0d4', text: '#6a5a30', border: '#c8b890' },
  'Letters and words': { bg: '#e4e0e8', text: '#5a4a6a', border: '#c0b0c8' },
  'Watching stuff':  { bg: '#d8e8e0', text: '#3a5a4a', border: '#a0c8b0' },
  'Slender objects': { bg: '#e0e4dc', text: '#4a5a3a', border: '#b8c0a8' },
  'Garbage':         { bg: '#dcd8d0', text: '#5a5440', border: '#b8b0a0' },
  'None':            { bg: '#e8e8e8', text: '#6a6a6a', border: '#c0c0c0' },
};

export const HABITAT_COLORS = {
  Bright: { color: '#e8b830', bg: '#fef8e0', gradient: 'linear-gradient(135deg, #fef8e0 0%, #fce8a0 100%)' },
  Warm:   { color: '#d94040', bg: '#fce8e4', gradient: 'linear-gradient(135deg, #fce8e4 0%, #f0c0b0 100%)' },
  Cool:   { color: '#3a8fd4', bg: '#e0f0fc', gradient: 'linear-gradient(135deg, #e0f0fc 0%, #b0d8f0 100%)' },
  Dark:   { color: '#7a52b0', bg: '#ede0f4', gradient: 'linear-gradient(135deg, #ede0f4 0%, #d0b8e4 100%)' },
  Humid:  { color: '#2e9464', bg: '#d8f4e8', gradient: 'linear-gradient(135deg, #d8f4e8 0%, #a8e0c4 100%)' },
  Dry:    { color: '#b89040', bg: '#f4ecd4', gradient: 'linear-gradient(135deg, #f4ecd4 0%, #e0d0a8 100%)' },
};

/** Get the badge color for a habitat type */
export function getHabitatBadgeColor(type) {
  return HABITAT_COLORS[type]?.color || '#888';
}

/** Get the favorite tag style */
export function getFavoriteStyle(favorite) {
  return FAVORITE_COLORS[favorite] || { bg: '#e8e8e8', text: '#6a6a6a', border: '#c0c0c0' };
}

/**
 * Parse a hex color to [r, g, b].
 */
function parseHex(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

/**
 * Convert [r, g, b] to hex string.
 */
function toHex([r, g, b]) {
  return '#' + [r, g, b].map(v => Math.round(Math.min(255, Math.max(0, v)))
    .toString(16).padStart(2, '0')).join('');
}

/**
 * Blend multiple colors with weights. Returns [r, g, b].
 */
function blendColors(colorWeights) {
  let totalWeight = 0;
  let r = 0, g = 0, b = 0;
  for (const { color, weight } of colorWeights) {
    const [cr, cg, cb] = parseHex(color);
    r += cr * weight;
    g += cg * weight;
    b += cb * weight;
    totalWeight += weight;
  }
  if (totalWeight === 0) return [240, 240, 236];
  return [r / totalWeight, g / totalWeight, b / totalWeight];
}

/**
 * Lighten a color toward white by a factor (0 = original, 1 = white).
 */
function lighten([r, g, b], factor) {
  return [
    r + (255 - r) * factor,
    g + (255 - g) * factor,
    b + (255 - b) * factor,
  ];
}

/**
 * Determine the habitat theme from a group of pokemon.
 *
 * The background is driven by the favorite composition — the top favorites
 * by count are blended together weighted by frequency, then mixed with the
 * dominant habitat type color at a lower weight. This means two habitats
 * of the same type will look different based on their favorite makeup:
 * a water-favorite-heavy Humid habitat gets a blue background, while a
 * nature-favorite-heavy one gets green.
 *
 * Returns { habitatType, gradient, accentColor }.
 */
export function getHabitatTheme(pokemonList) {
  if (!pokemonList || pokemonList.length === 0) {
    return {
      habitatType: null,
      gradient: 'linear-gradient(135deg, #f5f7f0 0%, #eef2e6 100%)',
      accentColor: '#b4da4b',
    };
  }

  // Find dominant habitat type
  const habitatCounts = {};
  for (const p of pokemonList) {
    habitatCounts[p.idealHabitat] = (habitatCounts[p.idealHabitat] || 0) + 1;
  }
  const dominantHabitat = Object.entries(habitatCounts)
    .sort((a, b) => b[1] - a[1])[0][0];
  const habitatTheme = HABITAT_COLORS[dominantHabitat];

  // Count favorites across the group
  const favCounts = {};
  for (const p of pokemonList) {
    for (const f of p.favorites) {
      favCounts[f] = (favCounts[f] || 0) + 1;
    }
  }

  // Take top favorites by count — these define the visual identity
  const topFavs = Object.entries(favCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Build weighted color list from favorite border colors (most saturated)
  // Favorites contribute 75% of the blend, habitat type 25%
  const colorWeights = topFavs.map(([fav, count]) => ({
    color: getFavoriteStyle(fav).border,
    weight: count,
  }));

  const totalFavWeight = colorWeights.reduce((sum, c) => sum + c.weight, 0);

  // Add habitat type color at 25% relative weight
  colorWeights.push({
    color: habitatTheme.color,
    weight: totalFavWeight * 0.33,
  });

  // Blend to get the core color
  const coreColor = blendColors(colorWeights);

  // Create gradient: very light version → slightly less light version
  const lightColor = lighten(coreColor, 0.82);
  const medColor = lighten(coreColor, 0.65);

  return {
    habitatType: dominantHabitat,
    gradient: `linear-gradient(135deg, ${toHex(lightColor)} 0%, ${toHex(medColor)} 100%)`,
    accentColor: habitatTheme.color,
  };
}
