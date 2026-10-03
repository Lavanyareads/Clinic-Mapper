"""
Tests for the hub optimizer module.
"""
import sys
import os
import numpy as np
import pandas as pd
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.ml.hub_optimizer import optimize_hubs, generate_hub_explanation, compute_before_after, haversine_dist
from app.ml.equity_score import compute_equity_score


def make_test_df(n=100, seed=42):
    np.random.seed(seed)
    return pd.DataFrame({
        "location_id": [f"C{i:03d}" for i in range(n)],
        "village_name": [f"Village_{i}" for i in range(n)],
        "latitude": np.random.uniform(22, 25, n),
        "longitude": np.random.uniform(76, 80, n),
        "population": np.random.randint(500, 20000, n),
        "elderly_population": np.random.randint(50, 3000, n),
        "low_income_population": np.random.randint(100, 10000, n),
        "distance_to_nearest_clinic_km": np.random.uniform(1, 40, n),
        "distance_to_nearest_specialist_km": np.random.uniform(5, 80, n),
        "doctors_available": np.random.randint(0, 5, n),
        "specialist_available": np.random.randint(0, 2, n),
        "internet_connectivity": np.random.uniform(0, 1, n),
        "road_accessibility": np.random.uniform(0, 1, n),
        "healthcare_visits": np.random.randint(100, 5000, n),
        "emergency_cases": np.random.randint(10, 500, n),
        "telemedicine_usage": np.random.uniform(0, 1, n),
    })


class TestHaversine:
    def test_same_point(self):
        assert haversine_dist(23.0, 77.0, 23.0, 77.0) == 0.0

    def test_known_distance(self):
        # Approximately 111 km per degree of latitude
        d = haversine_dist(23.0, 77.0, 24.0, 77.0)
        assert 110 < d < 112

    def test_symmetric(self):
        d1 = haversine_dist(23.0, 77.0, 24.0, 78.0)
        d2 = haversine_dist(24.0, 78.0, 23.0, 77.0)
        assert abs(d1 - d2) < 0.001


class TestOptimizeHubs:
    def test_population_mode(self):
        df = make_test_df()
        result = optimize_hubs(df, n_hubs=3, mode="population")
        assert "hub_locations" in result
        assert "overall_metrics" in result
        assert len(result["hub_locations"]) == 3
        for hub in result["hub_locations"]:
            assert "lat" in hub
            assert "lon" in hub
            assert "communities_served" in hub
            assert "population_covered" in hub
            assert hub["communities_served"] > 0

    def test_equity_mode(self):
        df = make_test_df()
        result = optimize_hubs(df, n_hubs=3, mode="equity")
        assert len(result["hub_locations"]) == 3
        for hub in result["hub_locations"]:
            assert hub["communities_served"] > 0

    def test_single_hub(self):
        df = make_test_df()
        result = optimize_hubs(df, n_hubs=1, mode="population")
        assert len(result["hub_locations"]) == 1
        # Single hub must serve all communities
        assert result["hub_locations"][0]["communities_served"] == len(df)

    def test_total_communities_assigned(self):
        df = make_test_df()
        result = optimize_hubs(df, n_hubs=5, mode="population")
        total_served = sum(h["communities_served"] for h in result["hub_locations"])
        assert total_served == len(df)

    def test_reproducible(self):
        df = make_test_df()
        r1 = optimize_hubs(df, n_hubs=3, seed=42)
        r2 = optimize_hubs(df, n_hubs=3, seed=42)
        for h1, h2 in zip(r1["hub_locations"], r2["hub_locations"]):
            assert h1["lat"] == h2["lat"]
            assert h1["lon"] == h2["lon"]

    def test_empty_df(self):
        df = pd.DataFrame()
        result = optimize_hubs(df, n_hubs=3)
        assert result["hub_locations"] == []


class TestHubExplanation:
    def test_generates_explanation(self):
        df = make_test_df()
        result = optimize_hubs(df, n_hubs=3)
        for hub in result["hub_locations"]:
            explanation = generate_hub_explanation(hub, df)
            assert isinstance(explanation, str)
            assert len(explanation) > 20
            assert "communities" in explanation.lower() or "population" in explanation.lower()


class TestBeforeAfter:
    def test_computes_comparison(self):
        df = make_test_df()
        result = optimize_hubs(df, n_hubs=3)
        ba = compute_before_after(df, result["hub_locations"])
        assert "avg_distance_before" in ba
        assert "avg_distance_after" in ba
        assert "improvement" in ba
        assert ba["avg_distance_before"] >= 0
        assert ba["avg_distance_after"] >= 0

    def test_empty_hubs(self):
        df = make_test_df()
        ba = compute_before_after(df, [])
        assert ba == {}


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
