# DATA DICTIONARY — Clinic-Cluster Mapper (Real Data Integration)

> **Last updated:** October 2026  
> **Data mode:** REAL (built from open government datasets + NIN facilities)  
> **Pipeline script:** `data/real/build_real_dataset.py`

---

## Datasets Overview

| Dataset File | Source | Records | Role in Pipeline |
|---|---|---|---|
| `data/real/nin/nin-health-facilities-dataset.csv` | NIN (National Institute of Nutrition) / Ministry of Health | 192,905 | Healthcare facility locations and types |
| `data/real/population/india_population_dataset/india_settlements_population.csv` | India Open Data | 1,000 | Community/village base table with lat/lon, population |
| `data/real/nfhs/nfhs_district.csv` | NFHS-5 (National Family Health Survey 2021) | 706 districts | District-level health & vulnerability indicators |
| `data/real/pmgsy/pmgsy_roads.csv` | PMGSY (Pradhan Mantri Gram Sadak Yojana) 2024-25 | 2,296 | Road accessibility by district |
| `data/real/population/india_population_dataset/census_2011_age.csv` | Census of India 2011 | State/District level | Elderly population fraction (60+) |
| `data/real/pincode/pincode_details.csv` | India Post / Open Data | 153,618 | Geocoding fallback by pincode |

---

## Output Files (used by the ML pipeline)

All output files are saved to: `data/real/processed/`

### 1. `communities.csv` — Community/Village Table

This is the **primary ML input**. Each row is one community/settlement.

| Column | Source | Type | Description |
|---|---|---|---|
| `location_id` | India Settlements | string | Unique village ID (e.g. VIL_00001) |
| `village_name` | India Settlements | string | Village name with state/district suffix |
| `latitude` | India Settlements | float | GPS latitude of settlement |
| `longitude` | India Settlements | float | GPS longitude of settlement |
| `population` | India Settlements | int | Total population |
| `state` | India Settlements | string | State name |
| `district` | India Settlements | string | District name |
| `elderly_population` | **COMPUTED** from Census 2011 | int | Estimated population aged 60+; calculated by multiplying village `population` × district/state elderly fraction from Census 2011 age tables |
| `low_income_population` | **DERIVED** from NFHS-5 | int | Estimated low-income population; proxy: `population × (1 − health_insurance_coverage_pct)`. Communities with lower health insurance coverage are treated as more economically vulnerable |
| `distance_to_nearest_clinic_km` | **COMPUTED** via haversine | float | Straight-line (haversine) distance from village GPS coords to nearest NIN clinic-level facility (PHC, SubCentre, CHC) |
| `distance_to_nearest_specialist_km` | **COMPUTED** via haversine | float | Haversine distance to nearest NIN specialist facility (CHC, Sub-District Hospital, District Hospital, Medical College) |
| `doctors_available` | **APPROXIMATED** from NIN | int | Approximate doctors at nearest clinic type. PHC=2, CHC=5, SubCentre=1, District=15, Medical College=30. **These are standard government staffing norms, not individual facility records** |
| `specialist_available` | **COMPUTED** from distances | int | 1 if nearest specialist facility ≤50 km, else 0 |
| `internet_connectivity` | **DERIVED** from NFHS-5 | float (0–1) | Proxy: `electricity_coverage_pct × 0.7`. Rural electrification rate correlates strongly with digital infrastructure. Joined at district level |
| `road_accessibility` | **DERIVED** from PMGSY | float (0–1) | Physical road completion percentage (PMGSY scheme) at district level, normalized 0–1 |
| `healthcare_visits` | **ESTIMATED** | int | `population × 0.3` — Estimated annual outpatient visits (Indian rural utilization benchmark) |
| `emergency_cases` | **ESTIMATED** | int | `population × 0.02` — Estimated annual emergency cases (2% population) |
| `telemedicine_usage` | **ESTIMATED** | float (0–1) | Baseline 0.05 + 0.10 if internet > 0.5 + 0.05 if road access > 0.6 |

---

### 2. `healthcare_facilities.csv` — Facility Location Table

Filtered from the NIN Health Facilities dataset. One row per facility.

| Column | Source | Description |
|---|---|---|
| `facility_id` | NIN sr_no | Unique facility identifier |
| `facility_name` | NIN | Official facility name |
| `facility_type` | NIN | Type: PHC, CHC, Sub-District Hospital, District Hospital, Medical College |
| `lat`, `lon` | NIN | GPS coordinates |
| `doctors` | **APPROXIMATED** (govt norms) | Approximate doctor count by facility type |
| `specialists` | **APPROXIMATED** | Approximate specialist count |
| `state`, `district` | NIN | Administrative location |
| `has_telemedicine` | Default=0 | No telemedicine field in source data |

---

### 3. `specialists.csv` — Specialist Facility Table

