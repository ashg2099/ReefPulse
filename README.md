# 🪸 ReefPulse AI

> AI-powered Great Barrier Reef health monitoring system — real-time bleaching risk assessment, species thermal stress analysis, and 7-day ocean forecasting.

[![Live Demo](https://img.shields.io/badge/Live-reef--pulse--1bv3.vercel.app-0284c7?style=flat-square)](https://reef-pulse-1bv3.vercel.app)
[![Backend](https://img.shields.io/badge/API-reefpulse.onrender.com-16a34a?style=flat-square)](https://reefpulse.onrender.com/health)
[![SDG 14](https://img.shields.io/badge/SDG%2014-Life%20Below%20Water-0066cc?style=flat-square)](https://sdgs.un.org/goals/goal14)

---

## What is ReefPulse?

ReefPulse is a full-stack environmental monitoring platform that tracks the health of the Great Barrier Reef in real time. It combines live ocean data, machine learning, and a 3-agent CrewAI system to assess bleaching risk across 372 coral species — updated every 60 seconds.

Built in response to the 2016, 2017, 2020, and 2022 mass bleaching events that have affected over 90% of the GBR.

---

## Features

### 🔵 Overview Tab
- Live sea surface temperature, degree heating weeks, wave height, wind speed
- AI Health Report with score out of 100 and actionable recommendations
- Interactive reef station map (6 GBR monitoring stations)
- CrewAI 3-agent deep analysis on demand
- Auto-refreshes every 60 seconds

### 📈 Forecast Tab
- 7-day SST and bleaching risk forecast
- SST chart with 14-day history + 7-day projection
- ML model metrics (Accuracy, Precision, Recall, F1, ROC-AUC)
- Risk probability per day

### 📊 History Tab
- 90-day SST trend chart
- 12-month climatology comparison
- Historical GBR mass bleaching events (1998–2022)
- Anomaly detection

### 🚨 Alerts Tab
- Live bleaching alert level (No Stress → Watch → Alert → Severe)
- Per-station monitoring across 6 GBR locations
- NOAA CRW-based DHW threshold guide
- Configurable notification preferences

### 🪸 Species Tab
- Thermal stress risk for 372 GBR coral species (sourced from OBIS)
- Filter by risk level and thermal sensitivity
- Per-species: bleach threshold, SST above threshold, stress score
- Summary breakdown: No Stress / Watch / Alert / Severe

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| Next.js 14 (App Router) | React framework |
| TypeScript | Type safety |
| Zustand | Global state (active tab, location, dark mode) |
| TanStack Query | Data fetching, caching, refetch intervals |
| Tailwind CSS | Utility styling |

### Backend
| Technology | Purpose |
|---|---|
| FastAPI | REST API framework |
| Python 3.11 | Runtime |
| Poetry | Dependency management |
| CrewAI | 3-agent AI orchestration |
| Groq (Llama 3.3 70B) | LLM inference |
| scikit-learn | Bleaching risk ML model |
| ChromaDB | RAG vector store |
| httpx | Async HTTP client |

### Data Sources
| Source | Data |
|---|---|
| Open-Meteo Marine API | Sea surface temperature, wave height, swell, wind |
| OBIS API | 372 GBR coral species occurrence records |
| Bureau of Meteorology | Weather conditions |
| Synthetic AR(1) fallback | SST backup when APIs unavailable |

### Deployment
| Service | Purpose |
|---|---|
| Vercel | Frontend hosting (auto-deploy on push) |
| Render | Backend hosting (free tier, Python 3.11) |
| UptimeRobot | Keep Render awake (pings every 5 min) |

---

## Architecture
┌─────────────────────────────────────────────────────┐

│                   Next.js Frontend                   │

│  Overview │ Forecast │ History │ Alerts │ Species    │

│              Zustand + TanStack Query                │

└──────────────────────┬──────────────────────────────┘

│ HTTPS

┌──────────────────────▼──────────────────────────────┐

│                  FastAPI Backend                      │

│  /snapshot  /forecast  /history  /alerts  /species  │

│  /analysis  /model/metrics  /health                  │

└────┬──────────────┬──────────────┬───────────────────┘

│              │              │

┌────▼────┐  ┌──────▼──────┐  ┌───▼──────────────┐

│Open-Meteo│  │  CrewAI     │  │  scikit-learn    │

│Marine API│  │  3 Agents   │  │  Bleaching Model │

└─────────┘  │  Groq LLM   │  └──────────────────┘

│  ChromaDB   │

└─────────────┘

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11
- Poetry
- Groq API key (free at [console.groq.com](https://console.groq.com))

### 1. Clone the repo
```bash
git clone https://github.com/ashg2099/ReefPulse.git
cd ReefPulse
```

### 2. Backend setup
```bash
cd backend
poetry install
cp .env.example .env   # add your GROQ_API_KEY
poetry run uvicorn main:app --reload --port 8000
```

### 3. Build species dataset (first time only)
```bash
cd backend
poetry run python scripts/build_species_dataset.py
```
This fetches 372 GBR coral species from the OBIS API and saves to `data/gbr_coral_species.json`.

### 4. Frontend setup
```bash
cd frontend
pnpm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

### Backend (`.env`)
GROQ_API_KEY=your_groq_key_here

ENVIRONMENT=development

CORS_ORIGINS=http://localhost:3000

### Frontend (`.env.local`)
NEXT_PUBLIC_API_URL=http://localhost:8000

---

## API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | Health check |
| `/snapshot` | GET | Live SST, DHW, wave, wind snapshot |
| `/forecast` | GET | 7-day SST + bleaching risk forecast |
| `/history` | GET | 90-day SST history + monthly climatology |
| `/alerts` | GET | Current bleaching alert level + 6 stations |
| `/species-risk` | GET | Thermal stress for 372 coral species |
| `/analysis` | POST | Run CrewAI 3-agent deep analysis |
| `/model/metrics` | GET | ML model evaluation metrics |

All endpoints accept `?lat=&lon=` query params (default: Central GBR `-18.0, 147.0`).

---

## ML Model

ReefPulse uses a Logistic Regression model trained on synthetic data calibrated to NOAA CRW bleaching thresholds and Hughes et al. 2017 field observations.

**Features:** SST (°C), DHW (°C-weeks), Month sin, Month cos  
**Performance:** Accuracy 0.97 · Precision 0.89 · Recall 0.83 · F1 0.86 · ROC-AUC 0.99

---

## Project Structure
ReefPulse/

├── backend/

│   ├── main.py                  # FastAPI app + router registration

│   ├── pyproject.toml           # Poetry dependencies

│   ├── render.yaml              # Render deployment config

│   ├── agents/

│   │   ├── reef_crew.py         # CrewAI 3-agent setup

│   │   └── reef_tasks.py        # Agent task definitions

│   ├── data/

│   │   └── gbr_coral_species.json  # 372 OBIS species (generated)

│   ├── ml/

│   │   └── bleaching_model.py   # Logistic Regression + training

│   ├── routers/

│   │   ├── forecast.py          # 7-day forecast endpoint

│   │   ├── history.py           # SST history endpoint

│   │   ├── alerts.py            # Bleaching alerts endpoint

│   │   ├── species.py           # Species risk endpoint

│   │   └── model.py             # ML metrics endpoint

│   ├── scripts/

│   │   └── build_species_dataset.py  # One-time OBIS data builder

│   └── tools/

│       ├── erddap.py            # Open-Meteo SST fetcher

│       ├── noaa_tool.py         # CrewAI ocean conditions tool

│       ├── marine_tool.py       # Wave/swell/wind fetcher

│       └── reef_data_aggregator.py  # Snapshot aggregator

└── frontend/

├── app/

│   ├── layout.tsx           # Root layout

│   └── page.tsx             # Entry point (server component)

└── src/

├── components/

│   ├── TabContent.tsx   # Tab router

│   ├── Navbar.tsx       # Navigation + dark mode

│   ├── HeroOcean.tsx    # Hero with reef imagery

│   ├── QuickStats.tsx   # Bento metric cards

│   ├── ReefMap.tsx      # Station map

│   ├── HealthReport.tsx # AI health score

│   ├── ForecastPage.tsx # 7-day forecast

│   ├── HistoryPage.tsx  # SST history charts

│   ├── AlertsPage.tsx   # Bleaching alerts

│   └── SpeciesRiskPage.tsx # Species risk grid

└── lib/

├── store.ts         # Zustand store

└── api.ts           # API client

---

## Deployment

### Backend → Render
1. Connect GitHub repo to Render
2. Root directory: `backend`
3. Build command: `pip install poetry && poetry lock && poetry install --no-root`
4. Start command: `poetry run uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Environment: `PYTHON_VERSION=3.11.0`, `GROQ_API_KEY=...`

### Frontend → Vercel
1. Import repo on Vercel
2. Root directory: `frontend`
3. Framework: Next.js (auto-detected)
4. Environment variable: `NEXT_PUBLIC_API_URL=https://reefpulse.onrender.com`

### Keep Render awake
Set up a free UptimeRobot monitor for `https://reefpulse.onrender.com/health` every 5 minutes to prevent cold starts on the free tier.

---

## SDG Alignment

ReefPulse directly supports **UN SDG 14: Life Below Water** by providing:
- Early warning system for coral bleaching events
- Species-level thermal stress monitoring
- Historical bleaching event tracking
- Data-driven insights for reef conservation decisions

---

## License

MIT