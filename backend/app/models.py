from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class CommunityData(BaseModel):
    id: str
    population: int
    income: float
    distance_to_nearest_facility: float

class FacilityData(BaseModel):
    id: str
    capacity: int
    services_offered: List[str]

class SpecialistData(BaseModel):
    id: str
    specialty: str

class ClusteringRequest(BaseModel):
    k: Optional[int] = None

class ClusteringResult(BaseModel):
    k: int
    clusters: List[Dict[str, Any]]
    silhouette_score: Optional[float] = None

class EquityScoreRequest(BaseModel):
    weights: Optional[Dict[str, float]] = None

class EquityScoreResult(BaseModel):
    overall_score: float
    breakdown: Dict[str, Any]

class UnderservedRequest(BaseModel):
    thresholds: Dict[str, float]

class UnderservedResult(BaseModel):
    underserved_areas: List[Dict[str, Any]]

class HubOptimizationRequest(BaseModel):
    n_hubs: int
    mode: str = "population"

class HubOptimizationResult(BaseModel):
    hubs: List[Dict[str, Any]]
    metrics: Dict[str, Any]

class WhatIfRequest(BaseModel):
    scenario_params: Dict[str, Any]

class WhatIfResult(BaseModel):
    results: Dict[str, Any]

class ScenarioSaveRequest(BaseModel):
    name: str
    params: Dict[str, Any]
    results: Dict[str, Any]

class ScenarioCompareResult(BaseModel):
    comparison: Dict[str, Any]

class DataQualityReport(BaseModel):
    score: float
    issues: List[str]
    missing_values: int

class ReportRequest(BaseModel):
    include_sections: List[str]

class DashboardStats(BaseModel):
    total_population: int
    total_facilities: int
    avg_equity_score: float
    underserved_count: int
