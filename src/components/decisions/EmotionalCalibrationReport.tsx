import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { generateCalibrationReport, type CalibrationReport } from '@/lib/emotions/emotionalAnchorEngine';
import { moodEmoji } from '@/components/notes/MoodPicker';
import type { MoodType } from '@/lib/db';
import { BarChart3 } from 'lucide-react';

export function EmotionalCalibrationReport() {
  const { t } = useTranslation();
  const [report, setReport] = useState<CalibrationReport | null>(null);

  useEffect(() => {
    generateCalibrationReport().then(setReport);
  }, []);

  if (!report || !report.hasEnoughData) return null;

  return (
    <div className="space-y-3 p-4 rounded-xl bg-card border border-border">
      <h3 className="font-semibold text-sm flex items-center gap-1.5">
        <BarChart3 className="w-4 h-4 text-primary" />
        {t('emotion.calibrationTitle')}
      </h3>

      <p className="text-xs text-muted-foreground">
        {t('emotion.calibrationDesc', { count: report.totalDecisions })}
      </p>

      <div className="space-y-2">
        {report.stats.map((stat) => (
          <div key={stat.mood} className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">{moodEmoji(stat.mood as MoodType)}</span>
              <span className="text-xs text-muted-foreground flex-1">
                {stat.total} {t('emotion.decisions')}
              </span>
              <span className="text-xs font-medium">
                {Math.round(stat.positiveRate * 100)}% {t('emotion.positive')}
              </span>
            </div>

            {/* Stacked bar */}
            <div className="flex h-2 rounded-full overflow-hidden bg-muted">
              {stat.positive > 0 && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(stat.positive / stat.total) * 100}%` }}
                  className="bg-green-500"
                />
              )}
              {stat.neutral > 0 && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(stat.neutral / stat.total) * 100}%` }}
                  className="bg-gray-400"
                />
              )}
              {stat.negative > 0 && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(stat.negative / stat.total) * 100}%` }}
                  className="bg-red-500"
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {report.bestMood && (
        <p className="text-xs text-muted-foreground">
          {t('emotion.bestMood')}: {moodEmoji(report.bestMood as MoodType)}
        </p>
      )}
    </div>
  );
}
