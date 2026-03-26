import { createContext, useContext } from 'react';

/**
 * Provides static pokemon data, ownership state, and common callbacks
 * to avoid prop drilling through AdventureMode → LocationView and similar chains.
 */
const PokemonDataContext = createContext(null);

export function usePokemonData() {
  const ctx = useContext(PokemonDataContext);
  if (!ctx) throw new Error('usePokemonData must be used within PokemonDataProvider');
  return ctx;
}

export default PokemonDataContext;
