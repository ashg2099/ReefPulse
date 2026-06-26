"""
SST data via Open-Meteo Marine API (same source as wave/swell — confirmed working).
Falls back to AR(1) synthetic data calibrated to GBR 30-yr climatology.
"""
import httpx
import numpy as np
from datetime import datetime, timedelta

MONTHLY_CLIMATOLOGY = {
    1: 28.9, 2: 29.1, 3: 28.3, 4: 27.0, 5: 25.5,
    6: 24.3, 7: 23.7, 8: 23.5, 9: 24.1, 10: 25.2,
    11: 26.7, 12: 27.9,
}


async def fetch_sst(lat: float, lon: float, days: int = 14) -> list:
    """
    Fetch daily mean SST from Open-Meteo Marine API.
    Uses hourly sea_surface_temperature → daily average.
    Falls back to synthetic AR(1) data if API fails.
    """
    now        = datetime.now()
    end_date   = (now - timedelta(days=1)).strftime("%Y-%m-%d")
    start_date = (now - timedelta(days=days)).strftime("%Y-%m-%d")

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.get(
                "https://marine-api.open-meteo.com/v1/marine",
                params={
                    "latitude":  lat,
                    "longitude": lon,
                    "hourly":    "sea_surface_temperature",
                    "start_date": start_date,
                    "end_date":   end_date,
                },
            )
            data = r.json()

        hourly = data.get("hourly", {})
        times  = hourly.get("time", [])
        ssts   = hourly.get("sea_surface_temperature", [])

        if not times or not ssts:
            raise ValueError("Empty response from Open-Meteo Marine")

        # Aggregate hourly → daily mean
        by_date: dict = {}
        for t, sst in zip(times, ssts):
            if sst is not None:
                by_date.setdefault(t[:10], []).append(float(sst))

        result = []
        for date in sorted(by_date):
            dt   = datetime.strptime(date, "%Y-%m-%d")
            mean = round(float(np.mean(by_date[date])), 2)
            clim = MONTHLY_CLIMATOLOGY[dt.month]
            result.append({
                "date":   date,
                "month":  dt.month,
                "year":   dt.year,
                "sst":    mean,
                "clim":   clim,
                "anom":   round(mean - clim, 2),
                "source": "Open-Meteo Marine",
            })

        print(f"[SST] Open-Meteo Marine → {len(result)} daily records ✓")
        return result

    except Exception as e:
        print(f"[SST] Open-Meteo Marine failed ({e}) — using synthetic fallback")
        return _synthetic_sst(days)


def _synthetic_sst(days: int) -> list:
    """
    AR(1) synthetic SST (φ=0.85) based on GBR 30-yr AIMS/NOAA climatology.
    Stable within a calendar day (seeded by date).
    """
    now = datetime.now()
    np.random.seed(int(now.strftime("%Y%j")))

    result, prev = [], 0.0
    for d in range(days - 1, -1, -1):
        dt   = now - timedelta(days=d)
        clim = MONTHLY_CLIMATOLOGY[dt.month]
        noise = 0.85 * prev + 0.15 * float(np.random.normal(0, 0.5))
        prev  = noise
        result.append({
            "date":   dt.strftime("%Y-%m-%d"),
            "month":  dt.month,
            "year":   dt.year,
            "sst":    round(clim + noise, 2),
            "clim":   clim,
            "anom":   round(noise, 2),
            "source": "synthetic",
        })
    return result