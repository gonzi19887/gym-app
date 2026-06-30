import json
import os
import re

# Rutas de los archivos
script_dir = os.path.dirname(os.path.abspath(__file__))
json_path = r"C:\Users\Gonzi\Documents\Proyectos\gym-app\src\db\scraped_exercises_es.json"
sql_output_path = r"C:\Users\Gonzi\Documents\Proyectos\gym-app\update_exercises.sql"

if not os.path.exists(json_path):
    print("Error: No se encontró el JSON en", json_path)
    exit(1)

with open(json_path, "r", encoding="utf-8") as f:
    exercises_data = json.load(f)

# 1. Diccionario de mapeos directos e individuales para ejercicios comunes o con nombres especiales (Adaptados de fitnessprogramer.com)
mapeo_nombres_directo = {
    # CARDIO
    "treadmill running": "Cinta de correr",
    "treadmill walking": "Caminadora / Caminata en cinta",
    "stair climber": "Escaladora (Stair Climber)",
    "elliptical trainer": "Elíptica",
    "stationary bicycle": "Bicicleta estática",
    "jump rope": "Salto de cuerda",
    "rowing machine": "Máquina de remo",
    "run in place": "Trotar en el sitio",
    "burpee": "Burpee",
    "burpees": "Burpees",
    "jumping jacks": "Saltos de tijera (Jumping Jacks)",
    "mountain climber": "Escaladores (Mountain Climbers)",
    "high knees": "Elevación de rodillas (High Knees)",
    "squat jump": "Sentadilla con salto",
    "box jump": "Salto al cajón",
    "farmers walk": "Paseo del granjero (Farmers Walk)",
    
    # BÍCEPS
    "barbell curl": "Curl de bíceps con barra",
    "dumbbell curl": "Curl de bíceps con mancuernas",
    "ez bar curl": "Curl de bíceps con barra EZ",
    "hammer curl": "Curl martillo",
    "preacher curl": "Curl predicador",
    "concentration curl": "Curl concentrado",
    "spider curl": "Curl araña",
    "waiter curl": "Curl de camarero",
    "cable curl": "Curl de bíceps en polea",
    "lying cable curl": "Curl de bíceps tumbado con polea",
    "seated hammer curl": "Curl martillo sentado",
    "seated alternating dumbbell curl": "Curl alterno con mancuernas sentado",
    
    # TRÍCEPS
    "cable tricep kickback": "Patada de tríceps en polea",
    "dumbbell triceps extension": "Extensión de tríceps con mancuerna",
    "overhead triceps extension": "Extensión de tríceps tras nuca",
    "triceps pushdown": "Extensión de tríceps en polea",
    "ez bar lying triceps extension (skullcrusher)": "Press francés con barra EZ (Skullcrusher)",
    "parallel bar dips": "Fondos en paralelas",
    "dips between chairs": "Fondos entre bancos / sillas",
    "chair dips": "Fondos en silla",
    "assisted triceps dips": "Fondos asistidos en máquina",
    "triceps extension machine": "Extensión de tríceps en máquina",
    
    # ESPALDA
    "straight arm pulldown": "Pullover en polea alta",
    "straight-arm pulldown": "Pullover en polea alta",
    "lat pulldown": "Jalón al pecho",
    "behind the neck pulldown": "Jalón tras nuca",
    "seated cable row": "Remo en polea baja",
    "bent over row": "Remo inclinado con barra",
    "dumbbell row": "Remo con mancuerna",
    "one arm dumbbell row": "Remo unilateral con mancuerna",
    "t-bar row": "Remo con barra en T",
    "pull-up": "Dominada",
    "pullup": "Dominada",
    "chin-up": "Dominada supina",
    "chinup": "Dominada supina",
    "back extension": "Hiperextensiones lumbares",
    "hyperextension": "Hiperextensiones lumbares",
    
    # PECHO
    "bench press": "Press de banca con barra",
    "dumbbell bench press": "Press de banca con mancuernas",
    "incline bench press": "Press de banca inclinado con barra",
    "incline dumbbell press": "Press inclinado con mancuernas",
    "decline bench press": "Press de banca declinado con barra",
    "decline dumbbell press": "Press declinado con mancuernas",
    "chest fly": "Aperturas de pecho con mancuernas",
    "push-up": "Flexión de pecho / lagartija",
    "pushup": "Flexión de pecho",
    "diamond push-up": "Flexión diamante",
    "cable crossover": "Cruce de poleas",
    
    # HOMBROS
    "shoulder press": "Press de hombros",
    "military press": "Press militar con barra",
    "arnold press": "Press Arnold",
    "lateral raise": "Elevaciones laterales",
    "front raise": "Elevaciones frontales",
    "shrug": "Encogimiento de hombros",
    "face pull": "Face pull en polea",
    "rear delt fly": "Pájaro / Vuelos posteriores en máquina",
    "bent over lateral raise": "Pájaro / Vuelos posteriores con mancuernas",
    
    # PIERNAS
    "back squat": "Sentadilla trasera con barra",
    "front squat": "Sentadilla frontal con barra",
    "goblet squat": "Sentadilla Goblet",
    "bulgarian split squat": "Sentadilla búlgara",
    "leg press": "Prensa de piernas",
    "hack squat": "Sentadilla Hack",
    "seated leg curl": "Curl de piernas sentado",
    "lying leg curl": "Curl de piernas acostado",
    "leg extension": "Extensión de piernas",
    "romanian deadlift": "Peso muerto rumano",
    "sumo deadlift": "Peso muerto sumo",
    "conventional deadlift": "Peso muerto convencional",
    "hip thrust": "Hip thrust",
    "glute bridge": "Puente de glúteos",
    
    # PANTORRILLAS
    "calf raise": "Elevación de talones / pantorrillas",
    "standing calf raise": "Elevación de talones de pie",
    "seated calf raise": "Elevación de talones sentado",
    
    # ABDOMEN
    "plank": "Plancha abdominal",
    "side plank": "Plancha lateral",
    "crunch": "Crunch abdominal",
    "bicycle crunch": "Crunch bicicleta",
    "russian twist": "Giros rusos",
    "ab wheel rollout": "Rueda abdominal (Ab Wheel)",
    "hanging leg raise": "Elevación de piernas colgado",
    "lying leg raise": "Elevación de piernas acostado",
    "dead bug": "Bicho muerto (Dead Bug)",
}

