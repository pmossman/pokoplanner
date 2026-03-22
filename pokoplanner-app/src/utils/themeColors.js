import { TbSun, TbFlame, TbSnowflake, TbMoon, TbDroplet, TbCactus } from 'react-icons/tb';

/**
 * Color mappings for favorites and habitat types.
 * Each favorite gets a color that evokes its theme.
 * Each habitat type gets a primary color and a background gradient.
 */

export const FAVORITE_COLORS = {
  // ── Elemental (vivid — these drive habitat color identity) ──

  // Water
  'Lots of water':   { bg: '#d0e8f8', text: '#1a5a8a', border: '#90c4e4' },
  'Ocean vibes':     { bg: '#b8daf0', text: '#1a4a7a', border: '#80b8d8' },
  'Cleanliness':     { bg: '#d0f0f4', text: '#1a6a7a', border: '#90d4e0' },

  // Fire
  'Lots of fire':    { bg: '#fce0d0', text: '#a03010', border: '#f0a880' },

  // Nature
  'Lots of nature':  { bg: '#d4f0c4', text: '#2a6a1a', border: '#a0d48e' },
  'Pretty flowers':  { bg: '#f4d0e8', text: '#8a2060', border: '#e0a0c8' },
  'Lots of dirt':    { bg: '#e4d4c0', text: '#6a4a20', border: '#c8b090' },

  // Electric / Tech
  'Electronics':     { bg: '#d0e4f0', text: '#2a4a6a', border: '#90b8d4' },

  // Dark / Spooky
  'Spooky stuff':    { bg: '#dcd0e8', text: '#4a2a6a', border: '#b8a0d0' },
  'Strange stuff':   { bg: '#d8d0e0', text: '#5a3a6a', border: '#b0a0c0' },

  // Wind / Sky
  'Nice breezes':    { bg: '#d8eef8', text: '#2a5a8a', border: '#a0d0e8' },

  // Healing
  'Healing':         { bg: '#d0f4e0', text: '#1a6a3a', border: '#90d8b0' },

  // ── Non-elemental (muted — readable as tags but won't dominate blending) ──

  // Material (warm grays / taupes)
  'Wooden stuff':    { bg: '#eae6e0', text: '#6a5a48', border: '#c8bfb0' },
  'Metal stuff':     { bg: '#e4e4e4', text: '#5a5a5a', border: '#b8b8b8' },
  'Stone stuff':     { bg: '#e4e0dc', text: '#5a5450', border: '#c0b8b0' },
  'Hard stuff':      { bg: '#e4e0dc', text: '#5a5450', border: '#bfb8b0' },
  'Sharp stuff':     { bg: '#e8e0dc', text: '#6a5850', border: '#c4b8b0' },
  'Glass stuff':     { bg: '#e4e8ec', text: '#4a5460', border: '#b4bcc4' },

  // Shiny / Luxury (subtle warm)
  'Shiny stuff':     { bg: '#f0ecdc', text: '#7a6a30', border: '#d4c888' },
  'Luxury':          { bg: '#ece4ec', text: '#6a5068', border: '#c8b8c4' },
  'Colorful stuff':  { bg: '#ece4ec', text: '#6a5068', border: '#c8b4c8' },

  // Soft / Cute / Fabric (subtle pink-gray)
  'Cute stuff':      { bg: '#f0e4e8', text: '#7a4a58', border: '#d4b0bc' },
  'Soft stuff':      { bg: '#ece4e8', text: '#6a5460', border: '#ccbcc4' },
  'Fabric':          { bg: '#e8e0e4', text: '#645460', border: '#c4b4bc' },

  // Shape / Physics (neutral)
  'Round stuff':     { bg: '#ece8e0', text: '#6a5a40', border: '#ccc0a8' },
  'Wobbly stuff':    { bg: '#e4e8e4', text: '#4a5848', border: '#b8c0b4' },
  'Spinning stuff':  { bg: '#e0e4e8', text: '#4a5060', border: '#b0b8c4' },
  'Slender objects': { bg: '#e4e4e0', text: '#585848', border: '#c0c0b4' },

  // Building (warm neutral)
  'Construction':    { bg: '#ece4d8', text: '#6a5838', border: '#ccbc9c' },
  'Blocky stuff':    { bg: '#e8e0d8', text: '#605848', border: '#c4b8a8' },
  'Containers':      { bg: '#e4e4e0', text: '#545848', border: '#b8bcb0' },

  // Social / Activity (warm neutral)
  'Group activities': { bg: '#ece8dc', text: '#6a5a30', border: '#ccc4a0' },
  'Gatherings':      { bg: '#ece4dc', text: '#6a5838', border: '#ccc098' },
  'Play spaces':     { bg: '#e4e8e0', text: '#485840', border: '#b4c0a8' },
  'Exercise':        { bg: '#e4e4dc', text: '#585838', border: '#c0c0a4' },

  // Misc (neutral)
  'Complicated stuff': { bg: '#e4e4e8', text: '#545460', border: '#b4b4c0' },
  'Noisy stuff':     { bg: '#ece8e0', text: '#6a5840', border: '#ccc0a8' },
  'Looks like food': { bg: '#ece4dc', text: '#6a5438', border: '#ccbc9c' },
  'Rides':           { bg: '#e4e4e8', text: '#545460', border: '#b4b4c0' },
  'Symbols':         { bg: '#e8e4dc', text: '#605838', border: '#c4bc9c' },
  'Letters and words': { bg: '#e4e4e8', text: '#54546a', border: '#b8b4c4' },
  'Watching stuff':  { bg: '#e4e8e4', text: '#485448', border: '#b4c0b0' },
  'Garbage':         { bg: '#e4e0dc', text: '#585450', border: '#bcb8b0' },
  'Musical stuff':   { bg: '#e8e4ec', text: '#585060', border: '#c0b8c8' },
  'Fun stuff':       { bg: '#ece8dc', text: '#6a5a30', border: '#ccc4a0' },
  'None':            { bg: '#e8e8e8', text: '#6a6a6a', border: '#c0c0c0' },
};

