import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { type NoteType } from '@/lib/db';
import { typeConfig } from '@/components/notes/TypeBadge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Share2 } from 'lucide-react';
import type { SharedContent } from '@/hooks/useShareReceiver';

interface ShareReceiverModalProps {
  content: SharedContent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateNote: (data: { type: NoteType; title: string; body: string }) => void;
}

const noteTypes: NoteType[] = ['decision', 'action', 'info', 'idea', 'followup'];

export function ShareReceiverModal({ content, open, onOpenChange, onCreateNote }: ShareReceiverModalProps) {
  const { t } = useTranslation();
  const [selectedType, setSelectedType] = useState<NoteType>('info');
  const [body, setBody] = useState('');

  // Pre-fill body when content changes
  if (content && !body) {
    const parts = [];
    if (content.title) parts.push(content.title);
    if (content.text) parts.push(content.text);
    if (content.url) parts.push(content.url);
    if (parts.length > 0) {
      setBody(parts.join('\n\n'));
    }
  }

  const handleCreate = () => {
    onCreateNote({
      type: selectedType,
      title: content?.title || '',
      body: body.trim(),
    });
    setBody('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            {t('share.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Type selector */}
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
            {noteTypes.map((type) => {
              const config = typeConfig[type];
              const Icon = config.icon;
              const isActive = selectedType === type;

              return (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-lg',
                    'text-sm font-medium whitespace-nowrap transition-all',
                    isActive
                      ? config.badgeClass
                      : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {config.label}
                </button>
              );
            })}
          </div>

          {/* Content preview/edit */}
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t('share.contentPlaceholder')}
            className="min-h-[120px]"
          />

          <Button onClick={handleCreate} className="w-full" disabled={!body.trim()}>
            {t('share.createNote')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
