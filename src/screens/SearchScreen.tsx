import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useNotes, useTags } from '@/hooks/useNotes';
import { useUIStore } from '@/store/useStore';
import { PageHeader } from '@/components/layout/PageHeader';
import { NoteCard } from '@/components/notes/NoteCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { semanticSearch, SearchFilters, SortOption } from '@/lib/search/semanticSearch';
import { useTranslation } from '@/lib/i18n';
import { 
  Search as SearchIcon, 
  X,
  FileText,
  SlidersHorizontal,
  ArrowUpDown,
  Calendar,
  Tag,
  Star,
  ChevronDown
} from 'lucide-react';

interface SearchScreenProps {
  onNoteSelect: (noteId: string) => void;
}

const dateRangeOptions = [
  { value: 'all', labelKey: 'search.allTime' },
  { value: 'today', labelKey: 'search.today' },
  { value: 'week', labelKey: 'search.last7days' },
  { value: 'month', labelKey: 'search.last30days' },
] as const;

const sortOptions = [
  { value: 'relevance', labelKey: 'search.relevance' },
  { value: 'newest', labelKey: 'search.newest' },
  { value: 'oldest', labelKey: 'search.oldest' },
] as const;

export function SearchScreen({ onNoteSelect }: SearchScreenProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    dateRange: 'all',
    tagIds: [],
    favoritesOnly: false,
  });
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  
  const notes = useNotes();
  const tags = useTags();
  const isPro = useUIStore((s) => s.isPro);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Build note-tags map
  const noteTags = useMemo(() => {
    const map = new Map<string, typeof tags>();
    // For now, return empty tags - in real app this would be populated
    notes.forEach(note => map.set(note.id, []));
    return map;
  }, [notes, tags]);

  // Perform semantic search
  const results = useMemo(() => {
    return semanticSearch(debouncedQuery, notes, noteTags, filters, sortBy);
  }, [debouncedQuery, notes, noteTags, filters, sortBy]);

  const toggleTagFilter = useCallback((tagId: string) => {
    setFilters(f => ({
      ...f,
      tagIds: f.tagIds.includes(tagId)
        ? f.tagIds.filter(id => id !== tagId)
        : [...f.tagIds, tagId]
    }));
  }, []);

  return (
    <div className="flex flex-col h-full">
      <PageHeader 
        title={t('search.title')} 
        subtitle={debouncedQuery ? t('search.results', { count: results.length }) : t('search.findNotes')}
      />
      
      {/* Search Input */}
      <div className="relative mb-3" role="search">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" aria-hidden="true" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('search.placeholder')}
          aria-label={t('search.placeholder') || 'Search notes'}
          className="pl-10 pr-10 h-12 text-base"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            aria-label={t('search.clearSearch') || 'Clear search'}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Filter & Sort Row */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={showFilters ? "default" : "outline"}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-1.5"
          aria-expanded={showFilters}
          aria-label={t('search.filters') || 'Filters'}
        >
          <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
          {t('search.filters')}
        </Button>

        <div className="flex-1" />

        <Button variant="outline" size="sm" className="gap-1.5" aria-label={t('search.sortBy') || 'Sort by'}>
          <ArrowUpDown className="w-4 h-4" aria-hidden="true" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-transparent border-none outline-none text-sm"
            aria-label={t('search.sortBy') || 'Sort by'}
          >
            {sortOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
            ))}
          </select>
        </Button>
      </div>
      
      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="p-4 rounded-xl bg-card border border-border space-y-4" role="region" aria-label={t('search.filters') || 'Search filters'}>
              {/* Date Range */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {t('search.dateRange')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {dateRangeOptions.map(opt => (
                    <Badge
                      key={opt.value}
                      variant={filters.dateRange === opt.value ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setFilters(f => ({ ...f, dateRange: opt.value }))}
                    >
                      {t(opt.labelKey)}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {/* Tags */}
              {tags.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    {t('search.tags')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <Badge
                        key={tag.id}
                        variant={filters.tagIds.includes(tag.id) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleTagFilter(tag.id)}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Favorites */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilters(f => ({ ...f, favoritesOnly: !f.favoritesOnly }))}
                  aria-pressed={filters.favoritesOnly}
                  aria-label={t('search.favorites') || 'Favorites only'}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors",
                    filters.favoritesOnly
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border"
                  )}
                >
                  <Star className={cn("w-4 h-4", filters.favoritesOnly && "fill-current")} aria-hidden="true" />
                  <span className="text-sm">{t('search.favorites')}</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Results */}
      <div className="flex-1 overflow-y-auto -mx-4 px-4 md:-mx-0 md:px-0 pb-20 md:pb-6 space-y-3 scrollbar-hide">
        {!debouncedQuery.trim() ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <SearchIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">{t('search.startTyping')}</p>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground">{t('search.noResults', { query: debouncedQuery })}</p>
            <p className="text-sm text-muted-foreground mt-1">{t('search.tryDifferent')}</p>
          </div>
        ) : (
          <>
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {t('search.notes')} ({results.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <AnimatePresence mode="popLayout">
              {results.map((result) => (
                <NoteCard
                  key={result.note.id}
                  note={result.note}
                  onClick={() => onNoteSelect(result.note.id)}
                />
              ))}
            </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
