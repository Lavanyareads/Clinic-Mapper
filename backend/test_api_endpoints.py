"""
Test all FastAPI endpoints end-to-end using TestClient.
"""
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

print("--- TESTING FASTAPI ROUTES ---")

# Root
r = client.get("/")
print(f"GET / -> {r.status_code}")
assert r.status_code == 200

# Demo data load
r = client.get("/api/data/demo")
msg = r.json().get("message", "")
print(f"GET /api/data/demo -> {r.status_code}: {msg}")
assert r.status_code == 200

# Dashboard stats
r = client.get("/api/dashboard/stats")
pop = r.json().get("total_population", 0)
print(f"GET /api/dashboard/stats -> {r.status_code}: total_pop={pop:,}")
assert r.status_code == 200

# Preview
r = client.get("/api/data/preview")
n_rows = len(r.json().get("rows", []))
print(f"GET /api/data/preview -> {r.status_code}: {n_rows} rows returned")
assert r.status_code == 200

# Quality
r = client.get("/api/data/quality")
score = r.json().get("score", 0)
print(f"GET /api/data/quality -> {r.status_code}: score={score}")
assert r.status_code == 200

# Optimal K
r = client.get("/api/clustering/optimal-k")
sugg_k = r.json().get("suggested_k", 0)
print(f"GET /api/clustering/optimal-k -> {r.status_code}: suggested_k={sugg_k}")
assert r.status_code == 200

# Run clustering
r = client.post("/api/clustering/run?k=3")
k_val = r.json().get("k", 0)
sil = r.json().get("silhouette_score", 0)
print(f"POST /api/clustering/run?k=3 -> {r.status_code}: k={k_val}, sil={sil:.3f}")
assert r.status_code == 200

# Cluster profiles
r = client.get("/api/clustering/profiles")
n_prof = len(r.json().get("profiles", []))
print(f"GET /api/clustering/profiles -> {r.status_code}: {n_prof} profiles")
assert r.status_code == 200

# Equity formula
r = client.get("/api/equity/formula")
print(f"GET /api/equity/formula -> {r.status_code}")
assert r.status_code == 200

# Underserved detect
r = client.post("/api/underserved/detect")
n_areas = len(r.json().get("underserved_areas", []))
print(f"POST /api/underserved/detect -> {r.status_code}: {n_areas} areas")
assert r.status_code == 200

# Hub optimize
r = client.post("/api/hubs/optimize?n_hubs=3&mode=population")
n_hubs = len(r.json().get("hub_locations", []))
print(f"POST /api/hubs/optimize -> {r.status_code}: {n_hubs} hubs")
assert r.status_code == 200

# Hub explain
r = client.get("/api/hubs/explain/0")
expl = r.json().get("explanation", "")[:60]
print(f"GET /api/hubs/explain/0 -> {r.status_code}: {expl}...")
assert r.status_code == 200

# What-If simulate
r = client.post("/api/whatif/simulate?hub_min=1&hub_max=4&mode=population")
n_scen = len(r.json().get("scenarios", []))
print(f"POST /api/whatif/simulate -> {r.status_code}: {n_scen} scenarios")
assert r.status_code == 200

# Compare modes
r = client.post("/api/whatif/compare-modes?n_hubs=3")
print(f"POST /api/whatif/compare-modes -> {r.status_code}")
assert r.status_code == 200

# Map data
r = client.get("/api/map/data")
n_comm = len(r.json().get("communities", []))
n_fac = len(r.json().get("facilities", []))
n_hb = len(r.json().get("hubs", []))
print(f"GET /api/map/data -> {r.status_code}: {n_comm} communities, {n_fac} facilities, {n_hb} hubs")
assert r.status_code == 200

# Methodology
r = client.get("/api/research/methodology")
n_sec = len(r.json().get("sections", []))
print(f"GET /api/research/methodology -> {r.status_code}: {n_sec} sections")
assert r.status_code == 200

# Research metrics
r = client.get("/api/research/metrics")
print(f"GET /api/research/metrics -> {r.status_code}")
assert r.status_code == 200

# Generate report
r = client.post("/api/reports/generate")
fname = r.json().get("filename", "")
print(f"POST /api/reports/generate -> {r.status_code}: {fname}")
assert r.status_code == 200

print("\n=== ALL FASTAPI ENDPOINTS VERIFIED & WORKING END-TO-END! ===")
