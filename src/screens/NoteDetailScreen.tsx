import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useNotes, useActionItems, useNoteActions, useActionItemActions, useTags, useTagActions } from '@/hooks/useNotes';
import { useVaultAuth } from '@/hooks/useBiometrics';
import { useUIStore } from '@/store/useStore';
import { useTranslation } from '@/lib/i18n';
import { getDisplayTitle } from '@/lib/utils/autoTitle';
import { type NoteType, type Tag, getTagsForNote } from '@/lib/db';
import { hapticMedium } from '@/lib/native/haptics';
import { TypeBadge, typeConfig } from '@/components/notes/TypeBadge';
import type { LifecycleStage } from '@/lib/db';
import { ProLockedState } from '@/components/notes/ProLockedState';
import { ColorPicker } from '@/components/notes/ColorPicker';
import { TagPills } from '@/components/notes/TagPills';
import { AttachmentGrid } from '@/components/notes/AttachmentGrid';
import { ImageViewer } from '@/components/modals/ImageViewer';
import { MarkdownPreview } from '@/components/notes/MarkdownPreview';
import { suggestTags } from '@/lib/tags/autoTagger';
import { extractDateMention } from '@/lib/dates/naturalDateParser';
import { findBacklinks, resolveWikilink } from '@/lib/notes/wikilinks';
import { takePhoto, pickFromGallery, MAX_ATTACHMENTS } from '@/lib/native/camera';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  ArrowLeft,
  Pin,
  Lock,
  Trash2,
  Plus,
  Calendar as CalendarIcon,
  GripVertical,
  MoreHorizontal,
  History,
  Archive,
  Camera,
  Eye,
  Edit3,
  Link2,
  Tag as TagIcon,
  Mic,
  Smile
} from 'lucide-react';
import { MoodPicker, moodEmoji } from '@/components/notes/MoodPicker';
import { WritingStats } from '@/components/notes/WritingStats';
import { VersionHistoryModal, saveNoteVersion } from '@/components/modals/VersionHistoryModal';
import { VoiceRecorder } from '@/components/modals/VoiceRecorder';
import { ProConMatrix } from '@/components/decisions/ProConMatrix';
import { DecisionScoreCard } from '@/components/decisions/DecisionScoreCard';
import { NoteDNA } from '@/components/notes/NoteDNA';
import { WriteSpeedBar } from '@/components/notes/WriteSpeedBar';
import { useWriteSpeed } from '@/hooks/useWriteSpeed';
import { DecisionReplay } from '@/components/decisions/DecisionReplay';
import { OutcomePicker } from '@/components/notes/OutcomePicker';
import { RelatedNotesSuggestions } from '@/components/notes/RelatedNotesSuggestions';
import { useReverseSearch } from '@/hooks/useReverseSearch';
import { IncubationBadge } from '@/components/notes/IncubationBadge';
import { IncubationSheet } from '@/components/modals/IncubationSheet';
import { LetGoFlow } from '@/components/modals/LetGoFlow';
import { ConfidenceSlider } from '@/components/decisions/ConfidenceSlider';
import { ScenarioCard } from '@/components/decisions/ScenarioCard';
import { ScenarioBuilder } from '@/components/decisions/ScenarioBuilder';
import { ScenarioResolveFlow } from '@/components/decisions/ScenarioResolveFlow';
import { FolderPicker } from '@/components/notes/FolderPicker';
import { FolderBreadcrumb } from '@/components/notes/FolderBreadcrumb';
import { useScenarios } from '@/hooks/useScenarios';
import { Moon, Feather, GitBranch, FolderOpen, Bot, Sparkles as SparklesIcon, FileText as FileTextIcon, Loader2, X } from 'lucide-react';
import type { MoodType, Scenario, ScenarioOutcome } from '@/lib/db';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { useAI } from '@/hooks/useAI';

interface NoteDetailScreenProps {
  noteId: string;
  onBack: () => void;
}

const noteTypes: NoteType[] = ['decision', 'action', 'info', 'idea', 'followup', 'question', 'journal'];

