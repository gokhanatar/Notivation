import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { WelcomeStep } from './WelcomeStep';
import { UserTypeStep } from './UserTypeStep';
import { ThemePickerStep } from './ThemePickerStep';
import { PrivacyStep } from './PrivacyStep';
import { FirstNoteStep } from './FirstNoteStep';

interface OnboardingFlowProps {
  onComplete: () => void;
}

const TOTAL_STEPS = 5;

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 200 : -200,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -200 : 200,
    opacity: 0,
  }),
};

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const goNext = () => {
    if (step < TOTAL_STEPS - 1) {
      setDirection(1);
      setStep((s) => s + 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('notivation-onboarded', 'true');
    onComplete();
  };

  const handleSkip = () => {
    handleComplete();
  };

  const isLastStep = step === TOTAL_STEPS - 1;

  return (
    <div className="min-h-screen bg-background flex flex-col safe-top">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 pt-6 pb-4">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'rounded-full transition-all duration-300',
              i === step
                ? 'w-8 h-2 bg-primary'
                : i < step
                  ? 'w-2 h-2 bg-primary/60'
                  : 'w-2 h-2 bg-muted-foreground/30'
            )}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="absolute inset-0"
          >
            {step === 0 && <WelcomeStep onNext={goNext} />}
            {step === 1 && <UserTypeStep onNext={goNext} />}
            {step === 2 && <ThemePickerStep onNext={goNext} />}
            {step === 3 && <PrivacyStep onNext={goNext} />}
            {step === 4 && <FirstNoteStep onComplete={handleComplete} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom navigation */}
      <div className="flex items-center justify-between px-6 pb-6 pt-4 safe-bottom">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSkip}
          className="text-muted-foreground"
        >
          {t('onboarding.skip')}
        </Button>

        {isLastStep ? (
          <Button onClick={handleComplete} size="lg" className="px-8">
            {t('onboarding.getStarted')}
          </Button>
        ) : (
          <Button onClick={goNext} size="lg" className="px-8">
            {t('onboarding.next')}
          </Button>
        )}
      </div>
    </div>
  );
}
