# CLINIC-CLUSTER MAPPER

**AI-Powered Healthcare Accessibility & Telemedicine Hub Optimization**

> ⚠️ **DISCLAIMER**: This is an academic decision-support prototype. All data is synthetic/demo data. This is NOT a medical diagnosis system and should NOT be used for actual clinical or policy decisions without expert review. All weights and thresholds are modeling assumptions, NOT medical standards.

---

## Overview

Clinic-Cluster Mapper uses K-Means clustering, geospatial analysis, accessibility scoring, and optimization to identify underserved communities and recommend optimal telemedicine hub locations.

### Core Pipeline

```
Data → Preprocessing → Feature Engineering → K-Means Clustering →
Cluster Profiling → Healthcare Equity Score → Underserved Detection →
Hub Optimization → Before/After Analysis → What-if Simulation
```

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS + Recharts + React-Leaflet |
| Design System | Custom UI components (`Card`, `Button`) with dynamic dark mode and modern aesthetic |
| Backend | Python + FastAPI |
| ML/Data | Pandas + NumPy + Scikit-learn + SciPy |
| Database | SQLite (extensible to PostgreSQL/PostGIS) |
| Maps | Leaflet + OpenStreetMap |
| Reports | ReportLab (PDF) |

---

## Project Structure

```
clinic-cluster-mapper/
├── backend/
│   ├── app/
│   │   ├── api/routes.py          # All API endpoints (inc. /api/data/real)
│   │   ├── ml/
│   │   │   ├── preprocessing.py   # Data loading & validation
│   │   │   ├── clustering.py      # K-Means pipeline
│   │   │   ├── equity_score.py    # Healthcare equity scoring
│   │   │   ├── underserved.py     # Underserved detection
│   │   │   ├── hub_optimizer.py   # Hub placement optimization
│   │   │   ├── what_if.py         # What-if simulation
│   │   │   └── scenario.py        # Scenario management
│   │   ├── reports/generator.py   # PDF report generation
│   │   ├── config.py              # Settings (demo & real data paths)
│   │   ├── database.py            # SQLite setup
│   │   ├── models.py              # Pydantic models
│   │   └── main.py                # FastAPI app
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── src/
│   │   ├── pages/                 # 9 application pages
│   │   ├── components/Layout.tsx  # App shell & navigation
│   │   ├── services/api.ts        # API client
│   │   └── types/index.ts         # TypeScript types
│   ├── package.json
│   └── vite.config.ts
├── data/
│   ├── demo/                      # Synthetic demo dataset
│   │   ├── generate_demo_data.py
│   │   ├── communities.csv
│   │   ├── healthcare_facilities.csv
│   │   └── specialists.csv
│   ├── real/                      # Real government data pipeline
│   │   ├── build_real_dataset.py  # Data ingestion & distance calculator
│   │   └── processed/             # Clean output (communities, facilities, specialists)
├── tests/
│   ├── test_clustering.py
│   ├── test_equity.py
│   ├── test_optimizer.py
│   └── test_real_data.py
├── DATA_DICTIONARY.md             # Complete data dictionary for real & calculated features
└── README.md
```

---

## Datasets & Sources

The platform supports both **Synthetic Demo Data** and **Real Government Datasets**:

1. **Real Data Sources**:
   - **NIN Health Facilities (162K+ records)**: Geocoded PHCs, CHCs, SubCentres, District Hospitals, and Medical Colleges.
   - **India Post Pincode Dataset**: Geocoded branch & sub-post offices serving as real community location anchors.
   - **NFHS-5 District Survey**: Health insurance coverage, electrification rate, and sanitation indicators.
   - **PMGSY (Pradhan Mantri Gram Sadak Yojana)**: Road accessibility and infrastructure progress rates.
   - **Census 2011 Age Data**: Elderly (60+) demographic proportions.

2. **Distance & Metric Calculation**:
   - Distances to nearest clinics and specialists are computed directly using the **Haversine formula** between community coordinates and real NIN facility coordinates.
   - Full documentation of columns, calculations, and data assumptions is available in [`DATA_DICTIONARY.md`](DATA_DICTIONARY.md).

---

## Quick Start

### Prerequisites

- Python 3.9+
- Node.js 18+
- npm or yarn

### 1. Build Real Datasets (Optional if already built)

```bash
cd clinic-cluster-mapper/data/real
python build_real_dataset.py
```

### 1. Clone & Setup Backend

```bash
cd clinic-cluster-mapper/backend

# Create virtual environment (recommended)
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt
```

### 2. Generate Demo Data (if CSVs don't exist)

```bash
cd ../data/demo
python generate_demo_data.py
cd ../../backend
```

### 3. Start Backend Server

