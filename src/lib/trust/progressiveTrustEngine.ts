import { db, type AppSettings } from '@/lib/db';

export type TrustLevel = 'seed' | 'sprout' | 'grow' | 'bloom';

export interface TrustLevelConfig {
  id: TrustLevel;
  labelKey: string;
  minNotes: number;
  minDays: number;
  emoji: string;
  order: number;
}

export const trustLevels: TrustLevelConfig[] = [
  { id: 'seed', labelKey: 'trust.seed', minNotes: 0, minDays: 0, emoji: '🌱', order: 0 },
  { id: 'sprout', labelKey: 'trust.sprout', minNotes: 5, minDays: 3, emoji: '🌿', order: 1 },
  { id: 'grow', labelKey: 'trust.grow', minNotes: 15, minDays: 7, emoji: '🌳', order: 2 },
  { id: 'bloom', labelKey: 'trust.bloom', minNotes: 30, minDays: 14, emoji: '🌸', order: 3 },
];

export const trustLevelMap = Object.fromEntries(
  trustLevels.map(l => [l.id, l])
) as Record<TrustLevel, TrustLevelConfig>;

/**
 * Calculate the current trust level based on note count and days since first use
 */
export async function calculateTrustLevel(): Promise<TrustLevel> {
  const settings = await db.settings.get('default');
  if (settings?.trustOverride) return 'bloom';

  const noteCount = await db.notes.filter(n => !n.archived).count();
  const firstUseDate = settings?.firstUseDate ? new Date(settings.firstUseDate) : new Date();
  const daysSinceFirstUse = Math.floor(
    (new Date().getTime() - firstUseDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  let level: TrustLevel = 'seed';

  for (const config of trustLevels) {
    if (noteCount >= config.minNotes && daysSinceFirstUse >= config.minDays) {
      level = config.id;
    }
  }

  // Update stored level
  await db.settings.update('default', { trustLevel: level });

  return level;
}

/**
 * Feature gating configuration
 * Maps features to the minimum trust level required
 */
export const featureGates: Record<string, TrustLevel> = {
  'chunking': 'sprout',
  'decisionReplay': 'sprout',
  'emotionalCalibration': 'grow',
  'reverseSearch': 'sprout',
  'writeSpeed': 'sprout',
  'noteDNA': 'seed',
  'memoryFade': 'grow',
  'clarityScore': 'sprout',
  // New features
  'incubation': 'sprout',
  'freshStart': 'seed',
  'letGo': 'grow',
  'momentum': 'sprout',
  'openLoops': 'sprout',
  'calibration': 'grow',
  'futureCast': 'grow',
  'myWords': 'sprout',
  'folders': 'sprout',
  'canvas': 'bloom',
};

/**
 * Check if a feature is unlocked at the given trust level
 */
export function isFeatureUnlocked(feature: string, currentLevel: TrustLevel): boolean {
  const requiredLevel = featureGates[feature];
  if (!requiredLevel) return true;

  const currentOrder = trustLevelMap[currentLevel]?.order ?? 0;
  const requiredOrder = trustLevelMap[requiredLevel]?.order ?? 0;

  return currentOrder >= requiredOrder;
}
