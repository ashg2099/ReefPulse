from dotenv import load_dotenv
load_dotenv()

import litellm

_original_completion = litellm.completion

def _patched_completion(**kwargs):
    if "messages" in kwargs:
        for msg in kwargs["messages"]:
            msg.pop("cache_breakpoint", None)
            msg.pop("cache_control", None)
    return _original_completion(**kwargs)

litellm.completion = _patched_completion
litellm.drop_params = True

import uvicorn
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
from typing import Optional
import uuid
import time

# Router imports 
from routers.model    import router as model_router
from routers.forecast import router as forecast_router
from routers.history import router as history_router

# App 
app = FastAPI(
    title="ReefPulse",
    version="1.0.0",
    description="AI-powered health intelligence for the Great Barrier Reef"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers (must be after app is created)
app.include_router(model_router)
app.include_router(forecast_router)
app.include_router(history_router)

# In-memory job store
jobs = {}

class AnalysisRequest(BaseModel):
    latitude: float = -18.0
    longitude: float = 147.0

class JobStatus(BaseModel):
    job_id: str
    status: str  # pending, running, completed, failed
    result: Optional[dict] = None
    error: Optional[str] = None
    created_at: float
    completed_at: Optional[float] = None

def run_analysis_job(job_id: str, lat: float, lon: float):
    try:
        jobs[job_id]["status"] = "running"
        from agents.reef_crew import run_reef_analysis
        result = run_reef_analysis(lat, lon)
        jobs[job_id]["status"] = "completed"
        jobs[job_id]["result"] = result
        jobs[job_id]["completed_at"] = time.time()
    except Exception as e:
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["error"] = str(e)
        jobs[job_id]["completed_at"] = time.time()

@app.get("/")
def read_root():
    return {
        "message": "ReefPulse API is live. Monitoring coral bleaching, sea temperature and reef health across the Great Barrier Reef."
    }

@app.get("/health")
def health():
    return {"status": "ok", "service": "ReefPulse"}

@app.get("/snapshot")
def get_snapshot(lat: float = -18.0, lon: float = 147.0):
    """Get live sensor data snapshot without running AI analysis."""
    from tools.reef_data_aggregator import get_reef_snapshot
    return get_reef_snapshot(lat, lon)

@app.post("/analyse")
def start_analysis(request: AnalysisRequest, background_tasks: BackgroundTasks):
    """Start a full AI crew analysis in the background. Returns a job_id to poll."""
    job_id = str(uuid.uuid4())
    jobs[job_id] = {
        "job_id": job_id,
        "status": "pending",
        "result": None,
        "error": None,
        "created_at": time.time(),
        "completed_at": None
    }
    background_tasks.add_task(run_analysis_job, job_id, request.latitude, request.longitude)
    return {"job_id": job_id, "status": "pending"}

@app.get("/analyse/{job_id}")
def get_analysis_result(job_id: str):
    """Poll for analysis result by job_id."""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    return jobs[job_id]

@app.get("/jobs")
def list_jobs():
    """List all analysis jobs."""
    return list(jobs.values())

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)