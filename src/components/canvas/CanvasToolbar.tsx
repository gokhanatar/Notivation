import { ZoomIn, ZoomOut, RotateCcw, Wand2, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

interface CanvasToolbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onAutoLayout: () => void;
  onToggleConnectionMode: () => void;
  connectionMode: boolean;
  scale: number;
}

export function CanvasToolbar({
  onZoomIn,
  onZoomOut,
  onReset,
  onAutoLayout,
  onToggleConnectionMode,
  connectionMode,
  scale,
}: CanvasToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 md:left-[calc(50%+40px)] md:-translate-x-1/2 bg-card border border-border rounded-full px-4 py-2 shadow-lg flex items-center gap-2 z-[60]">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onZoomOut}
        title={t('canvas.zoomOut')}
      >
        <ZoomOut className="w-4 h-4" />
      </Button>

      <span className="text-xs text-muted-foreground min-w-[3rem] text-center tabular-nums">
        {Math.round(scale * 100)}%
      </span>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onZoomIn}
        title={t('canvas.zoomIn')}
      >
        <ZoomIn className="w-4 h-4" />
      </Button>

      <div className="w-px h-5 bg-border mx-1" />

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onReset}
        title={t('canvas.reset')}
      >
        <RotateCcw className="w-4 h-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onAutoLayout}
        title={t('canvas.autoLayout')}
      >
        <Wand2 className="w-4 h-4" />
      </Button>

      <div className="w-px h-5 bg-border mx-1" />

      <Button
        variant={connectionMode ? 'default' : 'ghost'}
        size="icon"
        className={cn('h-8 w-8', connectionMode && 'bg-primary text-primary-foreground')}
        onClick={onToggleConnectionMode}
        title={t('canvas.connectMode')}
      >
        <Link2 className="w-4 h-4" />
      </Button>
    </div>
  );
}
