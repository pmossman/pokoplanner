import { useState, useMemo } from 'react';
import { filterPokemon } from '../utils/pokemonUtils';
import PokemonCard from './PokemonCard';
import './PokemonSearch.css';

function PokemonSearch({
  allPokemon,
  allFavorites,
  allIdealHabitats,
  onSelect,
  onAddToHabitat,
  habitatPokemon,
}) {
  const [query, setQuery] = useState('');
  const [idealHabitat, setIdealHabitat] = useState('');
  const [favorite, setFavorite] = useState('');

  const results = useMemo(
    () => filterPokemon(allPokemon, { query, idealHabitat, favorite }),
    [allPokemon, query, idealHabitat, favorite]
  );

  return (
    <div className="pokemon-search">
      <div className="search-controls">
        <input
          type="text"
          placeholder="Search by name or number..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
        />
        <select
          value={idealHabitat}
          onChange={(e) => setIdealHabitat(e.target.value)}
          className="search-select"
        >
          <option value="">All Habitat Types</option>
          {allIdealHabitats.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <select
          value={favorite}
          onChange={(e) => setFavorite(e.target.value)}
          className="search-select"
        >
          <option value="">All Favorites</option>
          {allFavorites.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>

      <p className="result-count">{results.length} Pokemon found</p>

      <div className="pokemon-grid">
        {results.map((pokemon) => (
          <PokemonCard
            key={pokemon.id}
            pokemon={pokemon}
            onClick={() => onSelect(pokemon)}
            onAdd={() => onAddToHabitat(pokemon)}
            inHabitat={habitatPokemon.some((p) => p.id === pokemon.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default PokemonSearch;
