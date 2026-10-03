import pandas as pd
from typing import Dict, Union, Any

DEFAULT_WEIGHTS = {
    "specialist_distance": 0.25,
    "clinic_distance": 0.15,
    "vulnerability": 0.20,
    "demand": 0.15,
    "connectivity": 0.15,
    "road_access": 0.10
}

def compute_equity_score(row_or_df: Union[pd.Series, pd.DataFrame], weights: Dict[str, float] = None) -> Union[float, pd.Series]:
    if weights is None:
        weights = DEFAULT_WEIGHTS
        
    def _compute_single(row):
        specialist_distance_score = max(0.0, 1.0 - row.get('distance_to_nearest_specialist_km', 0) / 100.0)
        clinic_distance_score = max(0.0, 1.0 - row.get('distance_to_nearest_clinic_km', 0) / 50.0)
        
        elderly_pct = row.get('elderly_population', 0) / max(row.get('population', 1), 1)
        low_income_pct = row.get('low_income_population', 0) / max(row.get('population', 1), 1)
        vulnerability_score = max(0.0, 1.0 - (elderly_pct + low_income_pct) / 2.0)
        
        healthcare_visits = row.get('healthcare_visits', 0)
        pop = max(row.get('population', 1), 1)
        demand_score = min(1.0, healthcare_visits / pop)
        
        connectivity_score = min(1.0, max(0.0, row.get('internet_connectivity', 0.5)))
        road_access_score = min(1.0, max(0.0, row.get('road_accessibility', 0.5)))
        
        score = (
            specialist_distance_score * weights.get('specialist_distance', 0) +
            clinic_distance_score * weights.get('clinic_distance', 0) +
            vulnerability_score * weights.get('vulnerability', 0) +
            demand_score * weights.get('demand', 0) +
            connectivity_score * weights.get('connectivity', 0) +
            road_access_score * weights.get('road_access', 0)
        )
        return score * 100.0
        
    if isinstance(row_or_df, pd.DataFrame):
        return row_or_df.apply(_compute_single, axis=1)
    else:
        return _compute_single(row_or_df)

def get_score_breakdown(row: pd.Series, weights: Dict[str, float] = None) -> Dict[str, Any]:
    if weights is None:
        weights = DEFAULT_WEIGHTS
        
    specialist_distance_score = max(0.0, 1.0 - row.get('distance_to_nearest_specialist_km', 0) / 100.0)
    clinic_distance_score = max(0.0, 1.0 - row.get('distance_to_nearest_clinic_km', 0) / 50.0)
    
    elderly_pct = row.get('elderly_population', 0) / max(row.get('population', 1), 1)
    low_income_pct = row.get('low_income_population', 0) / max(row.get('population', 1), 1)
    vulnerability_score = max(0.0, 1.0 - (elderly_pct + low_income_pct) / 2.0)
    
    healthcare_visits = row.get('healthcare_visits', 0)
    pop = max(row.get('population', 1), 1)
    demand_score = min(1.0, healthcare_visits / pop)
    
    connectivity_score = min(1.0, max(0.0, row.get('internet_connectivity', 0.5)))
    road_access_score = min(1.0, max(0.0, row.get('road_accessibility', 0.5)))
    
    return {
        "specialist_distance": {"score": specialist_distance_score, "weight": weights.get('specialist_distance', 0)},
        "clinic_distance": {"score": clinic_distance_score, "weight": weights.get('clinic_distance', 0)},
        "vulnerability": {"score": vulnerability_score, "weight": weights.get('vulnerability', 0)},
        "demand": {"score": demand_score, "weight": weights.get('demand', 0)},
        "connectivity": {"score": connectivity_score, "weight": weights.get('connectivity', 0)},
        "road_access": {"score": road_access_score, "weight": weights.get('road_access', 0)}
    }

def get_formula_description() -> str:
    return (
        "Equity Score Formula:\n"
        "Score is a weighted sum (scaled 0-100) of normalized components:\n"
        "- specialist_distance_score = max(0, 1 - dist_specialist/100)\n"
        "- clinic_distance_score = max(0, 1 - dist_clinic/50)\n"
        "- vulnerability_score = 1 - (elderly_pct + low_income_pct)/2\n"
        "- demand_score = healthcare_visits / population\n"
        "- connectivity_score = internet_connectivity\n"
        "- road_access_score = road_accessibility\n\n"
        "DISCLAIMER: These weights and thresholds are mathematical modeling assumptions "
        "and do NOT represent official medical standards."
    )
