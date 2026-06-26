import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tools.noaa_tool import get_noaa_dhw
from tools.marine_tool import get_marine_conditions
from tools.bom_tool import get_bom_weather

def get_reef_snapshot(lat=-18.0, lon=147.0):
    """
    Aggregates all data sources into a single reef health snapshot.
    """
    noaa = get_noaa_dhw(lat, lon)
    marine = get_marine_conditions(lat, lon)
    bom = get_bom_weather()

    return {
        "location": {"latitude": lat, "longitude": lon},
        "thermal_stress": {
            "sst_celsius": noaa.get("sst_celsius"),
            "dhw_celsius_weeks": noaa.get("dhw_celsius_weeks"),
            "bleaching_alert": noaa.get("bleaching_alert"),
            "bleaching_status": noaa.get("bleaching_status"),
        },
        "marine_conditions": {
            "wave_height_m": marine.get("wave_height_m"),
            "swell_wave_height_m": marine.get("swell_wave_height_m"),
            "wave_period_s": marine.get("wave_period_s"),
            "wave_direction_deg": marine.get("wave_direction_deg"),
        },
        "weather": {
            "air_temp_celsius": bom.get("air_temp_celsius"),
            "wind_speed_kmh": bom.get("wind_speed_kmh"),
            "wind_direction": bom.get("wind_direction"),
            "humidity_pct": bom.get("humidity_pct"),
        },
        "data_sources": ["NOAA Coral Reef Watch", "Open-Meteo Marine", "Bureau of Meteorology"]
    }

if __name__ == "__main__":
    import json
    result = get_reef_snapshot()
    print(json.dumps(result, indent=2))