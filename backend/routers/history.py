from fastapi import APIRouter, Query
import numpy as np
from datetime import datetime, timedelta

from tools.erddap import fetch_sst, MONTHLY_CLIMATOLOGY

router = APIRouter()

# ── Published GBR mass bleaching events ──────────────────────────────────────
GBR_BLEACHING_EVENTS = [
    {
        "year": 1998, "name": "1998 El Niño Bleaching",
        "severity": 2, "severity_label": "Severe",
        "pct_bleached": 42, "pct_mortality": 16,
        "cause": "Strong El Niño — prolonged SST anomaly +1.5°C above MMM across northern GBR",
        "recovery": "Partial recovery by 2003 in southern sectors; northern reefs took 10+ years",
        "dhw_peak": 8.2, "color": "#f97316",
        "citation": "Hoegh-Guldberg 1999; GBRMPA Reef Health Report",
    },
    {
        "year": 2002, "name": "2002 Bleaching Event",
        "severity": 2, "severity_label": "Severe",
        "pct_bleached": 54, "pct_mortality": 5,
        "cause": "Record summer temperatures across central and southern GBR sectors",
        "recovery": "Most reefs recovered within 2–3 years due to lower mortality rates",
        "dhw_peak": 6.8, "color": "#f97316",
        "citation": "Berkelmans et al. 2004, Coral Reefs",
    },
    {
        "year": 2016, "name": "2016 Mass Bleaching (worst on record)",
        "severity": 4, "severity_label": "Catastrophic",
        "pct_bleached": 93, "pct_mortality": 29,
        "cause": "Record-breaking El Niño combined with long-term ocean warming. Northern GBR worst affected.",
        "recovery": "Ongoing — many northern reefs have not recovered. Coral cover still depressed.",
        "dhw_peak": 12.4, "color": "#ef4444",
        "citation": "Hughes et al. 2017, Nature 543:373–377",
    },
    {
        "year": 2017, "name": "2017 Consecutive Bleaching",
        "severity": 3, "severity_label": "Major",
        "pct_bleached": 67, "pct_mortality": 22,
        "cause": "Second consecutive mass bleaching — unprecedented back-to-back event",
        "recovery": "Severely limited — no recovery window between 2016 and 2017 events",
        "dhw_peak": 9.1, "color": "#ef4444",
        "citation": "Hughes et al. 2018, Science 359:80–83",
    },
    {
        "year": 2020, "name": "2020 Bleaching Event",
        "severity": 3, "severity_label": "Major",
        "pct_bleached": 60, "pct_mortality": 15,
        "cause": "Hottest Australian summer on record combined with reduced cloud cover over GBR",
        "recovery": "Partial — southern reefs showed recovery; central sectors remain stressed",
        "dhw_peak": 8.9, "color": "#ef4444",
        "citation": "AIMS Annual Report 2020; GBRMPA Coral Bleaching Survey",
    },
    {
        "year": 2022, "name": "2022 La Niña Bleaching",
        "severity": 3, "severity_label": "Major",
        "pct_bleached": 91, "pct_mortality": 10,
        "cause": "First mass bleaching during a La Niña year — demonstrates climate baseline shift",
        "recovery": "Ongoing — lower mortality than 2016 due to shorter heat exposure",
        "dhw_peak": 7.3, "color": "#ef4444",
        "citation": "AIMS MMP Report 2022; Hughes et al. 2023",
    },
]


def build_monthly(daily: list, now: datetime) -> list:
    """
    12-month summary. Uses real data where available,
    fills gaps with climatology + small noise.
    """
    real: dict = {}
    for d in daily:
        key = (d["year"], d["month"])
        real.setdefault(key, []).append(d["sst"])

    np.random.seed(int(now.strftime("%Y%j")))
    result = []
    for offset in range(11, -1, -1):
        month = ((now.month - 1 - offset) % 12) + 1
        year  = now.year + ((now.month - 1 - offset) // 12)
        clim  = MONTHLY_CLIMATOLOGY[month]
        key   = (year, month)

        if key in real:
            mean = round(float(np.mean(real[key])), 2)
            src  = daily[0].get("source", "unknown") if daily else "unknown"
        else:
            mean = round(clim + float(np.random.normal(0, 0.2)), 2)
            src  = "climatology"

        result.append({
            "label":  f"{datetime(year, month, 1).strftime('%b')} '{str(year)[2:]}",
            "month":  month,
            "year":   year,
            "mean":   mean,
            "clim":   clim,
            "anom":   round(mean - clim, 2),
            "source": src,
        })
    return result


@router.get("/history")
async def get_history(
    lat: float = Query(-18.0),
    lon: float = Query(147.0),
):
    now   = datetime.now()
    daily = await fetch_sst(lat, lon, days=90)

    monthly   = build_monthly(daily, now)
    anoms     = [d["anom"] for d in daily]
    peak_sst  = max((d["sst"] for d in daily), default=None)
    mean_anom = round(float(np.mean(anoms)), 3) if anoms else 0.0
    warm_days = sum(1 for d in daily if d["anom"] > 1.0)
    real_src  = daily[0].get("source", "synthetic") if daily else "synthetic"

    return {
        "location":     {"lat": lat, "lon": lon},
        "generated_at": now.isoformat(),
        "daily":        daily[-90:],
        "monthly":      monthly,
        "summary": {
            "days_fetched": len(daily),
            "peak_sst":     round(peak_sst, 2) if peak_sst else None,
            "mean_anomaly": mean_anom,
            "warm_days":    warm_days,
            "data_source":  f"Open-Meteo Marine API ({real_src})",
        },
        "bleaching_events": GBR_BLEACHING_EVENTS,
    }