# Refinamiento de la auditoría 1-1 (Nombres comunes de internet/fitness)
mapeo_nombres_directo.update({
    "barbell rollout": "Rueda abdominal con barra (Barbell Rollout)",
    "barbell side bend": "Flexión lateral de tronco con barra",
    "cable side bend": "Flexión lateral de tronco en polea",
    "dumbbell floor wipers": "Limpiaparabrisas con mancuernas en el suelo (Floor Wipers)",
    "dumbbell side bend": "Flexión lateral de tronco con mancuerna",
    "dumbbell v-up": "Abdominales en V con mancuerna (V-ups)",
    "banded jack knife sit-up": "Abdominales navaja con banda de resistencia",
    "chaturanga dandasana": "Postura de plancha baja (Chaturanga Dandasana)",
    "decline sit-up": "Abdominales en banco declinado (Sit-ups)",
    "double leg stretch": "Estiramiento de doble pierna (Pilates)",
    "down to up twist gymstick": "Giros de abajo a arriba con Gymstick",
    "bicycle crunch gymstick": "Abdominales bicicleta con Gymstick",
    "skier gymstick": "Simulador de esquí con Gymstick",
    "swing gymstick": "Giros con Gymstick",
    "the box jump": "Salto al cajón (Box Jump)",
    "battle rope": "Entrenamiento con cuerdas de batalla (Battle Ropes)",
    "astride jumps": "Saltos laterales astride",
    "bodyweight row in doorway": "Remo con peso corporal en marco de puerta",
    "pelvic tilt": "Basculación / Inclinación pélvica",
    "glute bridge on bench": "Puente de glúteos apoyado en banco",
    "glute bridge one leg on bench": "Puente de glúteos a una pierna apoyado en banco",
    "side bridge hip abduction": "Plancha lateral con abducción de cadera",
    "unilateral bridge": "Puente de glúteos unilateral (a una pierna)",
    "hands bike": "Pedaleo de manos (Bicicleta de brazos)",
    "chin up around the bar": "Dominadas supinas alrededor de la barra",
    "shoulder external rotation": "Rotación externa de hombro",
    "elbow flexion": "Flexión de codo (Glosario)",
    "shoulder internal rotation": "Rotación interna de hombro",
    "alternating shoulder flexion": "Flexión de hombro alterna con mancuerna",
    "lateral leg swings": "Columpios laterales de piernas (Calentamiento)",
    "single knee to chest": "Estiramiento de rodilla al pecho",
    "frog pump": "Frog Pumps para glúteos",
    "landmine t-bar row": "Remo con barra T en Landmine",
    "1-2 stick drill": "Paso lateral 1-2 (Coordinación)",
    "rack pull": "Peso muerto parcial (Rack Pulls)",
    "fire hydrant": "Patada lateral de glúteo (Boca de incendio / Fire Hydrant)",
    "step up with knee raises": "Subidas al cajón con elevación de rodilla",
    "snap jumps": "Saltos snap (Snap Jumps / Medio Burpee)",
    "donkey kicks": "Patada de glúteo en cuadrupedia (Donkey Kicks)",
    "high knee run": "Carrera con rodillas altas (Skipping)",
    "high knee skips": "Saltos con rodillas altas",
    "reverse plank kicks": "Plancha invertida con patadas",
    "plank knee to elbow": "Plancha abdominal con rodilla al codo (Spiderman Plank)",
    "half wipers": "Medios limpiaparabrisas (Half Wipers)",
    "plank leg lift": "Plancha abdominal con elevación de pierna",
    "skater": "Saltos de patinador (Skaters)",
    "long arm crunch": "Crunch abdominal con brazos estirados",
    "jackknife sit-ups (v-up)": "Abdominales navaja (V-ups)",
    "flutter kick": "Aleteo de piernas (Flutter Kicks)",
    "hip abduction machine": "Abducciones de cadera en máquina",
    "side plank knee to elbow": "Plancha lateral con rodilla al codo",
    "suspended ab fall-out": "Despliegue de abdomen en suspensión (TRX)",
    "trx mountain climber": "Escaladores en suspensión con TRX",
    "bodyweight skull crushers": "Extensión de tríceps con peso corporal (Skullcrushers)",
    "glute ham raise": "Glute Ham Raise (Femorales)",
    "knee circles": "Círculos de rodillas (Movilidad)",
    "half cross crunch": "Medio crunch cruzado (Abdominales)",
    "hip circles": "Círculos de cadera (Movilidad)",
    "side plank rotation": "Plancha lateral con rotación de tronco",
    "reverse dips": "Fondos invertidos en banco",
    "wall ball": "Lanzamiento de balón a la pared (Wall Ball)",
    "kicks leg bent": "Patadas con pierna flexionada",
    "hell slide": "Deslizamientos de talón en el suelo",
    "prone abdominal hollowing": "Vacío abdominal en prono (acostado boca abajo)",
    "push-up to renegade row": "Flexiones con remo renegado",
    "smith machine hip thrust": "Hip thrust en máquina Smith",
    "rolling like a ball": "Rodar como una pelota (Pilates)",
    "assault airbike": "Bicicleta de aire (Assault Airbike)",
    "recumbent exercise bike": "Bicicleta estática reclinada",
    "ring dips": "Fondos en anillas",
    "side hip abduction": "Abducción lateral de cadera",
    "lever pullover": "Pullover en máquina de palanca",
    "commando pull-up": "Dominadas de comando (Commando Pull-ups)",
    "scapula pull-up": "Dominadas escapulares",
    "behind the neck pull-up": "Dominadas tras nuca",
    "bicycle twisting crunch": "Crunch con giro de bicicleta",
    "foam roller calves": "Masaje de pantorrillas con rodillo de espuma (Foam Roller)",
    "serratus wall slide with foam roller": "Deslizamientos en pared para serrato con rodillo",
    "hands in air dead bug": "Bicho muerto con manos arriba (Dead Bug)",
    "wall supported arm raises": "Elevación de brazos apoyado en pared",
    "dead hang": "Colgado pasivo en barra (Dead Hang)",
    "backhand raise": "Elevación de dorso de la mano",
    "isometric pull-up": "Dominada isométrica",
    "box jump 1 to 2": "Salto de caja de 1 a 2 pies",
    "box jump 2 to 1": "Salto de caja de 2 a 1 pies",
    "single leg box jump": "Salto al cajón a una pierna",
    "side plank oblique crunch": "Plancha lateral con crunch para oblicuos",
    "foot and ankle rotation": "Rotación de pie y tobillo (Movilidad)",
    "leg scissors": "Tijeras de piernas (Abdominales)",
    "side bent": "Flexión lateral de tronco de pie",
    "handstand": "Pino de pie (Handstand)",
    "handstand walk": "Caminata sobre manos (Handstand Walk)",
    "climbing monkey bars": "Pasamanos (Climbing Monkey Bars)",
    "supine spinal twist": "Giro espinal en supino (Estiramiento)",
    "reaction ball throw": "Lanzamiento con pelota de reacción",
    "lever high row": "Remo alto en máquina de palanca",
    "4 point tummy vacuum exercise": "Vacío abdominal en 4 puntos (cuadrupedia)",
    "jumping pull-up": "Dominadas con salto",
    "vibration plate": "Ejercicio en plataforma vibratoria",
    "foam roller posterior shoulder": "Masaje de hombro posterior con rodillo de espuma (Foam Roller)",
    "leg pull-in knee-ups": "Elevaciones de rodillas en banco sentado",
    "archer pull-up": "Dominadas de arquero (Archer Pull-ups)",
    "right cross": "Golpe de derecha (Directo / Cross)",
    "assisted pull-up": "Dominadas asistidas en máquina",
    "back lever": "Back Lever (Calistenia)",
    "pull-up": "Dominadas prónas",
    "inverted row": "Remo invertido (Dominadas australianas)",
    "wall slides": "Deslizamientos en pared para hombros",
    "weighted pull-up": "Dominadas con lastre",
    "scapula protraction and retraction": "Protracción y retracción escapular",
    "superman": "Ejercicio Supermán para lumbares",
    "hip adduction machine": "Aducciones de cadera en máquina",
    "impossible dips": "Fondos imposibles (Impossible Dips)",
    "hanging knee raises": "Elevaciones de rodillas colgado",
    "dragon flag": "Dragon Flag (Abdominales de Dragón)",
    "depth jump to hurdle hop": "Salto de profundidad a salto de valla (Pliometría)",
    "front lever pull-up": "Dominadas en Front Lever",
    "high plank": "Plancha alta sobre manos",
    "ball russian twist throw with partner": "Lanzamiento de giros rusos con balón medicinal y compañero",
    "neutral grip pull-up": "Dominadas con agarre neutro",
})

