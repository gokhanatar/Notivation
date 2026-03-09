/**
 * AI Service Layer
 * Supports Gemini, OpenAI, and Anthropic (Claude) providers.
 */

import { GoogleGenAI } from '@google/genai';
import { fillPrompt, SUMMARIZE_PROMPT, TAG_SUGGEST_PROMPT, DECISION_ANALYSIS_PROMPT } from './prompts';

// ==========================================
// TYPES
// ==========================================

export type AIProviderType = 'gemini' | 'openai' | 'anthropic';

export interface AIProviderConfig {
  provider: AIProviderType;
  model: string;
  apiKey: string;
}

export interface AIProvider {
  summarize(content: string): Promise<string>;
  suggestTags(content: string): Promise<string[]>;
  analyzeDecision(content: string): Promise<string>;
  testConnection(): Promise<boolean>;
}

// ==========================================
// MODEL OPTIONS
// ==========================================

export const AI_MODELS: Record<AIProviderType, { id: string; label: string }[]> = {
  gemini: [
    { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite' },
  ],
  openai: [
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { id: 'gpt-4o', label: 'GPT-4o' },
  ],
  anthropic: [
    { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
    { id: 'claude-sonnet-4-5-20250514', label: 'Claude Sonnet 4.5' },
  ],
};

export const API_KEY_URLS: Record<AIProviderType, string> = {
  gemini: 'https://aistudio.google.com/apikey',
  openai: 'https://platform.openai.com/api-keys',
  anthropic: 'https://console.anthropic.com/settings/keys',
};

// ==========================================
// GEMINI PROVIDER
// ==========================================

class GeminiProvider implements AIProvider {
  private client: GoogleGenAI;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  async summarize(content: string): Promise<string> {
    const prompt = fillPrompt(SUMMARIZE_PROMPT, content);
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: prompt,
    });
    return response.text || '';
  }

  async suggestTags(content: string): Promise<string[]> {
    const prompt = fillPrompt(TAG_SUGGEST_PROMPT, content);
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: prompt,
    });
    const text = response.text || '[]';
    try {
      const match = text.match(/\[[\s\S]*\]/);
      return match ? JSON.parse(match[0]) : [];
    } catch {
      return [];
    }
  }

  async analyzeDecision(content: string): Promise<string> {
    const prompt = fillPrompt(DECISION_ANALYSIS_PROMPT, content);
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: prompt,
    });
    return response.text || '';
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: 'Reply with "ok"',
      });
      return !!response.text;
    } catch {
      return false;
    }
  }
}

// ==========================================
// OPENAI PROVIDER
// ==========================================

class OpenAIProvider implements AIProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model;
  }

  private async chat(prompt: string): Promise<string> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1024,
      }),
    });
    if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  }

  async summarize(content: string): Promise<string> {
    return this.chat(fillPrompt(SUMMARIZE_PROMPT, content));
  }

  async suggestTags(content: string): Promise<string[]> {
    const text = await this.chat(fillPrompt(TAG_SUGGEST_PROMPT, content));
    try {
      const match = text.match(/\[[\s\S]*\]/);
      return match ? JSON.parse(match[0]) : [];
    } catch {
      return [];
    }
  }

  async analyzeDecision(content: string): Promise<string> {
    return this.chat(fillPrompt(DECISION_ANALYSIS_PROMPT, content));
  }

  async testConnection(): Promise<boolean> {
    try {
      const result = await this.chat('Reply with "ok"');
      return !!result;
    } catch {
      return false;
    }
  }
}

// ==========================================
// ANTHROPIC PROVIDER
// ==========================================

class AnthropicProvider implements AIProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model;
  }

  private async chat(prompt: string): Promise<string> {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);
    const data = await res.json();
    return data.content?.[0]?.text || '';
  }

  async summarize(content: string): Promise<string> {
    return this.chat(fillPrompt(SUMMARIZE_PROMPT, content));
  }

  async suggestTags(content: string): Promise<string[]> {
    const text = await this.chat(fillPrompt(TAG_SUGGEST_PROMPT, content));
    try {
      const match = text.match(/\[[\s\S]*\]/);
      return match ? JSON.parse(match[0]) : [];
    } catch {
      return [];
    }
  }

  async analyzeDecision(content: string): Promise<string> {
    return this.chat(fillPrompt(DECISION_ANALYSIS_PROMPT, content));
  }

  async testConnection(): Promise<boolean> {
    try {
      const result = await this.chat('Reply with "ok"');
      return !!result;
    } catch {
      return false;
    }
  }
}

// ==========================================
// FACTORY
// ==========================================

export function createAIProvider(config: AIProviderConfig): AIProvider {
  switch (config.provider) {
    case 'gemini':
      return new GeminiProvider(config.apiKey, config.model);
    case 'openai':
      return new OpenAIProvider(config.apiKey, config.model);
    case 'anthropic':
      return new AnthropicProvider(config.apiKey, config.model);
    default:
      throw new Error(`Unknown AI provider: ${config.provider}`);
  }
}
