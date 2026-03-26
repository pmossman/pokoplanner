import { useMemo } from 'react';
import { favoriteCounts, suggestSplit, suggestHabitatTypeSplit } from '../utils/pokemonUtils';
import { getHabitatTheme, getDominantHabitat } from '../utils/themeColors';
import { computePokemonWarnings, computeFavoriteTiers } from '../utils/habitatHelpers';

/**
 * Hook that computes all analysis data for a habitat's pokemon group.
 * Shared between HabitatBuilder and LocationView.
 */
export function useHabitatAnalysis(habitatPokemon) {
  const favCounts = useMemo(
    () => favoriteCounts(habitatPokemon),
    [habitatPokemon]
  );

  const { topFavorites, midFavorites } = useMemo(
    () => computeFavoriteTiers(favCounts, habitatPokemon.length),
    [favCounts, habitatPokemon.length]
  );

  const habitatTheme = useMemo(
    () => getHabitatTheme(habitatPokemon),
    [habitatPokemon]
  );

  const dominantHabitat = useMemo(
    () => getDominantHabitat(habitatPokemon),
    [habitatPokemon]
  );

  const pokemonWarnings = useMemo(
    () => computePokemonWarnings(habitatPokemon, dominantHabitat),
    [habitatPokemon, dominantHabitat]
  );

  const splitResult = useMemo(
    () => suggestSplit(habitatPokemon),
    [habitatPokemon]
  );

  const habitatTypeSplit = useMemo(
    () => suggestHabitatTypeSplit(habitatPokemon),
    [habitatPokemon]
  );

  const showHabitatTypeSplit = !!habitatTypeSplit;
  const showFavoriteSplit = splitResult && (
    !habitatTypeSplit || splitResult.scoreAfter > habitatTypeSplit.scoreAfter
  );

  const splitFavCountsA = useMemo(
    () => (splitResult ? favoriteCounts(splitResult.groupA) : []),
    [splitResult]
  );
  const splitFavCountsB = useMemo(
    () => (splitResult ? favoriteCounts(splitResult.groupB) : []),
    [splitResult]
  );

  return {
    favCounts,
    topFavorites,
    midFavorites,
    habitatTheme,
    dominantHabitat,
    pokemonWarnings,
    splitResult,
    habitatTypeSplit,
    showHabitatTypeSplit,
    showFavoriteSplit,
    splitFavCountsA,
    splitFavCountsB,
  };
}
