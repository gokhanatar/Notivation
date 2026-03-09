import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/useStore';
import { useTranslation } from '@/lib/i18n';
import {
  StickyNote,
  ListChecks,
  Scale,
  Compass,
  Crown,
} from 'lucide-react';

const tabs = [
  { id: 'stream' as const, labelKey: 'nav.notes', icon: StickyNote },
  { id: 'actions' as const, labelKey: 'nav.todos', icon: ListChecks },
  { id: 'decide' as const, labelKey: 'nav.decide', icon: Scale },
  { id: 'tools' as const, labelKey: 'nav.tools', icon: Compass },
];

interface BottomNavProps {
  hidePhoneNav?: boolean;
}

export function BottomNav({ hidePhoneNav }: BottomNavProps = {}) {
  const { activeTab, setActiveTab, isPro } = useUIStore();
  const { t } = useTranslation();

  return (
    <>
      {!hidePhoneNav && (
      <nav role="tablist" aria-label="Main navigation" className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-card/95 backdrop-blur-lg border-t border-border',
        'safe-bottom',
        'md:hidden'
      )}>
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                role="tab"
                aria-current={isActive ? 'page' : undefined}
                aria-label={t(tab.labelKey)}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'relative flex flex-col items-center justify-center',
                  'w-16 h-full tap-target',
                  'transition-colors'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator-bottom"
                    className="absolute inset-x-2 top-0 h-0.5 bg-primary rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}

                <div className="relative">
                  <Icon
                    className={cn(
                      'w-5 h-5 transition-colors',
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    )}
                  />
                  {tab.id === 'tools' && !isPro && (
                    <Crown className="w-2.5 h-2.5 text-amber-500 absolute -top-1 -right-1.5" />
                  )}
                </div>
                <span
                  className={cn(
                    'text-[11px] mt-1 transition-colors leading-tight truncate max-w-full',
                    isActive ? 'text-primary font-medium' : 'text-muted-foreground'
                  )}
                >
                  {t(tab.labelKey)}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
      )}

      <nav role="tablist" aria-label="Main navigation" className={cn(
        'hidden md:flex flex-col',
        'sticky top-0 h-screen w-20 lg:w-56 flex-shrink-0',
        'bg-card/95 backdrop-blur-lg border-r border-border',
        'pt-6 pb-6 safe-top'
      )}>
        <div className="flex items-center gap-2 px-4 mb-8">
          <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0">
            <img src="/logo.png" alt="Notivation" className="w-full h-full object-cover" />
          </div>
          <span className="hidden lg:block text-lg font-bold text-foreground">Notivation</span>
        </div>
        <div className="flex flex-col gap-1 px-2 flex-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                role="tab"
                aria-current={isActive ? 'page' : undefined}
                aria-label={t(tab.labelKey)}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'relative flex items-center gap-3 px-3 py-3 rounded-xl',
                  'transition-colors tap-target',
                  'lg:justify-start justify-center',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator-sidebar"
                    className="absolute left-0 top-2 bottom-2 w-0.5 bg-primary rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}

                <div className="relative flex-shrink-0">
                  <Icon className={cn(
                    'w-5 h-5',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )} />
                  {tab.id === 'tools' && !isPro && (
                    <Crown className="w-2.5 h-2.5 text-amber-500 absolute -top-1 -right-1.5" />
                  )}
                </div>
                <span className={cn(
                  'hidden lg:block text-sm transition-colors truncate',
                  isActive ? 'text-primary font-semibold' : 'text-muted-foreground'
                )}>
                  {t(tab.labelKey)}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
