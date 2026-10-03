import pandas as pd
from typing import Dict, Any
from .equity_score import compute_equity_score

def classify_priority(row: pd.Series) -> str:
    eq_score = row.get('equity_score', 100)
    if eq_score < 25:
        return 'Critical'
    elif eq_score < 40:
        return 'High'
    else:
        return 'Medium'

def detect_underserved(df: pd.DataFrame, equity_threshold: float = 35, specialist_dist_threshold: float = 30, connectivity_threshold: float = 0.4) -> pd.DataFrame:
    if 'equity_score' not in df.columns:
        df['equity_score'] = compute_equity_score(df)
        
    flagged = df[
        (df['equity_score'] <= equity_threshold) |
        (df.get('distance_to_nearest_specialist_km', 0) >= specialist_dist_threshold) |
        (df.get('internet_connectivity', 1.0) <= connectivity_threshold)
    ].copy()
    
    explanations = []
    priorities = []
    for _, row in flagged.iterrows():
        pop = row.get('population', 0)
        spec_dist = row.get('distance_to_nearest_specialist_km', 0)
        conn = row.get('internet_connectivity', 0)
        low_inc = (row.get('low_income_population', 0) / max(pop, 1)) * 100
        
        expl = f"High population ({int(pop)}) with specialist distance of {spec_dist:.1f}km, poor connectivity ({conn:.2f}), {low_inc:.1f}% low-income population"
        explanations.append(expl)
        priorities.append(classify_priority(row))
        
    flagged['underserved_explanation'] = explanations
    flagged['priority'] = priorities
    
    return flagged

def get_underserved_summary(flagged_df: pd.DataFrame) -> Dict[str, Any]:
    if flagged_df.empty:
        return {
            "total": 0,
            "by_priority": {"Critical": 0, "High": 0, "Medium": 0},
            "total_population_affected": 0,
            "avg_equity_score": 0.0
        }
        
    by_priority = flagged_df.groupby('priority').size().to_dict()
    total_pop = int(flagged_df.get('population', pd.Series([0])).sum())
    avg_eq = float(flagged_df.get('equity_score', pd.Series([0])).mean())
    
    return {
        "total": len(flagged_df),
        "by_priority": {
            "Critical": by_priority.get('Critical', 0),
            "High": by_priority.get('High', 0),
            "Medium": by_priority.get('Medium', 0)
        },
        "total_population_affected": total_pop,
        "avg_equity_score": avg_eq
    }
