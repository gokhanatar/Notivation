import type { LifecycleStage, NoteType } from '@/lib/db';

// ==========================================
// LIFECYCLE STAGE DEFINITIONS
// ==========================================

export interface LifecycleStageConfig {
  id: LifecycleStage;
  labelKey: string;
  icon: string; // lucide icon name
  colorVar: string; // CSS variable name
  order: number;
}

export const lifecycleStages: LifecycleStageConfig[] = [
  { id: 'spark', labelKey: 'lifecycle.spark', icon: 'Sparkles', colorVar: '--lifecycle-spark', order: 0 },
  { id: 'thought', labelKey: 'lifecycle.thought', icon: 'Brain', colorVar: '--lifecycle-thought', order: 1 },
  { id: 'decision', labelKey: 'lifecycle.decision', icon: 'Scale', colorVar: '--lifecycle-decision', order: 2 },
  { id: 'action', labelKey: 'lifecycle.action', icon: 'Zap', colorVar: '--lifecycle-action', order: 3 },
  { id: 'outcome', labelKey: 'lifecycle.outcome', icon: 'Trophy', colorVar: '--lifecycle-outcome', order: 4 },
];

export const lifecycleStageMap: Record<LifecycleStage, LifecycleStageConfig> = Object.fromEntries(
  lifecycleStages.map(s => [s.id, s])
) as Record<LifecycleStage, LifecycleStageConfig>;

// ==========================================
// DEFAULT STAGE MAPPING
// ==========================================

export function getDefaultLifecycleStage(noteType: NoteType): LifecycleStage {
  switch (noteType) {
    case 'idea':
    case 'info':
    case 'question':
    case 'journal':
      return 'spark';
    case 'followup':
      return 'thought';
    case 'decision':
      return 'decision';
    case 'action':
      return 'action';
    default:
      return 'spark';
  }
}

// ==========================================
// PROMOTE / DEMOTE
// ==========================================

const stageOrder: LifecycleStage[] = ['spark', 'thought', 'decision', 'action', 'outcome'];

export function canPromote(stage: LifecycleStage): boolean {
  return stage !== 'outcome';
}

export function canDemote(stage: LifecycleStage): boolean {
  return stage !== 'spark';
}

export function getNextStage(stage: LifecycleStage): LifecycleStage | null {
  const idx = stageOrder.indexOf(stage);
  if (idx < 0 || idx >= stageOrder.length - 1) return null;
  return stageOrder[idx + 1];
}

export function getPreviousStage(stage: LifecycleStage): LifecycleStage | null {
  const idx = stageOrder.indexOf(stage);
  if (idx <= 0) return null;
  return stageOrder[idx - 1];
}

// ==========================================
// PROGRESS CALCULATION
// ==========================================

export function getLifecycleProgress(stage: LifecycleStage): number {
  const idx = stageOrder.indexOf(stage);
  if (idx < 0) return 0;
  return (idx + 1) / stageOrder.length; // 0.2, 0.4, 0.6, 0.8, 1.0
}

export function getLifecycleStageIndex(stage: LifecycleStage): number {
  return stageOrder.indexOf(stage);
}

export { stageOrder };
