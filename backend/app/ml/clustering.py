import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from typing import Dict, Any, List, Tuple

def find_optimal_k(X: np.ndarray, k_range: Tuple[int, int] = (2, 12)) -> Dict[str, Any]:
    if X.shape[0] < k_range[0]:
        return {"elbow_scores": [], "silhouette_scores": [], "suggested_k": 1}
        
    elbow_scores = []
    silhouette_scores = []
    max_k = min(k_range[1], X.shape[0] - 1)
    k_values = list(range(k_range[0], max_k + 1))
    
    for k in k_values:
        kmeans = KMeans(n_clusters=k, random_state=42, n_init='auto')
        labels = kmeans.fit_predict(X)
        elbow_scores.append(float(kmeans.inertia_))
        silhouette_scores.append(float(silhouette_score(X, labels)))
        
    suggested_k = k_values[np.argmax(silhouette_scores)] if silhouette_scores else 1
    
    return {
        "elbow_scores": elbow_scores,
        "silhouette_scores": silhouette_scores,
        "suggested_k": suggested_k
    }

def run_kmeans(X: np.ndarray, k: int, seed: int = 42) -> Dict[str, Any]:
    if X.shape[0] < k:
        k = X.shape[0]
    kmeans = KMeans(n_clusters=k, random_state=seed, n_init='auto')
    labels = kmeans.fit_predict(X)
    
    unique_labels, counts = np.unique(labels, return_counts=True)
    cluster_sizes = dict(zip([int(l) for l in unique_labels], [int(c) for c in counts]))
    
    n_samples = X.shape[0]
    sil_score = float(silhouette_score(X, labels)) if (1 < k < n_samples) else 0.0
    
    return {
        "labels": labels.tolist(),
        "centers": kmeans.cluster_centers_.tolist(),
        "inertia": float(kmeans.inertia_),
        "silhouette_score": sil_score,
        "cluster_sizes": cluster_sizes
    }

def generate_cluster_profiles(df_with_labels: pd.DataFrame, feature_names: List[str]) -> List[Dict[str, Any]]:
    profiles = []
    overall_means = df_with_labels[feature_names].mean()
    
    for cluster_id, group in df_with_labels.groupby('cluster'):
        cluster_means = group[feature_names].mean()
        size = len(group)
        
        label = "Average Access"
        desc = []
        if 'distance_to_nearest_specialist_km' in cluster_means and cluster_means['distance_to_nearest_specialist_km'] > overall_means.get('distance_to_nearest_specialist_km', 0) * 1.2:
            label = "High Demand / Poor Specialist Access"
            desc.append("very far from specialists")
        if 'low_income_population' in cluster_means and cluster_means['low_income_population'] > overall_means.get('low_income_population', 0) * 1.2:
            label = "Vulnerable / High Demand"
            desc.append("high low-income population")
        if 'internet_connectivity' in cluster_means and cluster_means['internet_connectivity'] < overall_means.get('internet_connectivity', 0) * 0.8:
            label = "Poor Connectivity"
            desc.append("limited internet connectivity")
            
        description = "This cluster is characterized by " + " and ".join(desc) if desc else "This cluster has average characteristics."
        
        profiles.append({
            "cluster_id": int(cluster_id),
            "size": int(size),
            "label": label,
            "mean_values": cluster_means.to_dict(),
            "description": description
        })
        
    return profiles