# 2. Función de traducción inteligente basada en reglas gramaticales para fitness
def traducir_nombre_fitness(name_en):
    name_clean = name_en.strip().lower()
    
    # Quitar caracteres especiales molestos o detalles entre paréntesis
    name_clean = re.sub(r'\(.*?\)', '', name_clean).strip()
    name_clean = re.sub(r'\s+', ' ', name_clean)

    # Verificar si está en el mapeo directo primero
    if name_clean in mapeo_nombres_directo:
        return mapeo_nombres_directo[name_clean]

    # Descomponer el nombre para traducir por partes
    # Estructura típica: [Modificadores] + [Ejercicio] + [Equipamiento]
    
    # Traducción de equipamiento
    equipamiento = ""
    if "dumbbell" in name_clean:
        equipamiento = " con mancuerna" if "one arm" in name_clean or "single arm" in name_clean else " con mancuernas"
    elif "barbell" in name_clean:
        equipamiento = " con barra"
    elif "ez-bar" in name_clean or "ez bar" in name_clean:
        equipamiento = " con barra EZ"
    elif "cable" in name_clean:
        equipamiento = " en polea"
    elif "machine" in name_clean:
        equipamiento = " en máquina"
    elif "band" in name_clean:
        equipamiento = " con banda de resistencia"
    elif "kettlebell" in name_clean:
        equipamiento = " con pesa rusa / kettlebell"
    elif "medicine ball" in name_clean:
        equipamiento = " con balón medicinal"
    elif "stability ball" in name_clean or "swiss ball" in name_clean or "exercise ball" in name_clean:
        equipamiento = " sobre pelota de estabilidad"
    elif "smith" in name_clean:
        equipamiento = " en máquina Smith"

    # Traducción de posición/modificadores
    posicion = ""
    if "seated" in name_clean:
        posicion = " sentado"
    elif "standing" in name_clean:
        posicion = " de pie"
    elif "lying" in name_clean:
        posicion = " acostado"
    elif "incline" in name_clean:
        posicion = " inclinado"
    elif "decline" in name_clean:
        posicion = " declinado"
    elif "bent over" in name_clean or "bent-over" in name_clean:
        posicion = " inclinado"
    elif "kneeling" in name_clean:
        posicion = " de rodillas"
    elif "one arm" in name_clean or "single arm" in name_clean or "one-arm" in name_clean:
        posicion += " unilateral"
    elif "alternate" in name_clean:
        posicion += " alterno"
    elif "reverse grip" in name_clean or "reverse-grip" in name_clean:
        posicion += " con agarre inverso"

    # Ejercicios base
    ejercicio = "Ejercicio"
    if "biceps curl" in name_clean or "bicep curl" in name_clean or "curl" in name_clean:
        if "hammer" in name_clean:
            ejercicio = "Curl martillo"
        elif "preacher" in name_clean:
            ejercicio = "Curl predicador"
        elif "concentration" in name_clean:
            ejercicio = "Curl concentrado"
        elif "wrist" in name_clean:
            ejercicio = "Curl de muñeca"
        elif "leg" in name_clean:
            ejercicio = "Curl de piernas"
        else:
            ejercicio = "Curl de bíceps"
            
    elif "triceps extension" in name_clean or "tricep extension" in name_clean or "extension" in name_clean:
        if "leg" in name_clean:
            ejercicio = "Extensión de piernas"
        elif "back" in name_clean:
            ejercicio = "Extensión de espalda"
        else:
            ejercicio = "Extensión de tríceps"
            
    elif "kickback" in name_clean:
        ejercicio = "Patada de tríceps"
        
    elif "bench press" in name_clean or "chest press" in name_clean or "press" in name_clean:
        if "shoulder" in name_clean or "overhead" in name_clean or "military" in name_clean:
            ejercicio = "Press de hombros"
        elif "leg" in name_clean:
            ejercicio = "Prensa de piernas"
        else:
            ejercicio = "Press de pecho"
            
    elif "fly" in name_clean:
        if "reverse" in name_clean or "rear delt" in name_clean:
            ejercicio = "Pájaro / Vuelos posteriores"
        else:
            ejercicio = "Aperturas de pecho"
            
    elif "raise" in name_clean:
        if "lateral" in name_clean or "side" in name_clean:
            ejercicio = "Elevaciones laterales"
        elif "front" in name_clean:
            ejercicio = "Elevaciones frontales"
        elif "calf" in name_clean:
            ejercicio = "Elevación de pantorrillas"
        elif "leg" in name_clean:
            ejercicio = "Elevación de piernas"
        else:
            ejercicio = "Elevación"
            
    elif "row" in name_clean:
        ejercicio = "Remo"
        
    elif "shrug" in name_clean:
        ejercicio = "Encogimiento de hombros"
        
    elif "pulldown" in name_clean:
        if "straight-arm" in name_clean or "straight arm" in name_clean:
            ejercicio = "Pullover en polea"
        else:
            ejercicio = "Jalón al pecho"
            
    elif "squat" in name_clean:
        ejercicio = "Sentadilla"
        
    elif "lunge" in name_clean:
        ejercicio = "Zancadas"
        
    elif "deadlift" in name_clean:
        ejercicio = "Peso muerto"
        
    elif "push-up" in name_clean or "pushup" in name_clean:
        ejercicio = "Flexiones de pecho"
        
    elif "pull-up" in name_clean or "pullup" in name_clean:
        ejercicio = "Dominadas"
        
    elif "chin-up" in name_clean or "chinup" in name_clean:
        ejercicio = "Dominadas supinas"
        
    elif "dip" in name_clean:
        ejercicio = "Fondos"
        
    elif "stretch" in name_clean:
        ejercicio = "Estiramiento"
        
    elif "plank" in name_clean:
        ejercicio = "Plancha"
        
    elif "twist" in name_clean:
        ejercicio = "Giro ruso"
        
    elif "yoga" in name_clean or "pose" in name_clean:
        ejercicio = "Postura de yoga"

    # Construir el nombre final en español
    nombre_traducido = f"{ejercicio}{posicion}{equipamiento}".strip()
    
    # Capitalizar la primera letra
    nombre_traducido = nombre_traducido[0].upper() + nombre_traducido[1:]
    return nombre_traducido

