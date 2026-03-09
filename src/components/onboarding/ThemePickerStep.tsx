import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { useUIStore } from '@/store/useStore';
import { updateSettings, type AppSettings } from '@/lib/db';
import { Check } from 'lucide-react';

interface ThemePickerStepProps {
  onNext: () => void;
}

type ThemeId = AppSettings['theme'];

const themes: { id: ThemeId; labelKey: string; colors: string[] }[] = [
  { id: 'light', labelKey: 'settings.themeLight', colors: ['#ffffff', '#f8fafc', '#0f172a', '#6366f1'] },
  { id: 'dark', labelKey: 'settings.themeDark', colors: ['#1e1e2e', '#2a2a3c', '#e2e8f0', '#818cf8'] },
  { id: 'warm', labelKey: 'settings.themeWarm', colors: ['#fef7ed', '#fef3c7', '#78350f', '#f59e0b'] },
  { id: 'kids', labelKey: 'settings.themeKids', colors: ['#fdf2f8', '#fce7f3', '#831843', '#ec4899'] },
  { id: 'senior', labelKey: 'settings.themeSenior', colors: ['#f8fafc', '#f1f5f9', '#1e293b', '#475569'] },
  { id: 'minimal', labelKey: 'settings.themeMinimal', colors: ['#fafafa', '#f5f5f5', '#171717', '#525252'] },
  { id: 'oled', labelKey: 'settings.themeOled', colors: ['#000000', '#0a0a0a', '#f5f5f5', '#a78bfa'] },
  { id: 'ocean', labelKey: 'settings.themeOcean', colors: ['#0c1426', '#132040', '#e0f2fe', '#38bdf8'] },
  { id: 'forest', labelKey: 'settings.themeForest', colors: ['#0f1a0f', '#1a2e1a', '#dcfce7', '#4ade80'] },
  { id: 'sunset', labelKey: 'settings.themeSunset', colors: ['#1c0f1a', '#2d1628', '#fce7f3', '#f472b6'] },
];

export function ThemePickerStep({ onNext }: ThemePickerStepProps) {
  const { t } = useTranslation();
  const currentTheme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);

  const handleThemeSelect = (themeId: ThemeId) => {
    setTheme(themeId);
    updateSettings({ theme: themeId });
  };

  return (
    <div className="flex flex-col items-center min-h-[60vh] px-6">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-foreground mb-8 text-center"
      >
        {t('onboarding.pickTheme')}
      </motion.h2>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 w-full max-w-sm">
        {themes.map((theme, i) => {
          const isSelected = currentTheme === theme.id;
          return (
            <motion.button
              key={theme.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 * i }}
              onClick={() => handleThemeSelect(theme.id)}
              className={cn(
                'flex flex-col items-center gap-2 p-2 rounded-xl border-2 transition-all',
                isSelected
                  ? 'border-primary shadow-md'
                  : 'border-transparent hover:border-border'
              )}
            >
              <div className="relative w-12 h-12 rounded-lg overflow-hidden shadow-sm">
                {/* 4-color swatch */}
                <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
                  {theme.colors.map((color, ci) => (
                    <div key={ci} style={{ backgroundColor: color }} />
                  ))}
                </div>
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center bg-primary/30">
                    <Check className="w-5 h-5 text-white drop-shadow-md" />
                  </div>
                )}
              </div>
              <span className="text-xs font-medium text-muted-foreground truncate w-full text-center">
                {t(theme.labelKey)}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
