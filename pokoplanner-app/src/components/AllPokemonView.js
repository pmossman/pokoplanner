import { useState, useMemo } from 'react';
import { usePokemonData } from '../contexts/PokemonDataContext';
import { getLocationInfo } from '../utils/themeColors';

const SHORT_LOCATION = {
  'Withered Wastelands': 'Withered',
  'Sparkling Skylands': 'Skylands',
  'Rocky Ridges': 'Ridges',
  'Bleak Beach': 'Beach',
  'Palette Town': 'Palette',
};

function AllPokemonView({
  getPokemonLocation,
  ownedPokemon,
  toggleOwned,
  onMovePokemon,
  habitats,
  onRemoveFromHabitat,
  onDeleteHabitat,
}) {
  const { allPokemon, allSpecialties, selectPokemon } = usePokemonData();
  const [search, setSearch] = useState('');
  const [filterHabitat, setFilterHabitat] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('');

  // Build a reverse lookup: pokemon ID → habitat
  const pokemonToHabitat = useMemo(() => {
    const map = {};
    for (const h of habitats) {
      for (const p of h.pokemon) {
        map[p.id] = h;
      }
    }
    return map;
  }, [habitats]);

  const filteredPokemon = useMemo(() => {
    let list = allPokemon;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        String(p.number).includes(q)
      );
    }
    if (filterHabitat) {
      list = list.filter((p) => p.idealHabitat === filterHabitat);
    }
    if (filterSpecialty) {
      list = list.filter((p) => p.specialties && p.specialties.includes(filterSpecialty));
    }
    if (filterLocation) {
      if (filterLocation === '__unregistered__') {
        list = list.filter((p) => !ownedPokemon.has(p.id));
      } else if (filterLocation === '__registered__') {
        list = list.filter((p) => ownedPokemon.has(p.id));
      } else {
        list = list.filter((p) => ownedPokemon.has(p.id) && getPokemonLocation(p.id) === filterLocation);
      }
    }
    return list;
  }, [allPokemon, search, filterHabitat, filterSpecialty, filterLocation, ownedPokemon, getPokemonLocation]);

  const registeredCount = allPokemon.filter((p) => ownedPokemon.has(p.id)).length;

  const handleDragStart = (e, pokemon) => {
    e.dataTransfer.setData('text/pokemon-id', pokemon.id);
    const hab = pokemonToHabitat[pokemon.id];
    if (hab) {
      e.dataTransfer.setData('text/source-habitat-id', hab.id);
    }
    e.dataTransfer.effectAllowed = 'move';
  };

  const LOCATIONS = [
    'Withered Wastelands',
    'Palette Town',
    'Bleak Beach',
    'Rocky Ridges',
    'Sparkling Skylands',
  ];

  return (
    <div className="all-pokemon-view">
      <div className="all-pokemon-header">
        <h2>My Pokédex</h2>
        <span className="all-pokemon-count">{registeredCount}/{allPokemon.length} registered</span>
      </div>

      <div className="all-pokemon-filters">
        <input
          type="text"
          className="all-pokemon-search"
          placeholder="Search by name or number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="all-pokemon-select"
          value={filterHabitat}
          onChange={(e) => setFilterHabitat(e.target.value)}
        >
          <option value="">All Habitats</option>
          <option value="Bright">Bright</option>
          <option value="Warm">Warm</option>
          <option value="Cool">Cool</option>
          <option value="Dark">Dark</option>
          <option value="Humid">Humid</option>
          <option value="Dry">Dry</option>
        </select>
        <select
          className="all-pokemon-select"
          value={filterSpecialty}
          onChange={(e) => setFilterSpecialty(e.target.value)}
        >
          <option value="">All Specialties</option>
          {(allSpecialties || []).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          className="all-pokemon-select"
          value={filterLocation}
          onChange={(e) => setFilterLocation(e.target.value)}
        >
          <option value="">All</option>
          <option value="__registered__">Registered</option>
          <option value="__unregistered__">Unregistered</option>
          {LOCATIONS.map((loc) => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
      </div>

      <div className="all-pokemon-grid">
        {filteredPokemon.map((p) => {
          const isOwned = ownedPokemon.has(p.id);
          const location = isOwned ? getPokemonLocation(p.id) : null;
          const locInfo = location ? getLocationInfo(location) : null;
          const inHabitat = pokemonToHabitat[p.id];

          return (
            <div
              key={p.id}
              className={`all-pokemon-tile ${isOwned ? 'registered' : 'unregistered'}`}
              onClick={() => {
                if (isOwned) selectPokemon(p);
                else toggleOwned(p.id);
              }}
              draggable={isOwned}
              onDragStart={isOwned ? (e) => handleDragStart(e, p) : undefined}
            >
              <div className="all-pokemon-sprite-wrap">
                {p.sprite && (
                  <img
                    className={`all-pokemon-sprite ${isOwned ? '' : 'silhouette'}`}
                    src={p.sprite}
                    alt={p.name}
                  />
                )}
              </div>
              {isOwned && (
                <span className="all-pokemon-name">{p.name}</span>
              )}
              {!isOwned && (
                <span className="all-pokemon-name unregistered">???</span>
              )}
              {isOwned && locInfo && (
                <span
                  className="all-pokemon-location"
                  style={{ color: locInfo.color, backgroundColor: locInfo.bg }}
                >
                  {locInfo.Icon && <locInfo.Icon size={10} />}
                  {SHORT_LOCATION[location] || location}
                </span>
              )}
              {isOwned && inHabitat && (
                <span className="all-pokemon-home-badge">In home</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AllPokemonView;