# 3. Categorizador automático robusto
def categorizar_ejercicio(name_en, current_category):
    name_clean = name_en.lower()
    
    if "cardio" in name_clean or "run" in name_clean or "walk" in name_clean or "treadmill" in name_clean or "stair" in name_clean or "elliptical" in name_clean or "bicycle" in name_clean or "cycling" in name_clean or "jump rope" in name_clean or "burpee" in name_clean:
        return "Cardio"
    if "bicep" in name_clean:
        return "Bíceps"
    if "tricep" in name_clean:
        return "Tríceps"
    if "forearm" in name_clean or "wrist" in name_clean:
        return "Antebrazos"
    if "bench press" in name_clean or "chest press" in name_clean or "fly" in name_clean or "push-up" in name_clean or "chest" in name_clean:
        if "reverse fly" in name_clean or "rear delt" in name_clean:
            return "Hombros"
        return "Pecho"
    if "row" in name_clean or "pulldown" in name_clean or "pull-up" in name_clean or "chin-up" in name_clean or "lat" in name_clean or "back" in name_clean:
        return "Espalda"
    if "shoulder" in name_clean or "military press" in name_clean or "lateral raise" in name_clean or "front raise" in name_clean or "delt" in name_clean or "shrug" in name_clean:
        return "Hombros"
    if "squat" in name_clean or "leg press" in name_clean or "lunge" in name_clean or "deadlift" in name_clean or "leg curl" in name_clean or "leg extension" in name_clean or "quad" in name_clean or "hamstring" in name_clean or "glute" in name_clean:
        return "Piernas"
    if "calf" in name_clean or "calves" in name_clean:
        return "Pantorrillas"
    if "crunch" in name_clean or "plank" in name_clean or "leg raise" in name_clean or "twist" in name_clean or "sit-up" in name_clean or "abs" in name_clean or "core" in name_clean:
        return "Abdomen"
    
    # Validar categorías ya existentes
    validas = ["Pecho", "Espalda", "Hombros", "Bíceps", "Tríceps", "Antebrazos", "Abdomen", "Piernas", "Pantorrillas", "Cardio", "Otros"]
    if current_category in validas:
        return current_category
        
    return "Otros"

