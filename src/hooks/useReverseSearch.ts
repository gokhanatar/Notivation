import { useState, useEffect, useRef, useCallback } from 'react';
import { type Note, type Tag } from '@/lib/db';
import { semanticSearch, type SearchResult } from '@/lib/search/semanticSearch';

/**
 * Hook for reverse search — finds related notes as user types
 * Uses debounced semantic search on last 3 meaningful words
 */
export function useReverseSearch(
  currentNoteId: string,
  body: string,
  allNotes: Note[],
  noteTags: Map<string, Tag[]>
) {
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const debounceRef = useRef<NodeJS.Timeout>();

  const search = useCallback(() => {
    if (!body || body.length < 10) {
      setSuggestions([]);
      return;
    }

    // Extract last 3 meaningful words
    const words = body
      .split(/\s+/)
      .filter(w => w.length > 2)
      .slice(-3);

    if (words.length === 0) {
      setSuggestions([]);
      return;
    }

    const query = words.join(' ');

    const results = semanticSearch(
      query,
      allNotes.filter(n => n.id !== currentNoteId),
      noteTags,
      { dateRange: 'all', tagIds: [], favoritesOnly: false },
      'relevance'
    );

    // Only show results with decent relevance
    const filtered = results
      .filter(r => r.score > 0.4)
      .slice(0, 3);

    setSuggestions(filtered);
  }, [body, allNotes, currentNoteId, noteTags]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(search, 1500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [search]);

  return suggestions;
}
