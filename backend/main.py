from dotenv import load_dotenv
load_dotenv()

import uvicorn
from fastapi import FastAPI

# FastAPI App 
app = FastAPI(title="ReefPulse", version="1.0.0",
              description="AI-powered health intelligence for the Great Barrier Reef")


# Endpoints
@app.get("/health")
def health():
    return {"status": "ok", "service": "ReefPulse"}

@app.get("/")
def read_root():
    return {"message" : "ReefPulse API is live. Monitoring coral bleaching, sea temperature and reef health across the Great Barrier Reef."}

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)