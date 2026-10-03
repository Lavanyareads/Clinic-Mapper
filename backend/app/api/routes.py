"""
Clinic-Cluster Mapper - API Routes
Complete API endpoints wired to actual ML pipeline modules.
"""
from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
import os
import json
import time
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional

from app.config import settings
from app.ml.preprocessing import (
    load_communities_csv, load_facilities_csv, load_specialists_csv,
    validate_data, compute_data_quality_score, preprocess_for_clustering
)
from app.ml.clustering import find_optimal_k, run_kmeans, generate_cluster_profiles
from app.ml.equity_score import compute_equity_score, get_score_breakdown, get_formula_description, DEFAULT_WEIGHTS
from app.ml.underserved import detect_underserved, classify_priority, get_underserved_summary
from app.ml.hub_optimizer import optimize_hubs, generate_hub_explanation, compute_before_after
from app.ml.what_if import simulate_scenarios, compare_modes
from app.ml.scenario import ScenarioManager

router = APIRouter()


# ---------------------------------------------------------------------------
# In-memory state – stores current session data and analysis results
# ---------------------------------------------------------------------------
class StateManager:
    def __init__(self):
        self.communities_df: Optional[pd.DataFrame] = None
        self.facilities_df: Optional[pd.DataFrame] = None
        self.specialists_df: Optional[pd.DataFrame] = None
        self.feature_matrix: Optional[np.ndarray] = None
        self.feature_names: Optional[List[str]] = None
        self.scaler = None
        self.clustering_result: Optional[Dict] = None
        self.cluster_profiles: Optional[List[Dict]] = None
        self.equity_scores: Optional[pd.Series] = None
        self.underserved_df: Optional[pd.DataFrame] = None
        self.hub_result: Optional[Dict] = None
        self.scenario_manager = ScenarioManager()
        self.analysis_runtime: float = 0.0
        self.data_loaded: bool = False

    def reset(self):
        self.__init__()


state = StateManager()


def auto_load_real_data() -> bool:
    """Auto-load real dataset into in-memory state on startup or request."""
    try:
        real_path = os.path.abspath(settings.REAL_DATA_PATH)
        comm_path = os.path.join(real_path, "communities.csv")
        fac_path = os.path.join(real_path, "healthcare_facilities.csv")
        spec_path = os.path.join(real_path, "specialists.csv")

        if not os.path.exists(comm_path):
            # Fallback to demo path if real dataset hasn't been built
            demo_path = os.path.abspath(settings.DEMO_DATA_PATH)
            comm_path = os.path.join(demo_path, "communities.csv")
            fac_path = os.path.join(demo_path, "healthcare_facilities.csv")
            spec_path = os.path.join(demo_path, "specialists.csv")
            if not os.path.exists(comm_path):
                return False

        state.communities_df = load_communities_csv(comm_path)
        if os.path.exists(fac_path):
            state.facilities_df = load_facilities_csv(fac_path)
        if os.path.exists(spec_path):
            state.specialists_df = load_specialists_csv(spec_path)

        state.feature_matrix, state.feature_names, state.scaler = preprocess_for_clustering(state.communities_df)
        state.equity_scores = compute_equity_score(state.communities_df)
        state.communities_df["equity_score"] = state.equity_scores
        state.data_loaded = True
        return True
    except Exception as e:
        print(f"[WARN] auto_load_real_data failed: {e}")
        return False


def ensure_data_loaded():
    """Ensure that data is loaded before executing an analysis endpoint."""
    if state.communities_df is None or not state.data_loaded:
        loaded = auto_load_real_data()
        if not loaded:
            raise HTTPException(status_code=400, detail="No dataset available. Please ensure real data is built.")


# Automatically load real data on module import
auto_load_real_data()


# ========================== DATA ENDPOINTS ==========================

