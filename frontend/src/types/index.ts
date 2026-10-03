// =====================================================
// Clinic-Cluster Mapper - TypeScript Type Definitions
// All types match the backend API response shapes exactly.
// =====================================================

export interface Community {
  location_id: string;
  village_name: string;
  latitude: number;
  longitude: number;
  population: number;
  elderly_population: number;
  low_income_population: number;
  distance_to_nearest_clinic_km: number;
  distance_to_nearest_specialist_km: number;
  doctors_available: number;
  specialist_available: number;
  internet_connectivity: number;
  road_accessibility: number;
  healthcare_visits: number;
  emergency_cases: number;
  telemedicine_usage: number;
  equity_score?: number;
  cluster?: number;
}

export interface Facility {
  facility_id: string;
  facility_name: string;
  facility_type: string;
  lat: number;
  lon: number;
  doctors: number;
  specialists: number;
}

export interface Specialist {
  specialist_id: string;
  center_name: string;
  lat: number;
  lon: number;
  specialty: string;
}

export interface ClusterProfile {
  cluster_id: number;
  label: string;
  size: number;
  mean_values: Record<string, number>;
  description: string;
}

export interface ClusterResult {
  k: number;
  labels: number[];
  inertia: number;
  silhouette_score: number;
  cluster_sizes: Record<string, number>;
  profiles: ClusterProfile[];
  runtime_seconds: number;
}

export interface OptimalKResult {
  k_values: number[];
  elbow_scores: number[];
  silhouette_scores: number[];
  suggested_k: number;
  runtime_seconds: number;
}

export interface EquityResult {
  scores: number[];
  mean_score: number;
  median_score: number;
  min_score: number;
  max_score: number;
  std_score: number;
  weights_used: Record<string, number>;
  distribution: Record<string, number>;
  disclaimer: string;
}

export interface EquityBreakdown {
  location_id: string;
  total_score: number;
  breakdown: Record<string, { score: number; weight: number }>;
  disclaimer: string;
}

export interface UnderservedArea {
  location_id: string;
  village_name: string;
  latitude: number;
  longitude: number;
  population: number;
  equity_score: number;
  priority: 'Critical' | 'High' | 'Medium';
  explanation: string;
  specialist_distance: number;
  connectivity: number;
}

export interface UnderservedResult {
  underserved_areas: UnderservedArea[];
  summary: {
    total: number;
    by_priority: { Critical: number; High: number; Medium: number };
    total_population_affected: number;
    avg_equity_score: number;
  };
  thresholds_used: Record<string, number>;
}

export interface HubLocation {
  lat: number;
  lon: number;
  community_assignments: number[];
  reason: string;
  communities_served: number;
  population_covered: number;
  vulnerable_pop_covered: number;
  avg_distance_before: number;
  avg_distance_after: number;
  accessibility_improvement: number;
  explanation?: string;
}

export interface HubOptimizationResult {
  hub_locations: HubLocation[];
  overall_metrics: {
    total_pop_covered: number;
    vulnerable_pop_covered: number;
    avg_improvement: number;
  };
  before_after: {
    avg_distance_before: number;
    avg_distance_after: number;
    improvement: number;
  };
  mode: string;
  n_hubs: number;
  runtime_seconds: number;
}

export interface HubExplanation {
  hub_index: number;
  lat: number;
  lon: number;
  explanation: string;
  communities_served: number;
  population_covered: number;
  vulnerable_pop_covered: number;
  avg_distance_before: number;
  avg_distance_after: number;
  accessibility_improvement: number;
  nearby_communities: { village_name: string; population: number; distance_to_hub: number }[];
  mode: string;
}

export interface WhatIfScenario {
  n_hubs: number;
  pop_coverage: number;
  vulnerable_coverage: number;
  avg_distance: number;
  accessibility_improvement: number;
  underserved_remaining: number;
}

export interface WhatIfResult {
  scenarios: WhatIfScenario[];
  mode: string;
  hub_range: number[];
}

export interface ModeComparison {
  n_hubs: number;
  comparison: {
    population_mode: { total_pop_covered: number; vulnerable_pop_covered: number; avg_improvement: number };
    equity_mode: { total_pop_covered: number; vulnerable_pop_covered: number; avg_improvement: number };
  };
  disclaimer: string;
}

export interface ScenarioSummary {
  name: string;
  params: Record<string, any>;
  summary: {
    total_pop_covered: number;
    n_hubs: number;
    mode: string;
  };
}

export interface DashboardStats {
  data_loaded: boolean;
  total_population: number;
  total_facilities: number;
  total_specialists: number;
  underserved_count: number;
  avg_specialist_distance: number;
  current_equity_score: number;
  optimized_equity_score: number;
  population_coverage: number;
  communities_count: number;
}

export interface DataQualityReport {
  score: number;
  missing_pct: number;
  invalid_coords: number;
  total_rows: number;
  total_columns: number;
  is_valid: boolean;
  errors: string[];
  warnings: string[];
  column_stats: Record<string, { non_null: number; null: number; dtype: string }>;
}

export interface MapData {
  communities: {
    location_id: string;
    village_name: string;
    lat: number;
    lon: number;
    population: number;
    equity_score: number;
    cluster: number;
    specialist_distance: number;
    connectivity: number;
  }[];
  facilities: Facility[];
  specialists: Specialist[];
  underserved: {
    location_id: string;
    village_name?: string;
    lat: number;
    lon: number;
    priority: string;
    equity_score?: number;
    specialist_distance?: number;
  }[];
  hubs: HubLocation[];
  center_lat: number;
  center_lon: number;
}

export interface MethodologySection {
  title: string;
  content: string;
}

export interface ResearchMetrics {
  data_loaded: boolean;
  dataset: Record<string, any>;
  clustering: Record<string, any>;
  optimization: Record<string, any>;
  equity?: Record<string, any>;
}
