import { type DecisionItem, getDecisionItemsByNote } from '@/lib/db';

export interface DecisionScore {
  score: number; // -100 to 100
  proTotal: number;
  conTotal: number;
  recommendation: 'yes' | 'no' | 'neutral';
}

export interface DecisionSummary extends DecisionScore {
  noteId: string;
  pros: DecisionItem[];
  cons: DecisionItem[];
  totalItems: number;
}

/**
 * Calculate a decision score from pro and con items.
 * Score = (proTotal - conTotal) / maxPossible * 100, normalized to -100..100.
 * Recommendation: score > 20 = 'yes', score < -20 = 'no', else 'neutral'.
 */
export function calculateDecisionScore(pros: DecisionItem[], cons: DecisionItem[]): DecisionScore {
  const proTotal = pros.reduce((sum, item) => sum + item.weight, 0);
  const conTotal = cons.reduce((sum, item) => sum + item.weight, 0);

  const maxPossible = Math.max(proTotal + conTotal, 1); // avoid division by zero
  const rawScore = proTotal - conTotal;
  const score = Math.round((rawScore / maxPossible) * 100);

  // Clamp to -100..100
  const clampedScore = Math.max(-100, Math.min(100, score));

  let recommendation: 'yes' | 'no' | 'neutral';
  if (clampedScore > 20) {
    recommendation = 'yes';
  } else if (clampedScore < -20) {
    recommendation = 'no';
  } else {
    recommendation = 'neutral';
  }

  return {
    score: clampedScore,
    proTotal,
    conTotal,
    recommendation,
  };
}

/**
 * Load decision items for a note from the database and calculate the full summary.
 */
export async function getDecisionSummary(noteId: string): Promise<DecisionSummary> {
  const items = await getDecisionItemsByNote(noteId);
  const pros = items.filter(i => i.type === 'pro');
  const cons = items.filter(i => i.type === 'con');

  const score = calculateDecisionScore(pros, cons);

  return {
    ...score,
    noteId,
    pros,
    cons,
    totalItems: items.length,
  };
}
