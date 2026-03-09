import { db, type Note, type MoodType } from '@/lib/db';

export interface EmotionOutcomeStats {
  mood: MoodType;
  total: number;
  positive: number;
  negative: number;
  neutral: number;
  positiveRate: number;
}

export interface CalibrationReport {
  stats: EmotionOutcomeStats[];
  totalDecisions: number;
  hasEnoughData: boolean;
  bestMood: MoodType | null;
  worstMood: MoodType | null;
}

/**
 * Generate an Emotional Calibration Report
 * Correlates mood at decision time with eventual outcome
 */
export async function generateCalibrationReport(): Promise<CalibrationReport> {
  const decisions = await db.notes
    .filter(n => n.type === 'decision' && !n.archived && !!n.mood && !!n.decisionOutcome)
    .toArray();

  const moodGroups = new Map<MoodType, { positive: number; negative: number; neutral: number }>();

  for (const note of decisions) {
    if (!note.mood || !note.decisionOutcome) continue;

    if (!moodGroups.has(note.mood)) {
      moodGroups.set(note.mood, { positive: 0, negative: 0, neutral: 0 });
    }

    const group = moodGroups.get(note.mood)!;
    group[note.decisionOutcome]++;
  }

  const stats: EmotionOutcomeStats[] = [];
  for (const [mood, counts] of moodGroups) {
    const total = counts.positive + counts.negative + counts.neutral;
    stats.push({
      mood,
      total,
      positive: counts.positive,
      negative: counts.negative,
      neutral: counts.neutral,
      positiveRate: total > 0 ? counts.positive / total : 0,
    });
  }

  // Sort by total decisions
  stats.sort((a, b) => b.total - a.total);

  let bestMood: MoodType | null = null;
  let worstMood: MoodType | null = null;

  if (stats.length >= 2) {
    const sorted = [...stats].sort((a, b) => b.positiveRate - a.positiveRate);
    bestMood = sorted[0].mood;
    worstMood = sorted[sorted.length - 1].mood;
  }

  return {
    stats,
    totalDecisions: decisions.length,
    hasEnoughData: decisions.length >= 5,
    bestMood,
    worstMood,
  };
}
