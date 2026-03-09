/**
 * AI Prompt Templates
 * Used by aiService providers for note summarization, tag suggestion, and decision analysis.
 */

export const SUMMARIZE_PROMPT = `You are a concise note summarizer. Given the following note content, produce a brief summary (2-3 sentences max) that captures the key points. Reply only with the summary, no extra commentary.

Note content:
{content}`;

export const TAG_SUGGEST_PROMPT = `You are a smart tagging assistant. Given the following note content, suggest 3-5 relevant tags. Return only a JSON array of tag strings, e.g. ["tag1", "tag2", "tag3"]. No extra text.

Note content:
{content}`;

export const DECISION_ANALYSIS_PROMPT = `You are a decision analysis assistant. Analyze the following decision note and provide:
1. A brief summary of the decision
2. Key pros (advantages)
3. Key cons (disadvantages)
4. A recommendation or things to consider

Keep it concise and structured. Use bullet points.

Decision note:
{content}`;

export function fillPrompt(template: string, content: string): string {
  return template.replace('{content}', content);
}
