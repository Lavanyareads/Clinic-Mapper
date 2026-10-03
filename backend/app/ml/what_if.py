import pandas as pd
from typing import Dict, Any, List
from .hub_optimizer import optimize_hubs
from .underserved import detect_underserved

def simulate_scenarios(df: pd.DataFrame, hub_range: tuple = (1, 10), mode: str = 'population') -> List[Dict[str, Any]]:
    results = []
    
    if df.empty:
        return results
        
    for n in range(hub_range[0], hub_range[1] + 1):
        opt = optimize_hubs(df, n_hubs=n, mode=mode)
        metrics = opt['overall_metrics']
        
        flagged = detect_underserved(df)
        underserved_rem = max(0, len(flagged) - n)
        
        results.append({
            "n_hubs": n,
            "pop_coverage": metrics.get('total_pop_covered', 0),
            "vulnerable_coverage": metrics.get('vulnerable_pop_covered', 0),
            "avg_distance": 0,
            "accessibility_improvement": metrics.get('avg_improvement', 0),
            "underserved_remaining": underserved_rem
        })
        
    return results

def compare_modes(df: pd.DataFrame, n_hubs: int) -> Dict[str, Any]:
    pop_opt = optimize_hubs(df, n_hubs, mode='population')
    eq_opt = optimize_hubs(df, n_hubs, mode='equity')
    
    pop_metrics = pop_opt['overall_metrics']
    eq_metrics = eq_opt['overall_metrics']
    
    return {
        "population_mode": {
            "total_pop_covered": pop_metrics.get('total_pop_covered', 0),
            "vulnerable_pop_covered": pop_metrics.get('vulnerable_pop_covered', 0),
            "avg_improvement": pop_metrics.get('avg_improvement', 0)
        },
        "equity_mode": {
            "total_pop_covered": eq_metrics.get('total_pop_covered', 0),
            "vulnerable_pop_covered": eq_metrics.get('vulnerable_pop_covered', 0),
            "avg_improvement": eq_metrics.get('avg_improvement', 0)
        }
    }