Subset of NIN facilities: CHC, Sub-District Hospital, District Hospital, Medical Colleges.

| Column | Description |
|---|---|
| `specialist_id` | Unique identifier |
| `center_name` | Facility name |
| `lat`, `lon` | GPS coordinates |
| `specialty` | Facility type (used as specialty category) |
| `specialists_count` | **Approximated** by facility type |
| `state`, `district` | Location |

---

## How Datasets Are Related

```
india_settlements_population.csv  ──── (lat, lon) ──── [haversine] ──── nin-health-facilities-dataset.csv
          │                                                                       │
     (state, district)                                                    (facility_type)
          │                                                                       │
     join by district name                                              → communities.csv
          │                                                             → healthcare_facilities.csv
    ┌─────┼─────────────────────┐                                      → specialists.csv
    │     │                     │
nfhs_district.csv   pmgsy_roads.csv   census_2011_age.csv
(vulnerability)     (road access)     (elderly fraction)
```

---

## Features Used by K-Means Clustering

The clustering model uses these **12 scaled features**:

| Feature | Column | Rationale |
|---|---|---|
| Population size | `population` | Demand driver |
| Elderly population | `elderly_population` | Vulnerability factor |
| Low-income population | `low_income_population` | Socioeconomic vulnerability |
| Clinic distance | `distance_to_nearest_clinic_km` | Primary access barrier |
| Specialist distance | `distance_to_nearest_specialist_km` | Specialist access barrier |
| Doctors available | `doctors_available` | Supply side |
| Specialist available | `specialist_available` | Specialist supply |
| Internet connectivity | `internet_connectivity` | Digital infrastructure |
| Road accessibility | `road_accessibility` | Physical infrastructure |
| Healthcare visits | `healthcare_visits` | Utilization/demand |
| Emergency cases | `emergency_cases` | Urgency indicator |
| Telemedicine usage | `telemedicine_usage` | Digital health readiness |

All features are **standardized (z-score)** before clustering using `sklearn.preprocessing.StandardScaler`.

---

## Computed vs. Real Values

| Column | Status | How Computed |
|---|---|---|
| `latitude`, `longitude` | ✅ **REAL** | GPS coordinates from settlements dataset |
| `population` | ✅ **REAL** | Census/settlements data |
| `state`, `district` | ✅ **REAL** | Administrative geography |
| `distance_to_nearest_clinic_km` | ✅ **COMPUTED from REAL coords** | Haversine between village and nearest NIN facility |
| `distance_to_nearest_specialist_km` | ✅ **COMPUTED from REAL coords** | Same, filtered to specialist facilities |
| `elderly_population` | ⚠️ **DERIVED** | Village pop × state/district 60+ fraction from Census 2011 |
| `low_income_population` | ⚠️ **PROXY** | Health insurance non-coverage from NFHS-5 as income proxy |
| `internet_connectivity` | ⚠️ **PROXY** | 70% of NFHS electrification rate (district-level) |
| `road_accessibility` | ⚠️ **PROXY** | PMGSY road completion rate (district-level) |
| `doctors_available` | ⚠️ **APPROXIMATED** | Government staffing norms by facility type |
| `healthcare_visits` | ⚠️ **ESTIMATED** | Pop × 0.30 (national rural utilization benchmark) |
| `emergency_cases` | ⚠️ **ESTIMATED** | Pop × 0.02 |
| `telemedicine_usage` | ⚠️ **ESTIMATED** | Rule-based from internet + road connectivity |

---

## Key Limitations

1. **Village name disambiguation**: Village IDs in settlements data use "Village_N" format — the real village names are not in this dataset version. State and district are real and accurate.
2. **Distances are straight-line (haversine)**: Actual travel distances are longer due to road networks. A routing engine (OSRM/Google Maps API) would give more accurate results.
3. **Doctors/specialists are approximated**: Individual facility staff records are not in the NIN dataset — government staffing norms are used instead.
4. **Internet connectivity is a proxy**: Based on electrification rate (NFHS), not actual broadband/mobile data.
5. **District-level joins**: NFHS, PMGSY, and Census data are at district level — all villages in the same district receive the same road accessibility and vulnerability indicators.
6. **Healthcare visits & emergency cases** are modeled estimates, not actual utilization records.

---

## NOT Used (Datasets Excluded and Why)

| Dataset | Reason Not Used |
|---|---|
| `bharatpoi.csv` (BharatPOI archive 6) | 216 MB — too large for pipeline; NIN dataset is more structured and authoritative for healthcare facilities |
| `global_internet_speeds_2025.csv` | Country-level only — not district/village granular |
| `Hospitals_and_Beds_statewise.csv` (archive 4) | State-level only — too coarse for community-level analysis |
| `historical_population_india.csv` | National-level time series — not geographic |
