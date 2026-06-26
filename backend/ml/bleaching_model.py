import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_validate
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, average_precision_score, confusion_matrix,
)
from sklearn.pipeline import Pipeline
from typing import Optional

# Published GBR climatology constants 
# Source: AIMS Long-Term Monitoring Programme + NOAA CoralTemp 30-yr record
# These are scientific constants from the literature: not computed dynamically.

MONTHLY_CLIMATOLOGY_SST = {
    1: 28.9, 2: 29.1, 3: 28.3, 4: 27.0, 5: 25.5,
    6: 24.3, 7: 23.7, 8: 23.5, 9: 24.1, 10: 25.2,
    11: 26.7, 12: 27.9,
}

# Maximum Monthly Mean (MMM) — NOAA CRW bleaching threshold baseline.
# DHW accumulates whenever SST > MMM. Published per-pixel by NOAA CRW.
MONTHLY_MMM = {
    1: 29.2, 2: 29.4, 3: 28.7, 4: 27.4, 5: 25.9,
    6: 24.7, 7: 24.0, 8: 23.8, 9: 24.4, 10: 25.6,
    11: 27.0, 12: 28.2,
}

FEATURE_NAMES = ["SST (°C)", "DHW (°C-weeks)", "Month sin", "Month cos"]

# Module-level singleton: trained once, reused everywhere 
_singleton = None


def get_or_build() -> tuple:
    global _singleton
    if _singleton is None:
        _singleton = _build()
    return _singleton


# Training data generation

def _generate_data():
    """
    Synthetic training data calibrated to:
    - NOAA CRW bleaching thresholds: watch ≥ 4 DHW, alert ≥ 8 DHW
    - Hughes et al. 2017 (Nature 543): GBR mass bleaching conditions
    - AIMS LTMP species sensitivity records
    Features: [SST, DHW, month_sin, month_cos]
    """
    np.random.seed(42)
    rows, labels = [], []

    for month in range(1, 13):
        clim = MONTHLY_CLIMATOLOGY_SST[month]
        mmm  = MONTHLY_MMM[month]

        # Safe / low-stress (all months)
        n     = 200
        sst_s = np.random.normal(clim - 0.3, 0.9, n).clip(19, 32)
        dhw_s = np.abs(np.random.normal(0.4, 0.7, n))
        for sst, dhw in zip(sst_s, dhw_s):
            rows.append([sst, dhw, month])
            labels.append(1 if (sst > mmm + 1.5 and dhw > 4.0) else 0)

        # Elevated stress — summer months only (Nov–Mar, per GBR bleaching history)
        if month in [11, 12, 1, 2, 3]:
            n_s   = 120
            sst_r = np.random.normal(clim + 1.8, 0.7, n_s).clip(24, 33)
            dhw_r = np.abs(np.random.normal(5.5, 2.5, n_s))
            for sst, dhw in zip(sst_r, dhw_r):
                rows.append([sst, dhw, month])
                bleach = (
                    1 if (sst > mmm + 1.2 and dhw > 4.0) else
                    1 if (sst > mmm + 2.0 and dhw > 2.0) else 0
                )
                labels.append(bleach)

    X_raw = np.array(rows)
    y     = np.array(labels)
    m_sin = np.sin(2 * np.pi * X_raw[:, 2] / 12)
    m_cos = np.cos(2 * np.pi * X_raw[:, 2] / 12)
    X     = np.column_stack([X_raw[:, 0], X_raw[:, 1], m_sin, m_cos])
    return X, y


# Evaluation 