export function NoteDetailScreen({ noteId, onBack }: NoteDetailScreenProps) {
  const notes = useNotes();
  const allActionItems = useActionItems();
  const note = notes.find((n) => n.id === noteId);
  const actionItems = allActionItems
    .filter((a) => a.noteId === noteId)
    .sort((a, b) => a.order - b.order);
  
  const isPro = useUIStore((s) => s.isPro);
  const { t } = useTranslation();
  const { authenticateForVault } = useVaultAuth();

  const { editNote, togglePin, toggleVault, archiveNote, promoteLifecycle, demoteLifecycle } = useNoteActions();
  const { createActionItem, editActionItem, toggleActionItem, deleteActionItem } = useActionItemActions();
  const { createTag, addTagToNote, removeTagFromNote } = useTagActions();
  const allTags = useTags();

  const [title, setTitle] = useState(note?.title || '');
  const [body, setBody] = useState(note?.body || '');
  const [newActionText, setNewActionText] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [vaultAuthenticated, setVaultAuthenticated] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  const [noteTags, setNoteTags] = useState<Tag[]>([]);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showIncubation, setShowIncubation] = useState(false);
  const [showLetGo, setShowLetGo] = useState(false);
  const [showScenarioBuilder, setShowScenarioBuilder] = useState(false);
  const [resolvingScenario, setResolvingScenario] = useState<(Scenario & { outcomes: ScenarioOutcome[] }) | null>(null);
  const [showFolderPicker, setShowFolderPicker] = useState(false);

  // AI
  const { isAvailable: aiAvailable, loading: aiLoading, summarizeNote, suggestNoteTags, analyzeDecision } = useAI();
  const [aiResult, setAiResult] = useState<{ type: string; content: string } | null>(null);

  // Write Speed tracking (B3)
  const { speedData, handleKeyDown: handleSpeedKeyDown, getTotalDurationMs, getWritingSpeed } = useWriteSpeed();

  // Scenarios (Future Cast)
  const { scenarios, addScenario, addNewOutcome, resolve: resolveScenario, remove: removeScenario } = useScenarios(noteId);

  // Reverse Search (C3)
  const reverseSearchSuggestions = useReverseSearch(noteId, body, notes, new Map());

  // Writing duration tracking (A5)
  const writingStartRef = useRef<number | null>(null);

  const titleRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Load tags for this note
  useEffect(() => {
    if (!noteId) return;
    getTagsForNote(noteId).then(setNoteTags);
  }, [noteId]);

  // Auto-tag suggestions based on content
  const suggestedTags = useMemo(() => {
    if (!note) return [];
    const existingNames = noteTags.map(t => t.name);
    return suggestTags(title, body, existingNames);
  }, [title, body, noteTags, note]);

  // Natural date parsing hint from body text
  const detectedDate = useMemo(() => {
    if (!body) return null;
    return extractDateMention(body);
  }, [body]);

  // Backlinks: notes that link to this note via [[wikilinks]]
  const backlinks = useMemo(() => {
    if (!note) return [];
    const noteTitle = note.title || getDisplayTitle(note.title, note.body);
    return findBacklinks(noteTitle, notes);
  }, [note, notes]);

  // Biometric gate for vault notes
  useEffect(() => {
    if (!note?.vault || vaultAuthenticated) return;

    authenticateForVault().then(success => {
      if (success) {
        setVaultAuthenticated(true);
      } else {
        onBack();
      }
    });
  }, [note?.vault, vaultAuthenticated, authenticateForVault, onBack]);

  // Sync local state with note
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setBody(note.body);
    }
  }, [note?.id]);

  // Autosave with debounce
  useEffect(() => {
    if (!note) return;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      if (title !== note.title || body !== note.body) {
        const dnaUpdates: Record<string, unknown> = { title, body };
        // Track edit count and writing metrics (A5)
        dnaUpdates.editCount = (note.editCount || 0) + 1;
        const duration = getTotalDurationMs();
        if (duration > 0) {
          dnaUpdates.writingDurationMs = (note.writingDurationMs || 0) + duration;
        }
        dnaUpdates.writingSpeed = getWritingSpeed();
        editNote(noteId, dnaUpdates);
        saveNoteVersion(noteId, title, body);
      }
    }, 300);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [title, body, note?.title, note?.body, noteId, editNote]);

  if (!note) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">{t('noteDetail.notFound')}</p>
      </div>
    );
  }

  // Don't render vault note content until authenticated
  if (note.vault && !vaultAuthenticated) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Authenticating...</p>
      </div>
    );
  }

  const handleTypeChange = (type: NoteType) => {
    hapticMedium();
    editNote(noteId, { type });
  };

  const handleLifecycleChange = (stage: LifecycleStage) => {
    hapticMedium();
    editNote(noteId, { lifecycleStage: stage, lifecyclePromotedAt: new Date() });
  };

  const handleAddAction = async () => {
    if (!newActionText.trim()) return;
    
    await createActionItem({
      noteId,
      text: newActionText.trim(),
      order: actionItems.length,
    });
    setNewActionText('');
  };

  const handleDueDateChange = (date: Date | undefined) => {
    editNote(noteId, { dueDate: date });
    setShowDatePicker(false);
  };

  const handleAcceptTag = async (suggestion: { name: string; color: string }) => {
    // Check if tag already exists globally
    let tag = allTags.find(t => t.name.toLowerCase() === suggestion.name.toLowerCase());
    if (!tag) {
      tag = await createTag(suggestion.name, suggestion.color);
    }
    await addTagToNote(noteId, tag.id);
    setNoteTags(prev => [...prev, tag!]);
  };

  const handleRemoveTag = async (tagId: string) => {
    await removeTagFromNote(noteId, tagId);
    setNoteTags(prev => prev.filter(t => t.id !== tagId));
  };

  const handleWikilinkClick = (linkTitle: string) => {
    const target = resolveWikilink(linkTitle, notes);
    if (target) {
      onBack();
      // Small delay to let navigation complete, then select the target note
      setTimeout(() => {
        useUIStore.getState().setSelectedNoteId?.(target.id);
      }, 100);
    }
  };

  const handleSetDetectedDate = () => {
    if (detectedDate) {
      editNote(noteId, { dueDate: detectedDate.date });
    }
  };

  const handleArchive = async () => {
    await archiveNote(noteId);
    onBack();
  };

  return (
    <div className="flex flex-col h-full max-w-full lg:max-w-3xl md:mx-auto md:w-full">
      {/* Header */}
      <header className="flex items-center justify-between mb-4 md:mb-6 -mx-4 md:-mx-0 px-4 md:px-0 py-2 border-b border-border bg-card/50 md:bg-transparent">
        <button onClick={onBack} className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center tap-target flex-shrink-0" aria-label={t('noteDetail.back') || 'Go back'}>
          <ArrowLeft className="w-5 h-5 text-foreground" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-1" role="toolbar" aria-label={t('noteDetail.actions') || 'Note actions'}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => togglePin(noteId)}
            className={cn('tap-target', note.pinned && 'text-primary')}
            aria-label={note.pinned ? (t('noteDetail.unpin') || 'Unpin note') : (t('noteDetail.pin') || 'Pin note')}
            aria-pressed={note.pinned}
          >
            <Pin className={cn('w-5 h-5', note.pinned && 'fill-current')} aria-hidden="true" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (!isPro) {
                useUIStore.getState().setProModalFeature('Vault');
                useUIStore.getState().setShowProModal(true);
                return;
              }
              toggleVault(noteId);
            }}
            className={cn('tap-target', note.vault && 'text-primary')}
            aria-label={note.vault ? (t('noteDetail.removeFromVault') || 'Remove from vault') : (t('noteDetail.addToVault') || 'Add to vault')}
            aria-pressed={note.vault}
          >
            <Lock className={cn('w-5 h-5', note.vault && 'fill-current')} aria-hidden="true" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (!isPro) {
                useUIStore.getState().setProModalFeature('Markdown Preview');
                useUIStore.getState().setShowProModal(true);
                return;
              }
              setIsPreviewMode(!isPreviewMode);
            }}
            className={cn('tap-target', isPreviewMode && 'text-primary')}
            aria-label={isPreviewMode ? (t('noteDetail.editMode') || 'Switch to edit mode') : (t('noteDetail.previewMode') || 'Switch to preview mode')}
            aria-pressed={isPreviewMode}
          >
            {isPreviewMode ? <Edit3 className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="tap-target" aria-label={t('noteDetail.moreOptions') || 'More options'}>
                <MoreHorizontal className="w-5 h-5" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  if (!isPro) {
                    useUIStore.getState().setProModalFeature(t('noteDetail.versionHistory'));
                    useUIStore.getState().setShowProModal(true);
                    return;
                  }
                  setShowVersionHistory(true);
                }}
              >
                <History className="w-4 h-4 mr-2" />
                {t('noteDetail.versionHistory')}
                {!isPro && <Lock className="w-3 h-3 ml-auto opacity-50" />}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  if (!isPro) {
                    useUIStore.getState().setProModalFeature(t('pro.voiceMemos'));
                    useUIStore.getState().setShowProModal(true);
                    return;
                  }
                  setShowVoiceRecorder(true);
                }}
              >
                <Mic className="w-4 h-4 mr-2" />
                {t('pro.voiceMemos')}
                {!isPro && <Lock className="w-3 h-3 ml-auto opacity-50" />}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowIncubation(true)}>
                <Moon className="w-4 h-4 mr-2" />
                {t('incubation.menuItem') || 'Incubate'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowLetGo(true)}>
                <Feather className="w-4 h-4 mr-2" />
                {t('letgo.button') || 'Let Go'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowFolderPicker(true)}>
                <FolderOpen className="w-4 h-4 mr-2" />
                {t('folders.moveToFolder') || 'Move to folder'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleArchive} className="text-destructive">
                <Archive className="w-4 h-4 mr-2" />
                {t('noteDetail.archive')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-20 md:pb-6 space-y-6 scrollbar-hide">
        {/* Type Selector — scrollable, compact */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4" role="radiogroup" aria-label={t('noteDetail.noteType') || 'Note type'}>
          {noteTypes.map((type) => {
            const config = typeConfig[type];
            const Icon = config.icon;
            const isActive = note.type === type;

            return (
              <button
                key={type}
                onClick={() => handleTypeChange(type)}
                role="radio"
                aria-checked={isActive}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1.5 rounded-lg',
                  'text-xs font-medium whitespace-nowrap transition-all',
                  isActive
                    ? config.badgeClass
                    : 'text-muted-foreground hover:bg-muted'
                )}
              >
                <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                {config.label}
              </button>
            );
          })}
        </div>

        {/* Title */}
        <Input
          ref={titleRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('noteDetail.titlePlaceholder')}
          aria-label={t('noteDetail.titlePlaceholder') || 'Note title'}
          className="text-xl md:text-2xl font-semibold border-none shadow-none px-0 focus-visible:ring-0 bg-transparent"
        />

        {/* Write Speed Bar (B3) */}
        <WriteSpeedBar speedData={speedData} visible={!isPreviewMode} />

        {/* Body */}
        {isPreviewMode ? (
          <MarkdownPreview
            content={body}
            onNoteLinkClick={handleWikilinkClick}
          />
        ) : (
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleSpeedKeyDown}
            placeholder={t('noteDetail.bodyPlaceholder')}
            aria-label={t('noteDetail.bodyPlaceholder') || 'Note content'}
            className="min-h-[120px] md:min-h-[200px] md:text-base border-none shadow-none px-0 resize-none focus-visible:ring-0 bg-transparent"
          />
        )}

        {/* AI Buttons */}
        {isPro && aiAvailable && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5" />
              {t('ai.title')}
            </h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={aiLoading}
                onClick={async () => {
                  const content = `${title}\n${body}`;
                  const result = await summarizeNote(content);
                  if (result) setAiResult({ type: 'summary', content: result });
                }}
              >
                {aiLoading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <FileTextIcon className="w-3.5 h-3.5 mr-1" />}
                {t('ai.summarizeBtn')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={aiLoading}
                onClick={async () => {
                  const content = `${title}\n${body}`;
                  const tags = await suggestNoteTags(content);
                  if (tags.length > 0) setAiResult({ type: 'tags', content: tags.join(', ') });
                }}
              >
                {aiLoading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <SparklesIcon className="w-3.5 h-3.5 mr-1" />}
                {t('ai.suggestTagsBtn')}
              </Button>
              {note.type === 'decision' && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={aiLoading}
                  onClick={async () => {
                    const content = `${title}\n${body}`;
                    const result = await analyzeDecision(content);
                    if (result) setAiResult({ type: 'analysis', content: result });
                  }}
                >
                  {aiLoading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Bot className="w-3.5 h-3.5 mr-1" />}
                  {t('ai.analyzeDecisionBtn')}
                </Button>
              )}
            </div>

            {/* AI Result Display */}
            {aiResult && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg bg-primary/5 border border-primary/20"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-primary">
                    {aiResult.type === 'summary' && t('ai.summary')}
                    {aiResult.type === 'tags' && t('ai.tagSuggestions')}
                    {aiResult.type === 'analysis' && t('ai.analysis')}
                  </p>
                  <button
                    onClick={() => setAiResult(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-sm text-foreground/80 whitespace-pre-wrap">{aiResult.content}</p>
              </motion.div>
            )}
          </div>
        )}

        {/* Reverse Search Suggestions (C3) */}
        {!isPreviewMode && (
          <RelatedNotesSuggestions
            suggestions={reverseSearchSuggestions}
            onNoteSelect={(id) => {
              onBack();
              setTimeout(() => {
                useUIStore.getState().setSelectedNoteId?.(id);
              }, 100);
            }}
          />
        )}

        {/* Natural Date Hint */}
        {detectedDate && !note.dueDate && !isPreviewMode && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20"
          >
            <CalendarIcon className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-sm text-primary flex-1">
              "{detectedDate.matchedText}" → {format(detectedDate.date, 'MMM d, yyyy')}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSetDetectedDate}
              className="text-primary font-medium h-7 px-2"
              aria-label={`${t('noteDetail.setDueDate') || 'Set due date'}: ${format(detectedDate.date, 'MMM d, yyyy')}`}
            >
              {t('noteDetail.setDueDate') || 'Set'}
            </Button>
          </motion.div>
        )}

        {/* Decision Pro/Con Matrix — only for decision notes */}
        {note.type === 'decision' && (
          <ProConMatrix noteId={noteId} />
        )}

        {/* Decision Score Card — only for decision notes */}
        {note.type === 'decision' && (
          <DecisionScoreCard noteId={noteId} />
        )}

        {/* Decision Outcome Picker (B4) — for decision notes at outcome stage */}
        {note.type === 'decision' && note.lifecycleStage === 'outcome' && (
          <OutcomePicker
            selected={note.decisionOutcome}
            onChange={(outcome) => editNote(noteId, { decisionOutcome: outcome })}
          />
        )}

        {/* Confidence Slider — for decision notes */}
        {note.type === 'decision' && (
          <ConfidenceSlider
            value={note.confidenceLevel}
            onChange={(val) => editNote(noteId, { confidenceLevel: val })}
          />
        )}

        {/* Decision Replay (B2) — timeline for decision notes */}
        {note.type === 'decision' && (
          <DecisionReplay noteId={noteId} />
        )}

        {/* Future Cast Scenarios — for decision notes */}
        {note.type === 'decision' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5" />
                {t('scenario.title') || 'Future Cast'}
              </h3>
              <Button variant="outline" size="sm" onClick={() => setShowScenarioBuilder(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                {t('scenario.addScenario') || 'Add'}
              </Button>
            </div>
            {scenarios.map((s) => (
              <ScenarioCard
                key={s.id}
                scenario={s}
                onResolve={() => setResolvingScenario(s)}
                onDelete={() => removeScenario(s.id)}
              />
            ))}
            {scenarios.length === 0 && (
              <p className="text-xs text-muted-foreground">{t('scenario.noScenariosDesc')}</p>
            )}
          </div>
        )}

        {/* Folder Breadcrumb */}
        {note.folderId && (
          <FolderBreadcrumb folderId={note.folderId} />
        )}

        {/* Tags */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <TagIcon className="w-3.5 h-3.5" />
            {t('noteDetail.tags') || 'Tags'}
          </h3>
          <TagPills
            tags={noteTags}
            suggestedTags={suggestedTags}
            onRemoveTag={handleRemoveTag}
            onAcceptSuggestion={handleAcceptTag}
          />
          {noteTags.length === 0 && suggestedTags.length === 0 && (
            <p className="text-xs text-muted-foreground">{t('noteDetail.noTags') || 'No tags yet. Tags will be suggested based on content.'}</p>
          )}
        </div>

        {/* Due Date */}
        <div className="flex items-center gap-3">
          <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="tap-target">
              <CalendarIcon className="w-4 h-4 mr-2" />
                {note.dueDate ? format(new Date(note.dueDate), 'MMM d, yyyy') : t('noteDetail.addDueDate')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={note.dueDate ? new Date(note.dueDate) : undefined}
                onSelect={handleDueDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          {note.dueDate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDueDateChange(undefined)}
              className="text-muted-foreground"
            >
              {t('noteDetail.clear')}
            </Button>
          )}
        </div>

        {/* Mood */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Smile className="w-3.5 h-3.5" />
            {t('mood.title')}
            {!isPro && <Lock className="w-3 h-3 opacity-50" />}
          </h3>
          {isPro ? (
            <MoodPicker
              selected={note.mood || null}
              onChange={(mood) => editNote(noteId, { mood })}
            />
          ) : (
            <button
              onClick={() => {
                useUIStore.getState().setProModalFeature(t('pro.moodTracking'));
                useUIStore.getState().setShowProModal(true);
              }}
              className="text-xs text-muted-foreground"
            >
              {t('mood.unlockToTrack')}
            </button>
          )}
        </div>

        {/* Color */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            {t('noteDetail.color')}
          </h3>
          <ColorPicker
            selectedColor={note.color}
            onColorChange={(color) => editNote(noteId, { color })}
          />
        </div>

        {/* Photos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              {t('noteDetail.photos')}
            </h3>
            {(note.attachments?.length || 0) < MAX_ATTACHMENTS && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const result = await takePhoto();
                    if (result) {
                      const attachments = [...(note.attachments || []), result.base64];
                      editNote(noteId, { attachments });
                    }
                  }}
                >
                  <Camera className="w-4 h-4 mr-1" />
                  {t('noteDetail.takePhoto')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const result = await pickFromGallery();
                    if (result) {
                      const attachments = [...(note.attachments || []), result.base64];
                      editNote(noteId, { attachments });
                    }
                  }}
                >
                  {t('noteDetail.chooseFromGallery')}
                </Button>
              </div>
            )}
          </div>
          <AttachmentGrid
            attachments={note.attachments || []}
            onRemove={(index) => {
              const attachments = [...(note.attachments || [])];
              attachments.splice(index, 1);
              editNote(noteId, { attachments });
            }}
            onImageClick={(index) => {
              setImageViewerIndex(index);
              setImageViewerOpen(true);
            }}
          />
        </div>

        {/* Action Items */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            {t('noteDetail.actionItems')}
          </h3>
          
          <AnimatePresence mode="popLayout">
            {actionItems.map((action) => (
              <motion.div
                key={action.id}
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-start gap-3 group"
              >
                <GripVertical className="w-4 h-4 text-muted-foreground/30 mt-2.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" aria-hidden="true" />

                <Checkbox
                  checked={action.isDone}
                  onCheckedChange={() => toggleActionItem(action.id)}
                  className="mt-2"
                  aria-label={`${action.isDone ? 'Completed' : 'Incomplete'}: ${action.text}`}
                />

                <div className="flex-1">
                  <Input
                    value={action.text}
                    onChange={(e) => editActionItem(action.id, { text: e.target.value })}
                    aria-label={t('noteDetail.actionItemText') || 'Action item text'}
                    className={cn(
                      'border-none shadow-none px-0 focus-visible:ring-0 bg-transparent',
                      action.isDone && 'line-through text-muted-foreground'
                    )}
                  />
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteActionItem(action.id)}
                  aria-label={`${t('noteDetail.deleteAction') || 'Delete action'}: ${action.text}`}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {/* Add new action */}
          <div className="flex items-center gap-3">
            <div className="w-4" /> {/* Spacer for grip */}
            <Plus className="w-4 h-4 text-muted-foreground" />
            <Input
              value={newActionText}
              onChange={(e) => setNewActionText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddAction()}
              placeholder={t('noteDetail.addActionPlaceholder')}
              aria-label={t('noteDetail.addActionPlaceholder') || 'Add new action item'}
              className="border-none shadow-none px-0 focus-visible:ring-0 bg-transparent"
            />
          </div>
        </div>

        {/* Note DNA (A5) */}
        {note && <NoteDNA note={note} />}

        {/* Writing Stats */}
        {isPro && (title + body).length > 0 && (
          <WritingStats text={title + ' ' + body} />
        )}

        {/* Backlinks */}
        {backlinks.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5" />
              {t('noteDetail.backlinks') || 'Linked from'} ({backlinks.length})
            </h3>
            <div className="space-y-1.5">
              {backlinks.map((bl) => (
                <button
                  key={bl.id}
                  onClick={() => {
                    onBack();
                    setTimeout(() => {
                      useUIStore.getState().setSelectedNoteId?.(bl.id);
                    }, 100);
                  }}
                  aria-label={`${t('noteDetail.openNote') || 'Open note'}: ${getDisplayTitle(bl.title, bl.body)}`}
                  className="w-full text-left px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm"
                >
                  <span className="font-medium">{getDisplayTitle(bl.title, bl.body)}</span>
                  <span className="text-muted-foreground ml-2 text-xs">
                    {format(new Date(bl.updatedAt), 'MMM d')}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <ImageViewer
        images={note.attachments || []}
        initialIndex={imageViewerIndex}
        open={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
      />

      <VersionHistoryModal
        open={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
        noteId={noteId}
        onRestore={(t, b) => { setTitle(t); setBody(b); editNote(noteId, { title: t, body: b }); }}
      />

      <VoiceRecorder
        open={showVoiceRecorder}
        onClose={() => setShowVoiceRecorder(false)}
        onSave={(audioBase64) => {
          const attachments = [...(note.attachments || []), audioBase64];
          editNote(noteId, { attachments });
        }}
      />

      <IncubationSheet
        open={showIncubation}
        onOpenChange={setShowIncubation}
        noteId={noteId}
        noteTitle={getDisplayTitle(note.title, note.body)}
      />

      <LetGoFlow
        open={showLetGo}
        onOpenChange={setShowLetGo}
        note={note}
        onComplete={() => {
          setShowLetGo(false);
          onBack();
        }}
      />

      {showScenarioBuilder && (
        <ScenarioBuilder
          noteId={noteId}
          onClose={() => setShowScenarioBuilder(false)}
        />
      )}

      <ScenarioResolveFlow
        open={!!resolvingScenario}
        onOpenChange={(v) => !v && setResolvingScenario(null)}
        scenario={resolvingScenario}
        onResolve={(outcomeId, reflection) => {
          if (resolvingScenario) {
            resolveScenario(resolvingScenario.id, outcomeId, reflection);
            setResolvingScenario(null);
          }
        }}
      />

      {showFolderPicker && (
        <FolderPicker
          currentFolderId={note.folderId}
          onSelect={(folderId) => {
            editNote(noteId, { folderId });
            setShowFolderPicker(false);
          }}
        />
      )}
    </div>
  );
}
