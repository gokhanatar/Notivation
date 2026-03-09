import { intentDictionary } from '@/lib/search/intentDictionary';
import type { Tag } from '@/lib/db';

// Category → tag name mapping with colors
const CATEGORY_TAGS: Record<string, { name: string; nameKey: string; color: string; keywords: string[] }> = {
  work: {
    name: 'Work',
    nameKey: 'category.work',
    color: '#3b82f6',
    keywords: ['iş', 'work', 'job', 'toplantı', 'meeting', 'proje', 'project', 'ofis', 'office', 'müşteri', 'client', 'mesai', 'şirket', 'company', 'patron', 'boss', 'maaş', 'salary'],
  },
  family: {
    name: 'Family',
    nameKey: 'category.family',
    color: '#ec4899',
    keywords: ['aile', 'family', 'anne', 'baba', 'çocuk', 'children', 'eş', 'spouse', 'kardeş', 'ev', 'home', 'parents'],
  },
  health: {
    name: 'Health',
    nameKey: 'category.health',
    color: '#22c55e',
    keywords: ['sağlık', 'health', 'doktor', 'doctor', 'hastane', 'hospital', 'ilaç', 'medicine', 'egzersiz', 'exercise', 'diyet', 'diet'],
  },
  finance: {
    name: 'Finance',
    nameKey: 'category.finance',
    color: '#f59e0b',
    keywords: ['para', 'money', 'banka', 'bank', 'kredi', 'credit', 'borç', 'debt', 'fatura', 'bill', 'bütçe', 'budget', 'yatırım', 'investment'],
  },
  education: {
    name: 'Education',
    nameKey: 'category.education',
    color: '#8b5cf6',
    keywords: ['eğitim', 'education', 'okul', 'school', 'üniversite', 'university', 'ders', 'class', 'sınav', 'exam', 'öğrenci', 'student', 'kurs', 'course'],
  },
  travel: {
    name: 'Travel',
    nameKey: 'category.travel',
    color: '#06b6d4',
    keywords: ['seyahat', 'travel', 'tatil', 'vacation', 'uçak', 'flight', 'otel', 'hotel', 'gezi', 'trip'],
  },
};

export interface SuggestedTag {
  name: string;
  nameKey: string;
  color: string;
  category: string;
  confidence: number;
}

export function suggestTags(
  title: string,
  body: string,
  existingTagNames: string[] = []
): SuggestedTag[] {
  const text = `${title} ${body}`.toLowerCase();
  const words = text.split(/\s+/);

  const scores: Record<string, number> = {};

  for (const [category, config] of Object.entries(CATEGORY_TAGS)) {
    // Skip if tag already exists
    if (existingTagNames.some(t => t.toLowerCase() === config.name.toLowerCase())) {
      continue;
    }

    let score = 0;
    for (const keyword of config.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        // Exact word match scores higher
        if (words.includes(keyword.toLowerCase())) {
          score += 2;
        } else {
          score += 1;
        }
      }
    }

    if (score > 0) {
      scores[category] = score;
    }
  }

  // Return sorted by confidence, max 3 suggestions
  return Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([category, score]) => ({
      name: CATEGORY_TAGS[category].name,
      nameKey: CATEGORY_TAGS[category].nameKey,
      color: CATEGORY_TAGS[category].color,
      category,
      confidence: Math.min(score / 6, 1), // Normalize to 0-1
    }));
}
