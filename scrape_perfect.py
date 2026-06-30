import json
import os
import re

def clean_and_structure_exercises():
    # Use relative path based on the script location
    script_dir = os.path.dirname(os.path.abspath(__file__))
    input_path = os.path.join(script_dir, 'src', 'db', 'scraped_exercises_es.json')
    output_path = input_path

    if not os.path.exists(input_path):
        print(f"Error: {input_path} does not exist.")
        return

    with open(input_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print(f"Loaded {len(data)} exercises for processing.")

    # Target categories mapping
    category_mapping = {
        # English terms to Spanish
        "neck": "Cuello",
        "cuello": "Cuello",
        "chest": "Pecho",
        "pecho": "Pecho",
        "back": "Espalda",
        "lats": "Espalda",
        "espalda": "Espalda",
        "trapecio": "Espalda",
        "trapecios": "Espalda",
        "shoulders": "Hombros",
        "deltoid": "Hombros",
        "deltoids": "Hombros",
        "hombros": "Hombros",
        "hombro": "Hombros",
        "biceps": "Bíceps",
        "bíceps": "Bíceps",
        "triceps": "Tríceps",
        "tríceps": "Tríceps",
        "forearms": "Antebrazos",
        "antebrazos": "Antebrazos",
        "abs": "Abdomen",
        "abdomen": "Abdomen",
        "abdominales": "Abdomen",
        "core": "Abdomen",
        "calves": "Pantorrillas",
        "pantorrilla": "Pantorrillas",
        "pantorrillas": "Pantorrillas",
        "legs": "Piernas",
        "quads": "Piernas",
        "hamstrings": "Piernas",
        "glutes": "Piernas",
        "piernas": "Piernas",
        "pierna": "Piernas",
        "cadera": "Piernas",
        "cardio": "Cardio",
        "yoga": "Yoga",
        "calisthenics": "Calistenia",
        "calistenia": "Calistenia"
    }

    processed_count = 0
    for key, val in data.items():
        # 1. Normalize Category
        raw_cat = str(val.get('category', 'Otros')).strip().lower()
        mapped_cat = "Otros"
        for k, v in category_mapping.items():
            if k in raw_cat:
                mapped_cat = v
                break
        val['category'] = mapped_cat

        # 2. Extract and Structure Instructions
        raw_instructions = val.get('instructions_es', [])
        
        # Remove duplicate sentences (some raw instructions have identical sentences or substrings)
        unique_instructions = []
        for line in raw_instructions:
            line_clean = line.strip()
            if not line_clean:
                continue
            # If line is already a substring of something we added, or vice versa, resolve it
            is_dup = False
            for added in unique_instructions:
                if line_clean in added and len(line_clean) > 10:
                    is_dup = True
                    break
                if added in line_clean and len(added) > 10:
                    # Replace shorter with longer
                    unique_instructions.remove(added)
                    break
            if not is_dup and line_clean not in unique_instructions:
                unique_instructions.append(line_clean)

        posicion_inicial = []
        ejecucion = []
        consejos = []
        variantes = []

        # Parse prefixed steps
        for line in unique_instructions:
            # Prefixes
            prefix_pos = ["configuración:", "posición inicial:", "setup:", "starting position:", "configure:"]
            prefix_eje = ["ejecución:", "execution:", "ascenso:", "descenso:", "movimiento:"]
            prefix_con = ["repeticiones y respiración:", "consejos:", "tips:", "comments:", "repeticiones:", "respiración:", "consejo:"]
            prefix_var = ["variaciones:", "variantes:", "variations:", "alternativas:"]

            line_lower = line.lower()
            matched = False

            for p in prefix_pos:
                if line_lower.startswith(p):
                    posicion_inicial.append(line[len(p):].strip())
                    matched = True
                    break
            if matched: continue

            for p in prefix_eje:
                if line_lower.startswith(p):
                    ejecucion.append(line[len(p):].strip())
                    matched = True
                    break
            if matched: continue

            for p in prefix_con:
                if line_lower.startswith(p):
                    consejos.append(line[len(p):].strip())
                    matched = True
                    break
            if matched: continue

            for p in prefix_var:
                if line_lower.startswith(p):
                    variantes.append(line[len(p):].strip())
                    matched = True
                    break
            if matched: continue

            # If no prefix, check keyword contents
            pos_words = ["ajuste", "coloque", "párese", "siéntese", "túmbese", "configure", "sujete", "agarre", "soporte", "inicial", "posición", "banco", "máquina", "peso", "setup", "starting", "parados"]
            eje_words = ["extienda", "empuje", "baje", "suba", "tire", "hale", "flexione", "doble", "levante", "ejecute", "realice", "movimiento", "exhale", "inhala", "ejecución", "desplace", "cruce", "lleve"]
            con_words = ["mantenga", "evite", "reps", "repeticiones", "consejo", "cuidado", "lesión", "apriete", "contraiga", "respiración", "inhalar", "exhalar", "asegúrese"]

            pos_score = sum(1 for w in pos_words if w in line_lower)
            eje_score = sum(1 for w in eje_words if w in line_lower)
            con_score = sum(1 for w in con_words if w in line_lower)

            if pos_score > eje_score and pos_score > con_score:
                posicion_inicial.append(line)
            elif eje_score > pos_score and eje_score > con_score:
                ejecucion.append(line)
            elif con_score > pos_score and con_score > eje_score:
                consejos.append(line)
            else:
                # Fallback to index-based distribution if no clear match
                pass

        # Any remaining instructions that weren't categorized by keyword score:
        uncategorized = [line for line in unique_instructions if line not in posicion_inicial and line not in ejecucion and line not in consejos and line not in variantes]
        
        # Distribute uncategorized based on relative position in the array
        for idx, line in enumerate(uncategorized):
            ratio = idx / len(uncategorized) if len(uncategorized) > 0 else 0
            if ratio < 0.35:
                posicion_inicial.append(line)
            elif ratio < 0.75:
                ejecucion.append(line)
            else:
                consejos.append(line)

        # Remove duplicate entries inside each list while preserving order
        val['posicion_inicial'] = list(dict.fromkeys([s.strip() for s in posicion_inicial if s.strip()]))
        val['ejecucion'] = list(dict.fromkeys([s.strip() for s in ejecucion if s.strip()]))
        val['consejos'] = list(dict.fromkeys([s.strip() for s in consejos if s.strip()]))
        val['variantes'] = list(dict.fromkeys([s.strip() for s in variantes if s.strip()]))
        
        # Clean up empty strings or formatting in names
        val['name_es'] = val.get('name_es', key.replace('_', ' ')).strip()
        
        processed_count += 1

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"Successfully processed and structured {processed_count} exercises in {output_path}.")

if __name__ == '__main__':
    clean_and_structure_exercises()
