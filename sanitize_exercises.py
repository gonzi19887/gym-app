import json
import re

json_path = r"C:\Users\Gonzi\Documents\Proyectos\gym-app\src\db\scraped_exercises_es.json"
out_path = r"C:\Users\Gonzi\Documents\Proyectos\gym-app\src\db\scraped_exercises_es.json"

with open(json_path, "r", encoding="utf-8") as f:
    data = json.load(f)

# Diccionario de adaptaciones exactas para términos que Google Translate traduce de manera literal/incorrecta
correcciones_especificas = {
    "chin-up": "Dominada supina",
    "chinup": "Dominada supina",
    "plank": "Plancha abdominal",
    "muscle-up": "Muscle-up (Fuerza en barra)",
    "muscle up": "Muscle-up (Fuerza en barra)",
    "push press": "Push Press (Press con impulso)",
    "run in place": "Trotar en el sitio",
    "box pistol squat": "Sentadilla pistola sobre cajón (Pistol Squat)",
    "pistol squat": "Sentadilla pistola (Pistol Squat)",
    "abdominal bracing": "Activación isométrica abdominal (Bracing)",
    "abdominal hollow": "Vacío abdominal (Hollowing)",
    "stomach vacuum": "Vacío abdominal",
    "tummy vacuum": "Vacío abdominal",
    "dead bug": "Bicho muerto (Dead Bug)",
    "bird dog": "Bird Dog (Pájaro Perro)",
    "superman": "Supermán (lumbares)",
    "good morning": "Buenos días (Good Morning)",
    "farmers walk": "Paseo del granjero",
    "farmer's walk": "Paseo del granjero",
    "face pull": "Face Pull en polea alta",
    "facepull": "Face Pull en polea alta",
    "skullcrusher": "Press francés (Skullcrusher)",
    "skullcrushers": "Press francés (Skullcrusher)",
    "thruster": "Thrusters (Sentadilla con press)",
    "thrusters": "Thrusters (Sentadilla con press)",
    "bear crawl": "Caminata de oso (Bear Crawl)",
    "bear crawls": "Caminata de oso (Bear Crawl)",
    "chaturanga dandasana": "Plancha baja de yoga (Chaturanga Dandasana)",
    "chaturanga": "Plancha baja de yoga (Chaturanga)",
    "boxer shuffle cardio": "Paso de boxeador (Boxer Shuffle)",
    "boxer shuffle": "Paso de boxeador (Boxer Shuffle)",
    "cable rear pulldown": "Jalón tras nuca en polea",
    "front to side plank": "Plancha de frontal a lateral",
    "standing toe touch": "Estiramiento de toque de puntas de pie",
    "weighted muscle-up": "Muscle-up con lastre",
    "weighted muscle up": "Muscle-up con lastre",
}

