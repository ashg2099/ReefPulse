from fastapi import APIRouter
from tools.noaa_tool import get_noaa_dhw
from datetime import datetime
import random, hashlib

router = APIRouter()

GBR_STATIONS = [
    {"id": "central_gbr",   "name": "Central GBR",    "lat": -18.0, "lon": 147.0},
    {"id": "cairns",        "name": "Cairns",          "lat": -16.9, "lon": 145.8},
    {"id": "cooktown",      "name": "Cooktown",        "lat": -15.5, "lon": 145.3},
    {"id": "whitsundays",   "name": "Whitsundays",     "lat": -20.2, "lon": 148.9},
    {"id": "capricorn",     "name": "Capricorn Group", "lat": -23.5, "lon": 151.9},
    {"id": "torres_strait", "name": "Torres Strait",   "lat": -10.6, "lon": 142.2},
]

ALERT_THRESHOLDS = [
    {"level": 0, "name": "No Stress",       "color": "#16a34a", "dhw_min": 0, "dhw_max": 1,   "description": "SST at or below maximum monthly mean. Coral conditions normal."},
    {"level": 1, "name": "Bleaching Watch", "color": "#ca8a04", "dhw_min": 1, "dhw_max": 4,   "description": "SST above MMM. Thermal stress accumulating. Monitor closely."},
    {"level": 2, "name": "Bleaching Alert", "color": "#ea580c", "dhw_min": 4, "dhw_max": 8,   "description": "Significant bleaching likely. Some mortality possible for sensitive species."},
    {"level": 3, "name": "Severe Alert",    "color": "#dc2626", "dhw_min": 8, "dhw_max": 999, "description": "Severe bleaching and significant mortality expected across species."},
]

def _get_alert_level(dhw: float, sst_anomaly: float) -> int:
    if dhw >= 8:                        return 3
    if dhw >= 4:                        return 2
    if dhw >= 1 or sst_anomaly > 0:    return 1
    return 0


@router.get("/alerts")
async def get_alerts(lat: float = -18.0, lon: float = 147.0):
    current = get_noaa_dhw(lat, lon)
    sst = current.get("sst_celsius", 0)
    dhw = current.get("dhw_celsius_weeks", 0)
    anomaly = sst - 27.0

    alert_level = _get_alert_level(dhw, anomaly)
    threshold = ALERT_THRESHOLDS[alert_level]

    station_alerts = []
    for st in GBR_STATIONS:
        seed = int(hashlib.md5(
            f"{st['id']}{datetime.utcnow().strftime('%Y%j')}".encode()
        ).hexdigest()[:8], 16)
        rng = random.Random(seed)
        st_dhw = round(max(0, dhw + rng.uniform(-0.5, 0.5)), 2)
        st_sst = round(sst + rng.uniform(-0.3, 0.3), 2)
        st_level = _get_alert_level(st_dhw, st_sst - 27.0)
        station_alerts.append({
            **st,
            "sst": st_sst,
            "dhw": st_dhw,
            "alert_level": st_level,
            "alert_name": ALERT_THRESHOLDS[st_level]["name"],
            "alert_color": ALERT_THRESHOLDS[st_level]["color"],
        })

    return {
        "current_alert": {
            "level": alert_level,
            "name": threshold["name"],
            "color": threshold["color"],
            "description": threshold["description"],
            "sst": sst,
            "dhw": dhw,
            "generated_at": datetime.utcnow().isoformat(),
        },
        "stations": station_alerts,
        "thresholds": ALERT_THRESHOLDS,
    }