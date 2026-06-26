import httpx
import numpy as np
from datetime import datetime, timedelta
from crewai.tools import tool

MONTHLY_MMM = {
    1: 28.9, 2: 29.1, 3: 28.3, 4: 27.0, 5: 25.5,
    6: 24.3, 7: 23.7, 8: 23.5, 9: 24.1, 10: 25.2,
    11: 26.7, 12: 27.9,
}

@tool("GBR Ocean Conditions Tool")
def fetch_noaa_conditions(lat: float = -18.0, lon: float = 147.0) -> dict:
    """
    Fetch current Great Barrier Reef ocean conditions including
    sea surface temperature, degree heating weeks, and bleaching alert level.
    """
    try:
        end = datetime.utcnow().date()
        start = end - timedelta(days=14)
        url = (
            "https://marine-api.open-meteo.com/v1/marine"
            f"?latitude={lat}&longitude={lon}"
            f"&hourly=sea_surface_temperature"
            f"&start_date={start}&end_date={end}"
            "&timezone=UTC"
        )
        resp = httpx.get(url, timeout=15)
        resp.raise_for_status()
        data = resp.json()

        temps = [t for t in data["hourly"]["sea_surface_temperature"] if t is not None]
        sst = round(sum(temps) / len(temps), 2) if temps else None

        if sst is None:
            raise ValueError("No SST data")

        month = datetime.utcnow().month
        mmm = MONTHLY_MMM.get(month, 27.0)
        anomaly = round(sst - mmm, 2)
        dhw = round(max(0, anomaly * 2), 2)

        if dhw >= 8:
            alert = 2
        elif dhw >= 4:
            alert = 1
        elif anomaly > 1:
            alert = 0
        else:
            alert = 0

        return {
            "sst": sst,
            "anomaly": anomaly,
            "dhw": dhw,
            "alert_level": alert,
            "source": "Open-Meteo Marine API",
        }

    except Exception as e:
        month = datetime.utcnow().month
        mmm = MONTHLY_MMM.get(month, 27.0)
        rng = np.random.default_rng(int(datetime.utcnow().strftime("%Y%j")))
        sst = round(float(mmm + rng.normal(0, 0.5)), 2)
        return {
            "sst": sst,
            "anomaly": round(sst - mmm, 2),
            "dhw": 0.0,
            "alert_level": 0,
            "source": "synthetic-fallback",
            "error": str(e),
        }