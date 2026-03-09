import { useState } from 'react';
import { type Note } from '@/lib/db';
import { getDisplayTitle } from '@/lib/utils/autoTitle';
import { useTranslation } from '@/lib/i18n';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CanvasConnectionDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  notes: Note[];
  onConnect: (fromId: string, toId: string, label?: string) => void;
}

export function CanvasConnectionDialog({ open, onOpenChange, notes, onConnect }: CanvasConnectionDialogProps) {
  const { t } = useTranslation();
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [label, setLabel] = useState('');

  const handleConnect = () => {
    if (!fromId || !toId || fromId === toId) return;
    onConnect(fromId, toId, label || undefined);
    setFromId('');
    setToId('');
    setLabel('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('canvas.connect')}</DialogTitle>
          <DialogDescription>{t('canvas.connectDesc')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* From note */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">{t('canvas.from')}</label>
            <Select value={fromId} onValueChange={setFromId}>
              <SelectTrigger>
                <SelectValue placeholder={t('canvas.from')} />
              </SelectTrigger>
              <SelectContent>
                {notes.map(note => (
                  <SelectItem key={note.id} value={note.id}>
                    {getDisplayTitle(note.title, note.body)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* To note */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">{t('canvas.to')}</label>
            <Select value={toId} onValueChange={setToId}>
              <SelectTrigger>
                <SelectValue placeholder={t('canvas.to')} />
              </SelectTrigger>
              <SelectContent>
                {notes.filter(n => n.id !== fromId).map(note => (
                  <SelectItem key={note.id} value={note.id}>
                    {getDisplayTitle(note.title, note.body)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Label */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">{t('canvas.label')}</label>
            <Input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder={t('canvas.labelPlaceholder')}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleConnect}
            disabled={!fromId || !toId || fromId === toId}
          >
            {t('canvas.connect')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
