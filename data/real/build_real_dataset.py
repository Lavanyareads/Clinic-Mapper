"""
Real Data Pipeline (v2) — Clinic-Cluster Mapper
=================================================
Community base: India Post Pincode dataset (real lat/lon Branch Offices)
Facilities:     NIN Health Facilities (real geocoded)
District data:  NFHS-5 survey + PMGSY roads + Census 2011 age groups

Run from project root:
    python data/real/build_real_dataset.py
Outputs to: data/real/processed/
"""
import os, sys, json, warnings, zipfile
import pandas as pd
import numpy as np
from math import radians, sin, cos, sqrt, atan2

warnings.filterwarnings("ignore")
np.random.seed(42)

# ── Paths ──────────────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
ZIP_DIR    = os.path.join(BASE_DIR, "..", "real data zip")
NIN_DIR    = os.path.join(BASE_DIR, "nin")
PIN_DIR    = os.path.join(BASE_DIR, "pincode")
NFHS_DIR   = os.path.join(BASE_DIR, "nfhs")
PMGSY_DIR  = os.path.join(BASE_DIR, "pmgsy")
AGE_DIR    = os.path.join(BASE_DIR, "population", "india_population_dataset")
OUT_DIR    = os.path.join(BASE_DIR, "processed")

for d in [NIN_DIR, PIN_DIR, NFHS_DIR, PMGSY_DIR, AGE_DIR, OUT_DIR]:
    os.makedirs(d, exist_ok=True)

# ── Helpers ────────────────────────────────────────────────────────────────
def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371.0
    phi1, phi2 = radians(lat1), radians(lat2)
    a = (sin((radians(lat2) - phi1) / 2) ** 2
         + cos(phi1) * cos(phi2)
         * sin((radians(lon2) - radians(lon1)) / 2) ** 2)
    return R * 2 * atan2(sqrt(a), sqrt(1 - a))


def compute_nearest_km(comm_lats, comm_lons, fac_lats, fac_lons, batch=200):
    """Vectorised nearest-facility distance (no scipy needed)."""
    clat = np.radians(comm_lats)
    clon = np.radians(comm_lons)
    flat = np.radians(fac_lats)
    flon = np.radians(fac_lons)
    n = len(comm_lats)
    best_km  = np.full(n, np.inf)
    best_idx = np.zeros(n, dtype=int)
    for start in range(0, n, batch):
        end  = min(start + batch, n)
        cl   = clat[start:end, None]
        clo  = clon[start:end, None]
        dphi = flat[None, :] - cl
        dlam = flon[None, :] - clo
        a_   = np.sin(dphi/2)**2 + np.cos(cl)*np.cos(flat)*np.sin(dlam/2)**2
        a_   = np.clip(a_, 0, 1)
        km_  = 6371.0 * 2 * np.arctan2(np.sqrt(a_), np.sqrt(1 - a_))
        idx_ = np.argmin(km_, axis=1)
        best_km[start:end]  = km_[np.arange(end-start), idx_]
        best_idx[start:end] = idx_
        if start % 400 == 0:
            pct = round(min(end, n) / n * 100)
            print(f"    {min(end,n)}/{n} ({pct}%)", end="\r")
    print()
    return best_km, best_idx


def norm(s):
    return str(s).strip().lower().replace("-", " ").replace("_", " ")


def extract_csv(zip_name, inner_suffix, dest_path):
    """Extract one CSV from a ZIP. inner_suffix = trailing part of inner filename."""
    if os.path.exists(dest_path):
        print(f"  [cached] {os.path.basename(dest_path)}")
        return True
    src = os.path.join(ZIP_DIR, zip_name)
    if not os.path.exists(src):
        print(f"  [MISSING ZIP] {src}")
        return False
    with zipfile.ZipFile(src, "r") as z:
        match = next((n for n in z.namelist() if n.endswith(inner_suffix)), None)
        if not match:
            print(f"  [NOT FOUND] '{inner_suffix}' in {zip_name}")
            return False
        data = z.read(match)
    with open(dest_path, "wb") as f:
        f.write(data)
    print(f"  Extracted {match} -> {os.path.basename(dest_path)} ({len(data):,} bytes)")
    return True


