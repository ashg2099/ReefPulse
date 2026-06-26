from fastapi import APIRouter
from ml.bleaching_model import get_or_build

router = APIRouter()

_MODEL, _SCALER, _METRICS = get_or_build()


@router.get("/model/metrics")
async def get_model_metrics():
    """
    Full evaluation report for the deployed bleaching risk model.
    Metrics are from a held-out 20% test set + 5-fold stratified CV.
    Computed once at startup — stable for the lifetime of the server process.
    """
    return _METRICS