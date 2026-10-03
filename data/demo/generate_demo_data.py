import pandas as pd
import numpy as np
import os
import math

np.random.seed(42)

def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0 # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def generate_demo_data(output_dir):
    os.makedirs(output_dir, exist_ok=True)
    
    # 1. Healthcare Facilities
    num_facilities = 35
    facilities = []
    for i in range(num_facilities):
        lat = np.random.uniform(22.0, 25.0)
        lon = np.random.uniform(76.0, 80.0)
        fac_type = np.random.choice(['PHC', 'CHC', 'District Hospital'], p=[0.7, 0.25, 0.05])
        doctors = np.random.randint(1, 4) if fac_type == 'PHC' else (np.random.randint(4, 10) if fac_type == 'CHC' else np.random.randint(10, 50))
        specialists = 0 if fac_type == 'PHC' else (np.random.randint(1, 5) if fac_type == 'CHC' else np.random.randint(5, 20))
        beds = np.random.randint(5, 10) if fac_type == 'PHC' else (np.random.randint(30, 50) if fac_type == 'CHC' else np.random.randint(100, 500))
        has_telemedicine = np.random.choice([0, 1], p=[0.8, 0.2] if fac_type == 'PHC' else [0.2, 0.8])
        
        facilities.append({
            'facility_id': f'F{i+1:03d}',
            'facility_name': f'Facility_{i+1}_{fac_type}',
            'facility_type': fac_type,
            'latitude': lat,
            'longitude': lon,
            'doctors': doctors,
            'specialists': specialists,
            'beds': beds,
            'has_telemedicine': has_telemedicine
        })
    df_facilities = pd.DataFrame(facilities)
    df_facilities.to_csv(os.path.join(output_dir, 'healthcare_facilities.csv'), index=False)
    
    # 2. Specialists
    num_spec = 18
    specialists_centers = []
    for i in range(num_spec):
        dh = df_facilities[df_facilities['facility_type'] == 'District Hospital']
        if not dh.empty and np.random.rand() > 0.3:
            parent = dh.sample(1).iloc[0]
            lat = parent['latitude'] + np.random.uniform(-0.05, 0.05)
            lon = parent['longitude'] + np.random.uniform(-0.05, 0.05)
        else:
            lat = np.random.uniform(22.0, 25.0)
            lon = np.random.uniform(76.0, 80.0)
            
        spec = np.random.choice(['Cardiology', 'Neurology', 'Oncology', 'Pediatrics', 'Orthopedics', 'Gynecology'])
        count = np.random.randint(1, 6)
        has_tm = np.random.choice([0, 1], p=[0.3, 0.7])
        specialists_centers.append({
            'specialist_id': f'S{i+1:03d}',
            'center_name': f'Specialty Center {i+1}',
            'latitude': lat,
            'longitude': lon,
            'specialty': spec,
            'specialists_count': count,
            'has_telemedicine': has_tm
        })
    df_spec = pd.DataFrame(specialists_centers)
    df_spec.to_csv(os.path.join(output_dir, 'specialists.csv'), index=False)
    
    # 3. Communities
    num_communities = 500
    communities = []
    
    village_prefixes = ['Raj', 'Sultan', 'Chandan', 'Bhim', 'Gopal', 'Kishan', 'Ram', 'Shyam', 'Laxman', 'Hari', 'Shiv', 'Nand']
    village_suffixes = ['pur', 'nagar', 'garh', 'gaon', 'khedi', 'pura', 'pind']
    
    def generate_name():
        return np.random.choice(village_prefixes) + np.random.choice(village_suffixes) + " (SYNTHETIC)"
    
    for i in range(num_communities):
        cluster = np.random.choice([1, 2, 3, 4, 5, 6], p=[0.15, 0.3, 0.2, 0.1, 0.1, 0.15])
        
        if cluster == 1:
            f = df_facilities[df_facilities['facility_type'].isin(['CHC', 'District Hospital'])].sample(1).iloc[0] if len(df_facilities[df_facilities['facility_type'].isin(['CHC', 'District Hospital'])]) > 0 else df_facilities.sample(1).iloc[0]
            lat = f['latitude'] + np.random.uniform(-0.02, 0.02)
            lon = f['longitude'] + np.random.uniform(-0.02, 0.02)
            pop = int(np.random.uniform(5000, 20000))
            internet = np.random.uniform(0.7, 1.0)
            road = np.random.uniform(0.8, 1.0)
            low_income_pct = np.random.uniform(0.2, 0.35)
        elif cluster == 2:
            lat = np.random.uniform(22.0, 25.0)
            lon = np.random.uniform(76.0, 80.0)
            pop = int(np.random.uniform(1000, 5000))
            internet = np.random.uniform(0.4, 0.7)
            road = np.random.uniform(0.5, 0.8)
            low_income_pct = np.random.uniform(0.3, 0.5)
        elif cluster == 3:
            lat = np.random.uniform(22.0, 25.0)
            lon = np.random.uniform(76.0, 80.0)
            pop = int(np.random.uniform(500, 3000))
            internet = np.random.uniform(0.0, 0.3)
            road = np.random.uniform(0.1, 0.4)
            low_income_pct = np.random.uniform(0.5, 0.7)
        elif cluster == 4:
            lat = np.random.uniform(22.0, 25.0)
            lon = np.random.uniform(76.0, 80.0)
            pop = int(np.random.uniform(20000, 50000))
            internet = np.random.uniform(0.5, 0.8)
            road = np.random.uniform(0.6, 0.9)
            low_income_pct = np.random.uniform(0.3, 0.5)
        elif cluster == 5:
            lat = np.random.uniform(22.0, 25.0)
            lon = np.random.uniform(76.0, 80.0)
            pop = int(np.random.uniform(300, 1000))
            internet = np.random.uniform(0.0, 0.1)
            road = np.random.uniform(0.0, 0.2)
            low_income_pct = np.random.uniform(0.6, 0.7)
        else: # 6
            phcs = df_facilities[df_facilities['facility_type'] == 'PHC']
            f = phcs.sample(1).iloc[0] if not phcs.empty else df_facilities.sample(1).iloc[0]
            lat = f['latitude'] + np.random.uniform(-0.05, 0.05)
            lon = f['longitude'] + np.random.uniform(-0.05, 0.05)
            pop = int(np.random.uniform(1000, 4000))
            internet = np.random.uniform(0.3, 0.6)
            road = np.random.uniform(0.4, 0.7)
            low_income_pct = np.random.uniform(0.4, 0.6)
            
        elderly_pct = np.random.uniform(0.08, 0.22)
        
        min_f_dist = float('inf')
        nearest_f = None
        for _, f in df_facilities.iterrows():
            d = haversine(lat, lon, f['latitude'], f['longitude'])
            if d < min_f_dist:
                min_f_dist = d
                nearest_f = f
                
        min_s_dist = float('inf')
        for _, s in df_spec.iterrows():
            d = haversine(lat, lon, s['latitude'], s['longitude'])
            if d < min_s_dist:
                min_s_dist = d
        
        if cluster in [4, 6] and min_s_dist < 15:
            min_s_dist += np.random.uniform(15, 30)
            
        if cluster == 1 and min_f_dist > 10:
            min_f_dist = np.random.uniform(1, 5)

        hc_visits = int(pop * np.random.uniform(1, 3) * (road / 0.5))
        em_cases = int(pop * np.random.uniform(0.01, 0.05))
        tm_usage = internet * np.random.uniform(0.5, 0.9)
        
        communities.append({
            'location_id': f'C{i+1:03d}',
            'village_name': generate_name(),
            'latitude': lat,
            'longitude': lon,
            'population': pop,
            'elderly_population': int(pop * elderly_pct),
            'low_income_population': int(pop * low_income_pct),
            'distance_to_nearest_clinic_km': round(min_f_dist, 2),
            'distance_to_nearest_specialist_km': round(min_s_dist, 2),
            'doctors_available': nearest_f['doctors'] if nearest_f is not None else 0,
            'specialist_available': nearest_f['specialists'] if nearest_f is not None else 0,
            'internet_connectivity': round(internet, 2),
            'road_accessibility': round(road, 2),
            'healthcare_visits': hc_visits,
            'emergency_cases': em_cases,
            'telemedicine_usage': round(tm_usage, 2)
        })
        
    df_comm = pd.DataFrame(communities)
    df_comm.to_csv(os.path.join(output_dir, 'communities.csv'), index=False)
    print(f"Demo data generated successfully in {output_dir}")

if __name__ == '__main__':
    script_dir = os.path.dirname(os.path.abspath(__file__))
    generate_demo_data(script_dir)
