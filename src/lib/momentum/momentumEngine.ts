import { db } from '@/lib/db';

export type MomentumZone = 'dormant' | 'warming' | 'flowing' | 'peak' | 'onFire';

export interface MomentumData {
  score: number;
  zone: MomentumZone;
  zoneLabel: string;
  isStruggling: boolean;
  weeklyHistory: number[];
  streakMultiplier: number;
}

const zoneThresholds: { zone: MomentumZone; min: number; color: string; labelKey: string }[] = [
  { zone: 'dormant', min: 0, color: '#94a3b8', labelKey: 'momentum.dormant' },
  { zone: 'warming', min: 3, color: '#f59e0b', labelKey: 'momentum.warming' },
  { zone: 'flowing', min: 6, color: '#3b82f6', labelKey: 'momentum.flowing' },
  { zone: 'peak', min: 11, color: '#8b5cf6', labelKey: 'momentum.peak' },
  { zone: 'onFire', min: 16, color: '#ef4444', labelKey: 'momentum.onFire' },
];

export function getZoneForScore(score: number): { zone: MomentumZone; color: string; labelKey: string } {
  let result = zoneThresholds[0];
  for (const t of zoneThresholds) {
    if (score >= t.min) result = t;
  }
  return result;
}

export function getZoneColor(zone: MomentumZone): string {
  return zoneThresholds.find(t => t.zone === zone)?.color || '#94a3b8';
}

export async function calculateMomentum(): Promise<MomentumData> {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const events = await db.actionEvents.where('timestamp').above(twoWeeksAgo).toArray();

  // Calculate today's score
  const todayEvents = events.filter(e => new Date(e.timestamp) >= oneDayAgo);
  let todayScore = 0;
  for (const e of todayEvents) {
    switch (e.type) {
      case 'note_created': todayScore += 1; break;
      case 'action_completed': todayScore += 2; break;
      case 'note_lifecycle_promoted': todayScore += 3; break;
      case 'note_updated': todayScore += 0.5; break;
    }
  }

  // Calculate streak multiplier
  let consecutiveDays = 0;
  for (let i = 0; i < 14; i++) {
    const dayStart = new Date(now.getTime() - (i + 1) * 24 * 60 * 60 * 1000);
    const dayEnd = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dayEvents = events.filter(e => {
      const t = new Date(e.timestamp);
      return t >= dayStart && t < dayEnd;
    });
    if (dayEvents.length > 0) consecutiveDays++;
    else break;
  }

  const streakMultiplier = consecutiveDays > 7 ? 1.5 : consecutiveDays > 3 ? 1.2 : 1.0;
  const finalScore = Math.round(todayScore * streakMultiplier);

  // Weekly history (last 7 days)
  const weeklyHistory: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(now.getTime() - (i + 1) * 24 * 60 * 60 * 1000);
    const dayEnd = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dayEvents = events.filter(e => {
      const t = new Date(e.timestamp);
      return t >= dayStart && t < dayEnd;
    });
    let dayScore = 0;
    for (const e of dayEvents) {
      switch (e.type) {
        case 'note_created': dayScore += 1; break;
        case 'action_completed': dayScore += 2; break;
        case 'note_lifecycle_promoted': dayScore += 3; break;
        case 'note_updated': dayScore += 0.5; break;
      }
    }
    weeklyHistory.push(Math.round(dayScore));
  }

  // Struggle detection
  const thisWeekTotal = weeklyHistory.slice(-7).reduce((a, b) => a + b, 0);
  const lastWeekEvents = events.filter(e => {
    const t = new Date(e.timestamp);
    return t >= twoWeeksAgo && t < oneWeekAgo;
  });
  let lastWeekTotal = 0;
  for (const e of lastWeekEvents) {
    switch (e.type) {
      case 'note_created': lastWeekTotal += 1; break;
      case 'action_completed': lastWeekTotal += 2; break;
      case 'note_lifecycle_promoted': lastWeekTotal += 3; break;
      case 'note_updated': lastWeekTotal += 0.5; break;
    }
  }
  const isStruggling = lastWeekTotal > 0 && thisWeekTotal < lastWeekTotal * 0.5;

  const { zone, labelKey } = getZoneForScore(finalScore);

  return {
    score: finalScore,
    zone,
    zoneLabel: labelKey,
    isStruggling,
    weeklyHistory,
    streakMultiplier,
  };
}
