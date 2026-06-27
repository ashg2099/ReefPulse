"""
One-time script to build GBR coral species dataset.
Sources:
  1. OBIS API — occurrence records for GBR corals (Order Scleractinia)
  2. CoralTraits — thermal tolerance / bleaching sensitivity traits

Run from backend/:
    python scripts/build_species_dataset.py
"""

import httpx
import csv
import json
import io
from pathlib import Path

OUT = Path(__file__).parent.parent / "data" / "gbr_coral_species.json"

GBR_WKT = "POLYGON((142.531 -24.498,154.025 -24.498,154.025 -10.683,142.531 -10.683,142.531 -24.498))"

MONTHLY_MMM = {
    1: 28.9, 2: 29.1, 3: 28.3, 4: 27.0, 5: 25.5,
    6: 24.3, 7: 23.7, 8: 23.5, 9: 24.1, 10: 25.2,
    11: 26.7, 12: 27.9,
}

# CoralTraits trait IDs we care about
TRAIT_BLEACHING_ID = "bleaching_sensitivity"   # trait name match
TRAIT_THERMAL_ID   = "upper_thermal_limit"


def fetch_obis_species() -> list[dict]:
    """Fetch all Scleractinia species recorded in GBR from OBIS."""
    print("Fetching OBIS species checklist for GBR...")
    url = "https://api.obis.org/v3/checklist"
    params = {
        "taxonid": 1267,   # Scleractinia (stony corals)
        "geometry": GBR_WKT,
        "size": 500,
    }
    r = httpx.get(url, params=params, timeout=60)
    r.raise_for_status()
    data = r.json()
    results = data.get("results", [])
    print(f"  → {len(results)} species from OBIS")
    return results


def fetch_coral_traits() -> dict[str, dict]:
    """Download CoralTraits CSV and index by species name."""
    print("Fetching CoralTraits dataset...")
    url = "https://coraltraits.org/traits.csv"
    r = httpx.get(url, timeout=120, follow_redirects=True)
    r.raise_for_status()
    reader = csv.DictReader(io.StringIO(r.text))
    traits: dict[str, dict] = {}
    for row in reader:
        sp = row.get("specie_name", "").strip()
        trait = row.get("trait_name", "").strip().lower()
        value = row.get("value", "").strip()
        if not sp or not value:
            continue
        if sp not in traits:
            traits[sp] = {}
        if "bleaching" in trait and "sensitivity" in trait:
            traits[sp]["bleaching_sensitivity"] = value
        if "thermal" in trait and "limit" in trait:
            try:
                traits[sp]["upper_thermal_limit"] = float(value)
            except ValueError:
                pass
    print(f"  → {len(traits)} species in CoralTraits")
    return traits


def build_dataset(obis: list[dict]) -> list[dict]:
    FAMILY_SENSITIVITY = {
        "Acroporidae":      {"sensitivity": "high",   "bleach_threshold": 28.5},
        "Pocilloporidae":   {"sensitivity": "high",   "bleach_threshold": 29.0},
        "Poritidae":        {"sensitivity": "low",    "bleach_threshold": 30.5},
        "Merulinidae":      {"sensitivity": "medium", "bleach_threshold": 30.0},
        "Fungiidae":        {"sensitivity": "medium", "bleach_threshold": 29.5},
        "Dendrophylliidae": {"sensitivity": "medium", "bleach_threshold": 29.8},
        "Euphylliidae":     {"sensitivity": "medium", "bleach_threshold": 29.5},
        "Lobophylliidae":   {"sensitivity": "medium", "bleach_threshold": 30.0},
        "Diploastreidae":   {"sensitivity": "low",    "bleach_threshold": 30.5},
        "Agariciidae":      {"sensitivity": "high",   "bleach_threshold": 29.0},
        "Pectiniidae":      {"sensitivity": "medium", "bleach_threshold": 29.8},
        "Caryophylliidae":  {"sensitivity": "low",    "bleach_threshold": 30.2},
        "Faviidae":         {"sensitivity": "medium", "bleach_threshold": 30.0},
        "Mussidae":         {"sensitivity": "medium", "bleach_threshold": 30.0},
    }

    dataset = []
    seen = set()

    for i, sp in enumerate(obis):
        # Only actual species, not phylum/class/order/genus
        rank = sp.get("taxonRank", "").lower()
        if rank not in ("species", ""):
            continue

        name = sp.get("scientificName", "").strip()
        # Must have at least genus + species (two words)
        if not name or len(name.split()) < 2 or name in seen:
            continue
        seen.add(name)

        family = sp.get("family", "Unknown")
        defaults = FAMILY_SENSITIVITY.get(family, {"sensitivity": "medium", "bleach_threshold": 29.5})

        dataset.append({
            "id": i + 1,
            "name": name,
            "common": sp.get("vernacularName") or (name.split()[1].capitalize() + " Coral"),
            "family": family,
            "bleach_threshold": defaults["bleach_threshold"],
            "sensitivity": defaults["sensitivity"],
            "depth": "1-30m",
            "obis_records": sp.get("records", 0),
            "has_trait_data": False,
        })

    dataset.sort(key=lambda x: x["obis_records"], reverse=True)
    return dataset


if __name__ == "__main__":
    obis = fetch_obis_species()
    dataset = build_dataset(obis)
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(json.dumps(dataset, indent=2))
    print(f"\nSaved {len(dataset)} species to {OUT}")
    print("Sample:", json.dumps(dataset[0], indent=2) if dataset else "empty")