def _evaluate(X: np.ndarray, y: np.ndarray) -> dict:
    """
    Rigorous evaluation:
    - 80/20 stratified train/test split (no data leakage — scaler fit on train only)
    - 5-fold stratified cross-validation for stability check
    """
    X_tr, X_te, y_tr, y_te = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    scaler_eval = StandardScaler()
    X_tr_s = scaler_eval.fit_transform(X_tr)   # fit on TRAIN only
    X_te_s = scaler_eval.transform(X_te)        # transform TEST without refitting

    eval_model = LogisticRegression(C=1.0, max_iter=1000, random_state=42)
    eval_model.fit(X_tr_s, y_tr)

    y_pred = eval_model.predict(X_te_s)
    y_prob = eval_model.predict_proba(X_te_s)[:, 1]
    cm     = confusion_matrix(y_te, y_pred)
    tn, fp, fn, tp = cm.ravel()

    # 5-fold stratified CV (proper pipeline to prevent leakage per fold)
    pipe = Pipeline([
        ("scaler", StandardScaler()),
        ("lr", LogisticRegression(C=1.0, max_iter=1000, random_state=42)),
    ])
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_res = cross_validate(
        pipe, X, y, cv=cv,
        scoring={"roc_auc": "roc_auc", "f1": "f1", "precision": "precision", "recall": "recall"},
        return_train_score=False,
    )

    metrics = {
        "test": {
            "n_samples":   int(len(y_te)),
            "n_bleaching": int(y_te.sum()),
            "accuracy":    round(float(accuracy_score(y_te, y_pred)),            4),
            "precision":   round(float(precision_score(y_te, y_pred)),           4),
            "recall":      round(float(recall_score(y_te, y_pred)),              4),
            "f1":          round(float(f1_score(y_te, y_pred)),                  4),
            "roc_auc":     round(float(roc_auc_score(y_te, y_prob)),             4),
            "pr_auc":      round(float(average_precision_score(y_te, y_prob)),   4),
        },
        "confusion_matrix": {
            "tn": int(tn), "fp": int(fp),
            "fn": int(fn), "tp": int(tp),
        },
        "cross_validation": {
            "folds": 5,
            "roc_auc": {
                "mean":     round(float(cv_res["test_roc_auc"].mean()), 4),
                "std":      round(float(cv_res["test_roc_auc"].std()),  4),
                "per_fold": [round(float(v), 4) for v in cv_res["test_roc_auc"]],
            },
            "f1":        {"mean": round(float(cv_res["test_f1"].mean()),        4), "std": round(float(cv_res["test_f1"].std()),        4)},
            "precision": {"mean": round(float(cv_res["test_precision"].mean()), 4), "std": round(float(cv_res["test_precision"].std()), 4)},
            "recall":    {"mean": round(float(cv_res["test_recall"].mean()),    4), "std": round(float(cv_res["test_recall"].std()),    4)},
        },
        "training": {
            "total_samples": int(len(y)),
            "train_samples": int(len(y_tr)),
            "test_samples":  int(len(y_te)),
            "bleaching_pct": round(float(y.mean()) * 100, 1),
            "safe_pct":      round(float((y == 0).mean()) * 100, 1),
        },
    }

    _log(metrics)
    return metrics


def _log(m: dict) -> None:
    t  = m["test"]
    cv = m["cross_validation"]
    cm = m["confusion_matrix"]
    print(
        f"\n{'─'*55}\n"
        f"  ReefML — Bleaching Risk Model\n"
        f"{'─'*55}\n"
        f"  Test set  n={t['n_samples']}  ({t['n_bleaching']} bleaching events)\n"
        f"    Accuracy  {t['accuracy']:.4f}\n"
        f"    Precision {t['precision']:.4f}   Recall {t['recall']:.4f}\n"
        f"    F1        {t['f1']:.4f}   ROC-AUC {t['roc_auc']:.4f}\n"
        f"    PR-AUC    {t['pr_auc']:.4f}  (preferred for imbalanced classes)\n"
        f"\n  5-Fold CV\n"
        f"    ROC-AUC   {cv['roc_auc']['mean']:.4f} ± {cv['roc_auc']['std']:.4f}\n"
        f"    F1        {cv['f1']['mean']:.4f} ± {cv['f1']['std']:.4f}\n"
        f"\n  Confusion Matrix\n"
        f"    TP={cm['tp']}  FP={cm['fp']}\n"
        f"    FN={cm['fn']}  TN={cm['tn']}\n"
        f"{'─'*55}\n"
    )


# Build production model 

def _build() -> tuple:
    X, y = _generate_data()

    # Step 1: Evaluate on held-out split (no leakage)
    metrics = _evaluate(X, y)

    # Step 2: Retrain on ALL data for production (maximises rare-event coverage)
    scaler = StandardScaler()
    X_s    = scaler.fit_transform(X)
    model  = LogisticRegression(C=1.0, max_iter=1000, random_state=42)
    model.fit(X_s, y)

    # Feature importance = standardised logistic regression coefficients
    coefs = model.coef_[0]
    metrics["feature_importance"] = sorted(
        [{"feature": name, "coefficient": round(float(c), 4), "abs": round(abs(float(c)), 4)}
         for name, c in zip(FEATURE_NAMES, coefs)],
        key=lambda x: x["abs"], reverse=True,
    )
    metrics["model"] = {
        "algorithm":      "Logistic Regression",
        "library":        "scikit-learn",
        "regularisation": "L2 (C=1.0)",
        "features":       FEATURE_NAMES,
        "trained_on":     "Synthetic data — NOAA CRW thresholds + Hughes et al. 2017",
        "note":           "Eval on held-out 20% test set; production model retrained on 100% of data.",
    }

    return model, scaler, metrics


def predict_risk(model, scaler, sst: float, dhw: float, month: int) -> dict:
    sin  = np.sin(2 * np.pi * month / 12)
    cos  = np.cos(2 * np.pi * month / 12)
    X    = scaler.transform([[sst, dhw, sin, cos]])
    prob = float(model.predict_proba(X)[0][1])

    if   prob < 0.05: level, label, color = 0, "No Stress",         "#0284c7"
    elif prob < 0.20: level, label, color = 1, "Watch",             "#f59e0b"
    elif prob < 0.50: level, label, color = 2, "Bleaching Alert 1", "#f97316"
    else:             level, label, color = 3, "Bleaching Alert 2", "#ef4444"

    return {"probability": round(prob, 3), "level": level, "label": label, "color": color}