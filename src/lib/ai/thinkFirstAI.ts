/**
 * Think First AI — Decision Analysis Module
 *
 * Uses the AI service layer for decision-related intelligence.
 */

import { getSettings } from '@/lib/db';
import { createAIProvider } from './aiService';

export interface ThinkFirstSuggestion {
  id: string;
  type: 'bias' | 'counter' | 'framework' | 'question';
  text: string;
  confidence: number;
}

export async function getThinkFirstSuggestions(
  noteContent: string,
  _noteType: string
): Promise<ThinkFirstSuggestion[]> {
  const settings = await getSettings();
  if (!settings.aiEnabled || !settings.aiApiKey || !settings.aiProvider || !settings.aiModel) {
    return [];
  }

  try {
    const provider = createAIProvider({
      provider: settings.aiProvider,
      model: settings.aiModel,
      apiKey: settings.aiApiKey,
    });
    const analysis = await provider.analyzeDecision(noteContent);
    if (!analysis) return [];

    return [{
      id: crypto.randomUUID(),
      type: 'framework',
      text: analysis,
      confidence: 0.8,
    }];
  } catch {
    return [];
  }
}

export async function isThinkFirstAvailable(): Promise<boolean> {
  const settings = await getSettings();
  return !!(settings.aiEnabled && settings.aiApiKey && settings.aiProvider);
}
