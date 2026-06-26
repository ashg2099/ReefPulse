import requests
import json

def get_marine_conditions(lat=-18.0, lon=147.0):
    """
    Fetch marine/wave conditions from Open-Meteo Marine API.
    Free, no API key required.
    """
    url = "https://marine-api.open-meteo.com/v1/marine"
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "wave_height,wave_direction,wave_period,wind_wave_height,swell_wave_height",
        "timezone": "Australia/Brisbane"
    }

    response = requests.get(url, params=params, timeout=30)
    print("Status:", response.status_code)

    if response.status_code != 200:
        return {"error": f"Failed with status {response.status_code}"}

    data = response.json()
    current = data.get("current", {})

    return {
        "timestamp": current.get("time"),
        "latitude": lat,
        "longitude": lon,
        "wave_height_m": current.get("wave_height"),
        "wave_direction_deg": current.get("wave_direction"),
        "wave_period_s": current.get("wave_period"),
        "wind_wave_height_m": current.get("wind_wave_height"),
        "swell_wave_height_m": current.get("swell_wave_height"),
        "source": "Open-Meteo Marine API"
    }

if __name__ == "__main__":
    result = get_marine_conditions()
    print(json.dumps(result, indent=2))