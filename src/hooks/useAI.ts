import { useState, useCallback, useEffect } from 'react';
import { getSettings } from '@/lib/db';
import { createAIProvider, type AIProvider, type AIProviderType } from '@/lib/ai/aiService';
import { db } from '@/lib/db';

interface UseAIReturn {
  isAvailable: boolean;
  loading: boolean;
  error: string | null;
  summarizeNote: (content: string) => Promise<string | null>;
  suggestNoteTags: (content: string) => Promise<string[]>;
  analyzeDecision: (content: string) => Promise<string | null>;
  testConnection: (provider: AIProviderType, model: string, apiKey: string) => Promise<boolean>;
}

export function useAI(): UseAIReturn {
  const [isAvailable, setIsAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSettings().then((settings) => {
      setIsAvailable(!!(settings.aiEnabled && settings.aiConsentGiven && settings.aiApiKey && settings.aiProvider && settings.aiModel));
    });
  }, []);

  const getProvider = useCallback(async (): Promise<AIProvider | null> => {
    const settings = await getSettings();
    if (!settings.aiEnabled || !settings.aiConsentGiven || !settings.aiApiKey || !settings.aiProvider || !settings.aiModel) {
      return null;
    }
    return createAIProvider({
      provider: settings.aiProvider,
      model: settings.aiModel,
      apiKey: settings.aiApiKey,
    });
  }, []);

  const summarizeNote = useCallback(async (content: string): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const provider = await getProvider();
      if (!provider) { setError('AI not configured'); return null; }
      const result = await provider.summarize(content);
      return result;
    } catch (e: any) {
      setError(e.message || 'AI error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [getProvider]);

  const suggestNoteTags = useCallback(async (content: string): Promise<string[]> => {
    setLoading(true);
    setError(null);
    try {
      const provider = await getProvider();
      if (!provider) { setError('AI not configured'); return []; }
      return await provider.suggestTags(content);
    } catch (e: any) {
      setError(e.message || 'AI error');
      return [];
    } finally {
      setLoading(false);
    }
  }, [getProvider]);

  const analyzeDecision = useCallback(async (content: string): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const provider = await getProvider();
      if (!provider) { setError('AI not configured'); return null; }
      return await provider.analyzeDecision(content);
    } catch (e: any) {
      setError(e.message || 'AI error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [getProvider]);

  const testConnection = useCallback(async (provider: AIProviderType, model: string, apiKey: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const p = createAIProvider({ provider, model, apiKey });
      const ok = await p.testConnection();
      if (!ok) setError('Connection failed');
      return ok;
    } catch (e: any) {
      setError(e.message || 'Connection error');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { isAvailable, loading, error, summarizeNote, suggestNoteTags, analyzeDecision, testConnection };
}
