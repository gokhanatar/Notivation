import { db, type Note } from '@/lib/db';

// Contextual prompts organized by category
const sparkPrompts = {
  en: {
    general: [
      "What's on your mind right now?",
      "Is there a decision you've been putting off?",
      "What's one thing you learned today?",
      "What would make today a good day?",
      "Is there something you want to remember later?",
    ],
    decision: [
      "What decision is weighing on you?",
      "What are the options you're considering?",
      "What would you advise a friend in your situation?",
    ],
    reflection: [
      "What went well this week?",
      "What could have gone better?",
      "What are you grateful for today?",
    ],
    action: [
      "What's the most important thing to do today?",
      "Is there a task you keep postponing?",
      "What small step could you take right now?",
    ],
  },
  tr: {
    general: [
      "Su an aklinda ne var?",
      "Ertelemekte oldugun bir karar var mi?",
      "Bugun ogrendigin bir sey neydi?",
      "Bugunu iyi bir gun yapacak sey ne?",
      "Sonra hatirlamak istedigin bir sey var mi?",
    ],
    decision: [
      "Hangi karar seni zorluyor?",
      "Dusundugun secenekler neler?",
      "Senin yerinde bir arkadasa ne tavsiye ederdin?",
    ],
    reflection: [
      "Bu hafta ne iyi gitti?",
      "Ne daha iyi olabilirdi?",
      "Bugun neye minnettar hissediyorsun?",
    ],
    action: [
      "Bugun yapilacak en onemli sey ne?",
      "Surekli erteledigin bir gorev var mi?",
      "Su an atabilcegin kucuk bir adim ne?",
    ],
  },
};

let currentIndex = 0;

/**
 * Get a contextual spark prompt
 * Rotates through different categories based on time of day and user context
 */
export function getSparkPrompt(lang: string = 'en'): string {
  const locale = lang.startsWith('tr') ? 'tr' : 'en';
  const prompts = sparkPrompts[locale];

  const hour = new Date().getHours();
  let category: keyof typeof prompts;

  if (hour >= 6 && hour < 10) {
    category = 'action';
  } else if (hour >= 10 && hour < 17) {
    category = 'general';
  } else if (hour >= 17 && hour < 21) {
    category = 'reflection';
  } else {
    category = 'general';
  }

  const categoryPrompts = prompts[category];
  const prompt = categoryPrompts[currentIndex % categoryPrompts.length];
  currentIndex++;

  return prompt;
}

/**
 * Get a half-finished note to suggest continuing
 */
export async function getUnfinishedNote(): Promise<Note | null> {
  const notes = await db.notes
    .filter(n => !n.archived && !n.vault)
    .toArray();

  // Find notes with very short body (likely unfinished)
  const unfinished = notes
    .filter(n => n.body.length > 0 && n.body.length < 50 && n.title.length === 0)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return unfinished[0] || null;
}