# Patrones de expresiones regulares y sus reemplazos de jerga de gimnasio en español
reemplazos_patrones = [
    # 1. Correcciones de palabras que se traducen literal
    (r"\bposavasos ab\b", "Ab Coaster"),
    (r"\bposavasos\b", "Ab Coaster"),
    (r"\bpalo de gimnasia\b", "Gymstick"),
    (r"\bpalo de gimnasio\b", "Gymstick"),
    (r"\bmina terrestre\b", "Landmine"),
    (r"\bcontragolpe\b", "patada de glúteos"),
    (r"\bcontragolpes\b", "patadas de glúteos"),
    (r"\bmusculoso\b", "Muscle-up"),
    (r"\bejecutar en el lugar\b", "Trotar en el sitio"),
    (r"\bejercicio de plancha\b", "Plancha"),
    (r"\bplancha corporal\b", "plancha tipo sierra"),
    (r"\bsierra corporal\b", "plancha tipo sierra (Body Saw)"),
    (r"\bsierra de carrocería\b", "plancha tipo sierra (Body Saw)"),
    (r"\bejercicio de dominada\b", "Dominada"),
    (r"\bde la mquina de Smith\b", "en máquina Smith"),
    (r"\bde la mquina Smith\b", "en máquina Smith"),
    (r"\bmquina de smith\b", "en máquina Smith"),
    (r"\bmquina smith\b", "en máquina Smith"),
    (r"\bmáquina de smith\b", "en máquina Smith"),
    (r"\bmáquina smith\b", "en máquina Smith"),
    (r"\bde la mquina de palanca\b", "en máquina de palanca"),
    (r"\bmquina de palanca\b", "en máquina de palanca"),
    (r"\bmáquina de palanca\b", "en máquina de palanca"),
    (r"\bde la mquina de cable\b", "en polea"),
    (r"\bde cable\b", "en polea"),
    (r"\bde la mquina de cables\b", "en polea"),
    (r"\bde la mquina con cables\b", "en polea"),
    (r"\bcuerda de salto\b", "salto de cuerda"),
    (r"\bcuerda para saltar\b", "salto de cuerda"),
    (r"\bmosca del pecho\b", "aperturas de pecho"),
    (r"\bmosca de pecho\b", "aperturas de pecho"),
    (r"\bmoscas de pecho\b", "aperturas de pecho"),
    (r"\bmosca inversa\b", "pájaro / vuelos posteriores"),
    (r"\bmoscas inversas\b", "pájaro / vuelos posteriores"),
    (r"\blevantamiento de piernas\b", "elevación de piernas"),
    (r"\blevantamientos de piernas\b", "elevación de piernas"),
    (r"\blevantamiento de pierna\b", "elevación de pierna"),
    (r"\blevantamientos de pierna\b", "elevación de pierna"),
    (r"\blevantamiento de rodilla\b", "elevación de rodilla"),
    (r"\blevantamientos de rodilla\b", "elevación de rodilla"),
    (r"\blevantamiento de rodillas\b", "elevación de rodillas"),
    (r"\blevantamientos de rodillas\b", "elevación de rodillas"),
    (r"\bencogimiento de hombros\b", "encogimiento de hombros"),
    (r"\bencogimientos de hombros\b", "encogimiento de hombros"),
    (r"\bde oso\b", "de caminata de oso"),
    (r"\bde arrastre de oso\b", "de caminata de oso"),
    (r"\barrastre del oso\b", "caminata de oso"),
    (r"\bde arrastre del oso\b", "de caminata de oso"),
    (r"\bbarra con mancuernas\b", "mancuerna"),
    (r"\bcon mancuernas de mancuerna\b", "con mancuerna"),
    (r"\bde vaco de barriga\b", "de vacío abdominal"),
    (r"\bde vaco de abdomen\b", "de vacío abdominal"),
    (r"\bvaco de abdomen\b", "vacío abdominal"),
    (r"\bvaco de barriga\b", "vacío abdominal"),
    (r"\bvacío de abdomen\b", "vacío abdominal"),
    (r"\bvacío de barriga\b", "vacío abdominal"),
    (r"\bde vacio de barriga\b", "de vacío abdominal"),
    (r"\bde vacio de abdomen\b", "de vacío abdominal"),
    (r"\bdespliegue de barra\b", "despliegue con barra"),
    (r"\bdespliegue de la rueda abdominal\b", "rueda abdominal (Ab Wheel Rollout)"),
    (r"\bdespliegue de rueda abdominal\b", "rueda abdominal (Ab Wheel Rollout)"),
    (r"\bempujar prensa\b", "Push Press (Press con impulso)"),
    (r"\bprensa de empuje\b", "Push Press (Press con impulso)"),
    (r"\bde la caja de la pistola\b", "pistola sobre cajón (Pistol Squat)"),
    (r"\bde la caja de pistola\b", "pistola sobre cajón (Pistol Squat)"),
    (r"\bsentadilla con pistola\b", "sentadilla pistola"),
    (r"\bsentadillas con pistola\b", "sentadillas pistola"),
    (r"\bcangrejo de twist\b", "giro de cangrejo"),
    (r"\bcangrejo giro\b", "giro de cangrejo"),
    (r"\bgiro de cangrejo\b", "giro de cangrejo (Crab Twist)"),
    (r"\barrastre de oso de escalada\b", "escaladores en posición de oso"),
    (r"\btringulo\b", "triángulo (Push-up)"),
    (r"\btriangulo\b", "triángulo (Push-up)"),
    (r"\bde inclinacin plvica\b", "de basculación pélvica"),
    (r"\binclinacin plvica\b", "basculación pélvica"),
    (r"\binclinación pélvica\b", "basculación pélvica"),
    
    # 2. Reemplazos de verbos o palabras sueltas de traducción literal
    (r"\bprensa de pecho\b", "press de pecho"),
    (r"\bprensas de pecho\b", "press de pecho"),
    (r"\bprensa de hombro\b", "press de hombros"),
    (r"\bprensas de hombro\b", "press de hombros"),
    (r"\bprensa militar\b", "press militar"),
    (r"\bprensa de piernas\b", "prensa de piernas"),
    (r"\bprensas de piernas\b", "prensa de piernas"),
    (r"\bextensin de tríceps de mancuerna\b", "extensión de tríceps con mancuerna"),
    (r"\btrceps pushdown\b", "extensión de tríceps en polea"),
    (r"\btriceps pushdown\b", "extensión de tríceps en polea"),
    (r"\bextensin de trceps en polea alta\b", "extensión de tríceps en polea"),
    (r"\bcurl de barra ez\b", "curl con barra EZ"),
    (r"\bcurl de barra EZ\b", "curl con barra EZ"),
    (r"\bcurl de bíceps de barra ez\b", "curl de bíceps con barra EZ"),
    (r"\bcurl de bceps de barra ez\b", "curl de bíceps con barra EZ"),
    (r"\bejercicio de curl\b", "curl"),
    (r"\bejercicio de remo\b", "remo"),
    (r"\bejercicio de flexin\b", "flexión"),
    (r"\bejercicio de flexión\b", "flexión"),
    (r"\bejercicio de sentadilla\b", "sentadilla"),
    (r"\bejercicio de estiramiento\b", "estiramiento"),
    
    # 3. Limpieza de conectores o redundancias
    (r"^(ejercicio de|ejercicios de|ejercicio para|ejercicios para)\s+", ""),
    
    # 4. Traducciones erróneas sistemáticas de gimnasio
    (r"\binmersión\b", "fondo"),
    (r"\binmersiones\b", "fondos"),
    (r"\bcrujido\b", "crunch"),
    (r"\bcrujidos\b", "crunch"),
    (r"\baérea\b", "sobre la cabeza"),
    (r"\baéreo\b", "sobre la cabeza"),
    (r"\bcon un solo brazo\b", "unilateral"),
    (r"\ba un solo brazo\b", "unilateral"),
    (r"\bun solo brazo\b", "unilateral"),
    (r"\bcon un brazo\b", "unilateral"),
    (r"\bcon cable\b", "en polea"),
    (r"\bde cable\b", "en polea"),
    (r"\bcon polea\b", "en polea"),
    (r"\bcuclillas\b", "sentadilla"),
    (r"\bcuclilla\b", "sentadilla"),
    (r"\bdividido búlgaro\b", "búlgaro (Split)"),
    (r"\bdividida búlgara\b", "búlgara (Split)"),
    (r"\blimpiadores de piso\b", "limpiaparabrisas (Floor Wipers)"),
    (r"\blimpiador de piso\b", "limpiaparabrisas (Floor Wipers)"),
    (r"\blimpiadores de suelo\b", "limpiaparabrisas (Floor Wipers)"),
    (r"\btorsión de arriba a abajo\b", "giro de alto a bajo"),
    (r"\btorsión de abajo a arriba\b", "giro de bajo a alto"),
    (r"\bde torsión\b", "de giro"),
    (r"\btorsión\b", "giro"),
    (r"\brejilla frontal\b", "soporte frontal (Front Rack)"),
    (r"\brejilla\b", "soporte (Rack)"),
    (r"\bestirable\b", "estiramiento"),
    (r"\bde unilateral\b", "unilateral"),
    (r"\bcruce de polea unilateral\b", "cruce de poleas unilateral"),
    (r"\bcontragolpe inverso\b", "patada de glúteos inversa"),
    (r"\bjersey\b", "pullover"),
    (r"\bjerseys\b", "pullover"),
    (r"\bponderado\b", "con lastre"),
    (r"\bponderada\b", "con lastre"),
    (r"\bponderados\b", "con lastre"),
    (r"\bestocada\b", "zancada"),
    (r"\bestocadas\b", "zancadas"),
    (r"\bpaseo por la pared\b", "caminata por la pared (Wall Walk)"),
    (r"\bcaminata de pared\b", "caminata por la pared (Wall Walk)"),
    (r"\blevantamientos corporales\b", "flexiones de tríceps en plancha (Body Ups)"),
    (r"\bflexión de tríceps en polea\b", "extensión de tríceps en polea"),
    (r"\bflexión de tríceps\b", "extensión de tríceps"),
    (r"\bflexión de triceps\b", "extensión de tríceps"),
    (r"\bprensa arnold\b", "Press Arnold"),
    (r"\bprensa Arnold\b", "Press Arnold"),
    (r"\belevación de troncos\b", "elevación de tronco (Log Lift)"),
    (r"\bcon una pierna\b", "a una pierna"),
    (r"\bmolino de viento\b", "Molino (Windmill)"),
    (r"\bflexión de caída\b", "flexión pliométrica con caída (Drop Push-Up)"),
    (r"\bsentadilla hasta la rodilla\b", "sentadilla con elevación de rodilla"),
    (r"\bpatada de aleteo\b", "aleteo de piernas (Flutter Kicks)"),
    (r"\bpatadas de aleteo\b", "aleteo de piernas (Flutter Kicks)"),
    (r"\bmosca de la máquina\b", "aperturas en máquina"),
    (r"\bmosca de la mquina\b", "aperturas en máquina"),
    (r"\bmosca\b", "aperturas"),
    (r"\bmoscas\b", "aperturas"),
    (r"\bplaca cargada\b", "con discos (Plate Loaded)"),
    (r"\bplacas cargadas\b", "con discos (Plate Loaded)"),
    (r"\bcon placa cargada\b", "con discos (Plate Loaded)"),
    (r"\bcon placas cargadas\b", "con discos (Plate Loaded)"),
    (r"\btirón facial\b", "Face Pull"),
    (r"\btirón de cara\b", "Face Pull"),
    (r"\bmedio arrodillado\b", "en media rodilla"),
    (r"\bmedio arrodillada\b", "en media rodilla"),
    (r"\bescalador de escaleras\b", "escaladora"),
    (r"\bminas terrestres\b", "Landmine"),
    (r"\bcrujiente de pliegue\b", "crunch agrupado (Tuck Crunch)"),
    (r"\bcrujiente\b", "crunch"),
    (r"\bpilates de adelanto\b", "Teaser (Pilates)"),
    (r"\bteaser pilates\b", "Teaser (Pilates)"),
    (r"\brodilla con balón de estabilidad\b", "encogimiento de rodillas sobre fitball (Knee Tuck)"),
    (r"\brodilla con pelota de estabilidad\b", "encogimiento de rodillas sobre fitball (Knee Tuck)"),
    (r"\brodilla con fitball\b", "encogimiento de rodillas sobre fitball (Knee Tuck)"),
    (r"\bempuje con banda\b", "extensión de tríceps con banda"),
    (r"\bretroceso de glúteos\b", "patada de glúteos"),
    (r"\bretroceso de glúteo\b", "patada de glúteos"),
    (r"\bretroceso\b", "patada"),
    (r"\bdividido\b", "Split"),
    (r"\bdividida\b", "Split"),
    (r"\brechazar\b", "declinado"),
    (r"\bponderada\b", "con lastre"),
    (r"\bponderadas\b", "con lastre"),
    (r"\bcon una sola pierna\b", "a una pierna"),
    (r"\ba una sola pierna\b", "a una pierna"),
    (r"\bdivididos\b", "Split"),
    (r"\bdivididas\b", "Split"),
    (r"\bjalón lateral\b", "jalón al pecho"),
    (r"\bjalón de lat\b", "jalón al pecho"),
    (r"\bjalones de lat\b", "jalones al pecho"),
    (r"\btoque de hombros\b", "con toque de hombros"),
    (r"\btoque de hombro\b", "con toque de hombros"),
    (r"\blimpiar y presionar\b", "cargada y press (Clean and Press)"),
    (r"\bcargada y presionar\b", "cargada y press (Clean and Press)"),
    (r"\bpasar el cable\b", "tirón entre piernas en polea (Pull Through)"),
    (r"\btirar del cable\b", "tirón entre piernas en polea (Pull Through)"),
    (r"\btirones de cable\b", "tirón entre piernas en polea (Pull Through)"),
    (r"\bcurva lateral\b", "flexión lateral de tronco"),
    (r"\bde dos brazos\b", "a dos brazos"),
    (r"\bcolumpio 360\b", "giro 360"),
    (r"\bcorrer en cinta\b", "correr en cinta (cinta de correr)"),
    (r"\bpatada de glúteos de tríceps\b", "patada de tríceps"),
    (r"\bpatada de glúteo de tríceps\b", "patada de tríceps"),
    (r"\bdesplegable trasero\b", "jalón tras nuca"),
    (r"\bdesplegable\b", "jalón"),
    (r"\bmusculación\b", "Muscle-up"),
]