# ═══════════════════════════════════════════════════════════════
print("=" * 62)
print("STEP 1: Extracting ZIPs")
print("=" * 62)

nin_path   = os.path.join(NIN_DIR,  "nin_facilities.csv")
pin_path   = os.path.join(PIN_DIR,  "pincode_details.csv")
nfhs_path  = os.path.join(NFHS_DIR, "nfhs_district.csv")
pmgsy_path = os.path.join(PMGSY_DIR,"pmgsy_roads.csv")
age_path   = os.path.join(AGE_DIR,  "census_2011_age.csv")

extract_csv("archive.zip",    "nin-health-facilities-dataset.csv", nin_path)
extract_csv("archive (5).zip","pincode details.csv",               pin_path)
extract_csv("archive (3).zip","datafile.csv",                      nfhs_path)
extract_csv("archive (2).zip","2024-2025).csv",                    pmgsy_path)
extract_csv("archive (1).zip","census_2011_age.csv",               age_path)

# ═══════════════════════════════════════════════════════════════
print("\n" + "=" * 62)
print("STEP 2: Loading NIN Health Facilities (real geocoded data)")
print("=" * 62)

nin_df = pd.read_csv(nin_path, low_memory=False)
nin_df.columns = nin_df.columns.str.strip()
nin_df = nin_df.dropna(subset=["latitude","longitude"])
nin_df = nin_df[nin_df["latitude"].between(5,40) & nin_df["longitude"].between(65,100)].copy()
print(f"  Total valid NIN facilities: {len(nin_df):,}")

CLINIC_TYPES = ["Primary Health Centre","SubCentre","Community Health Center",
                "Urban Health Centre","Urban Health Posts"]
SPECIALIST_TYPES = ["Community Health Center","Sub-District Hospital","District Hospital",
                    "Medical Colleges Hospital","Civil Hospital/General Hospital","Women Hospital"]
ALL_FAC_TYPES = list(set(CLINIC_TYPES + SPECIALIST_TYPES))

nin_clinics     = nin_df[nin_df["facility_type"].isin(CLINIC_TYPES)].reset_index(drop=True)
nin_specialists = nin_df[nin_df["facility_type"].isin(SPECIALIST_TYPES)].reset_index(drop=True)
print(f"  Clinic-level: {len(nin_clinics):,}  |  Specialist-level: {len(nin_specialists):,}")

DOC_MAP = {
    "Primary Health Centre":2, "SubCentre":1, "Community Health Center":5,
    "Urban Health Centre":2, "Urban Health Posts":1, "Sub-District Hospital":8,
    "District Hospital":15, "Medical Colleges Hospital":30,
    "Civil Hospital/General Hospital":12, "Women Hospital":6,
}
SPEC_MAP = {
    "Primary Health Centre":0, "SubCentre":0, "Community Health Center":2,
    "Urban Health Centre":0, "Urban Health Posts":0, "Sub-District Hospital":3,
    "District Hospital":8, "Medical Colleges Hospital":20,
    "Civil Hospital/General Hospital":5, "Women Hospital":3,
}

# ═══════════════════════════════════════════════════════════════
print("\n" + "=" * 62)
print("STEP 3: Building Community Table from Pincode Dataset (real lat/lon)")
print("=" * 62)

pin_df = pd.read_csv(pin_path, low_memory=False)
pin_df.columns = pin_df.columns.str.strip()
pin_df["latitude"]  = pd.to_numeric(pin_df["latitude"],  errors="coerce")
pin_df["longitude"] = pd.to_numeric(pin_df["longitude"], errors="coerce")
pin_df = pin_df.dropna(subset=["latitude","longitude"])
pin_df = pin_df[pin_df["latitude"].between(5,40) & pin_df["longitude"].between(65,100)].copy()
print(f"  Total pincodes with valid coords: {len(pin_df):,}")

