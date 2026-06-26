from fastapi import APIRouter, Query
import httpx
import numpy as np
from datetime import datetime, timedelta
from typing import Optional

from ml.bleaching_model import get_or_build, predict_risk, MONTHLY_MMM
from tools.erddap import fetch_sst, MONTHLY_CLIMATOLOGY

router = APIRouter()
_MODEL, _SCALER, _ = get_or_build()

_COMPASS = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"]


def _deg_to_compass(d: float) -> str:
    return _COMPASS[round(float(d) / 22.5) % 16]


def _daily_mean(hourly: list, day: int) -> Optional[float]:
    sl   = hourly[day * 24 : day * 24 + 24]
    vals = [v for v in sl if v is not None]
    return round(float(np.mean(vals)), 2) if vals else None


def _wave_icon(h: float) -> str:
    if h < 1.0: return "☀️"
    if h < 1.5: return "🌤"
    if h < 2.0: return "⛅"
    if h < 2.5: return "☁️"
    return "🌊"


def _fmt(dt: datetime) -> str:
    return f"{dt.day} {dt.strftime('%b')}"


def project_sst(historical: list, base_sst: float, days_ahead: int, target_date: datetime) -> float:
    clim  = MONTHLY_CLIMATOLOGY[target_date.month]
    slope = 0.0
    if len(historical) >= 3:
        recent = historical[-min(7, len(historical)):]
        ssts   = [h["sst"] for h in recent]
        slope  = float(np.polyfit(range(len(ssts)), ssts, 1)[0])
    trend_damp = np.exp(-days_ahead / 10.0)
    clim_pull  = (1 - trend_damp) * 0.35
    return round(
        float(base_sst)
        + slope * days_ahead * trend_damp
        + (clim - float(base_sst)) * clim_pull
        + float(np.random.normal(0, 0.08)),
        2
    )


def project_dhw(base_dhw: float, sst_series: list, base_date: datetime) -> list:
    dhws, dhw = [round(base_dhw, 2)], float(base_dhw)
    for i, sst in enumerate(sst_series[1:], 1):
        m   = (base_date + timedelta(days=i)).month
        mmm = MONTHLY_MMM[m]
        dhw = max(0.0, dhw + (sst - mmm) / 7.0 if sst > mmm else dhw - 0.04)
        dhws.append(round(dhw, 2))
    return dhws


