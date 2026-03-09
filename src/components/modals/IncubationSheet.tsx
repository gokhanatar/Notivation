import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { startIncubation, wakeUpNote, isIncubating } from '@/lib/incubation/incubationEngine';
import { hapticSuccess } from '@/lib/native/haptics';
import { toast } from 'sonner';
import { db } from '@/lib/db';
import { Moon, Sunrise } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

interface IncubationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  noteId: string;
  noteTitle: string;
}

const durationOptions = [
  { days: 3, emoji: '🌙' },
  { days: 7, emoji: '🌗' },
  { days: 14, emoji: '🌑' },
  { days: 30, emoji: '🌚' },
];

export function IncubationSheet({ open, onOpenChange, noteId, noteTitle }: IncubationSheetProps) {
  const { t } = useTranslation();
  const [alreadyIncubating, setAlreadyIncubating] = useState(false);

  useEffect(() => {
    if (open && noteId) {
      db.notes.get(noteId).then(note => {
        if (note) {
          setAlreadyIncubating(isIncubating(note));
        }
      });
    }
  }, [open, noteId]);

  const handleSelectDuration = async (days: number) => {
    await startIncubation(noteId, days);
    hapticSuccess();
    toast.success(t('incubation.started', { days: String(days) }));
    onOpenChange(false);
  };

  const handleWakeUp = async () => {
    await wakeUpNote(noteId);
    hapticSuccess();
    toast.success(t('incubation.wakeUp'));
    setAlreadyIncubating(false);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-indigo-500" />
            {t('incubation.title')}
          </SheetTitle>
          <SheetDescription>
            {t('incubation.subtitle')}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-3 pb-6">
          {/* Duration option cards */}
          <div className="grid grid-cols-2 gap-3">
            {durationOptions.map(({ days, emoji }) => (
              <button
                key={days}
                onClick={() => handleSelectDuration(days)}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl',
                  'border-2 border-border hover:border-indigo-400',
                  'bg-card hover:bg-indigo-50 dark:hover:bg-indigo-950/30',
                  'transition-all active:scale-95'
                )}
              >
                <span className="text-2xl">{emoji}</span>
                <span className="text-lg font-semibold text-foreground">
                  {days}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t('incubation.days', { count: String(days) })}
                </span>
              </button>
            ))}
          </div>

          {/* Wake up early button */}
          {alreadyIncubating && (
            <button
              onClick={handleWakeUp}
              className={cn(
                'w-full flex items-center justify-center gap-2 p-3 rounded-xl',
                'border-2 border-amber-300 dark:border-amber-600',
                'bg-amber-50 dark:bg-amber-950/30',
                'text-amber-700 dark:text-amber-300',
                'font-medium text-sm',
                'hover:bg-amber-100 dark:hover:bg-amber-950/50',
                'transition-all active:scale-95'
              )}
            >
              <Sunrise className="w-4 h-4" />
              {t('incubation.wakeUpEarly')}
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