# Keep Branch Offices (BO) and Sub-Offices (SO) — village-level POs
rural_pin = pin_df[pin_df["officetype"].isin(["BO","SO","HO"])].copy()
print(f"  Rural/village-level offices (BO/SO/HO): {len(rural_pin):,}")

# ── Sample ~500 communities stratified by state ──
# Target states that have good NIN coverage + are meaningful
TARGET_N = 500
states = rural_pin["statename"].value_counts()
print(f"  States represented: {len(states)}")

# Proportional sample per state (min 10 per state, proportional to NIN facility count)
nin_state_count = (nin_df.groupby("state_name").size()
                   .reset_index(name="nin_count")
                   .rename(columns={"state_name":"statename"}))
pin_states = (rural_pin.groupby("statename").size()
              .reset_index(name="pin_count"))
state_info = pin_states.merge(nin_state_count, on="statename", how="left")
state_info["nin_count"] = state_info["nin_count"].fillna(100)
state_info["weight"] = state_info["nin_count"] / state_info["nin_count"].sum()
state_info["n_sample"] = (state_info["weight"] * TARGET_N).clip(lower=5).round().astype(int)
# Adjust to hit exactly TARGET_N
diff = TARGET_N - state_info["n_sample"].sum()
state_info.loc[state_info["n_sample"].idxmax(), "n_sample"] += diff
print(f"  Sampling {state_info['n_sample'].sum()} communities across {len(state_info)} states")

sampled_parts = []
for _, row in state_info.iterrows():
    state_pool = rural_pin[rural_pin["statename"] == row["statename"]]
    n = min(int(row["n_sample"]), len(state_pool))
    if n > 0:
        sampled_parts.append(state_pool.sample(n, random_state=42))

comm_df = pd.concat(sampled_parts, ignore_index=True)
comm_df = comm_df.reset_index(drop=True)
comm_df["location_id"] = ["VIL_" + str(i).zfill(5) for i in range(len(comm_df))]
print(f"  Final community sample: {len(comm_df):,}")

# ── Assign a sensible name ─────────────────────────────────────────────────
# officename is the Post Office name — use as village name proxy
comm_df["village_name"] = comm_df["officename"].str.strip().str.replace(r"\s+(B\.O|S\.O|H\.O|BO|SO|HO)$", "", regex=True)

# ═══════════════════════════════════════════════════════════════
print("\n" + "=" * 62)
print("STEP 4: Computing Haversine Distances (real coords -> real NIN facilities)")
print("=" * 62)

print(f"  Computing distance to nearest CLINIC ({len(nin_clinics):,} facilities)...")
clinic_km, clinic_idx = compute_nearest_km(
    comm_df["latitude"].values, comm_df["longitude"].values,
    nin_clinics["latitude"].values, nin_clinics["longitude"].values,
)
print(f"  Avg clinic distance: {clinic_km.mean():.2f} km  (max {clinic_km.max():.1f} km)")

print(f"  Computing distance to nearest SPECIALIST ({len(nin_specialists):,} facilities)...")
spec_km, spec_idx = compute_nearest_km(
    comm_df["latitude"].values, comm_df["longitude"].values,
    nin_specialists["latitude"].values, nin_specialists["longitude"].values,
)
print(f"  Avg specialist distance: {spec_km.mean():.2f} km  (max {spec_km.max():.1f} km)")

comm_df["distance_to_nearest_clinic_km"]     = np.round(clinic_km, 2)
comm_df["distance_to_nearest_specialist_km"] = np.round(spec_km, 2)

# ═══════════════════════════════════════════════════════════════
print("\n" + "=" * 62)
print("STEP 5: Assigning Population from District-Level Estimates")
print("=" * 62)

# We don't have village-level population in the pincode set.
# Use district population from Census 2011 and distribute across sampled communities
# as a proportional estimate (clearly noted as estimate in DATA_DICTIONARY.md)
age_df = pd.read_csv(age_path, low_memory=False)
age_df.columns = age_df.columns.str.strip()

# Get total rural population by state
total_df = age_df[age_df["Age Group"] == "All ages"].copy()
state_pop = (total_df.groupby("Area Name")["Rural Persons"].sum()
             .reset_index().rename(columns={"Rural Persons":"state_pop"}))
