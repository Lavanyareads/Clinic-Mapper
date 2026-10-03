# Synthetic Demo Data

This directory contains synthetic demographic and healthcare facility datasets for the Clinic-Cluster Mapper project.

## Files Generated:
- `communities.csv`: Features 300-500 simulated communities/villages with populations, connectivity scores, medical access distances, and annual healthcare visit metrics.
- `healthcare_facilities.csv`: Features 25-35 synthetic primary and community health centers, and district hospitals.
- `specialists.csv`: Features 12-18 synthetic specialist centers with available specialty metrics and telemedicine capability.

## Clusters Implemented:
The data points deliberately exhibit distinct patterns to facilitate K-Means clustering algorithm testing:
1. Well-served semi-urban areas near facilities
2. Moderately served rural areas
3. Remote underserved areas
4. High-population areas with insufficient specialist access
5. Tribal/remote areas with very poor infrastructure
6. Areas with adequate primary care but no specialist access

All data is generated targeting the geographical bounding box covering Madhya Pradesh, India, to reflect realistic coordinate distributions.
**Disclaimer:** All data in this directory is SYNTHETIC and generated for DEMONSTRATION purposes only.
