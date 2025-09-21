import json
import os

# Paths
input_file = os.path.join(os.path.dirname(__file__), "plantnet300K_species_names.json")
output_file = os.path.join(os.path.dirname(__file__), "plantnet_classes.json")

# Read input JSON
with open(input_file, "r", encoding="utf-8") as f:
    data = json.load(f)

# Create array of keys (plant IDs)
plant_ids = list(data.keys())

# Write array to output JSON
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(plant_ids, f, ensure_ascii=False, indent=2)