# 4. Generador de instrucciones por plantilla para evitar campos vacíos
def generar_instrucciones_es(name_en, category):
    name_clean = name_en.lower()
    pos = []
    eje = []
    con = []
    var = []

    # Plantillas de acuerdo a categorías/ejercicios
    if category == "Bíceps":
        pos = [
            "Sujete el peso (mancuerna, barra o polea) con un agarre supino (palmas hacia arriba).",
            "Mantenga los pies separados al ancho de los hombros y las rodillas ligeramente flexionadas.",
            "Coloque los codos pegados a los costados del torso y mantenga la espalda recta."
        ]
        eje = [
            "Manteniendo inmóvil la parte superior de los brazos, flexione los codos y eleve la carga hacia los hombros.",
            "Apriete fuertemente los bíceps en el punto de máxima contracción por un segundo.",
            "Baje el peso de forma controlada y lenta hasta extender completamente los brazos."
        ]
        con = [
            "Evite balancear la espalda o mover los hombros hacia adelante para ayudarse.",
            "Mantenga las muñecas firmes y rectas durante todo el recorrido."
        ]
    elif category == "Tríceps":
        pos = [
            "Colóquese en la posición adecuada según la variante (de pie para polea, acostado para press francés o sentado).",
            "Alinee las manos con la resistencia y mantenga el abdomen contraído para estabilizar el cuerpo.",
            "Fije los codos cerca de la cabeza o de los costados del cuerpo."
        ]
        eje = [
            "Extienda completamente los codos empujando o presionando la resistencia de forma explosiva.",
            "Sienta la contracción en la parte posterior del brazo al completar la extensión.",
            "Regrese lentamente a la posición inicial flexionando los codos, sintiendo el estiramiento del tríceps."
        ]
        con = [
            "No abra los codos hacia afuera durante el movimiento.",
            "Evite utilizar el impulso del cuerpo o de los hombros."
        ]
    elif category == "Pecho":
        pos = [
            "Túmbese en el banco (plano, inclinado o declinado) apoyando firmemente la espalda, cabeza y pies.",
            "Sujete la barra o mancuernas con las manos separadas a un ancho ligeramente mayor que el de los hombros.",
            "Retraiga las escápulas (junte los omóplatos) y mantenga el abdomen firme."
        ]
        eje = [
            "Descienda la carga de manera controlada hacia la parte media del pecho (esternón).",
            "Empuje el peso hacia arriba de forma explosiva extendiendo los brazos sin llegar a bloquear los codos por completo.",
            "Sienta la contracción en los pectorales al final del ascenso."
        ]
        con = [
            "Mantenga los pies siempre apoyados en el suelo para mayor estabilidad.",
            "No rebote la barra en el pecho al descender."
        ]
    elif category == "Espalda":
        pos = [
            "Sujete el agarre (barra, mancuerna o polea) manteniendo una postura erguida.",
            "Alinee las rodillas y mantenga la espalda con su curvatura natural.",
            "Active el core y estabilice los hombros hacia abajo."
        ]
        eje = [
            "Tire de la resistencia hacia su cuerpo (abdomen o pecho) guiando el movimiento con los codos.",
            "Junte los omóplatos al final del tirón y sostenga la contracción muscular un instante.",
            "Extienda los brazos lentamente para regresar al punto de inicio."
        ]
        con = [
            "Evite tironear con la espalda baja o balancear el torso.",
            "Concéntrese en jalar con los dorsales y no únicamente con la fuerza de los brazos."
        ]
    elif category == "Hombros":
        pos = [
            "Sujete las mancuernas, barra o polea manteniendo una posición erguida y estable.",
            "Active el core para proteger la espalda baja.",
            "Mantenga los codos en un ángulo seguro (plano escapular)."
        ]
        eje = [
            "Eleve el peso de manera controlada (hacia el frente, los lados o arriba según el ejercicio).",
            "Llegue al punto máximo del recorrido de forma controlada.",
            "Descienda lentamente manteniendo la tensión en los deltoides."
        ]
        con = [
            "No encoja los hombros hacia las orejas durante la elevación.",
            "Utilice un peso que le permita controlar la bajada sin balanceo."
        ]
    elif category == "Piernas" or category == "Pantorrillas":
        pos = [
            "Colóquese en la máquina o posicione los pies a la anchura de las caderas.",
            "Mantenga la espalda recta y el abdomen contraído.",
            "Asegure que las rodillas estén alineadas con la punta de los pies."
        ]
        eje = [
            "Flexione las rodillas y caderas descendiendo el cuerpo de forma controlada.",
            "Empuje con fuerza a través de los talones para volver a la posición inicial.",
            "Evite hiperextender o bloquear las rodillas en el punto más alto."
        ]
        con = [
            "Mantenga siempre el talón apoyado firmemente.",
            "No permita que las rodillas colapsen hacia adentro."
        ]
    elif category == "Abdomen":
        pos = [
            "Recuéstese sobre la colchoneta o colóquese en suspensión.",
            "Fije la zona lumbar contra el suelo o estabilice la cadera.",
            "Coloque las manos suavemente al lado de la cabeza o mantenga los brazos estirados."
        ]
        eje = [
            "Contraiga el abdomen elevando los hombros o las piernas de manera controlada.",
            "Exhale completamente durante la máxima contracción abdominal.",
            "Regrese lentamente a la posición inicial manteniendo la tensión en el core."
        ]
        con = [
            "No tire del cuello con las manos.",
            "Concéntrese en la flexión de la columna y no de la cadera."
        ]
    elif category == "Cardio":
        pos = [
            "Colóquese en el equipo de cardio (cinta, elíptica, escaladora, etc.) o en una posición libre de pie.",
            "Ajuste los parámetros del dispositivo o prepare su cronómetro.",
            "Mantenga una postura erguida y la vista al frente."
        ]
        eje = [
            "Inicie el movimiento dinámico a un ritmo moderado para calentar.",
            "Incremente la velocidad o resistencia según su plan de entrenamiento.",
            "Mantenga una respiración rítmica y constante durante todo el tiempo de ejecución."
        ]
        con = [
            "Mantenga la hidratación adecuada antes y durante la actividad.",
            "Monitoree su frecuencia cardíaca para mantenerse en su zona de entrenamiento objetivo."
        ]
    else:
        # Genéricas
        pos = [
            "Adopte una posición cómoda y estable con la espalda recta.",
            "Prepare la carga o resistencia de forma segura.",
            "Active los músculos del core para mantener la estabilidad."
        ]
        eje = [
            "Realice el movimiento principal de forma controlada y con buena técnica.",
            "Mantenga una contracción muscular en el punto de mayor esfuerzo.",
            "Regrese lentamente a la posición inicial sintiendo el estiramiento."
        ]
        con = [
            "Ajuste el peso de acuerdo a su capacidad física.",
            "Consulte con un profesional si siente dolor o incomodidad excesiva."
        ]
        
    return {
        "posicion_inicial": pos,
        "ejecucion": eje,
        "consejos": con,
        "variantes": var
    }

