import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Settings, Search, Crown } from 'lucide-react';
import { useUIStore } from '@/store/useStore';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  showLogo?: boolean;
}

export function PageHeader({ title, subtitle, action, className, showLogo }: PageHeaderProps) {
  const setShowSettingsDrawer = useUIStore((s) => s.setShowSettingsDrawer);
  const setShowSearchOverlay = useUIStore((s) => s.setShowSearchOverlay);
  const isPro = useUIStore((s) => s.isPro);
  const setShowProModal = useUIStore((s) => s.setShowProModal);

  return (
    <header className={cn('flex items-center justify-between mb-4 md:mb-6', className)}>
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {showLogo && (
          <div className="w-8 h-8 md:w-0 md:h-0 md:hidden rounded-lg overflow-hidden flex-shrink-0"><img src="/logo.png" alt="Notivation" className="w-full h-full object-cover" /></div>
        )}
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-foreground truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs md:text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-0 flex-shrink-0">
        {action}
        {!isPro && (
          <button
            onClick={() => setShowProModal(true)}
            className="p-2 rounded-lg hover:bg-amber-500/10 transition-colors tap-target"
            aria-label="Upgrade to Pro"
          >
            <Crown className="w-4 h-4 text-amber-500" />
          </button>
        )}
        <button
          onClick={() => setShowSearchOverlay(true)}
          className="p-2.5 rounded-lg hover:bg-muted transition-colors tap-target"
          aria-label="Search"
        >
          <Search className="w-5 h-5 text-muted-foreground" />
        </button>
        <button
          onClick={() => setShowSettingsDrawer(true)}
          className="p-2.5 rounded-lg hover:bg-muted transition-colors tap-target"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
}