// Favorites that have strong elemental color identity — these dominate circle blending
const ELEMENTAL_FAVORITES = new Set([
  'Lots of water', 'Ocean vibes', 'Cleanliness',
  'Lots of fire',
  'Lots of nature', 'Pretty flowers', 'Lots of dirt',
  'Electronics',
  'Spooky stuff', 'Strange stuff',
  'Nice breezes',
  'Healing',
]);

export const HABITAT_COLORS = {
  Bright: { color: '#e0c040', bg: '#fdf8dc', gradient: 'linear-gradient(135deg, #fefae4 0%, #f4e8a0 100%)' },
  Warm:   { color: '#d48830', bg: '#fcecd4', gradient: 'linear-gradient(135deg, #fcecd4 0%, #f0c890 100%)' },
  Cool:   { color: '#3a8fd4', bg: '#d8ecfc', gradient: 'linear-gradient(135deg, #d8ecfc 0%, #a8d0f0 100%)' },
  Dark:   { color: '#6048a0', bg: '#e0d4f0', gradient: 'linear-gradient(135deg, #e4d8f4 0%, #c0a4e0 100%)' },
  Humid:  { color: '#2e9464', bg: '#d0f0e4', gradient: 'linear-gradient(135deg, #d0f0e4 0%, #98d8b8 100%)' },
  Dry:    { color: '#b89040', bg: '#f0e8c8', gradient: 'linear-gradient(135deg, #f0e8c8 0%, #d8c890 100%)' },
};

/** Icon components for each habitat type */
export const HABITAT_ICONS = {
  Bright: TbSun,
  Warm:   TbFlame,
  Cool:   TbSnowflake,
  Dark:   TbMoon,
  Humid:  TbDroplet,
  Dry:    TbCactus,
};

/** Get the icon component for a habitat type */
export function getHabitatIcon(type) {
  return HABITAT_ICONS[type] || null;
}

/** Get the badge color for a habitat type */
export function getHabitatBadgeColor(type) {
  return HABITAT_COLORS[type]?.color || '#888';
}

/** Get the full habitat info (color, Icon component, label) */
export function getHabitatInfo(type) {
  const colors = HABITAT_COLORS[type] || { color: '#888', bg: '#f0f0f0', gradient: '' };
  return {
    ...colors,
    Icon: HABITAT_ICONS[type] || null,
    label: type || 'Unknown',
  };
}