state_pop["statename_norm"] = state_pop["Area Name"].apply(norm)

comm_df["statename_norm"] = comm_df["statename"].apply(norm)

# For each community: state_pop / n_communities_in_that_state * some variance
comm_df = comm_df.merge(state_pop[["statename_norm","state_pop"]], on="statename_norm", how="left")
comm_df["state_pop"] = comm_df["state_pop"].fillna(5_000_000)  # fallback 5M

# Communities per state in sample
comm_per_state = comm_df.groupby("statename_norm")["location_id"].transform("count")
base_pop = (comm_df["state_pop"] / comm_per_state / 50).clip(300, 80000)  # realistic range

# Add log-normal variation (small villages + some towns)
rng = np.random.default_rng(42)
multiplier = rng.lognormal(mean=0, sigma=0.8, size=len(comm_df))
comm_df["population"] = (base_pop * multiplier).clip(300, 60000).round().astype(int)
print(f"  Population: mean={comm_df['population'].mean():.0f}, "
      f"min={comm_df['population'].min()}, max={comm_df['population'].max()}")

# ═══════════════════════════════════════════════════════════════
print("\n" + "=" * 62)
print("STEP 6: Joining NFHS District Health Indicators")
print("=" * 62)

nfhs_df = pd.read_csv(nfhs_path, low_memory=False)
nfhs_df.columns = nfhs_df.columns.str.strip()

INS_COL  = "Households with any usual member covered under a health insurance/financing scheme (%)"
ELEC_COL = "Population living in households with electricity (%)"
SAN_COL  = "Population living in households that use an improved sanitation facility2 (%)"

nfhs_df["state_norm"]    = nfhs_df["State/UT"].apply(norm)
nfhs_df["district_norm"] = nfhs_df["District Names"].apply(norm)

comm_df["state_norm"]    = comm_df["statename"].apply(norm)
comm_df["district_norm"] = comm_df["district"].apply(norm)

nfhs_cols = ["state_norm","district_norm"] + [c for c in [INS_COL, ELEC_COL, SAN_COL] if c in nfhs_df.columns]
nfhs_sub  = nfhs_df[nfhs_cols].drop_duplicates(subset=["state_norm","district_norm"])

comm_df = comm_df.merge(nfhs_sub, on=["state_norm","district_norm"], how="left")

# Fill missing: state median -> overall median
for col in [INS_COL, ELEC_COL, SAN_COL]:
    if col not in comm_df.columns:
        continue
    state_med = comm_df.groupby("state_norm")[col].transform("median")
    comm_df[col] = comm_df[col].fillna(state_med).fillna(comm_df[col].median())

joined = comm_df[ELEC_COL].notna().sum() if ELEC_COL in comm_df.columns else 0
print(f"  Communities matched to NFHS: {joined}/{len(comm_df)}")

# ═══════════════════════════════════════════════════════════════
print("\n" + "=" * 62)
print("STEP 7: Computing Derived Features")
print("=" * 62)

# Internet connectivity (proxy: 70% of NFHS electrification rate)
if ELEC_COL in comm_df.columns:
    comm_df["internet_connectivity"] = (comm_df[ELEC_COL] / 100 * 0.7).clip(0, 1).round(3)
else:
    comm_df["internet_connectivity"] = 0.45
print(f"  internet_connectivity: mean={comm_df['internet_connectivity'].mean():.3f}")

# Road accessibility from PMGSY
pmgsy_df = pd.read_csv(pmgsy_path, low_memory=False)
pmgsy_df.columns = pmgsy_df.columns.str.strip()
pmgsy_df["state_norm"]    = pmgsy_df["state"].apply(norm)
pmgsy_df["district_norm"] = pmgsy_df["district"].apply(norm)
pmgsy_agg = (pmgsy_df.groupby(["state_norm","district_norm"], as_index=False)
             .agg(road_pct=("phys_progress_pct","mean")))

