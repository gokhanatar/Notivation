import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { type NoteChunk } from '@/lib/chunking/chunkingEngine';
import { getDisplayTitle } from '@/lib/utils/autoTitle';
import { Layers, Tag } from 'lucide-react';

interface NoteChunkCardProps {
  chunk: NoteChunk;
  onGroupTag?: (chunk: NoteChunk) => void;
  onNoteSelect?: (noteId: string) => void;
}

export function NoteChunkCard({ chunk, onGroupTag, onNoteSelect }: NoteChunkCardProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      {/* Stacked cards visual */}
      <div className="relative">
        {/* Background cards */}
        <div className="absolute inset-0 translate-y-2 translate-x-1 rounded-lg bg-muted/30 border border-border/50" />
        <div className="absolute inset-0 translate-y-1 translate-x-0.5 rounded-lg bg-muted/50 border border-border/50" />

        {/* Main card */}
        <div className="relative rounded-lg bg-card border border-border p-3">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">
              {chunk.notes.length} {t('chunk.notes')}
            </span>
          </div>

          {/* Common keywords as chips */}
          {chunk.commonKeywords.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {chunk.commonKeywords.map((kw) => (
                <span
                  key={kw}
                  className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs"
                >
                  {kw}
                </span>
              ))}
            </div>
          )}

          {/* Note titles */}
          <div className="space-y-1">
            {chunk.notes.slice(0, 3).map((note) => (
              <button
                key={note.id}
                onClick={() => onNoteSelect?.(note.id)}
                className="w-full text-left text-xs text-muted-foreground truncate hover:text-foreground transition-colors"
              >
                {getDisplayTitle(note.title, note.body)}
              </button>
            ))}
            {chunk.notes.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{chunk.notes.length - 3} {t('common.more')}
              </span>
            )}
          </div>

          {/* Group action */}
          {onGroupTag && (
            <button
              onClick={() => onGroupTag(chunk)}
              className="mt-2 flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <Tag className="w-3 h-3" />
              {t('chunk.groupTag')}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
