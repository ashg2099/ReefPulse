import requests
import json

def get_bom_weather(station_id="IDQ60801", wmo_id="94294"):
    """
    Fetch latest weather observation from BOM.
    Station 94294 = Cairns Airport (closest major station to GBR)
    """
    url = f"http://www.bom.gov.au/fwo/{station_id}/{station_id}.{wmo_id}.json"
    
    headers = {"User-Agent": "ReefPulse/1.0 (reef health monitoring research)"}
    response = requests.get(url, headers=headers, timeout=30)
    print("Status:", response.status_code)

    if response.status_code != 200:
        return {"error": f"Failed with status {response.status_code}"}

    data = response.json()
    obs = data["observations"]["data"][0]  # Most recent observation

    return {
        "timestamp": obs.get("local_date_time_full"),
        "station": obs.get("name"),
        "air_temp_celsius": obs.get("air_temp"),
        "wind_speed_kmh": obs.get("wind_spd_kmh"),
        "wind_direction": obs.get("wind_dir"),
        "humidity_pct": obs.get("rel_hum"),
        "cloud_oktas": obs.get("cloud"),
        "source": "Australian Bureau of Meteorology"
    }

if __name__ == "__main__":
    result = get_bom_weather()
    print(json.dumps(result, indent=2))