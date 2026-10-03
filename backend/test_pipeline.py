"""
End-to-end test of the entire ML pipeline.
"""
import sys
import os

from app.ml.preprocessing import load_communities_csv, preprocess_for_clustering
from app.ml.clustering import find_optimal_k, run_kmeans, generate_cluster_profiles
from app.ml.equity_score import compute_equity_score
from app.ml.underserved import detect_underserved
from app.ml.hub_optimizer import optimize_hubs, generate_hub_explanation, compute_before_after
from app.ml.what_if import simulate_scenarios, compare_modes

print("--- TESTING ML PIPELINE END-TO-END ---")

# 1. Load data
comm = load_communities_csv("../data/demo/communities.csv")
print(f"1. Communities loaded: {len(comm)} rows, {len(comm.columns)} columns")

# 2. Preprocess
X, features, scaler = preprocess_for_clustering(comm)
print(f"2. Preprocessed: shape {X.shape}, features: {len(features)}")

# 3. K-Means
optimal = find_optimal_k(X, (2, 8))
k = optimal["suggested_k"]
best_sil = max(optimal["silhouette_scores"])
print(f"3. Optimal K: {k}, silhouette: {best_sil:.3f}")

result = run_kmeans(X, k=k)
comm["cluster"] = result["labels"]
profiles = generate_cluster_profiles(comm, features)
print(f"   Cluster profiles generated: {len(profiles)}")
for p in profiles[:3]:
    print(f"   - Cluster {p['cluster_id']}: {p['label']} ({p['size']} communities)")

# 4. Equity scores
scores = compute_equity_score(comm)
comm["equity_score"] = scores
print(f"4. Equity scores: mean={scores.mean():.1f}, min={scores.min():.1f}, max={scores.max():.1f}")

# 5. Underserved detection
flagged = detect_underserved(comm)
print(f"5. Underserved detected: {len(flagged)} communities")
print(f"   Sample explanation: {flagged.iloc[0]['underserved_explanation'][:80]}...")

# 6. Hub optimization (3 hubs)
opt = optimize_hubs(comm, n_hubs=3, mode="population")
print("6. Hubs optimized (3 hubs, population mode):")
for i, h in enumerate(opt["hub_locations"]):
    print(f"   Hub {i+1}: ({h['lat']:.3f}, {h['lon']:.3f}) - serves {h['communities_served']} comm, "
          f"covers {h['population_covered']:,} pop, {h['accessibility_improvement']:.1f}km imprv")
ba = compute_before_after(comm, opt["hub_locations"])
print(f"   Before/After: {ba['avg_distance_before']:.1f}km -> {ba['avg_distance_after']:.1f}km (imprv: {ba['improvement']:.1f}km)")

# 7. What-If simulation
sim = simulate_scenarios(comm, hub_range=(1, 5))
print("7. What-If simulation (1-5 hubs):")
for s in sim:
    print(f"   {s['n_hubs']} hubs: pop_cov={s['pop_coverage']:,}, vuln_cov={s['vulnerable_coverage']:,}, "
          f"underserved_rem={s['underserved_remaining']}")

# 8. Mode comparison
comp = compare_modes(comm, n_hubs=3)
print("8. Mode comparison (3 hubs):")
print(f"   Pop mode: pop={comp['population_mode']['total_pop_covered']:,}, "
      f"vuln={comp['population_mode']['vulnerable_pop_covered']:,}")
print(f"   Eq mode:  pop={comp['equity_mode']['total_pop_covered']:,}, "
      f"vuln={comp['equity_mode']['vulnerable_pop_covered']:,}")

# 9. PDF Report Generation
from app.reports.generator import generate_pdf_report
analysis_data = {
    "communities_df": comm,
    "clustering_result": result,
    "cluster_profiles": profiles,
    "equity_scores": scores,
    "underserved_df": flagged,
    "hub_result": opt,
}
report_path = os.path.join("..", "..", "reports", "demo_report.pdf")
os.makedirs(os.path.dirname(report_path), exist_ok=True)
generate_pdf_report(analysis_data, report_path)
print(f"9. PDF Report generated successfully: {report_path} (size: {os.path.getsize(report_path):,} bytes)")

print("\n=== ALL ML PIPELINE & REPORT TESTS PASSED PERFECTLY! ===")