# phys_progress_pct may be 0-1 (decimal) or 0-100 (percentage) depending on dataset
# check and normalise
if pmgsy_agg["road_pct"].max() <= 1.1:
    # already 0-1
    pmgsy_agg["road_pct_norm"] = pmgsy_agg["road_pct"].clip(0, 1)
else:
    pmgsy_agg["road_pct_norm"] = (pmgsy_agg["road_pct"] / 100).clip(0, 1)

comm_df = comm_df.merge(
    pmgsy_agg[["state_norm","district_norm","road_pct_norm"]],
    on=["state_norm","district_norm"], how="left"
)
# Also try state-only join as fallback
state_road_agg = pmgsy_agg.groupby("state_norm")["road_pct_norm"].mean().reset_index(name="state_road")
comm_df = comm_df.merge(state_road_agg, on="state_norm", how="left")
comm_df["road_pct_norm"] = comm_df["road_pct_norm"].fillna(comm_df["state_road"])
comm_df["road_pct_norm"] = comm_df["road_pct_norm"].fillna(comm_df["road_pct_norm"].median())
comm_df["road_accessibility"] = comm_df["road_pct_norm"].round(3)
print(f"  road_accessibility: mean={comm_df['road_accessibility'].mean():.3f}, "
      f"min={comm_df['road_accessibility'].min():.3f}, max={comm_df['road_accessibility'].max():.3f}")

# Elderly population from Census 2011 state fractions
ELDERLY_GROUPS = ["60-64","65-69","70-74","75-79","80+","80 +","80 and above"]
eld_df = age_df[age_df["Age Group"].isin(ELDERLY_GROUPS)]
by_eld   = eld_df.groupby("State Code")["Rural Persons"].sum()
by_total = total_df.groupby("State Code")["Rural Persons"].sum()
eld_frac = (by_eld / by_total.replace(0, np.nan)).dropna().clip(0.05, 0.25)
eld_df2  = eld_frac.reset_index().rename(columns={"Rural Persons":"elderly_pct"})
st_names = (total_df[["State Code","Area Name"]].drop_duplicates()
            .assign(statename_norm=lambda d: d["Area Name"].apply(norm)))
eld_df2  = eld_df2.merge(st_names[["State Code","statename_norm"]], on="State Code")
comm_df = comm_df.merge(eld_df2[["statename_norm","elderly_pct"]], on="statename_norm", how="left")
comm_df["elderly_pct"] = comm_df["elderly_pct"].fillna(0.10)
comm_df["elderly_population"] = (comm_df["population"] * comm_df["elderly_pct"]).round().astype(int)
print(f"  elderly_population: mean={comm_df['elderly_population'].mean():.0f}")

# Low-income from health insurance non-coverage (NFHS proxy)
if INS_COL in comm_df.columns:
    ins_pct = comm_df[INS_COL] / 100
else:
    ins_pct = 0.30
comm_df["low_income_population"] = ((comm_df["population"] * (1 - ins_pct)).round().astype(int))
print(f"  low_income_population: mean={comm_df['low_income_population'].mean():.0f}")

# Doctors from nearest facility type
comm_df["nearest_clinic_type"] = nin_clinics.loc[clinic_idx, "facility_type"].values
comm_df["doctors_available"]   = comm_df["nearest_clinic_type"].map(DOC_MAP).fillna(1).astype(int)
comm_df["specialist_available"] = (comm_df["distance_to_nearest_specialist_km"] < 50).astype(int)
print(f"  doctors_available: mean={comm_df['doctors_available'].mean():.1f}")
pct_spec = comm_df["specialist_available"].mean() * 100
print(f"  specialist_available: {pct_spec:.1f}% within 50 km")

# Utilisation estimates
comm_df["healthcare_visits"] = (comm_df["population"] * 0.30).round().astype(int)
comm_df["emergency_cases"]   = (comm_df["population"] * 0.02).round().astype(int)
comm_df["telemedicine_usage"] = (
    0.05
    + (comm_df["internet_connectivity"] > 0.50).astype(float) * 0.10
    + (comm_df["road_accessibility"] > 0.60).astype(float) * 0.05
).round(3)

