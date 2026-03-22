# Pokoplanner

A companion app for Pokemon Pokopia that helps plan multi-Pokemon habitats by finding Pokemon with overlapping favorites and compatible ideal habitat types.

## Architecture

- **Tech:** React SPA with static JSON data file, no backend
- **Persistence:** localStorage auto-save + JSON export/import for habitat plans
- **Data source:** Bootstrapped from github.com/JEschete/PokopiaPlanning CSV, sprites from PokeAPI
- **Single-page layout:** Habitat builder is the entire app (no tabs/routing)

## Data Model

305 Pokemon in `src/data/pokemon.json`, each with:
- id (unique slug), name, Pokedex number, national dex number
- Ideal Habitat: one of 6 types (Bright, Warm, Cool, Dark, Humid, Dry)
- Favorites: 5 categories from 44 total (e.g. "Lots of fire", "Cute stuff", "Group activities")
- Flavor preference (stored but not surfaced in UI yet)
- Specialty: job they perform (Grow, Burn, Fly, Build, Search, Trade, etc.)
- Habitats, locations, rarity, time, weather
- Sprite URL from PokeAPI

Data pipeline: `scripts/csv_to_json.py` converts raw CSV, `scripts/add_sprites.py` adds sprite URLs.

## Core Features

### Habitat Builder (main view)
- Sidebar with all habitats — create, rename (double-click), delete
- Auto-generated subtitles showing ideal habitat type(s) + top favorites
- Inline search with name input + habitat type + favorite category filter dropdowns
- Browse mode ("Show all") expands search results into a card grid
- Pokemon detail modal on click, showing full info + most compatible Pokemon
- Add Pokemon from search, browse, suggestions, or detail modal

### Compatibility & Analysis
- Favorite overlap bars showing which favorites are most common in the group
- Suggestion engine ranks candidates by weighted favorite overlap (favorites shared by more group members score higher)
- "Same ideal habitat only" filter toggle (on by default)
- Suggested Split: detects when a group would have better internal overlap as two subgroups, with preview and one-click apply

### Persistence
- Auto-save habitat plans to localStorage
- Export/import habitat plans as JSON files (not yet implemented)

## Out of Scope (for now)
- User accounts / cross-device sync
- Flavor preferences in UI
- Habitat construction recipes (which items/furniture to build)
- Item-to-favorites-category database (data exists on Serebii, ~43 category pages to scrape)
- Backend / database
