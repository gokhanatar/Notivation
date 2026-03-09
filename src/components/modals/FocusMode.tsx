import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { hapticSuccess, hapticLight } from '@/lib/native/haptics';
import { X, Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Phase = 'work' | 'break';

interface FocusModeProps {
  open: boolean;
  onClose: () => void;
}

const WORK_DURATION = 25 * 60;
const BREAK_DURATION = 5 * 60;

export function FocusMode({ open, onClose }: FocusModeProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>('work');
  const [seconds, setSeconds] = useState(WORK_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const reset = useCallback(() => {
    setIsRunning(false);
    setPhase('work');
    setSeconds(WORK_DURATION);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (!open) {
      reset();
      setSessions(0);
    }
  }, [open, reset]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => {
          if (prev <= 1) {
            hapticSuccess();
            if (phase === 'work') {
              setSessions(s => s + 1);
              setPhase('break');
              return BREAK_DURATION;
            } else {
              setPhase('work');
              return WORK_DURATION;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, phase]);

  if (!open) return null;

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const total = phase === 'work' ? WORK_DURATION : BREAK_DURATION;
  const progress = ((total - seconds) / total) * 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background flex flex-col safe-top"
      >
        {/* Header with close */}
        <div className="flex items-center justify-end px-5 py-3">
          <button
            onClick={onClose}
            className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center tap-target"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">

        <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-8">
          {phase === 'work' ? t('focus.workTime') : t('focus.breakTime')}
        </p>

        <div className="relative w-56 h-56 mb-8">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/30" />
            <circle
              cx="60" cy="60" r="54" fill="none"
              stroke="currentColor" strokeWidth="4"
              strokeLinecap="round"
              className={phase === 'work' ? 'text-primary' : 'text-green-500'}
              strokeDasharray={`${2 * Math.PI * 54}`}
              strokeDashoffset={`${2 * Math.PI * 54 * (1 - progress / 100)}`}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold tabular-nums">
              {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            className="w-12 h-12 rounded-full"
            onClick={reset}
          >
            <RotateCcw className="w-5 h-5" />
          </Button>

          <Button
            size="icon"
            className={cn(
              'w-16 h-16 rounded-full',
              phase === 'work'
                ? 'bg-primary hover:bg-primary/90'
                : 'bg-green-500 hover:bg-green-600'
            )}
            onClick={() => { hapticLight(); setIsRunning(!isRunning); }}
          >
            {isRunning ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-0.5" />}
          </Button>

          <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center">
            <span className="text-sm font-bold">{sessions}</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          {t('focus.sessionsCompleted', { count: String(sessions) })}
        </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