```bash
python run.py
# or:  uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`. API docs at `http://localhost:8000/docs`.

### 4. Setup & Start Frontend

```bash
cd ../frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`.

### 5. Run Tests

```bash
cd ..
python -m pytest tests/ -v
```

---

## Demo Flow

1. **Open** `http://localhost:5173` in your browser
2. **Load Demo Data** — Click "Load Demo Data" on the Dashboard
3. **Explore Data** — Go to Data Explorer to see the dataset and quality metrics
4. **Cluster Analysis** — Auto-detect K and run clustering. View cluster profiles
5. **Accessibility Map** — Open the interactive map. See communities, facilities, clusters
6. **Hub Optimizer** — Select 3 hubs, run population-first optimization. Click "Why this location?"
7. **Compare Before/After** — Toggle between Current and Optimized system on the map
8. **What-If Simulator** — Change hubs from 3→5 and see the impact
9. **Compare Modes** — Run equity-first vs population-first comparison
10. **Save & Compare Scenarios** — Save different configurations and compare metrics
11. **Generate Report** — Create a PDF research report

---

## Features

### 1. K-Means Clustering
- Clusters on 12 healthcare/demographic/accessibility features (not just coordinates)
- Automatic K selection via Elbow + Silhouette Score
- Dynamic cluster profiles (e.g., "High Demand / Poor Specialist Access")

### 2. Healthcare Equity Score (0–100)
- Weighted composite: specialist distance (25%), clinic distance (15%), vulnerability (20%), demand (15%), connectivity (15%), road access (10%)
- Fully explainable with per-component breakdown
- Adjustable weights

### 3. Underserved Area Detection
- Threshold-based flagging with priority classification (Critical/High/Medium)
- Plain-language explanations for each flagged community

### 4. Telemedicine Hub Optimization
- Weighted facility-location optimization (not just centroids)
- K-Means++ initialization with iterative refinement
- Two modes: Population-first and Equity-first
- "Why this location?" explanations with actual metrics

### 5. Before vs After Analysis
- Interactive Leaflet map with layer toggles
- Current System / Optimized System comparison

### 6. What-If Simulator
- Dynamic hub count simulation (1–10 hubs)
- Charts showing diminishing returns and optimal hub count

### 7. Equity-First vs Population-First Comparison
- Factual metric comparison without ranking

### 8. Scenario Management
- Save, compare, and delete named scenarios

### 9. Research Mode
- Silhouette Score, inertia, cluster sizes, runtime, optimization metrics

### 10. PDF Report Generation
- Professional research report with all analysis sections

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/data/demo` | Load demo dataset |
| POST | `/api/data/upload` | Upload CSV file |
| GET | `/api/data/preview` | Preview dataset |
| GET | `/api/data/quality` | Data quality report |
| GET | `/api/data/stats` | Dataset statistics |
| GET | `/api/clustering/optimal-k` | Elbow + Silhouette analysis |
| POST | `/api/clustering/run?k=N` | Run K-Means |
| POST | `/api/equity/compute` | Compute equity scores |
| GET | `/api/equity/formula` | Get formula description |
| POST | `/api/underserved/detect` | Detect underserved areas |
| POST | `/api/hubs/optimize?n_hubs=N&mode=M` | Run optimization |
| GET | `/api/hubs/explain/{index}` | Hub explanation |
| POST | `/api/whatif/simulate` | What-if simulation |
| POST | `/api/whatif/compare-modes` | Compare optimization modes |
| POST | `/api/scenarios/save` | Save scenario |
| GET | `/api/scenarios/list` | List scenarios |
| GET | `/api/dashboard/stats` | Dashboard KPIs |
| GET | `/api/map/data` | All map layer data |
| POST | `/api/reports/generate` | Generate PDF report |

Full API docs at `http://localhost:8000/docs` (Swagger UI).

---

## Synthetic Data

The demo dataset represents a synthetic Indian rural/semi-rural region (Madhya Pradesh area) with:
- **500 communities** with 6 distinct accessibility patterns
- **30 healthcare facilities** (PHC, CHC, District Hospital)
- **15 specialist centers**

All data is clearly labeled as SYNTHETIC and is designed to demonstrate meaningful clustering patterns. No real patient data or PII is used.

---

## Limitations

1. **Demo data only** — All data is synthetic and for demonstration purposes
2. **Straight-line distances** — Uses haversine distance, not actual road distances
3. **Model assumptions** — Equity weights are for academic analysis, not medical standards
4. **No real-world validation** — Not validated against actual healthcare outcomes
5. **No regulatory constraints** — Does not account for political, budgetary, or legal factors
6. **Not for clinical use** — Academic prototype only

---

## License

This project is an academic/research prototype.