count = 0
for key, val in data.items():
    name_en = val.get("name_en", "").strip()
    name_es = val.get("name_es", "").strip()
    
    if not name_en:
        continue
    
    name_en_lower = name_en.lower()
    
    # 1. Verificar si tiene excepción exacta
    if name_en_lower in correcciones_especificas:
        val["name_es"] = correcciones_especificas[name_en_lower]
        count += 1
        continue
    
    # 2. Aplicar patrones
    new_name = name_es
    for pattern, rep in reemplazos_patrones:
        new_name = re.sub(pattern, rep, new_name, flags=re.IGNORECASE)
        
    # Condicionar flexión de hombros para Shoulder Tap Push-ups
    if "push-up" in name_en_lower or "pushup" in name_en_lower:
        if "flexión de hombros" in new_name.lower():
            new_name = re.sub(r"flexión de hombros", "flexión de pecho con toque de hombros (Shoulder Tap)", new_name, flags=re.IGNORECASE)
    else:
        # Revertir cualquier cambio incorrecto en estiramientos de flexión de hombros
        if "flexión de pecho con con toque de hombros" in new_name.lower() or "flexión de pecho con toque de hombros" in new_name.lower():
            new_name = "Estiramiento de flexión de hombro"
    
    # 3. Eliminar redundancias de inicio
    new_name = re.sub(r'^(ejercicio de|ejercicios de|ejercicio para|ejercicios para)\s+', '', new_name, flags=re.IGNORECASE)
    if len(new_name.split()) > 2:
        if new_name.lower().startswith("ejercicio con "):
            new_name = new_name[14:]
        elif new_name.lower().startswith("ejercicio en "):
            new_name = new_name[13:]
            
    # Capitalizar la primera letra del resultado final
    if new_name:
        new_name = new_name[0].upper() + new_name[1:]
        
    if new_name != name_es:
        val["name_es"] = new_name
        count += 1

# Guardar cambios
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Saneamiento de jerga de gimnasio completado. Se corrigieron y guardaron {count} ejercicios en {out_path}.")