/** Render a habitat type icon inline. Usage: <HabitatTypeIcon type="Bright" /> */
export function HabitatTypeIcon({ type, size = 14 }) {
  const Icon = HABITAT_ICONS[type];
  if (!Icon) return null;
  return <Icon size={size} style={{ verticalAlign: '-2px' }} />;
}

/**
 * Get the dominant habitat type from a list of Pokemon.
 * Returns { type, count, total, tied } or null if empty.
 */
export function getDominantHabitat(pokemonList) {
  if (!pokemonList || pokemonList.length === 0) return null;
  const counts = {};
  for (const p of pokemonList) {
    counts[p.idealHabitat] = (counts[p.idealHabitat] || 0) + 1;
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const topCount = sorted[0][1];
  const tied = sorted.filter(([, c]) => c === topCount);
  return {
    type: sorted[0][0],
    count: topCount,
    total: pokemonList.length,
    all: sorted.map(([type, count]) => ({ type, count })),
    tied: tied.length > 1 ? tied.map(([type]) => type) : null,
  };
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
 * Two separate color systems:
 * - Background: driven by ideal habitat type (or blended if tied/mixed)
 * - Circle: driven by top favorite colors as a gradient
 *
 * Returns { habitatType, bgGradient, circleGradient, accentColor }.
 */
export function getHabitatTheme(pokemonList) {
  if (!pokemonList || pokemonList.length === 0) {
    return {
      habitatType: null,
      bgGradient: 'linear-gradient(135deg, #f8f8f6 0%, #f0f0ee 100%)',
      circleGradient: 'linear-gradient(135deg, #e8e8e6, #ddddd8)',
      accentColor: '#aaa',
    };
  }

  // --- Background: ideal habitat type ---
  const habitatCounts = {};
  for (const p of pokemonList) {
    habitatCounts[p.idealHabitat] = (habitatCounts[p.idealHabitat] || 0) + 1;
  }
  const sorted = Object.entries(habitatCounts).sort((a, b) => b[1] - a[1]);
  const topCount = sorted[0][1];
  const topHabitats = sorted.filter(([, c]) => c === topCount);

  let bgGradient;
  let accentColor;
  if (topHabitats.length === 1) {
    // Single dominant habitat — use its gradient
    const theme = HABITAT_COLORS[topHabitats[0][0]];
    bgGradient = theme.gradient;
    accentColor = theme.color;
  } else {
    // Tied — gradient transitions between each habitat type's color
    const colors = topHabitats.map(([type]) => HABITAT_COLORS[type]);
    const stops = colors.map((c, i) => {
      const pct = (i / (colors.length - 1)) * 100;
      return `${toHex(lighten(parseHex(c.color), 0.65))} ${pct}%`;
    });
    bgGradient = `linear-gradient(135deg, ${stops.join(', ')})`;
    accentColor = colors[0].color;
  }

  // --- Circle: driven by elemental favorites only (fall back to all if none) ---
  const favCounts = {};
  for (const p of pokemonList) {
    for (const f of p.favorites) {
      favCounts[f] = (favCounts[f] || 0) + 1;
    }
  }
  const allFavsSorted = Object.entries(favCounts)
    .sort((a, b) => b[1] - a[1]);

  // Top 2 favorites drive the circle gradient
  const circleFavs = allFavsSorted.slice(0, 2);

  let circleGradient;
  if (circleFavs.length === 1) {
    const c = getFavoriteStyle(circleFavs[0][0]).border;
    const light = toHex(lighten(parseHex(c), 0.35));
    const med = toHex(lighten(parseHex(c), 0.1));
    circleGradient = `linear-gradient(135deg, ${light}, ${med})`;
  } else {
    const stops = circleFavs.map(([fav, count], i) => {
      const c = getFavoriteStyle(fav).border;
      const lightened = toHex(lighten(parseHex(c), 0.25));
      const pct = (i / (circleFavs.length - 1)) * 100;
      return `${lightened} ${pct}%`;
    });
    circleGradient = `linear-gradient(135deg, ${stops.join(', ')})`;
  }

  return {
    habitatType: sorted[0][0],
    bgGradient,
    circleGradient,
    accentColor,
  };
}