# ═══════════════════════════════════════════════════════════════
print("\n" + "=" * 62)
print("STEP 8: Saving communities.csv")
print("=" * 62)

comm_final = pd.DataFrame({
    "location_id":   comm_df["location_id"],
    "village_name":  (comm_df["village_name"].astype(str)
                      + " (" + comm_df["statename"].str.strip().astype(str)
                      + ", " + comm_df["district"].astype(str) + ")"),
    "latitude":      comm_df["latitude"].round(6),
    "longitude":     comm_df["longitude"].round(6),
    "population":    comm_df["population"],
    "elderly_population":  comm_df["elderly_population"],
    "low_income_population": comm_df["low_income_population"],
    "distance_to_nearest_clinic_km":     comm_df["distance_to_nearest_clinic_km"],
    "distance_to_nearest_specialist_km": comm_df["distance_to_nearest_specialist_km"],
    "doctors_available":    comm_df["doctors_available"],
    "specialist_available": comm_df["specialist_available"],
    "internet_connectivity": comm_df["internet_connectivity"],
    "road_accessibility":   comm_df["road_accessibility"],
    "healthcare_visits":    comm_df["healthcare_visits"],
    "emergency_cases":      comm_df["emergency_cases"],
    "telemedicine_usage":   comm_df["telemedicine_usage"],
    "state":                comm_df["statename"].str.strip(),
    "district":             comm_df["district"].astype(str),
})

out_comm = os.path.join(OUT_DIR, "communities.csv")
comm_final.to_csv(out_comm, index=False)
print(f"  Saved {len(comm_final)} rows  ->  {out_comm}")
print(f"  Lat: {comm_final['latitude'].min():.2f} - {comm_final['latitude'].max():.2f}")
print(f"  Lon: {comm_final['longitude'].min():.2f} - {comm_final['longitude'].max():.2f}")
print(f"  Avg clinic dist: {comm_final['distance_to_nearest_clinic_km'].mean():.2f} km")
print(f"  Avg specialist dist: {comm_final['distance_to_nearest_specialist_km'].mean():.2f} km")

# ═══════════════════════════════════════════════════════════════
print("\n" + "=" * 62)
print("STEP 9: Saving healthcare_facilities.csv")
print("=" * 62)

fac_df = nin_df[nin_df["facility_type"].isin(ALL_FAC_TYPES)].copy().reset_index(drop=True)
fac_final = pd.DataFrame({
    "facility_id":   "FAC_" + fac_df["sr_no"].astype(str),
    "facility_name": fac_df["health_facility_name"].fillna("Unknown"),
    "facility_type": fac_df["facility_type"],
    "lat":           fac_df["latitude"].round(6),
    "lon":           fac_df["longitude"].round(6),
    "doctors":       fac_df["facility_type"].map(DOC_MAP).fillna(2).astype(int),
    "specialists":   fac_df["facility_type"].map(SPEC_MAP).fillna(0).astype(int),
    "state":         fac_df["state_name"],
    "district":      fac_df["district_name"],
    "has_telemedicine": 0,
})
fac_final = fac_final.dropna(subset=["lat","lon"]).reset_index(drop=True)
out_fac = os.path.join(OUT_DIR, "healthcare_facilities.csv")
fac_final.to_csv(out_fac, index=False)
print(f"  Saved {len(fac_final):,} rows  ->  {out_fac}")
print(f"  Types:\n{fac_df['facility_type'].value_counts().to_string()}")

# ═══════════════════════════════════════════════════════════════
print("\n" + "=" * 62)
print("STEP 10: Saving specialists.csv")
print("=" * 62)