@router.get("/forecast")
async def get_forecast(
    lat: float = Query(-18.0),
    lon: float = Query(147.0),
    current_sst: Optional[float] = Query(None),
    current_dhw: Optional[float] = Query(None),
):
    np.random.seed(42)
    now = datetime.now()

    # ── 1. Marine + weather forecast from Open-Meteo ─────────────────────
    wave_h   = [1.2] * 7
    swell_h  = [0.8] * 7
    wind_spd = [18]  * 7
    wind_dir = ["SE"] * 7

    async with httpx.AsyncClient(timeout=12) as client:
        try:
            r = await client.get(
                "https://marine-api.open-meteo.com/v1/marine",
                params={"latitude": lat, "longitude": lon,
                        "hourly": "wave_height,swell_wave_height",
                        "forecast_days": 7},
            )
            md      = r.json().get("hourly", {})
            wave_h  = [_daily_mean(md.get("wave_height",       []), d) or 1.2 for d in range(7)]
            swell_h = [_daily_mean(md.get("swell_wave_height", []), d) or 0.8 for d in range(7)]
        except Exception as e:
            print(f"[Forecast] Marine API error: {e}")

        try:
            r = await client.get(
                "https://api.open-meteo.com/v1/forecast",
                params={"latitude": lat, "longitude": lon,
                        "hourly": "wind_speed_10m,wind_direction_10m",
                        "wind_speed_unit": "kmh", "forecast_days": 7},
            )
            wd       = r.json().get("hourly", {})
            wind_spd = [round(_daily_mean(wd.get("wind_speed_10m",      []), d) or 18) for d in range(7)]
            wind_dir = [_deg_to_compass(_daily_mean(wd.get("wind_direction_10m", []), d) or 135) for d in range(7)]
        except Exception as e:
            print(f"[Forecast] Weather API error: {e}")

    # ── 2. Historical SST (Open-Meteo Marine, falls back to synthetic) ────
    historical_sst = await fetch_sst(lat, lon, days=14)

    if current_sst is not None:
        base_sst = current_sst
    elif historical_sst:
        base_sst = historical_sst[-1]["sst"]
    else:
        base_sst = MONTHLY_CLIMATOLOGY[now.month]

    base_dhw = float(current_dhw) if current_dhw is not None else abs(float(np.random.normal(0.1, 0.2)))

    # ── 3. SST & DHW projection ───────────────────────────────────────────
    sst_7day = [project_sst(historical_sst, base_sst, d, now + timedelta(days=d)) for d in range(7)]
    dhw_7day = project_dhw(base_dhw, sst_7day, now)

    # ── 4. Historical chart points ────────────────────────────────────────
    hist_by_date = {h["date"]: h["sst"] for h in historical_sst}
    chart_history = []
    for d in range(-6, 1):
        dt      = now + timedelta(days=d)
        key     = dt.strftime("%Y-%m-%d")
        sst_val = hist_by_date.get(key) or project_sst(historical_sst, base_sst, d, dt)
        src     = historical_sst[0].get("source", "modelled") if hist_by_date.get(key) else "modelled"
        chart_history.append({
            "label":  "Today" if d == 0 else _fmt(dt),
            "sst":    round(float(sst_val), 2),
            "type":   "today" if d == 0 else "history",
            "source": src if key in hist_by_date else "modelled",
        })

    # ── 5. Risk per day ───────────────────────────────────────────────────
    risk_per_day = [
        predict_risk(_MODEL, _SCALER, sst_7day[i], dhw_7day[i], (now + timedelta(days=i)).month)
        for i in range(7)
    ]

    # ── 6. Daily cards ────────────────────────────────────────────────────
    _DAYNAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    days_out = []
    for i in range(7):
        dt = now + timedelta(days=i)
        days_out.append({
            "short": "Today" if i == 0 else _DAYNAMES[dt.weekday()],
            "date":  _fmt(dt),
            "icon":  _wave_icon(wave_h[i]),
            "sst":   sst_7day[i],
            "dhw":   dhw_7day[i],
            "wave":  round(float(wave_h[i]),  2),
            "swell": round(float(swell_h[i]), 2),
            "wind":  wind_spd[i],
            "dir":   wind_dir[i],
            "risk":  risk_per_day[i],
        })

    # ── 7. Full chart (history + forecast) ───────────────────────────────
    chart = list(chart_history)
    for i in range(1, 7):
        dt = now + timedelta(days=i)
        chart.append({"label": _fmt(dt), "sst": sst_7day[i], "type": "forecast", "source": "modelled"})

    # ── 8. Outlook ────────────────────────────────────────────────────────
    max_prob = max(r["probability"] for r in risk_per_day)
    if   max_prob < 0.10: outlook = {"label": "LOW RISK — Winter safety window",               "level": "safe"}
    elif max_prob < 0.30: outlook = {"label": "WATCH — Monitor conditions closely",            "level": "watch"}
    else:                 outlook = {"label": "ELEVATED RISK — Bleaching conditions possible", "level": "alert"}

    real_src = historical_sst[0].get("source", "synthetic") if historical_sst else "synthetic"

    return {
        "location":     {"lat": lat, "lon": lon},
        "generated_at": now.isoformat(),
        "days":         days_out,
        "chart_data":   chart,
        "today_idx":    6,
        "current":      {"sst": round(float(base_sst), 2), "dhw": round(base_dhw, 2)},
        "outlook":      outlook,
        "data_sources": {
            "sst_history":  f"Open-Meteo Marine API ({real_src})",
            "sst_forecast": "Observed trend + AIMS/NOAA 30-yr climatological pull",
            "wave_wind":    "Open-Meteo Marine + Atmosphere APIs (NWP, 4×/day)",
            "dhw":          "Physically-based accumulation vs NOAA CRW Maximum Monthly Mean",
            "risk":         "Logistic Regression — SST, DHW, month (sin/cos)",
        },
        "model_info": {
            "algorithm":  "Logistic Regression (scikit-learn)",
            "features":   ["SST (°C)", "DHW (°C-weeks)", "Month sin", "Month cos"],
            "trained_on": "Synthetic data calibrated to NOAA CRW thresholds + Hughes et al. 2017",
        },
    }