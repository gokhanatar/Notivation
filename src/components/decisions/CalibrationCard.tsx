import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { generateCalibrationReport, type CalibrationReport } from '@/lib/calibration/calibrationEngine';
import { CalibrationChart } from './CalibrationChart';
import { TrendingUp, TrendingDown, CheckCircle } from 'lucide-react';

export function CalibrationCard() {
  const { t } = useTranslation();
  const [report, setReport] = useState<CalibrationReport | null>(null);

  useEffect(() => {
    generateCalibrationReport().then(setReport);
  }, []);

  if (!report) return null;

  if (report.totalCalibratedDecisions < 3) {
    return (
      <div className="rounded-xl border border-border p-4 space-y-3 bg-card">
        <h3 className="font-semibold text-sm">{t('calibration.title')}</h3>
        <p className="text-sm text-muted-foreground">{t('calibration.needMore')}</p>
        <p className="text-xs text-muted-foreground">{t('calibration.needMoreDesc')}</p>
      </div>
    );
  }

  const biasConfig = {
    overconfident: {
      icon: TrendingUp,
      color: 'text-amber-600 dark:text-amber-400',
      label: t('calibration.overconfident'),
    },
    underconfident: {
      icon: TrendingDown,
      color: 'text-blue-600 dark:text-blue-400',
      label: t('calibration.underconfident'),
    },
    'well-calibrated': {
      icon: CheckCircle,
      color: 'text-green-600 dark:text-green-400',
      label: t('calibration.wellCalibrated'),
    },
  };

  const config = biasConfig[report.bias];
  const BiasIcon = config.icon;

  return (
    <div className="rounded-xl border border-border p-4 space-y-3 bg-card">
      <h3 className="font-semibold text-sm">{t('calibration.title')}</h3>

      <CalibrationChart report={report} />

      {/* Bias indicator */}
      <div className="flex items-center gap-2">
        <BiasIcon className={cn('w-4 h-4', config.color)} />
        <span className="text-sm text-muted-foreground">{t('calibration.bias')}:</span>
        <span className={cn('text-sm font-medium', config.color)}>
          {config.label}
        </span>
      </div>

      {/* Total decisions */}
      <p className="text-xs text-muted-foreground">
        {t('calibration.totalDecisions', { count: report.totalCalibratedDecisions })}
      </p>
    </div>
  );
}