# 5. Procesar todos los ejercicios y actualizar sus campos internos
ejercicios_saneados = {}
sql_statements = []

# Mapear los ejercicios actuales manteniendo sus IDs (para consistencia del seed)
for key, val in exercises_data.items():
    # Obtener el nombre en inglés del ejercicio
    name_en = val.get("name_en", key.replace("_", " ")).strip()
    
    # Traducir correctamente al español
    name_es_nuevo = traducir_nombre_fitness(name_en)
    
    # Categorizar correctamente
    categoria_nueva = categorizar_ejercicio(name_en, val.get("category", "Otros"))
    
    # Determinar el GIF y ruta
    gif_url = val.get("gif_url", "")
    local_gif_path = val.get("local_gif_path", "")
    
    # Generar o pulir instrucciones
    inst_es = val.get("posicion_inicial", [])
    eje_es = val.get("ejecucion", [])
    
    if not inst_es or len(inst_es) == 0:
        instrucciones_nuevas = generar_instrucciones_es(name_en, categoria_nueva)
        posicion_inicial = instrucciones_nuevas["posicion_inicial"]
        ejecucion = instrucciones_nuevas["ejecucion"]
        consejos = instrucciones_nuevas["consejos"]
        variantes = instrucciones_nuevas["variantes"]
    else:
        posicion_inicial = val.get("posicion_inicial", [])
        ejecucion = val.get("ejecucion", [])
        consejos = val.get("consejos", [])
        variantes = val.get("variantes", [])

    # Mantener el objeto limpio en el JSON
    ejercicios_saneados[key] = {
        "name_es": name_es_nuevo,
        "name_en": name_en,
        "category": categoria_nueva,
        "url": val.get("url", ""),
        "gif_url": gif_url,
        "local_gif_path": local_gif_path,
        "overview_es": val.get("overview_es", ""),
        "instructions_es": val.get("instructions_es", []),
        "muscles_es": val.get("muscles_es", []),
        "equipment_es": val.get("equipment_es", []),
        "tips_es": val.get("tips_es", []),
        "mistakes_es": val.get("mistakes_es", []),
        "alternates": val.get("alternates", []),
        "posicion_inicial": posicion_inicial,
        "ejecucion": ejecucion,
        "consejos": consejos,
        "variantes": variantes
    }

