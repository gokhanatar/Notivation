import { type Note } from '@/lib/db';
import { stopWords } from './stopWords';

export interface NoteChunk {
  id: string;
  notes: Note[];
  commonKeywords: string[];
  label: string;
}

/**
 * Extract keywords from text (removing stop words)
 */
function extractKeywords(text: string): Set<string> {
  const words = text.toLowerCase()
    .replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));
  return new Set(words);
}

/**
 * Calculate Jaccard similarity between two keyword sets
 */
function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  const intersection = new Set([...a].filter(x => b.has(x)));
  const union = new Set([...a, ...b]);
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

/**
 * Find common keywords between a group of notes
 */
function findCommonKeywords(notes: Note[], allKeywords: Map<string, Set<string>>): string[] {
  if (notes.length === 0) return [];

  const keywordCount = new Map<string, number>();

  for (const note of notes) {
    const keywords = allKeywords.get(note.id) || new Set();
    for (const kw of keywords) {
      keywordCount.set(kw, (keywordCount.get(kw) || 0) + 1);
    }
  }

  // Keywords that appear in at least half of the notes
  const threshold = Math.ceil(notes.length / 2);
  return [...keywordCount.entries()]
    .filter(([_, count]) => count >= threshold)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([kw]) => kw);
}

/**
 * Greedy clustering algorithm for notes
 * Groups notes with Jaccard similarity >= threshold
 */
export function findNoteChunks(
  notes: Note[],
  threshold = 0.3,
  minClusterSize = 3
): NoteChunk[] {
  // Pre-compute keywords for each note
  const noteKeywords = new Map<string, Set<string>>();
  for (const note of notes) {
    const text = `${note.title} ${note.body}`;
    noteKeywords.set(note.id, extractKeywords(text));
  }

  // Greedy clustering
  const used = new Set<string>();
  const chunks: NoteChunk[] = [];

  for (let i = 0; i < notes.length; i++) {
    if (used.has(notes[i].id)) continue;

    const cluster: Note[] = [notes[i]];
    const seedKeywords = noteKeywords.get(notes[i].id)!;

    for (let j = i + 1; j < notes.length; j++) {
      if (used.has(notes[j].id)) continue;

      const otherKeywords = noteKeywords.get(notes[j].id)!;
      const similarity = jaccardSimilarity(seedKeywords, otherKeywords);

      if (similarity >= threshold) {
        cluster.push(notes[j]);
      }
    }

    if (cluster.length >= minClusterSize) {
      const commonKeywords = findCommonKeywords(cluster, noteKeywords);

      for (const note of cluster) {
        used.add(note.id);
      }

      chunks.push({
        id: crypto.randomUUID(),
        notes: cluster,
        commonKeywords,
        label: commonKeywords.slice(0, 3).join(', ') || 'Group',
      });
    }
  }

  return chunks;
}
