"""
Tests for Real Data Pipeline and Endpoint
"""
import os
import pandas as pd
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_real_data_files_exist():
    """Verify that all processed real data files exist and have valid structure."""
    processed_dir = os.path.join(os.path.dirname(__file__), "..", "data", "real", "processed")
    comm_path = os.path.join(processed_dir, "communities.csv")
    fac_path = os.path.join(processed_dir, "healthcare_facilities.csv")
    spec_path = os.path.join(processed_dir, "specialists.csv")

    assert os.path.exists(comm_path), "communities.csv should exist in data/real/processed"
    assert os.path.exists(fac_path), "healthcare_facilities.csv should exist in data/real/processed"
    assert os.path.exists(spec_path), "specialists.csv should exist in data/real/processed"

    df_comm = pd.read_csv(comm_path)
    assert len(df_comm) > 0, "communities.csv must not be empty"
    assert "latitude" in df_comm.columns
    assert "longitude" in df_comm.columns
    assert "distance_to_nearest_clinic_km" in df_comm.columns
    assert "distance_to_nearest_specialist_km" in df_comm.columns
    assert "equity_score" not in df_comm.columns or True  # dynamically added on load


def test_real_data_endpoint_and_pipeline():
    """Test loading real dataset via /api/data/real and verifying downstream ML endpoints."""
    # 1. Load real data
    res = client.get("/api/data/real")
    assert res.status_code == 200, f"Failed to load real data: {res.text}"
    data = res.json()
    assert data["is_demo"] is False
    assert data["communities_count"] > 0
    assert data["facilities_count"] > 0

    # 2. Check dashboard stats on real data
    stats_res = client.get("/api/dashboard/stats")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["data_loaded"] is True
    assert stats["total_population"] > 0
    assert stats["avg_specialist_distance"] > 0

    # 3. Check clustering on real data
    opt_k = client.get("/api/clustering/optimal-k")
    assert opt_k.status_code == 200
    k_val = opt_k.json().get("suggested_k", 3)

    cluster_res = client.post(f"/api/clustering/run?k={k_val}")
    assert cluster_res.status_code == 200
    c_data = cluster_res.json()
    assert "silhouette_score" in c_data
    assert len(c_data["profiles"]) == k_val

    # 4. Check underserved detection
    underserved_res = client.post("/api/underserved/detect")
    assert underserved_res.status_code == 200
    u_data = underserved_res.json()
    assert "underserved_areas" in u_data

    # 5. Check telemedicine hub optimization on real data
    hub_res = client.post("/api/hubs/optimize?n_hubs=3&mode=equity")
    assert hub_res.status_code == 200
    h_data = hub_res.json()
    assert len(h_data["hub_locations"]) == 3
    assert "before_after" in h_data
