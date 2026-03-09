import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { useTranslation } from '@/lib/i18n';
import { ArrowLeft } from 'lucide-react';

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  onOpenWeeklyDigest?: () => void;
  onOpenFocusMode?: () => void;
  onOpenNoteGraph?: () => void;
  onOpenCalendarView?: () => void;
  onOpenOpenLoops?: () => void;
  onOpenFolders?: () => void;
  onOpenMyWords?: () => void;
  onOpenCanvas?: () => void;
}

export function SettingsDrawer({ open, onClose, onOpenWeeklyDigest, onOpenFocusMode, onOpenNoteGraph, onOpenCalendarView, onOpenOpenLoops, onOpenFolders, onOpenMyWords, onOpenCanvas }: SettingsDrawerProps) {
  const { t } = useTranslation();

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md md:max-w-lg overflow-y-auto p-4 md:p-6">
        <SheetHeader className="mb-4 flex flex-row items-center gap-3">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center tap-target flex-shrink-0"
            aria-label="Close settings"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <SheetTitle className="flex-1">{t('settings.title')}</SheetTitle>
        </SheetHeader>
        <SettingsScreen
          onOpenWeeklyDigest={() => { onClose(); onOpenWeeklyDigest?.(); }}
          onOpenFocusMode={() => { onClose(); onOpenFocusMode?.(); }}
          onOpenNoteGraph={() => { onClose(); onOpenNoteGraph?.(); }}
          onOpenCalendarView={() => { onClose(); onOpenCalendarView?.(); }}
          onOpenOpenLoops={() => { onClose(); onOpenOpenLoops?.(); }}
          onOpenFolders={() => { onClose(); onOpenFolders?.(); }}
          onOpenMyWords={() => { onClose(); onOpenMyWords?.(); }}
          onOpenCanvas={() => { onClose(); onOpenCanvas?.(); }}
        />
      </SheetContent>
    </Sheet>
  );
}
