"""
Tests for the ML clustering module.
"""
import sys
import os
import numpy as np
import pandas as pd
import pytest

# Add the backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.ml.clustering import find_optimal_k, run_kmeans, generate_cluster_profiles
from app.ml.preprocessing import preprocess_for_clustering


def make_test_df(n=100, seed=42):
    """Create a simple test DataFrame."""
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


class TestFindOptimalK:
    def test_returns_valid_structure(self):
        df = make_test_df()
        X, features, scaler = preprocess_for_clustering(df)
        result = find_optimal_k(X, k_range=(2, 6))
        assert "elbow_scores" in result
        assert "silhouette_scores" in result
        assert "suggested_k" in result
        assert len(result["elbow_scores"]) == 5  # k=2..6
        assert result["suggested_k"] >= 2

    def test_small_dataset(self):
        df = make_test_df(n=5)
        X, features, scaler = preprocess_for_clustering(df)
        result = find_optimal_k(X, k_range=(2, 4))
        assert result["suggested_k"] >= 2
        assert len(result["elbow_scores"]) > 0


class TestRunKmeans:
    def test_basic_clustering(self):
        df = make_test_df()
        X, features, scaler = preprocess_for_clustering(df)
        result = run_kmeans(X, k=4)
        assert len(result["labels"]) == len(df)
        assert result["silhouette_score"] > -1
        assert result["silhouette_score"] <= 1
        assert len(result["cluster_sizes"]) == 4
        assert sum(result["cluster_sizes"].values()) == len(df)

    def test_reproducible_with_seed(self):
        df = make_test_df()
        X, features, scaler = preprocess_for_clustering(df)
        r1 = run_kmeans(X, k=3, seed=42)
        r2 = run_kmeans(X, k=3, seed=42)
        assert r1["labels"] == r2["labels"]

    def test_k_larger_than_samples(self):
        df = make_test_df(n=3)
        X, features, scaler = preprocess_for_clustering(df)
        result = run_kmeans(X, k=10)
        assert len(result["labels"]) == 3


class TestClusterProfiles:
    def test_generates_profiles(self):
        df = make_test_df()
        X, features, scaler = preprocess_for_clustering(df)
        result = run_kmeans(X, k=3)
        df["cluster"] = result["labels"]
        profiles = generate_cluster_profiles(df, features)
        assert len(profiles) == 3
        for p in profiles:
            assert "cluster_id" in p
            assert "size" in p
            assert "label" in p
            assert "mean_values" in p
            assert "description" in p
            assert p["size"] > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
