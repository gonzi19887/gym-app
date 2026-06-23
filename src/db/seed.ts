import { addRecord, getAllRecords, deleteRecord } from './localDb';
import type { Exercise } from './localDb';
// @ts-ignore
import scrapedExercises from './scraped_exercises_es.json';

export async function seedDatabase(): Promise<void> {
  try {
    const existing = await getAllRecords<Exercise>('exercises');
    const hasJpg = existing.some(ex => ex.gif_url && (ex.gif_url.endsWith('.jpg') || ex.gif_url.endsWith('.jpeg')));

    if (existing.length < 50 || hasJpg) {
      console.log('Cleaning exercises store to ensure only GIFs and scraped exercises are present...');
      for (const ex of existing) {
        await deleteRecord('exercises', ex.id);
      }

      const scrapedKeys = scrapedExercises ? Object.keys(scrapedExercises) : [];
      if (scrapedKeys.length > 0) {
        console.log(`Seeding database with ${scrapedKeys.length} scraped exercises...`);
        for (const [key, value] of Object.entries(scrapedExercises)) {
          const val = value as any;

          // Generate a deterministic UUID based on the exercise key to avoid duplicates and remain syncable
          let hash = 0;
          for (let i = 0; i < key.length; i++) {
            hash = (hash << 5) - hash + key.charCodeAt(i);
            hash |= 0;
          }
          const hex = Math.abs(hash).toString(16).padStart(8, '0');
          const finalId = `${hex}-c0de-4e80-babe-${hex.padEnd(12, '0')}`;

          const exercise: Exercise = {
            id: finalId,
            name: val.name_es || key.replace(/_/g, ' '),
            category: val.category || 'Otros',
            gif_url: val.local_gif_path || val.gif_url || '',
            tips: val.instructions_es || [],
            is_custom: false
          };
          await addRecord('exercises', exercise);
        }
        console.log('Seed with scraped exercises completed successfully.');
      } else {
        console.log('No scraped exercises JSON found to seed.');
      }
    }
  } catch (error) {
    console.error('Failed to seed database:', error);
  }
}