# 6. Inyección explícita de ejercicios especiales solicitados por el usuario
# Generaremos claves especiales en español
ejercicios_especiales = {
    "caminadora_de_gimnasio": {
        "name_es": "Cinta de correr / Caminadora",
        "name_en": "Treadmill Running",
        "category": "Cardio",
        "url": "https://fitnessprogramer.com/exercise/treadmill-running/",
        "gif_url": "https://fitnessprogramer.com/wp-content/uploads/2021/06/Treadmill.gif",
        "local_gif_path": "/images/CARDIO/treadmill.gif",
        "overview_es": "Ejercicio cardiovascular en cinta de correr para mejorar resistencia y quemar calorías.",
        "posicion_inicial": [
            "Súbase a la cinta de correr apoyando los pies en los rieles laterales.",
            "Sujete la llave de seguridad e insértela en el panel de control y engánchela en su ropa.",
            "Seleccione el programa de entrenamiento o la velocidad inicial."
        ],
        "ejecucion": [
            "Comience a caminar a un ritmo lento para calentar los músculos.",
            "Incremente gradualmente la velocidad hasta trotar o correr según su nivel.",
            "Mantenga una zancada natural y los hombros relajados."
        ],
        "consejos": [
            "Evite mirar constantemente a sus pies para no perder el equilibrio.",
            "Mantenga el cuerpo hidratado durante sesiones largas."
        ],
        "variantes": ["Caminata inclinada", "Sprint interválico"]
    },
    "escaladora_de_gimnasio": {
        "name_es": "Máquina escaladora / Escaladora",
        "name_en": "Stair Climber",
        "category": "Cardio",
        "url": "https://fitnessprogramer.com/exercise/stair-climber/",
        "gif_url": "https://fitnessprogramer.com/wp-content/uploads/2021/08/Stairmaster.gif",
        "local_gif_path": "/images/CARDIO/stairmaster.gif",
        "overview_es": "Ejercicio cardiovascular que simula subir escaleras para fortalecer glúteos y piernas.",
        "posicion_inicial": [
            "Súbase a los pedales de la máquina escaladora sujetándose de las barras de soporte.",
            "Configure el nivel de velocidad o resistencia deseado.",
            "Mantenga la espalda recta y el abdomen contraído."
        ],
        "ejecucion": [
            "Comience a dar pasos de forma constante, empujando los pedales hacia abajo.",
            "Mantenga un ritmo constante que eleve su frecuencia cardíaca.",
            "Apoye el pie completo en cada escalón para distribuir bien la carga."
        ],
        "consejos": [
            "Evite recargarse excesivamente sobre los pasamanos laterales.",
            "Mantenga una postura erguida durante todo el ejercicio."
        ],
        "variantes": ["Subida de escalón doble", "Pasos cruzados laterales"]
    },
    "eliptica": {
        "name_es": "Bici elíptica",
        "name_en": "Elliptical Trainer",
        "category": "Cardio",
        "url": "https://fitnessprogramer.com/exercise/elliptical-trainer/",
        "gif_url": "https://fitnessprogramer.com/wp-content/uploads/2021/04/Elliptical-Trainer.gif",
        "local_gif_path": "/images/CARDIO/elliptical-trainer.gif",
        "overview_es": "Ejercicio cardiovascular de bajo impacto que simula correr sin golpear las articulaciones.",
        "posicion_inicial": [
            "Súbase a los pedales de la elíptica y sujete los brazos móviles.",
            "Mantenga la vista al frente y la espalda recta.",
            "Inicie el pedaleo suavemente para encender la consola."
        ],
        "ejecucion": [
            "Empuje los pedales de manera elíptica moviendo los brazos en sincronía.",
            "Mantenga la fuerza repartida entre el empuje de las piernas y el jalón de los brazos.",
            "Aumente la resistencia o inclinación para mayor esfuerzo."
        ],
        "consejos": [
            "No despegue los talones de los pedales para evitar sobrecargar las pantorrillas.",
            "Mantenga los hombros relajados."
        ],
        "variantes": ["Pedaleo hacia atrás (inverso)", "Sin usar los pasamanos móviles"]
    },
    "bici_estatica": {
        "name_es": "Bicicleta estática",
        "name_en": "Stationary Bicycle",
        "category": "Cardio",
        "url": "https://fitnessprogramer.com/exercise/stationary-bicycle/",
        "gif_url": "",
        "local_gif_path": "/images/CARDIO/stationary-bike.gif",
        "overview_es": "Ejercicio de cardio de bajo impacto enfocado en piernas y resistencia general.",
        "posicion_inicial": [
            "Ajuste el sillín de la bicicleta a la altura de su cadera.",
            "Siéntese en el sillín y coloque los pies en los pedales, asegurando las correas.",
            "Sujete el manillar manteniendo la espalda ligeramente inclinada y el abdomen firme."
        ],
        "ejecucion": [
            "Comience a pedalear de forma constante sintiendo la resistencia adecuada.",
            "Mantenga una respiración rítmica y evite rebotar en el asiento.",
            "Incremente la resistencia o realice intervalos de velocidad."
        ],
        "consejos": [
            "Mantenga las rodillas apuntando hacia el frente en todo momento.",
            "No extienda completamente las piernas en la parte más baja del pedaleo."
        ],
        "variantes": ["Pedaleo de pie", "Intervalos de alta intensidad (HIIT)"]
    },
    "saltar_la_cuerda": {
        "name_es": "Salto de cuerda",
        "name_en": "Jump Rope",
        "category": "Cardio",
        "url": "https://fitnessprogramer.com/exercise/jump-rope/",
        "gif_url": "",
        "local_gif_path": "/images/CARDIO/jump-rope.gif",
        "overview_es": "Ejercicio cardiovascular de alta intensidad para mejorar agilidad, velocidad y coordinación.",
        "posicion_inicial": [
            "Sujete los mangos de la cuerda en cada mano con los codos cerca del cuerpo.",
            "Coloque la cuerda detrás de sus talones.",
            "Mantenga las rodillas ligeramente flexionadas y el abdomen firme."
        ],
        "ejecucion": [
            "Mueva las muñecas en círculos para pasar la cuerda por encima de su cabeza.",
            "Salte ligeramente sobre la cuerda apoyando la parte delantera de los pies.",
            "Mantenga los saltos bajos y el ritmo constante."
        ],
        "consejos": [
            "Salte con la punta de los pies para absorber el impacto adecuadamente.",
            "No levante demasiado las piernas para no cansarse prematuramente."
        ],
        "variantes": ["Salto alterno", "Doble vuelta (double under)"]
    },
    "pullover_en_polea_alta": {
        "name_es": "Pullover en polea alta",
        "name_en": "Straight Arm Pulldown",
        "category": "Espalda",
        "url": "https://fitnessprogramer.com/exercise/straight-arm-pulldown/",
        "gif_url": "https://fitnessprogramer.com/wp-content/uploads/2021/04/Straight-Arm-Pulldown.gif",
        "local_gif_path": "/images/ESPALDA/straight-arm-pulldown.gif",
        "overview_es": "Ejercicio de aislamiento enfocado en los dorsales y la parte superior de la espalda.",
        "posicion_inicial": [
            "Coloque una barra recta o cuerda en la polea alta.",
            "Sujete el agarre con las palmas mirando hacia abajo, dé un paso atrás y flexione levemente las caderas.",
            "Mantenga los brazos casi estirados (codos con flexión mínima) y el torso inclinado hacia adelante."
        ],
        "ejecucion": [
            "Tire de la barra hacia abajo hacia sus muslos describiendo un arco, contrayendo fuertemente los dorsales.",
            "Mantenga los brazos firmes y use la fuerza de la espalda para mover el peso.",
            "Regrese lentamente al punto de inicio permitiendo que la polea estire los dorsales por completo."
        ],
        "consejos": [
            "Evite flexionar y extender los codos para no involucrar al tríceps.",
            "Mantenga la espalda recta y no encoja los hombros."
        ],
        "variantes": ["Pullover en polea con cuerda", "Pullover con mancuerna en banco plano"]
    }
}

