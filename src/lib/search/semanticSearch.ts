import { Note, Tag } from '@/lib/db';
import { getIntentKeywords, matchesIntentKeywords } from './intentDictionary';
import { calculateContextBoost, parseTimeContext } from '@/lib/context/contextEngine';

export interface SearchFilters {
  dateRange: 'all' | 'today' | 'week' | 'month' | 'custom';
  startDate?: Date;
  endDate?: Date;
  tagIds: string[];
  category?: string;
  favoritesOnly: boolean;
  noteType?: string;
}

export interface SearchResult {
  note: Note;
  score: number;
  matchType: 'semantic' | 'intent' | 'exact';
  snippet: string;
}

export type SortOption = 'relevance' | 'newest' | 'oldest' | 'views' | 'favorites';

const MINIMUM_SCORE_THRESHOLD = 0.4;
const SHORT_QUERY_LENGTH = 3;

// Simple semantic similarity using word overlap
function calculateSemanticScore(query: string, text: string): number {
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 1);
  const textWords = new Set(text.toLowerCase().split(/\s+/));
  
  if (queryWords.length === 0) return 0;
  
  let matchCount = 0;
  for (const word of queryWords) {
    // Check for word presence (not substring)
    for (const textWord of textWords) {
      if (textWord === word || textWord.startsWith(word + ' ') || textWord.endsWith(' ' + word)) {
        matchCount++;
        break;
      }
    }
  }
  
  return matchCount / queryWords.length;
}

// Create searchable text from note
function createSearchText(note: Note, tags: Tag[]): string {
  const tagNames = tags.map(t => t.name).join(' ');
  return `${note.title} ${note.body} ${tagNames} ${note.type}`.toLowerCase();
}

// Extract snippet around matched content
function extractSnippet(text: string, query: string, maxLength: number = 100): string {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  
  // Find the first occurrence of any query word
  const queryWords = lowerQuery.split(/\s+/);
  let matchIndex = -1;
  
  for (const word of queryWords) {
    const idx = lowerText.indexOf(word);
    if (idx !== -1 && (matchIndex === -1 || idx < matchIndex)) {
      matchIndex = idx;
    }
  }
  
  if (matchIndex === -1) {
    // No match found, return start of text
    return text.slice(0, maxLength) + (text.length > maxLength ? '...' : '');
  }
  
  // Extract snippet around match
  const start = Math.max(0, matchIndex - 30);
  const end = Math.min(text.length, matchIndex + maxLength);
  
  let snippet = text.slice(start, end);
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';
  
  return snippet;
}

// Check if note matches date filter
function matchesDateFilter(note: Note, filters: SearchFilters): boolean {
  if (filters.dateRange === 'all') return true;
  
  const noteDate = new Date(note.createdAt);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (filters.dateRange) {
    case 'today':
      return noteDate >= startOfToday;
    case 'week': {
      const weekAgo = new Date(startOfToday);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return noteDate >= weekAgo;
    }
    case 'month': {
      const monthAgo = new Date(startOfToday);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return noteDate >= monthAgo;
    }
    case 'custom':
      if (filters.startDate && noteDate < filters.startDate) return false;
      if (filters.endDate && noteDate > filters.endDate) return false;
      return true;
    default:
      return true;
  }
}

// Main semantic search function
export function semanticSearch(
  query: string,
  notes: Note[],
  noteTags: Map<string, Tag[]>,
  filters: SearchFilters,
  sortBy: SortOption = 'relevance'
): SearchResult[] {
  const trimmedQuery = query.trim();
  
  // If no query, return recent notes
  if (!trimmedQuery) {
    return notes
      .filter(n => !n.archived && matchesDateFilter(n, filters))
      .slice(0, 20)
      .map(note => ({
        note,
        score: 1,
        matchType: 'exact' as const,
        snippet: note.body.slice(0, 100) + (note.body.length > 100 ? '...' : ''),
      }));
  }
  
  const isShortQuery = trimmedQuery.length <= SHORT_QUERY_LENGTH;
  const intentKeywords = isShortQuery ? getIntentKeywords(trimmedQuery) : [];
  
  const results: SearchResult[] = [];
  
  for (const note of notes) {
    if (note.archived) continue;
    
    // Apply filters
    if (!matchesDateFilter(note, filters)) continue;
    
    // Tag filter
    if (filters.tagIds.length > 0) {
      const tags = noteTags.get(note.id) || [];
      const hasMatchingTag = tags.some(t => filters.tagIds.includes(t.id));
      if (!hasMatchingTag) continue;
    }
    
    // Note type filter
    if (filters.noteType && note.type !== filters.noteType) continue;
    
    const tags = noteTags.get(note.id) || [];
    const searchText = createSearchText(note, tags);
    
    // Calculate scores
    const semanticScore = calculateSemanticScore(trimmedQuery, searchText);
    const intentScore = isShortQuery ? matchesIntentKeywords(searchText, intentKeywords) : 0;

    // Context boost (B1): notes created at similar time/day score higher
    const contextBoost = calculateContextBoost(note);

    // Time-based context filtering
    const timeContext = parseTimeContext(trimmedQuery);
    let contextMatch = 0;
    if (timeContext.timeOfDay && note.contextTimeOfDay === timeContext.timeOfDay) {
      contextMatch += 0.3;
    }
    if (timeContext.dayOfWeek !== undefined) {
      if (timeContext.dayOfWeek === -1) {
        // Weekend
        if (note.contextDayOfWeek === 0 || note.contextDayOfWeek === 6) contextMatch += 0.3;
      } else if (note.contextDayOfWeek === timeContext.dayOfWeek) {
        contextMatch += 0.3;
      }
    }

    // Calculate final score based on query length
    let finalScore: number;
    let matchType: 'semantic' | 'intent' | 'exact';
    
    if (isShortQuery && intentKeywords.length > 0) {
      // For short queries with intent dictionary, weight intent matching more heavily
      finalScore = (intentScore * 0.7) + (semanticScore * 0.3);
      matchType = intentScore > semanticScore ? 'intent' : 'semantic';
    } else {
      // For longer queries, weight semantic matching more
      finalScore = (semanticScore * 0.75) + (intentScore * 0.25);
      matchType = 'semantic';
    }

    // Apply context boost and context match
    finalScore += contextBoost + contextMatch;
    
    // Skip results below threshold
    if (finalScore < MINIMUM_SCORE_THRESHOLD && !searchText.includes(trimmedQuery.toLowerCase())) {
      // Also check for exact substring match as fallback (only for whole words)
      const words = trimmedQuery.toLowerCase().split(/\s+/);
      const hasExactWord = words.some(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        return regex.test(searchText);
      });
      
      if (!hasExactWord) continue;
      
      finalScore = 0.5; // Give moderate score to exact matches
      matchType = 'exact';
    }
    
    results.push({
      note,
      score: finalScore,
      matchType,
      snippet: extractSnippet(note.body || note.title, trimmedQuery),
    });
  }
  
  // Sort results
  switch (sortBy) {
    case 'relevance':
      results.sort((a, b) => b.score - a.score);
      break;
    case 'newest':
      results.sort((a, b) => new Date(b.note.createdAt).getTime() - new Date(a.note.createdAt).getTime());
      break;
    case 'oldest':
      results.sort((a, b) => new Date(a.note.createdAt).getTime() - new Date(b.note.createdAt).getTime());
      break;
  }
  
  return results;
}
