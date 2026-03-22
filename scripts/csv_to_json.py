#!/usr/bin/env python3
"""Convert PokopiaPlanning CSV to our app's JSON format."""

import csv
import json
import os


def convert():
    input_path = "raw_data/Pokopia.csv"
    output_path = "pokoplanner-app/src/data/pokemon.json"

    pokemon_list = []

    with open(input_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            number = int(row["Number"].replace("#", ""))

            # Favorites 1-5 (item/decor categories)
            favorites = []
            for i in range(1, 6):
                fav = row.get(f"Favorite {i}", "").strip()
                if fav:
                    favorites.append(fav)

            # Flavor preference (Favorite 6)
            flavor = row.get("Favorite 6", "").strip()

            # Specialties
            specialties = []
            for i in range(1, 3):
                spec = row.get(f"Specialty {i}", "").strip()
                if spec:
                    specialties.append(spec)

            # Habitats with full detail
            habitats = []
            locations = [
                "Withered Wastelands",
                "Bleak Beach",
                "Rocky Ridges",
                "Sparkling Skylands",
                "Palette Town",
            ]
            for i in range(1, 4):
                hab_name = row.get(f"Habitat {i}", "").strip()
                if not hab_name:
                    continue
                hab = {
                    "name": hab_name,
                    "rarity": row.get(f"Habitat {i} Rarity", "").strip(),
                    "time": row.get(f"Habitat {i} Time", "").strip(),
                    "weather": row.get(f"Habitat {i} Weather", "").strip(),
                    "locations": [
                        loc
                        for loc in locations
                        if row.get(f"Habitat {i} {loc}", "").strip() == "Yes"
                    ],
                }
                habitats.append(hab)

            name = row["Name"].strip()
            # Create a unique ID from the name (dex numbers have duplicates for variant forms)
            uid = name.lower().replace(" ", "-").replace("'", "").replace(".", "")

            pokemon_list.append({
                "id": uid,
                "number": number,
                "name": name,
                "primaryLocation": row["Primary Location"].strip(),
                "idealHabitat": row["Ideal Habitat"].strip(),
                "favorites": favorites,
                "flavor": flavor,
                "specialties": specialties,
                "habitats": habitats,
            })

    pokemon_list.sort(key=lambda p: p["number"])

    all_favorites = sorted(set(f for p in pokemon_list for f in p["favorites"]))
    all_ideal_habitats = sorted(set(p["idealHabitat"] for p in pokemon_list))
    all_specialties = sorted(set(s for p in pokemon_list for s in p["specialties"]))

    output = {
        "pokemon": pokemon_list,
        "allFavorites": all_favorites,
        "allIdealHabitats": all_ideal_habitats,
        "allSpecialties": all_specialties,
    }

    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"Converted {len(pokemon_list)} Pokemon")
    print(f"Unique favorites: {len(all_favorites)}")
    print(f"Unique ideal habitats: {len(all_ideal_habitats)}")
    print(f"Unique specialties: {len(all_specialties)}")
    print(f"Output: {output_path}")


if __name__ == "__main__":
    convert()
