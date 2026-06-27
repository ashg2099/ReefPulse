from fastapi import APIRouter
from tools.erddap import fetch_sst, MONTHLY_CLIMATOLOGY
from datetime import datetime
from pathlib import Path
import json

router = APIRouter()

MONTHLY_MMM = {
    1: 28.9, 2: 29.1, 3: 28.3, 4: 27.0, 5: 25.5,
    6: 24.3, 7: 23.7, 8: 23.5, 9: 24.1, 10: 25.2,
    11: 26.7, 12: 27.9,
}

_DATA_FILE = Path(__file__).parent.parent / "data" / "gbr_coral_species.json"

def _load_species() -> list:
    if _DATA_FILE.exists():
        return json.loads(_DATA_FILE.read_text())
    return []

CORAL_SPECIES = _load_species()


def _assess_risk(sst: float, dhw: float, month: int, species: dict) -> dict:
    threshold = species["bleach_threshold"]
    sst_above = max(0, sst - threshold)
    dhw_ratio = min(dhw / 8.0, 1.0)
    stress_score = round((sst_above / 1.5) * 0.6 + dhw_ratio * 0.4, 3)

    if stress_score >= 0.7:
        level, label = 3, "Severe Stress"
    elif stress_score >= 0.4:
        level, label = 2, "Bleaching Alert"
    elif stress_score >= 0.15:
        level, label = 1, "Watch"
    else:
        level, label = 0, "No Stress"

    return {
        **species,
        "current_sst": sst,
        "sst_above_threshold": round(sst_above, 2),
        "stress_score": stress_score,
        "stress_level": level,
        "stress_label": label,
        "dhw": dhw,
    }


@router.get("/species-risk")
async def get_species_risk(
    lat: float = -18.0,
    lon: float = 147.0,
    current_sst: float = None,
    current_dhw: float = None,
):
    month = datetime.utcnow().month

    if current_sst is None:
        sst_data = await fetch_sst(lat, lon, days=3)
        current_sst = sst_data[-1]["sst"] if sst_data else MONTHLY_MMM.get(month, 27.0)
    if current_dhw is None:
        current_dhw = 0.0

    assessed = [_assess_risk(current_sst, current_dhw, month, sp) for sp in CORAL_SPECIES]
    assessed.sort(key=lambda x: x["stress_score"], reverse=True)

    counts = {0: 0, 1: 0, 2: 0, 3: 0}
    for sp in assessed:
        counts[sp["stress_level"]] += 1

    return {
        "current_sst": current_sst,
        "current_dhw": current_dhw,
        "month": month,
        "species": assessed[:50],
        "summary": {
            "no_stress": counts[0],
            "watch": counts[1],
            "alert": counts[2],
            "severe": counts[3],
            "total": len(assessed),
        }
    }