spec_df = nin_df[nin_df["facility_type"].isin(SPECIALIST_TYPES)].copy().reset_index(drop=True)
spec_final = pd.DataFrame({
    "specialist_id":    "SPEC_" + spec_df["sr_no"].astype(str),
    "center_name":      spec_df["health_facility_name"].fillna("Unknown"),
    "lat":              spec_df["latitude"].round(6),
    "lon":              spec_df["longitude"].round(6),
    "specialty":        spec_df["facility_type"],
    "specialists_count": spec_df["facility_type"].map(SPEC_MAP).fillna(2).astype(int),
    "state":            spec_df["state_name"],
    "district":         spec_df["district_name"],
    "has_telemedicine": 0,
})
spec_final = spec_final.dropna(subset=["lat","lon"]).reset_index(drop=True)
out_spec = os.path.join(OUT_DIR, "specialists.csv")
spec_final.to_csv(out_spec, index=False)
print(f"  Saved {len(spec_final):,} rows  ->  {out_spec}")

# ═══════════════════════════════════════════════════════════════
print("\n" + "=" * 62)
print("STEP 11: Saving data_quality_report.json")
print("=" * 62)

quality = {
    "build_version": 2,
    "community_source": "India Post Pincode Dataset (Branch Offices / Sub-Offices) — real lat/lon",
    "note_on_settlements_csv": (
        "india_settlements_population.csv was found to have synthetic coordinates "
        "not constrained to correct state boundaries. Replaced with pincode-based communities."
    ),
    "communities": {
        "rows": int(len(comm_final)),
        "columns": int(len(comm_final.columns)),
        "missing_pct": {k: round(float(v), 4) for k,v in comm_final.isnull().mean().items()},
        "geographic_bounds": {
            "lat_min": float(comm_final["latitude"].min()),
            "lat_max": float(comm_final["latitude"].max()),
            "lon_min": float(comm_final["longitude"].min()),
            "lon_max": float(comm_final["longitude"].max()),
        },
        "distance_stats": {
            "avg_clinic_km":       round(float(comm_final["distance_to_nearest_clinic_km"].mean()), 2),
            "max_clinic_km":       round(float(comm_final["distance_to_nearest_clinic_km"].max()), 2),
            "avg_specialist_km":   round(float(comm_final["distance_to_nearest_specialist_km"].mean()), 2),
            "max_specialist_km":   round(float(comm_final["distance_to_nearest_specialist_km"].max()), 2),
        },
        "real_columns":     ["location_id","latitude","longitude","state","district","village_name"],
        "computed_columns": [
            "distance_to_nearest_clinic_km (haversine to nearest NIN clinic)",
            "distance_to_nearest_specialist_km (haversine to nearest NIN specialist)",
            "population (Census state total / communities in state * lognormal variation)",
            "elderly_population (Census 2011 60+ fraction * population)",
            "low_income_population (NFHS insurance non-coverage * population)",
            "internet_connectivity (NFHS electricity % * 0.7)",
            "road_accessibility (PMGSY physical completion %)",
            "doctors_available (govt staffing norms by nearest facility type)",
            "specialist_available (distance_to_nearest_specialist_km < 50)",
            "healthcare_visits (population * 0.30)",
            "emergency_cases (population * 0.02)",
            "telemedicine_usage (rule-based from connectivity)",
        ],
    },
    "healthcare_facilities": {
        "rows": int(len(fac_final)),
        "source": "NIN Health Facilities Dataset — REAL geocoded facilities",
        "facility_types": fac_df["facility_type"].value_counts().to_dict(),
    },
    "specialists": {
        "rows": int(len(spec_final)),
        "source": "NIN Health Facilities Dataset — specialist-tier filter",
        "specialist_types": spec_df["facility_type"].value_counts().to_dict(),
    },
}

out_qual = os.path.join(OUT_DIR, "data_quality_report.json")
with open(out_qual, "w") as f:
    json.dump(quality, f, indent=2, default=str)
print(f"  Saved  ->  {out_qual}")

# ═══════════════════════════════════════════════════════════════
print("\n" + "=" * 62)
print("BUILD COMPLETE")
print("=" * 62)
print(f"  communities.csv          : {len(comm_final):,} rows  (real lat/lon via India Post pincodes)")
print(f"  healthcare_facilities.csv: {len(fac_final):,} rows  (real NIN facilities)")
print(f"  specialists.csv          : {len(spec_final):,} rows  (real NIN specialist centres)")
print(f"  data_quality_report.json : saved")
print(f"\n  All outputs: {OUT_DIR}")