# Agregar los ejercicios especiales inyectados al diccionario principal
for key, val in ejercicios_especiales.items():
    ejercicios_saneados[key] = val

# 7. Escribir el archivo JSON de vuelta de forma limpia
with open(json_path, "w", encoding="utf-8") as f:
    json.dump(ejercicios_saneados, f, indent=2, ensure_ascii=False)

print(f"Saneados {len(ejercicios_saneados)} ejercicios en {json_path}")

# 8. Generar las sentencias SQL de UPDATE/INSERT para sincronizar con Supabase
# Para cada ejercicio saneado generamos un query SQL que actualiza nombre, categoría, y tips estructurados en public.exercises
for key, val in ejercicios_saneados.items():
    # Obtener el ID determinista exacto (mismo algoritmo que seed.ts)
    hash_val = 0
    for i in range(len(key)):
        hash_val = (hash_val << 5) - hash_val + ord(key[i])
        hash_val = hash_val & 0xffffffff
        if hash_val >= 0x80000000:
            hash_val -= 0x100000000
    hex_id = hex(abs(hash_val))[2:].zfill(8)
    final_id = f"{hex_id}-c0de-4e80-babe-{hex_id.ljust(12, '0')}"
    
    # Preparar campos SQL seguros (escaping comillas simples)
    name = (val.get("name_es") or "").replace("'", "''")
    category = (val.get("category") or "").replace("'", "''")
    gif_url = (val.get("gif_url") or "").replace("'", "''")
    
    # Combinar posicion_inicial + ejecucion + consejos en un array text[]
    tips_array = val["posicion_inicial"] + val["ejecucion"] + val["consejos"]
    cleaned_tips = []
    for t in tips_array:
        t_clean = t.replace("'", "''").replace('"', '\\"')
        cleaned_tips.append(f'"{t_clean}"')
    tips_sql_literal = "{" + ",".join(cleaned_tips) + "}"
    
    # Generar sentencia UPSERT
    sql = (
        f"INSERT INTO public.exercises (id, name, category, gif_url, tips, is_custom, user_id) "
        f"VALUES ('{final_id}', '{name}', '{category}', '{gif_url}', '{tips_sql_literal}'::text[], false, null) "
        f"ON CONFLICT (id) DO UPDATE SET "
        f"name = EXCLUDED.name, "
        f"category = EXCLUDED.category, "
        f"gif_url = EXCLUDED.gif_url, "
        f"tips = EXCLUDED.tips;"
    )
    sql_statements.append(sql)

# Escribir todas las sentencias en un archivo SQL
with open(sql_output_path, "w", encoding="utf-8") as f:
    f.write("-- SQL SCRIPT PARA ACTUALIZAR LOS EJERCICIOS DE LA BASE DE DATOS SUPABASE\n")
    f.write("-- Ejecuta esto en el SQL Editor de tu panel de control de Supabase.\n\n")
    f.write("\n".join(sql_statements))

print(f"Script SQL de actualización generado con éxito en: {sql_output_path}")
print(f"Total queries: {len(sql_statements)}")
