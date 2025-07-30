# This script checks if all IDs in MathIDs are unique and prints duplicates if any.

import os
input_path = os.path.join(os.path.dirname(__file__), 'VerbalIDs')

with open(input_path, 'r') as f:
    ids = [line.strip() for line in f if line.strip()]

seen = set()
unique_ids = []
duplicates = set()
for id_ in ids:
    if id_ not in seen:
        unique_ids.append(id_)
        seen.add(id_)
    else:
        duplicates.add(id_)

with open(input_path, 'w') as f:
    for id_ in unique_ids:
        f.write(f"{id_}\n")

if duplicates:
    print(f"Removed {len(duplicates)} duplicate IDs. {len(ids) - len(unique_ids)} total duplicates removed.")
else:
    print("All IDs were unique. No changes made.")
