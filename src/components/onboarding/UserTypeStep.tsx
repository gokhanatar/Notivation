import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { GraduationCap, Briefcase, PenTool, Heart, Code } from 'lucide-react';

interface UserTypeStepProps {
  onNext: () => void;
}

const userTypes = [
  { id: 'student', icon: GraduationCap, labelKey: 'onboarding.student' },
  { id: 'professional', icon: Briefcase, labelKey: 'onboarding.professional' },
  { id: 'writer', icon: PenTool, labelKey: 'onboarding.writer' },
  { id: 'personal', icon: Heart, labelKey: 'onboarding.personal' },
  { id: 'developer', icon: Code, labelKey: 'onboarding.developer' },
] as const;

export function UserTypeStep({ onNext }: UserTypeStepProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    setSelected(id);
    localStorage.setItem('notivation-user-type', id);
  };

  return (
    <div className="flex flex-col items-center min-h-[60vh] px-6">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-foreground mb-2 text-center"
      >
        {t('onboarding.userType')}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-sm text-muted-foreground mb-8 text-center"
      >
        {t('onboarding.skip')}
      </motion.p>

      <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
        {userTypes.map((type, i) => {
          const Icon = type.icon;
          const isSelected = selected === type.id;

          return (
            <motion.button
              key={type.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              onClick={() => handleSelect(type.id)}
              className={cn(
                'flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all',
                isSelected
                  ? 'border-primary bg-primary/10 shadow-md'
                  : 'border-border bg-card hover:border-primary/40'
              )}
            >
              <div className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center',
                isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              )}>
                <Icon className="w-6 h-6" />
              </div>
              <span className={cn(
                'text-sm font-medium',
                isSelected ? 'text-primary' : 'text-foreground'
              )}>
                {t(type.labelKey)}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