@router.get("/api/data/load")
@router.get("/api/data/real")
@router.get("/api/data/demo")
def load_real_data():
    """
    Load REAL dataset (preprocessed from NIN Health Facilities, India Settlements Population,
    NFHS District Survey, PMGSY Roads, and Census 2011 Age data).
    Distances are computed via haversine from actual GPS coordinates.
    """
    try:
        loaded = auto_load_real_data()
        if not loaded or state.communities_df is None:
            raise HTTPException(
                status_code=404,
                detail="Real processed data could not be loaded."
            )

        quality_path = os.path.join(os.path.abspath(settings.REAL_DATA_PATH), "data_quality_report.json")
        quality_summary = {}
        if os.path.exists(quality_path):
            with open(quality_path) as qf:
                quality_summary = json.load(qf)

        return {
            "message": "Real healthcare dataset loaded successfully",
            "communities_count": len(state.communities_df),
            "facilities_count": len(state.facilities_df) if state.facilities_df is not None else 0,
            "specialists_count": len(state.specialists_df) if state.specialists_df is not None else 0,
            "is_demo": False,
            "is_real": True,
            "data_sources": {
                "communities": "India Post Pincode Geocoded Settlements",
                "facilities": "NIN Health Facilities Dataset (Ministry of Health)",
                "road_accessibility": "PMGSY Progress Report 2024-2025",
                "vulnerability_indicators": "NFHS-5 District Health Survey",
                "elderly_population": "Census of India 2011 - Age Groups",
            },
            "computed_columns": [
                "distance_to_nearest_clinic_km",
                "distance_to_nearest_specialist_km",
                "elderly_population", "low_income_population",
                "internet_connectivity", "road_accessibility",
                "doctors_available", "specialist_available",
                "healthcare_visits", "emergency_cases", "telemedicine_usage",
            ],
            "disclaimer": (
                "Distances computed via haversine from GPS coords. "
                "internet_connectivity, road_accessibility, healthcare_visits are proxy/derived values. "
                "See DATA_DICTIONARY.md for details."
            ),
            "quality_summary": quality_summary,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading real data: {str(e)}")


@router.post("/api/data/upload")
async def upload_data(file: UploadFile = File(...)):
    """Upload a CSV file with community data."""
    try:
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        file_path = os.path.join(settings.UPLOAD_DIR, file.filename)
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)

        state.communities_df = load_communities_csv(file_path)

        required_cols = [
            "location_id", "latitude", "longitude", "population",
            "distance_to_nearest_clinic_km", "distance_to_nearest_specialist_km"
        ]
        is_valid, errors, warnings = validate_data(state.communities_df, required_cols)

        if not is_valid:
            state.communities_df = None
            raise HTTPException(status_code=400, detail={"errors": errors, "warnings": warnings})

        state.feature_matrix, state.feature_names, state.scaler = preprocess_for_clustering(state.communities_df)
        state.equity_scores = compute_equity_score(state.communities_df)
        state.communities_df["equity_score"] = state.equity_scores
        state.data_loaded = True

        quality = compute_data_quality_score(state.communities_df)

        return {
            "message": "Data uploaded successfully",
            "rows": len(state.communities_df),
            "columns": len(state.communities_df.columns),
            "data_quality": quality,
            "warnings": warnings,
            "is_demo": False
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/data/preview")
def preview_data():
    """Get first 50 rows of the loaded dataset."""
    if state.communities_df is None:
        raise HTTPException(status_code=400, detail="No data loaded. Load demo data or upload a CSV first.")

    df = state.communities_df.head(50)
    return {
        "columns": df.columns.tolist(),
        "rows": df.to_dict(orient="records"),
        "total_rows": len(state.communities_df),
        "total_columns": len(state.communities_df.columns)
    }


@router.get("/api/data/quality")
def get_data_quality():
    """Get data quality report."""
    if state.communities_df is None:
        raise HTTPException(status_code=400, detail="No data loaded.")

    quality = compute_data_quality_score(state.communities_df)
    required_cols = [
        "location_id", "village_name", "latitude", "longitude", "population",
        "elderly_population", "low_income_population",
        "distance_to_nearest_clinic_km", "distance_to_nearest_specialist_km",
        "doctors_available", "specialist_available",
        "internet_connectivity", "road_accessibility",
        "healthcare_visits", "emergency_cases", "telemedicine_usage"
    ]
    is_valid, errors, warnings = validate_data(state.communities_df, required_cols)

    return {
        "score": quality["score"],
        "missing_pct": quality["missing_pct"],
        "invalid_coords": quality["invalid_coords"],
        "total_rows": quality["stats"]["total_rows"],
        "total_columns": quality["stats"]["total_columns"],
        "is_valid": is_valid,
        "errors": errors,
        "warnings": warnings,
        "column_stats": {
            col: {
                "non_null": int(state.communities_df[col].notna().sum()),
                "null": int(state.communities_df[col].isna().sum()),
                "dtype": str(state.communities_df[col].dtype)
            }
            for col in state.communities_df.columns
        }
    }


@router.get("/api/data/stats")
def get_data_stats():
    """Get summary statistics for the dataset."""
    if state.communities_df is None:
        raise HTTPException(status_code=400, detail="No data loaded.")

    df = state.communities_df
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    stats = {}
    for col in numeric_cols:
        stats[col] = {
            "mean": float(df[col].mean()),
            "median": float(df[col].median()),
            "min": float(df[col].min()),
            "max": float(df[col].max()),
            "std": float(df[col].std()),
        }

    return {
        "row_count": len(df),
        "column_count": len(df.columns),
        "columns": df.columns.tolist(),
        "numeric_stats": stats
    }


@router.get("/api/data/download-sample")
def download_sample():
    """Return a sample CSV template."""
    sample_data = {
        "location_id": ["C001", "C002"],
        "village_name": ["Sample Village 1", "Sample Village 2"],
        "latitude": [23.5, 23.6],
        "longitude": [77.5, 77.6],
        "population": [5000, 3000],
        "elderly_population": [600, 400],
        "low_income_population": [2000, 1500],
        "distance_to_nearest_clinic_km": [5.0, 15.0],
        "distance_to_nearest_specialist_km": [25.0, 45.0],
        "doctors_available": [2, 0],
        "specialist_available": [0, 0],
        "internet_connectivity": [0.7, 0.3],
        "road_accessibility": [0.8, 0.4],
        "healthcare_visits": [1200, 400],
        "emergency_cases": [150, 80],
        "telemedicine_usage": [0.4, 0.1],
    }
    sample_df = pd.DataFrame(sample_data)
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    path = os.path.join(settings.UPLOAD_DIR, "sample_template.csv")
    sample_df.to_csv(path, index=False)
    return FileResponse(path, media_type="text/csv", filename="sample_template.csv")


# ========================== CLUSTERING ENDPOINTS ==========================

@router.get("/api/clustering/optimal-k")
def get_optimal_k():
    """Run Elbow + Silhouette analysis to find optimal K."""
    if state.feature_matrix is None:
        raise HTTPException(status_code=400, detail="No data preprocessed. Load data first.")

    t0 = time.time()
    result = find_optimal_k(state.feature_matrix, k_range=(2, 12))
    runtime = time.time() - t0

    k_values = list(range(2, 2 + len(result["elbow_scores"])))
    return {
        "k_values": k_values,
        "elbow_scores": result["elbow_scores"],
        "silhouette_scores": result["silhouette_scores"],
        "suggested_k": result["suggested_k"],
        "runtime_seconds": round(runtime, 3)
    }


@router.post("/api/clustering/run")
def run_clustering_endpoint(k: Optional[int] = None):
    """Run K-Means clustering."""
    if state.feature_matrix is None:
        raise HTTPException(status_code=400, detail="No data preprocessed. Load data first.")

    t0 = time.time()

    if k is None:
        optimal = find_optimal_k(state.feature_matrix)
        k = optimal["suggested_k"]

    result = run_kmeans(state.feature_matrix, k)
    runtime = time.time() - t0

    # Add cluster labels to dataframe
    state.communities_df["cluster"] = result["labels"]
    state.clustering_result = result
    state.clustering_result["k"] = k
    state.clustering_result["runtime"] = round(runtime, 3)

    # Generate profiles
    profiles = generate_cluster_profiles(state.communities_df, state.feature_names)
    state.cluster_profiles = profiles

    return {
        "k": k,
        "labels": result["labels"],
        "inertia": result["inertia"],
        "silhouette_score": result["silhouette_score"],
        "cluster_sizes": result["cluster_sizes"],
        "profiles": profiles,
        "runtime_seconds": round(runtime, 3)
    }


@router.get("/api/clustering/profiles")
def get_cluster_profiles():
    """Get cluster profiles from the last clustering run."""
    if state.cluster_profiles is None:
        raise HTTPException(status_code=400, detail="Run clustering first.")
    return {"profiles": state.cluster_profiles}


# ========================== EQUITY ENDPOINTS ==========================

@router.post("/api/equity/compute")
def compute_equity(weights: Optional[Dict[str, float]] = None):
    """Compute healthcare equity scores with optional custom weights."""
    if state.communities_df is None:
        raise HTTPException(status_code=400, detail="No data loaded.")

    w = weights if weights else DEFAULT_WEIGHTS
    scores = compute_equity_score(state.communities_df, w)
    state.communities_df["equity_score"] = scores
    state.equity_scores = scores

    return {
        "scores": scores.tolist(),
        "mean_score": float(scores.mean()),
        "median_score": float(scores.median()),
        "min_score": float(scores.min()),
        "max_score": float(scores.max()),
        "std_score": float(scores.std()),
        "weights_used": w,
        "distribution": {
            "0-20": int((scores < 20).sum()),
            "20-40": int(((scores >= 20) & (scores < 40)).sum()),
            "40-60": int(((scores >= 40) & (scores < 60)).sum()),
            "60-80": int(((scores >= 60) & (scores < 80)).sum()),
            "80-100": int((scores >= 80).sum()),
        },
        "disclaimer": "Weights are model assumptions, NOT medical standards."
    }


@router.get("/api/equity/formula")
def get_equity_formula():
    """Get the equity score formula description."""
    return {
        "description": get_formula_description(),
        "default_weights": DEFAULT_WEIGHTS
    }


@router.get("/api/equity/breakdown/{location_id}")
def get_equity_breakdown_loc(location_id: str):
    """Get equity score breakdown for a specific location."""
    if state.communities_df is None:
        raise HTTPException(status_code=400, detail="No data loaded.")

    row = state.communities_df[state.communities_df["location_id"] == location_id]
    if row.empty:
        raise HTTPException(status_code=404, detail=f"Location {location_id} not found.")

    breakdown = get_score_breakdown(row.iloc[0])
    total = float(compute_equity_score(row.iloc[0]))
    return {
        "location_id": location_id,
        "total_score": total,
        "breakdown": breakdown,
        "disclaimer": "Weights are model assumptions, NOT medical standards."
    }


# ========================== UNDERSERVED ENDPOINTS ==========================

@router.post("/api/underserved/detect")
def detect_underserved_areas(
    equity_threshold: float = 35,
    specialist_dist_threshold: float = 30,
    connectivity_threshold: float = 0.4
):
    """Detect underserved areas based on thresholds."""
    if state.communities_df is None:
        raise HTTPException(status_code=400, detail="No data loaded.")

    flagged = detect_underserved(
        state.communities_df.copy(),
        equity_threshold=equity_threshold,
        specialist_dist_threshold=specialist_dist_threshold,
        connectivity_threshold=connectivity_threshold
    )
    state.underserved_df = flagged

    # Build response
    areas = []
    for _, row in flagged.iterrows():
        areas.append({
            "location_id": row.get("location_id", ""),
            "village_name": row.get("village_name", ""),
            "latitude": float(row.get("latitude", 0)),
            "longitude": float(row.get("longitude", 0)),
            "population": int(row.get("population", 0)),
            "equity_score": float(row.get("equity_score", 0)),
            "priority": row.get("priority", "Medium"),
            "explanation": row.get("underserved_explanation", ""),
            "specialist_distance": float(row.get("distance_to_nearest_specialist_km", 0)),
            "connectivity": float(row.get("internet_connectivity", 0)),
        })

    summary = get_underserved_summary(flagged)

    return {
        "underserved_areas": areas,
        "summary": summary,
        "thresholds_used": {
            "equity_threshold": equity_threshold,
            "specialist_dist_threshold": specialist_dist_threshold,
            "connectivity_threshold": connectivity_threshold
        }
    }


@router.get("/api/underserved/summary")
def get_underserved_sum():
    """Get summary of underserved analysis."""
    if state.underserved_df is None:
        raise HTTPException(status_code=400, detail="Run underserved detection first.")
    return {"summary": get_underserved_summary(state.underserved_df)}


# ========================== HUB OPTIMIZATION ENDPOINTS ==========================

@router.post("/api/hubs/optimize")
def run_hub_optimization(n_hubs: int = 3, mode: str = "population"):
    """Run telemedicine hub optimization."""
    if state.communities_df is None:
        raise HTTPException(status_code=400, detail="No data loaded.")

    if n_hubs < 1 or n_hubs > 10:
        raise HTTPException(status_code=400, detail="Number of hubs must be between 1 and 10.")

    t0 = time.time()
    result = optimize_hubs(state.communities_df.copy(), n_hubs=n_hubs, mode=mode)
    runtime = time.time() - t0

    state.hub_result = result
    state.hub_result["mode"] = mode
    state.hub_result["n_hubs"] = n_hubs
    state.hub_result["runtime"] = round(runtime, 3)

    # Add explanations
    for hub in result["hub_locations"]:
        hub["explanation"] = generate_hub_explanation(hub, state.communities_df)

    # Compute before/after
    before_after = compute_before_after(state.communities_df, result["hub_locations"])

    return {
        "hub_locations": result["hub_locations"],
        "overall_metrics": result["overall_metrics"],
        "before_after": before_after,
        "mode": mode,
        "n_hubs": n_hubs,
        "runtime_seconds": round(runtime, 3)
    }


@router.get("/api/hubs/explain/{hub_index}")
def explain_hub(hub_index: int):
    """Get explanation for why a specific hub was recommended."""
    if state.hub_result is None:
        raise HTTPException(status_code=400, detail="Run hub optimization first.")

    hubs = state.hub_result.get("hub_locations", [])
    if hub_index < 0 or hub_index >= len(hubs):
        raise HTTPException(status_code=404, detail=f"Hub index {hub_index} not found.")

    hub = hubs[hub_index]
    explanation = generate_hub_explanation(hub, state.communities_df)

    # Find nearby communities for context
    nearby = []
    for idx in hub.get("community_assignments", [])[:10]:
        row = state.communities_df.iloc[idx]
        nearby.append({
            "village_name": row.get("village_name", ""),
            "population": int(row.get("population", 0)),
            "distance_to_hub": float(round(
                np.sqrt((row["latitude"] - hub["lat"])**2 + (row["longitude"] - hub["lon"])**2) * 111, 2
            ))
        })

    return {
        "hub_index": hub_index,
        "lat": hub["lat"],
        "lon": hub["lon"],
        "explanation": explanation,
        "communities_served": hub.get("communities_served", 0),
        "population_covered": hub.get("population_covered", 0),
        "vulnerable_pop_covered": hub.get("vulnerable_pop_covered", 0),
        "avg_distance_before": hub.get("avg_distance_before", 0),
        "avg_distance_after": hub.get("avg_distance_after", 0),
        "accessibility_improvement": hub.get("accessibility_improvement", 0),
        "nearby_communities": nearby,
        "mode": state.hub_result.get("mode", "population")
    }


@router.post("/api/hubs/before-after")
def compare_hubs_before_after():
    """Get before/after comparison with current hub optimization."""
    if state.hub_result is None or state.communities_df is None:
        raise HTTPException(status_code=400, detail="Run hub optimization first.")

    ba = compute_before_after(state.communities_df, state.hub_result["hub_locations"])

    # Per-community before/after
    community_comparison = []
    for _, row in state.communities_df.iterrows():
        community_comparison.append({
            "location_id": row.get("location_id", ""),
            "village_name": row.get("village_name", ""),
            "distance_before": float(row.get("distance_to_nearest_specialist_km", 0)),
            "equity_score": float(row.get("equity_score", 0)),
        })

    return {
        "overall": ba,
        "communities": community_comparison[:100],
        "total_communities": len(state.communities_df)
    }


# ========================== WHAT-IF ENDPOINTS ==========================

@router.post("/api/whatif/simulate")
def simulate_whatif(hub_min: int = 1, hub_max: int = 10, mode: str = "population"):
    """Run what-if simulation across hub range."""
    if state.communities_df is None:
        raise HTTPException(status_code=400, detail="No data loaded.")

    hub_max = min(hub_max, 10)
    hub_min = max(hub_min, 1)

    results = simulate_scenarios(state.communities_df.copy(), hub_range=(hub_min, hub_max), mode=mode)

    return {
        "scenarios": results,
        "mode": mode,
        "hub_range": [hub_min, hub_max]
    }


@router.post("/api/whatif/compare-modes")
def compare_whatif_modes(n_hubs: int = 3):
    """Compare population-first vs equity-first optimization."""
    if state.communities_df is None:
        raise HTTPException(status_code=400, detail="No data loaded.")

    comparison = compare_modes(state.communities_df.copy(), n_hubs=n_hubs)

    return {
        "n_hubs": n_hubs,
        "comparison": comparison,
        "disclaimer": "Neither mode is inherently 'better'. They optimize for different objectives."
    }


# ========================== SCENARIO ENDPOINTS ==========================

@router.post("/api/scenarios/save")
def save_scenario(name: str, n_hubs: int = 3, mode: str = "population"):
    """Save current analysis as a named scenario."""
    if state.hub_result is None:
        raise HTTPException(status_code=400, detail="Run hub optimization first to save a scenario.")

    params = {"n_hubs": n_hubs, "mode": mode}
    results = {
        "hub_locations": state.hub_result.get("hub_locations", []),
        "overall_metrics": state.hub_result.get("overall_metrics", {}),
        "clustering": {
            "k": state.clustering_result.get("k") if state.clustering_result else None,
            "silhouette_score": state.clustering_result.get("silhouette_score") if state.clustering_result else None,
        }
    }

    state.scenario_manager.save_scenario(name, params, results)
    return {"message": f"Scenario '{name}' saved successfully."}


@router.get("/api/scenarios/list")
def list_scenarios():
    """List all saved scenarios."""
    names = state.scenario_manager.list_scenarios()
    scenarios = []
    for name in names:
        s = state.scenario_manager.get_scenario(name)
        scenarios.append({
            "name": name,
            "params": s.get("params", {}),
            "summary": {
                "total_pop_covered": s.get("results", {}).get("overall_metrics", {}).get("total_pop_covered", 0),
                "n_hubs": s.get("params", {}).get("n_hubs", 0),
                "mode": s.get("params", {}).get("mode", ""),
            }
        })
    return {"scenarios": scenarios}


@router.post("/api/scenarios/compare")
def compare_scenarios_endpoint(names: List[str]):
    """Compare multiple saved scenarios."""
    comparison = state.scenario_manager.compare_scenarios(names)

    table = []
    for name, data in comparison.items():
        metrics = data.get("results", {}).get("overall_metrics", {})
        params = data.get("params", {})
        table.append({
            "name": name,
            "n_hubs": params.get("n_hubs", 0),
            "mode": params.get("mode", ""),
            "total_pop_covered": metrics.get("total_pop_covered", 0),
            "vulnerable_pop_covered": metrics.get("vulnerable_pop_covered", 0),
            "avg_improvement": metrics.get("avg_improvement", 0),
        })

    return {"comparison_table": table}


@router.delete("/api/scenarios/{name}")
def delete_scenario(name: str):
    """Delete a saved scenario."""
    if state.scenario_manager.delete_scenario(name):
        return {"message": f"Scenario '{name}' deleted."}
    raise HTTPException(status_code=404, detail=f"Scenario '{name}' not found.")


# ========================== DASHBOARD ENDPOINT ==========================

@router.get("/api/dashboard/stats")
def get_dashboard_stats():
    """Get all dashboard KPI statistics."""
    if state.communities_df is None:
        auto_load_real_data()

    if state.communities_df is None:
        return {
            "data_loaded": False,
            "is_demo": False,
            "is_real": False,
            "total_population": 0,
            "total_facilities": 0,
            "total_specialists": 0,
            "underserved_count": 0,
            "avg_specialist_distance": 0,
            "current_equity_score": 0,
            "optimized_equity_score": 0,
            "population_coverage": 0,
        }

    df = state.communities_df
    total_pop = int(df["population"].sum())
    n_fac = len(state.facilities_df) if state.facilities_df is not None else 0
    n_spec = len(state.specialists_df) if state.specialists_df is not None else 0
    avg_spec_dist = float(df["distance_to_nearest_specialist_km"].mean())
    current_eq = float(df["equity_score"].mean()) if "equity_score" in df.columns else 0

    # Underserved count
    underserved_count = 0
    if state.underserved_df is not None:
        underserved_count = len(state.underserved_df)
    else:
        flagged = detect_underserved(df.copy())
        underserved_count = len(flagged)

    # Optimized equity score (if hubs have been computed)
    optimized_eq = current_eq
    pop_coverage = 0
    if state.hub_result:
        metrics = state.hub_result.get("overall_metrics", {})
        pop_coverage = metrics.get("total_pop_covered", 0)
        improvement = metrics.get("avg_improvement", 0)
        optimized_eq = min(100, current_eq + improvement * 0.5)

    return {
        "data_loaded": True,
        "is_demo": False,
        "is_real": True,
        "total_population": total_pop,
        "total_facilities": n_fac,
        "total_specialists": n_spec,
        "underserved_count": underserved_count,
        "avg_specialist_distance": round(avg_spec_dist, 2),
        "current_equity_score": round(current_eq, 2),
        "optimized_equity_score": round(optimized_eq, 2),
        "population_coverage": pop_coverage,
        "communities_count": len(df),
    }


# ========================== MAP DATA ENDPOINT ==========================

@router.get("/api/map/data")
def get_map_data():
    """Get all map layer data for the accessibility map."""
    ensure_data_loaded()

    df = state.communities_df
    if df is None or len(df) == 0:
        raise HTTPException(status_code=400, detail="No data available.")

    communities = []
    for _, row in df.iterrows():
        lat = float(row["latitude"] if "latitude" in row else row["lat"])
        lon = float(row["longitude"] if "longitude" in row else row["lon"])
        communities.append({
            "location_id": str(row.get("location_id", "")),
            "village_name": str(row.get("village_name", "")),
            "lat": lat,
            "lon": lon,
            "population": int(row.get("population", 0)),
            "equity_score": float(row.get("equity_score", 0)) if "equity_score" in row else 0,
            "cluster": int(row.get("cluster", -1)) if "cluster" in row else -1,
            "specialist_distance": float(row.get("distance_to_nearest_specialist_km", 0)),
            "connectivity": float(row.get("internet_connectivity", 0)),
        })

    # Facilities layer (sample up to 400 for smooth browser rendering)
    facilities = []
    if state.facilities_df is not None and len(state.facilities_df) > 0:
        sample_fac = state.facilities_df.head(400) if len(state.facilities_df) > 400 else state.facilities_df
        for _, row in sample_fac.iterrows():
            lat = float(row["lat"] if "lat" in row else row["latitude"])
            lon = float(row["lon"] if "lon" in row else row["longitude"])
            facilities.append({
                "facility_id": str(row.get("facility_id", "")),
                "facility_name": str(row.get("facility_name", "")),
                "facility_type": str(row.get("facility_type", "")),
                "lat": lat,
                "lon": lon,
                "doctors": int(row.get("doctors", 0)),
                "specialists": int(row.get("specialists", 0)) if "specialists" in row else 0,
            })

    # Specialists layer (sample up to 150)
    specialists = []
    if state.specialists_df is not None and len(state.specialists_df) > 0:
        sample_spec = state.specialists_df.head(150) if len(state.specialists_df) > 150 else state.specialists_df
        for _, row in sample_spec.iterrows():
            lat = float(row["lat"] if "lat" in row else row["latitude"])
            lon = float(row["lon"] if "lon" in row else row["longitude"])
            specialists.append({
                "specialist_id": str(row.get("specialist_id", "")),
                "center_name": str(row.get("center_name", "")),
                "lat": lat,
                "lon": lon,
                "specialty": str(row.get("specialty", "")),
            })

    # Ensure underserved areas are detected for map overlay
    if state.underserved_df is None:
        state.underserved_df = detect_underserved(df.copy())

    underserved = []
    if state.underserved_df is not None:
        for _, row in state.underserved_df.iterrows():
            lat = float(row["latitude"] if "latitude" in row else row["lat"])
            lon = float(row["longitude"] if "longitude" in row else row["lon"])
            underserved.append({
                "location_id": str(row.get("location_id", "")),
                "village_name": str(row.get("village_name", "")),
                "lat": lat,
                "lon": lon,
                "priority": str(row.get("priority", "Medium")),
                "equity_score": float(row.get("equity_score", 0)),
                "specialist_distance": float(row.get("distance_to_nearest_specialist_km", 0)),
            })

    # Ensure hub optimization is computed for map overlay
    if state.hub_result is None:
        opt_res = optimize_hubs(df.copy(), n_hubs=3, mode="equity")
        state.hub_result = opt_res
        for hub in opt_res["hub_locations"]:
            hub["explanation"] = generate_hub_explanation(hub, df)

    hubs = []
    if state.hub_result:
        for h in state.hub_result.get("hub_locations", []):
            hubs.append(h)

    center_lat = float(df["latitude"].mean()) if "latitude" in df else 22.5
    center_lon = float(df["longitude"].mean()) if "longitude" in df else 78.5

    return {
        "communities": communities,
        "facilities": facilities,
        "specialists": specialists,
        "underserved": underserved,
        "hubs": hubs,
        "center_lat": round(center_lat, 4),
        "center_lon": round(center_lon, 4),
    }


# ========================== RESEARCH ENDPOINTS ==========================

@router.get("/api/research/methodology")
def get_methodology():
    """Get methodology documentation."""
    return {
        "sections": [
            {
                "title": "K-Means Clustering",
                "content": "K-Means partitions communities into K clusters based on healthcare accessibility features (not just geographic coordinates). Features include population, elderly/low-income ratios, distances to clinics and specialists, doctor availability, connectivity, and healthcare utilization metrics. All features are standardized using StandardScaler before clustering."
            },
            {
                "title": "K Selection",
                "content": "Optimal K is determined using two methods: (1) Elbow Method - plots inertia (within-cluster sum of squares) vs K to find the 'elbow' point, (2) Silhouette Score - measures how similar each point is to its own cluster vs other clusters. The K with the highest silhouette score is suggested."
            },
            {
                "title": "Feature Engineering",
                "content": "12 features are used for clustering: population, elderly_population, low_income_population, distance_to_nearest_clinic_km, distance_to_nearest_specialist_km, doctors_available, specialist_available, internet_connectivity, road_accessibility, healthcare_visits, emergency_cases, telemedicine_usage."
            },
            {
                "title": "Healthcare Equity Score",
                "content": "A weighted composite score (0-100) combining: specialist distance (25%), clinic distance (15%), vulnerability (20%), demand (15%), connectivity (15%), road access (10%). Higher scores indicate better healthcare equity. DISCLAIMER: These weights are modeling assumptions, NOT official medical or policy standards."
            },
            {
                "title": "Underserved Detection",
                "content": "Communities are flagged as underserved if they meet any of: equity score below threshold, specialist distance above threshold, or internet connectivity below threshold. Each flagged community receives a priority classification (Critical/High/Medium) and a plain-language explanation of why it was flagged."
            },
            {
                "title": "Hub Optimization",
                "content": "The optimizer uses weighted facility-location optimization. Starting with K-Means++ initialization on population-weighted or equity-weighted coordinates, it refines hub locations by evaluating candidate community sites. Two modes are available: Population-first (maximizes total population coverage) and Equity-first (prioritizes underserved/vulnerable communities)."
            },
            {
                "title": "Assumptions & Limitations",
                "content": "This is an academic decision-support prototype. Key limitations: (1) Synthetic demo data - not real healthcare data, (2) Distance is straight-line (haversine), not actual travel distance, (3) Equity weights are assumptions, (4) Does not account for political, budgetary, or regulatory constraints, (5) Not validated against real-world outcomes, (6) Should not be used for actual medical or policy decisions without expert review."
            }
        ]
    }


@router.get("/api/research/metrics")
def get_research_metrics():
    """Get all research/technical metrics from the current analysis."""
    metrics = {
        "data_loaded": state.data_loaded,
        "dataset": {},
        "clustering": {},
        "optimization": {},
    }

    if state.communities_df is not None:
        df = state.communities_df
        metrics["dataset"] = {
            "n_communities": len(df),
            "n_facilities": len(state.facilities_df) if state.facilities_df is not None else 0,
            "n_specialists": len(state.specialists_df) if state.specialists_df is not None else 0,
            "total_population": int(df["population"].sum()),
            "avg_population": float(df["population"].mean()),
            "geographic_bounds": {
                "lat_min": float(df["latitude"].min()),
                "lat_max": float(df["latitude"].max()),
                "lon_min": float(df["longitude"].min()),
                "lon_max": float(df["longitude"].max()),
            }
        }

    if state.clustering_result:
        metrics["clustering"] = {
            "k": state.clustering_result.get("k"),
            "silhouette_score": state.clustering_result.get("silhouette_score"),
            "inertia": state.clustering_result.get("inertia"),
            "cluster_sizes": state.clustering_result.get("cluster_sizes"),
            "runtime_seconds": state.clustering_result.get("runtime"),
        }

    if state.hub_result:
        metrics["optimization"] = {
            "n_hubs": state.hub_result.get("n_hubs"),
            "mode": state.hub_result.get("mode"),
            "runtime_seconds": state.hub_result.get("runtime"),
            "overall_metrics": state.hub_result.get("overall_metrics"),
        }

    if state.equity_scores is not None:
        metrics["equity"] = {
            "mean_score": float(state.equity_scores.mean()),
            "median_score": float(state.equity_scores.median()),
            "min_score": float(state.equity_scores.min()),
            "max_score": float(state.equity_scores.max()),
        }

    return metrics


# ========================== REPORT ENDPOINT ==========================

@router.post("/api/reports/generate")
def generate_report():
    """Generate a PDF research report."""
    if state.communities_df is None:
        raise HTTPException(status_code=400, detail="No data loaded.")

    from app.reports.generator import generate_pdf_report

    os.makedirs(settings.REPORTS_DIR, exist_ok=True)
    filename = f"clinic_cluster_report_{int(time.time())}.pdf"
    filepath = os.path.join(settings.REPORTS_DIR, filename)

    analysis_data = {
        "communities_df": state.communities_df,
        "facilities_df": state.facilities_df,
        "specialists_df": state.specialists_df,
        "clustering_result": state.clustering_result,
        "cluster_profiles": state.cluster_profiles,
        "equity_scores": state.equity_scores,
        "underserved_df": state.underserved_df,
        "hub_result": state.hub_result,
    }

    generate_pdf_report(analysis_data, filepath)

    return {
        "message": "Report generated successfully",
        "filename": filename,
        "download_url": f"/api/reports/download/{filename}"
    }


@router.get("/api/reports/download/{filename}")
def download_report(filename: str):
    """Download a generated PDF report."""
    filepath = os.path.join(settings.REPORTS_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Report not found.")
    return FileResponse(filepath, media_type="application/pdf", filename=filename)
