import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from typing import Tuple, Dict, Any, List

def load_communities_csv(file_path_or_dataframe) -> pd.DataFrame:
    if isinstance(file_path_or_dataframe, pd.DataFrame):
        return file_path_or_dataframe.copy()
    return pd.read_csv(file_path_or_dataframe)

def load_facilities_csv(file_path_or_dataframe) -> pd.DataFrame:
    if isinstance(file_path_or_dataframe, pd.DataFrame):
        return file_path_or_dataframe.copy()
    return pd.read_csv(file_path_or_dataframe)

def load_specialists_csv(file_path_or_dataframe) -> pd.DataFrame:
    if isinstance(file_path_or_dataframe, pd.DataFrame):
        return file_path_or_dataframe.copy()
    return pd.read_csv(file_path_or_dataframe)

def validate_data(df: pd.DataFrame, required_columns: List[str]) -> Tuple[bool, List[str], List[str]]:
    errors = []
    warnings = []
    is_valid = True
    
    missing_cols = [col for col in required_columns if col not in df.columns]
    if missing_cols:
        errors.append(f"Missing required columns: {missing_cols}")
        is_valid = False
        
    for col in required_columns:
        if col in df.columns and df[col].isnull().all():
            errors.append(f"Column '{col}' is entirely null.")
            is_valid = False
        elif col in df.columns and df[col].isnull().any():
            warnings.append(f"Column '{col}' contains some null values.")
            
    return is_valid, errors, warnings

def compute_data_quality_score(df: pd.DataFrame) -> Dict[str, Any]:
    total_cells = df.size
    missing_cells = df.isnull().sum().sum()
    missing_pct = (missing_cells / total_cells) * 100 if total_cells > 0 else 100
    
    invalid_coords = 0
    if 'latitude' in df.columns and 'longitude' in df.columns:
        invalid_lats = df[(df['latitude'] < -90) | (df['latitude'] > 90)].shape[0]
        invalid_lons = df[(df['longitude'] < -180) | (df['longitude'] > 180)].shape[0]
        invalid_coords = invalid_lats + invalid_lons
        
    score = max(0, 100 - missing_pct - (invalid_coords / df.shape[0] * 10 if df.shape[0] > 0 else 0))
    
    return {
        "score": score,
        "missing_pct": missing_pct,
        "invalid_coords": invalid_coords,
        "stats": {
            "total_rows": df.shape[0],
            "total_columns": df.shape[1]
        }
    }

def preprocess_for_clustering(df: pd.DataFrame) -> Tuple[np.ndarray, List[str], StandardScaler]:
    features = [
        "population", "elderly_population", "low_income_population", 
        "distance_to_nearest_clinic_km", "distance_to_nearest_specialist_km", 
        "doctors_available", "specialist_available", "internet_connectivity", 
        "road_accessibility", "healthcare_visits", "emergency_cases", 
        "telemedicine_usage"
    ]
    
    actual_features = [f for f in features if f in df.columns]
    X_df = df[actual_features].copy()
    
    for col in actual_features:
        X_df[col] = X_df[col].fillna(X_df[col].median())
        
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_df)
    
    return X_scaled, actual_features, scaler
