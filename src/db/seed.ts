import { addRecord, getAllRecords, generateUUID } from './localDb';
import type { Exercise } from './localDb';

const SEED_EXERCISES: Omit<Exercise, 'id'>[] = [
  {
    name: 'Press de Banca con Barra',
    category: 'Pecho',
    gif_url: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Bench_Press_-_Medium_Grip/0.jpg',
    tips: [
      'Mantén 5 puntos de contacto: pies en el suelo, glúteos, espalda alta y cabeza apoyados en el banco.',
      'Haz una retracción escapular (junta los omóplatos) para proteger tus hombros.',
      'La barra debe descender controladamente hasta la parte baja del pecho forming un ángulo de 45-60 grados con tus codos.'
    ],
    is_custom: false
  },
  {
    name: 'Aperturas Inclinadas con Mancuernas',
    category: 'Pecho',
    gif_url: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Incline_Dumbbell_Flyes/0.jpg',
    tips: [
      'Mantén una ligera flexión constante en los codos para no estresar la articulación.',
      'Siente el estiramiento en las fibras del pecho al bajar, sin forzar un rango de movimiento excesivo.',
      'Al subir, imagina que estás abrazando un árbol gigante para mantener la tensión constante.'
    ],
    is_custom: false
  },
  {
    name: 'Dominadas (Pull-ups)',
    category: 'Espalda',
    gif_url: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pullups/0.jpg',
    tips: [
      'Inicia el movimiento tirando desde los codos hacia el suelo, no jalando con los bíceps.',
      'Lleva el pecho hacia la barra, no solo intentes pasar la barbilla por encima.',
      'Controla la fase excéntrica (bajada); no te dejes caer de golpe.'
    ],
    is_custom: false
  },
  {
    name: 'Remo con Barra',
    category: 'Espalda',
    gif_url: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Bent_Over_Barbell_Row/0.jpg',
    tips: [
      'Inclina el torso unos 45 grados manteniendo la espalda completamente neutra.',
      'Tira de la barra hacia la zona del ombligo/parte inferior del abdomen.',
      'Mantén el core activo durante toda la serie para proteger la espalda baja.'
    ],
    is_custom: false
  },
  {
    name: 'Sentadilla Libre con Barra',
    category: 'Piernas',
    gif_url: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Squat/0.jpg',
    tips: [
      'Los pies deben estar al ancho de los hombros con las puntas apuntando ligeramente hacia afuera.',
      'Inicia el descenso empujando la cadera hacia atrás y doblando las rodillas, bajando al menos hasta el paralelo.',
      'Mantén los talones firmes en el suelo en todo momento.'
    ],
    is_custom: false
  },
  {
    name: 'Peso Muerto Rumano',
    category: 'Piernas',
    gif_url: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Romanian_Deadlift/0.jpg',
    tips: [
      'Enfócate en empujar la cadera hacia atrás como si quisieras tocar la pared con los glúteos.',
      'Mantén las mancuernas o barra pegadas a tus piernas en todo momento.',
      'La flexión de rodilla debe ser mínima; el movimiento es de bisagra de cadera.'
    ],
    is_custom: false
  },
  {
    name: 'Press Militar con Mancuernas',
    category: 'Hombros',
    gif_url: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Shoulder_Press/0.jpg',
    tips: [
      'Configura el banco a unos 75-80 grados para evitar arquear la espalda baja.',
      'Mantén los codos ligeramente metidos hacia adelante (plano escapular), no abiertos de par en par.',
      'Presiona de manera controlada sin bloquear con violencia los codos arriba.'
    ],
    is_custom: false
  },
  {
    name: 'Curl de Bíceps con Mancuernas',
    category: 'Brazos',
    gif_url: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Alternate_Bicep_Curl/0.jpg',
    tips: [
      'Mantén los codos pegados a los costados and evita balancear el cuerpo.',
      'Gira la muñeca hacia afuera (supinación) al subir para contracción máxima.',
      'Desciende lentamente controlando el peso hasta estirar casi por completo.'
    ],
    is_custom: false
  }
];

export async function seedDatabase(): Promise<void> {
  try {
    const existing = await getAllRecords<Exercise>('exercises');
    if (existing.length === 0) {
      console.log('Seeding database with default exercises...');
      for (const item of SEED_EXERCISES) {
        const exercise: Exercise = {
          ...item,
          id: generateUUID()
        };
        await addRecord('exercises', exercise);
      }
      console.log('Seed completed successfully.');
    }
  } catch (error) {
    console.error('Failed to seed database:', error);
  }
}
