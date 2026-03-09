import { db } from '@/lib/db';

const stopWordsEN = new Set([
  'the','be','to','of','and','a','in','that','have','i','it','for','not','on','with',
  'he','as','you','do','at','this','but','his','by','from','they','we','her','she',
  'or','an','will','my','one','all','would','there','their','what','so','up','out',
  'if','about','who','get','which','go','me','when','make','can','like','time','no',
  'just','him','know','take','people','into','year','your','good','some','could',
  'them','see','other','than','then','now','look','only','come','its','over','think',
  'also','back','after','use','two','how','our','work','first','well','way','even',
  'new','want','because','any','these','give','day','most','us','is','was','are',
  'were','been','has','had','did','am','does','done','doing','being',
]);

const stopWordsTR = new Set([
  'bir','bu','ve','de','da','ile','için','ben','sen','o','biz','siz','onlar',
  'ne','nasıl','neden','ama','fakat','veya','ya','ki','mi','mu','mı','mü',
  'gibi','kadar','daha','en','çok','az','var','yok','olan','olarak','her',
  'hem','ise','ancak','sadece','bile','hep','şu','şey','çünkü','sonra',
  'önce','üzerinde','altında','içinde','arasında','olan','oldu','olur',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);
}

function isStopWord(word: string): boolean {
  return stopWordsEN.has(word) || stopWordsTR.has(word);
}

export interface WordFrequency {
  word: string;
  count: number;
  percentage: number;
}

export interface VocabularyGrowth {
  month: string;
  uniqueWords: number;
  totalWords: number;
}

export async function extractWordFrequencies(): Promise<WordFrequency[]> {
  const notes = await db.notes.filter(n => !n.archived).toArray();
  const freq: Record<string, number> = {};
  let totalWords = 0;

  for (const note of notes) {
    const text = `${note.title} ${note.body}`;
    const words = tokenize(text).filter(w => !isStopWord(w));
    for (const word of words) {
      freq[word] = (freq[word] || 0) + 1;
      totalWords++;
    }
  }

  return Object.entries(freq)
    .map(([word, count]) => ({ word, count, percentage: totalWords > 0 ? (count / totalWords) * 100 : 0 }))
    .sort((a, b) => b.count - a.count);
}

export async function getTopWords(limit: number = 50): Promise<WordFrequency[]> {
  const all = await extractWordFrequencies();
  return all.slice(0, limit);
}

export async function getUniqueTerms(limit: number = 20): Promise<WordFrequency[]> {
  const all = await extractWordFrequencies();
  // Unique terms = words that appear only 1-3 times (rare but intentional)
  return all.filter(w => w.count >= 1 && w.count <= 3).slice(0, limit);
}

export async function getVocabularyGrowth(): Promise<VocabularyGrowth[]> {
  const notes = await db.notes.filter(n => !n.archived).toArray();
  const monthlyData: Record<string, Set<string>> = {};
  const monthlyTotal: Record<string, number> = {};

  for (const note of notes) {
    const date = new Date(note.createdAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = new Set();
      monthlyTotal[monthKey] = 0;
    }

    const words = tokenize(`${note.title} ${note.body}`).filter(w => !isStopWord(w));
    for (const word of words) {
      monthlyData[monthKey].add(word);
      monthlyTotal[monthKey]++;
    }
  }

  return Object.entries(monthlyData)
    .map(([month, words]) => ({
      month,
      uniqueWords: words.size,
      totalWords: monthlyTotal[month] || 0,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}
