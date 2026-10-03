"""
Tests for the healthcare equity score module.
"""
import sys
import os
import numpy as np
import pandas as pd
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.ml.equity_score import (
    compute_equity_score, get_score_breakdown,
    get_formula_description, DEFAULT_WEIGHTS
)


def make_test_row():
    """Create a test row (Series)."""
    return pd.Series({
        "population": 5000,
        "elderly_population": 800,
        "low_income_population": 2000,
        "distance_to_nearest_clinic_km": 10,
        "distance_to_nearest_specialist_km": 30,
        "doctors_available": 2,
        "specialist_available": 0,
        "internet_connectivity": 0.5,
        "road_accessibility": 0.6,
        "healthcare_visits": 1200,
        "emergency_cases": 150,
        "telemedicine_usage": 0.3,
    })


def make_test_df(n=50):
    np.random.seed(42)
    return pd.DataFrame({
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


class TestComputeEquityScore:
    def test_single_row(self):
        row = make_test_row()
        score = compute_equity_score(row)
        assert isinstance(score, float)
        assert 0 <= score <= 100

    def test_dataframe(self):
        df = make_test_df()
        scores = compute_equity_score(df)
        assert len(scores) == len(df)
        assert all(0 <= s <= 100 for s in scores)

    def test_custom_weights(self):
        row = make_test_row()
        custom_weights = {
            "specialist_distance": 0.5,
            "clinic_distance": 0.1,
            "vulnerability": 0.1,
            "demand": 0.1,
            "connectivity": 0.1,
            "road_access": 0.1,
        }
        score1 = compute_equity_score(row, DEFAULT_WEIGHTS)
        score2 = compute_equity_score(row, custom_weights)
        # Different weights should give different scores
        assert score1 != score2

    def test_extreme_values(self):
        # Perfect access
        perfect = pd.Series({
            "population": 5000,
            "elderly_population": 100,
            "low_income_population": 200,
            "distance_to_nearest_clinic_km": 0,
            "distance_to_nearest_specialist_km": 0,
            "internet_connectivity": 1.0,
            "road_accessibility": 1.0,
            "healthcare_visits": 5000,
        })
        score = compute_equity_score(perfect)
        assert score > 80  # Should be high

        # Terrible access
        terrible = pd.Series({
            "population": 5000,
            "elderly_population": 2500,
            "low_income_population": 4500,
            "distance_to_nearest_clinic_km": 50,
            "distance_to_nearest_specialist_km": 100,
            "internet_connectivity": 0.0,
            "road_accessibility": 0.0,
            "healthcare_visits": 100,
        })
        score2 = compute_equity_score(terrible)
        assert score2 < score  # Should be lower


class TestScoreBreakdown:
    def test_breakdown_structure(self):
        row = make_test_row()
        breakdown = get_score_breakdown(row)
        assert "specialist_distance" in breakdown
        assert "clinic_distance" in breakdown
        assert "vulnerability" in breakdown
        assert "demand" in breakdown
        assert "connectivity" in breakdown
        assert "road_access" in breakdown
        for key, val in breakdown.items():
            assert "score" in val
            assert "weight" in val
            assert 0 <= val["score"] <= 1


class TestFormulaDescription:
    def test_returns_string(self):
        desc = get_formula_description()
        assert isinstance(desc, str)
        assert len(desc) > 50
        assert "DISCLAIMER" in desc or "disclaimer" in desc.lower()


class TestDefaultWeights:
    def test_weights_sum_to_one(self):
        total = sum(DEFAULT_WEIGHTS.values())
        assert abs(total - 1.0) < 0.01


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
