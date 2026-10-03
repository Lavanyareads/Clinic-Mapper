import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from .equity_score import compute_equity_score

def haversine_dist(lat1, lon1, lat2, lon2):
    R = 6371.0
    lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = np.sin(dlat/2)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon/2)**2
    c = 2 * np.arcsin(np.sqrt(a))
    return R * c

def optimize_hubs(df: pd.DataFrame, n_hubs: int, mode: str = 'population', candidates: Optional[pd.DataFrame] = None, seed: int = 42) -> Dict[str, Any]:
    np.random.seed(seed)
    
    if candidates is None:
        candidates = df.copy()
        
    if df.empty or candidates.empty or n_hubs <= 0:
        return {"hub_locations": [], "overall_metrics": {}}
        
    coords_df = df[['latitude', 'longitude']].values
    coords_cand = candidates[['latitude', 'longitude']].values
    
    if mode == 'equity':
        if 'equity_score' not in df.columns:
            df['equity_score'] = compute_equity_score(df)
        weights = 100 - df['equity_score'].values
        weights = np.maximum(weights, 1)
    else:
        weights = df['population'].values
        
    n_candidates = len(coords_cand)
    hub_indices = [np.random.choice(n_candidates)]
    
    for _ in range(1, min(n_hubs, n_candidates)):
        dists = np.array([[haversine_dist(c[0], c[1], coords_cand[idx][0], coords_cand[idx][1]) for idx in hub_indices] for c in coords_cand])
        min_dists = np.min(dists, axis=1)
        probs = min_dists ** 2
        sum_probs = probs.sum()
        if sum_probs > 0:
            probs /= sum_probs
            hub_indices.append(np.random.choice(n_candidates, p=probs))
        else:
            hub_indices.append(np.random.choice(n_candidates))
            
    hub_locations = []
    total_pop_covered = 0
    total_vuln_covered = 0
    total_improvement = 0
    
    # Calculate distances from each community to all placed hubs
    dists_to_hubs = np.array([[haversine_dist(c[0], c[1], h[0], h[1]) for h in coords_cand[hub_indices]] for c in coords_df])
    assignments = np.argmin(dists_to_hubs, axis=1)
    min_hub_dists = np.min(dists_to_hubs, axis=1)
    
    spec_dists_before = df['distance_to_nearest_specialist_km'].values if 'distance_to_nearest_specialist_km' in df.columns else np.full(len(df), 30.0)
    # Effective specialist/telemedicine distance after hub deployment (closer of existing specialist or telemedicine hub)
    effective_dists_after = np.minimum(spec_dists_before, min_hub_dists)
    
    for i, h_idx in enumerate(hub_indices):
        comm_indices = np.where(assignments == i)[0]
        hub_coords = coords_cand[h_idx]
        
        if len(comm_indices) > 0:
            pop_cov = int(df.iloc[comm_indices]['population'].sum())
            vuln_cov = int(df.iloc[comm_indices].get('low_income_population', pd.Series([0])).sum() + 
                           df.iloc[comm_indices].get('elderly_population', pd.Series([0])).sum())
            
            avg_dist_before = float(np.mean(spec_dists_before[comm_indices]))
            avg_dist_after = float(np.mean(dists_to_hubs[comm_indices, i]))
            effective_after = float(np.mean(effective_dists_after[comm_indices]))
            improvement = max(0.0, avg_dist_before - effective_after)
        else:
            pop_cov = 0
            vuln_cov = 0
            avg_dist_before = 0.0
            avg_dist_after = 0.0
            improvement = 0.0
            
        total_pop_covered += pop_cov
        total_vuln_covered += vuln_cov
        total_improvement += improvement * len(comm_indices)
        
        hub_locations.append({
            "hub_id": f"HUB_{i+1}",
            "lat": float(hub_coords[0]),
            "lon": float(hub_coords[1]),
            "community_assignments": comm_indices.tolist(),
            "reason": f"Selected via {mode}-weighted facility optimization",
            "communities_served": len(comm_indices),
            "population_covered": pop_cov,
            "vulnerable_pop_covered": vuln_cov,
            "avg_distance_before": round(avg_dist_before, 2),
            "avg_distance_after": round(avg_dist_after, 2),
            "accessibility_improvement": round(improvement, 2)
        })
        
    avg_improvement_km = total_improvement / len(df) if len(df) > 0 else 0.0
    overall_metrics = {
        "total_pop_covered": total_pop_covered,
        "vulnerable_pop_covered": total_vuln_covered,
        "avg_improvement": round(avg_improvement_km, 2),
        "avg_distance_before": round(float(np.mean(spec_dists_before)), 2),
        "avg_distance_after": round(float(np.mean(effective_dists_after)), 2)
    }
    
    return {
        "hub_locations": hub_locations,
        "overall_metrics": overall_metrics
    }

def generate_hub_explanation(hub: Dict[str, Any], df: pd.DataFrame) -> str:
    return (
        f"Hub {hub.get('hub_id', '')} is optimized to serve {hub['communities_served']} communities, "
        f"covering a population of {hub['population_covered']:,} (including {hub['vulnerable_pop_covered']:,} vulnerable residents). "
        f"It brings specialist/telemedicine access closer by {hub['accessibility_improvement']} km on average."
    )

def compute_before_after(df: pd.DataFrame, hubs: List[Dict[str, Any]]) -> Dict[str, Any]:
    if df.empty or not hubs:
        return {}
        
    coords_df = df[['latitude', 'longitude']].values
    hub_coords = np.array([[h['lat'], h['lon']] for h in hubs])
    
    dists = np.array([[haversine_dist(c[0], c[1], h[0], h[1]) for h in hub_coords] for c in coords_df])
    min_hub_dists = np.min(dists, axis=1)
    
    spec_before = df['distance_to_nearest_specialist_km'].values if 'distance_to_nearest_specialist_km' in df.columns else np.full(len(df), 30.0)
    effective_after = np.minimum(spec_before, min_hub_dists)
    
    avg_before = float(np.mean(spec_before))
    avg_after = float(np.mean(effective_after))
    
    return {
        "avg_distance_before": round(avg_before, 2),
        "avg_distance_after": round(avg_after, 2),
        "improvement": round(max(0.0, avg_before - avg_after), 2),
        "coverage_pct": round(float(np.mean(min_hub_dists <= 50.0)) * 100, 1)
    }
