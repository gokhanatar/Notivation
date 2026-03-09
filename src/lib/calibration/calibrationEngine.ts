import { db, type Note } from '@/lib/db';

export interface CalibrationBucket {
  confidenceRange: string;
  totalDecisions: number;
  positiveOutcomes: number;
  accuracy: number;
}

export interface CalibrationReport {
  buckets: CalibrationBucket[];
  brierScore: number;
  totalCalibratedDecisions: number;
  bias: 'overconfident' | 'underconfident' | 'well-calibrated';
  biasScore: number;
}

export async function generateCalibrationReport(): Promise<CalibrationReport> {
  const notes = await db.notes
    .filter(n => n.type === 'decision' && n.confidenceLevel !== undefined && n.decisionOutcome !== undefined)
    .toArray();

  // Create buckets: 1-2, 3-4, 5-6, 7-8, 9-10
  const bucketRanges = [
    { label: '1-2', min: 1, max: 2 },
    { label: '3-4', min: 3, max: 4 },
    { label: '5-6', min: 5, max: 6 },
    { label: '7-8', min: 7, max: 8 },
    { label: '9-10', min: 9, max: 10 },
  ];

  const buckets: CalibrationBucket[] = bucketRanges.map(range => {
    const bucketNotes = notes.filter(
      n => n.confidenceLevel! >= range.min && n.confidenceLevel! <= range.max
    );
    const positiveOutcomes = bucketNotes.filter(n => n.decisionOutcome === 'positive').length;
    return {
      confidenceRange: range.label,
      totalDecisions: bucketNotes.length,
      positiveOutcomes,
      accuracy: bucketNotes.length > 0 ? positiveOutcomes / bucketNotes.length : 0,
    };
  });

  // Brier Score calculation
  let brierSum = 0;
  for (const note of notes) {
    const predicted = (note.confidenceLevel || 5) / 10;
    const actual = note.decisionOutcome === 'positive' ? 1 : 0;
    brierSum += Math.pow(predicted - actual, 2);
  }
  const brierScore = notes.length > 0 ? brierSum / notes.length : 0;

  // Bias detection
  let biasSum = 0;
  for (const note of notes) {
    const predicted = (note.confidenceLevel || 5) / 10;
    const actual = note.decisionOutcome === 'positive' ? 1 : 0;
    biasSum += predicted - actual;
  }
  const biasScore = notes.length > 0 ? biasSum / notes.length : 0;
  const bias: 'overconfident' | 'underconfident' | 'well-calibrated' =
    biasScore > 0.15 ? 'overconfident' : biasScore < -0.15 ? 'underconfident' : 'well-calibrated';

  return {
    buckets,
    brierScore: Math.round(brierScore * 100) / 100,
    totalCalibratedDecisions: notes.length,
    bias,
    biasScore: Math.round(biasScore * 100) / 100,
  };
}
