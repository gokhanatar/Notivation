import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { WriteSpeedData } from '@/hooks/useWriteSpeed';

interface WriteSpeedBarProps {
  speedData: WriteSpeedData;
  visible: boolean;
}

export function WriteSpeedBar({ speedData, visible }: WriteSpeedBarProps) {
  if (!visible || speedData.wpm === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-[3px] w-full rounded-full overflow-hidden bg-muted/30"
    >
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: speedData.color }}
        initial={{ width: '0%' }}
        animate={{
          width: `${Math.min(100, (speedData.wpm / 60) * 100)}%`,
        }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />
    </motion.div>
  );
}
