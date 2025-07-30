# This script will read MathIDs, remove JSON structure, quotes, and commas, and overwrite the file with one ID per line (no extra characters).

import os
input_path = os.path.join(os.path.dirname(__file__), 'MathIDs')

with open(input_path, 'r') as f:
    import json
    ids = json.load(f)

with open(input_path, 'w') as f:
    for id_ in ids:
        f.write(f"{id_}\n")
