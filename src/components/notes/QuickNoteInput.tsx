import { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { type NoteType } from '@/lib/db';
import { useNoteActions } from '@/hooks/useNotes';
import { useUIStore } from '@/store/useStore';
import { useTranslation, useLanguageStore } from '@/lib/i18n';
import { extractDateMention } from '@/lib/dates/naturalDateParser';
import { getSparkPrompt, getUnfinishedNote } from '@/lib/prompts/starterSparks';
import { typeConfig } from './TypeBadge';
import { Plus, Check, Calendar, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

interface QuickNoteInputProps {
  className?: string;
  onNoteCreated?: (noteId: string) => void;
}

const noteTypes: NoteType[] = ['idea', 'action', 'decision', 'question', 'journal'];

export function QuickNoteInput({ className, onNoteCreated }: QuickNoteInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [content, setContent] = useState('');
  const [showSaved, setShowSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { quickNoteType, setQuickNoteType } = useUIStore();
  const { createNote } = useNoteActions();
  const { t } = useTranslation();
  const { language } = useLanguageStore();

  // Starter Sparks — rotating contextual prompts
  const [sparkPrompt, setSparkPrompt] = useState(() => getSparkPrompt(language));
  const [unfinishedNote, setUnfinishedNote] = useState<{ id: string; body: string } | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setSparkPrompt(getSparkPrompt(language));
    }, 10000);
    return () => clearInterval(interval);
  }, [language]);

  useEffect(() => {
    getUnfinishedNote().then(note => {
      if (note) setUnfinishedNote({ id: note.id, body: note.body });
    });
  }, []);

  // Detect natural date in content
  const detectedDate = useMemo(() => {
    if (!content) return null;
    return extractDateMention(content);
  }, [content]);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    // Create note with auto-detected due date from natural language
    const note = await createNote({
      type: quickNoteType,
      title: '', // Empty - will be auto-generated for display
      body: content.trim(),
      dueDate: detectedDate?.date,
    });
    
    // Show saved feedback
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 1500);
    
    setContent('');
    setIsFocused(false);
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    
    onNoteCreated?.(note.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter = Save, Shift+Enter = new line
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      setIsFocused(false);
      textareaRef.current?.blur();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  const config = typeConfig[quickNoteType];
  const Icon = config.icon;

  return (
    <div className={cn('relative', className)}>
      {/* Saved feedback toast */}
      <AnimatePresence>
        {showSaved && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            role="status"
            aria-live="polite"
            className="absolute -top-10 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-lg"
          >
            <Check className="w-4 h-4" />
            {t('quickNote.saved')}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        animate={isFocused ? { scale: 1.02 } : { scale: 1 }}
        className={cn(
          'relative rounded-xl border-2 transition-colors',
          isFocused 
            ? 'border-primary bg-card shadow-lg' 
            : 'border-border bg-card/50'
        )}
      >
        <div className="flex items-start gap-3 p-3">
          <div className={cn(
            'flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0',
            config.badgeClass
          )}>
            <Icon className="w-5 h-5" />
          </div>
          
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleInput}
            onFocus={() => setIsFocused(true)}
            onBlur={() => !content && setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={sparkPrompt}
            aria-label="Quick note input"
            rows={1}
            className={cn(
              'flex-1 bg-transparent text-foreground placeholder:text-muted-foreground',
              'focus:outline-none text-base resize-none min-h-[40px] py-2'
            )}
          />
          
          <AnimatePresence>
            {content.trim() && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                onClick={handleSubmit}
                aria-label="Add note"
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0',
                  'bg-primary text-primary-foreground',
                  'hover:opacity-90 transition-opacity',
                  'tap-target press-effect'
                )}
              >
                <Plus className="w-5 h-5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        
        {/* Type selector */}
        <AnimatePresence>
          {isFocused && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-border overflow-hidden"
            >
              <div className="flex gap-2 p-2 overflow-x-auto scrollbar-hide" role="radiogroup" aria-label={t('quickNote.noteType') || 'Note type'}>
                {noteTypes.map((type) => {
                  const typeConf = typeConfig[type];
                  const TypeIcon = typeConf.icon;
                  const isSelected = type === quickNoteType;

                  return (
                    <button
                      key={type}
                      onClick={() => setQuickNoteType(type)}
                      role="radio"
                      aria-checked={isSelected}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-2 rounded-full',
                        'text-sm font-medium whitespace-nowrap transition-all',
                        'min-w-fit shrink-0',
                        'active:scale-95 transform duration-150',
                        isSelected
                          ? typeConf.badgeClass
                          : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                      )}
                    >
                      <TypeIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span className="truncate max-w-[100px]">{t(`type.${type}`)}</span>
                    </button>
                  );
                })}
              </div>
              
              {/* Detected date hint */}
              {detectedDate && (
                <div className="flex items-center gap-1.5 px-3 pb-1 text-xs text-primary">
                  <Calendar className="w-3 h-3" />
                  <span>
                    Due: {format(detectedDate.date, 'MMM d, yyyy')}
                  </span>
                </div>
              )}

              {/* Decision friction hint */}
              {quickNoteType === 'decision' && (
                <div className="px-3 pb-1 text-xs text-primary/70">
                  {t('friction.hint')}
                </div>
              )}

              {/* Unfinished note suggestion */}
              {unfinishedNote && !content && (
                <div className="flex items-center gap-2 px-3 pb-1">
                  <span className="text-xs text-muted-foreground truncate flex-1">
                    {t('spark.unfinished')}: "{unfinishedNote.body.slice(0, 40)}..."
                  </span>
                  <button
                    onClick={() => onNoteCreated?.(unfinishedNote.id)}
                    className="text-xs text-primary font-medium flex items-center gap-0.5"
                  >
                    {t('spark.continue')} <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Hint text */}
              <div className="px-3 pb-2 text-xs text-muted-foreground">
                {t('quickNote.hint')}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
