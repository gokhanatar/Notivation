import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useTranslation } from '@/lib/i18n';
import type { CalibrationReport } from '@/lib/calibration/calibrationEngine';

interface CalibrationChartProps {
  report: CalibrationReport;
}

export function CalibrationChart({ report }: CalibrationChartProps) {
  const { t } = useTranslation();

  // Perfect calibration values for each bucket midpoint
  const perfectCalibration: Record<string, number> = {
    '1-2': 15,
    '3-4': 35,
    '5-6': 55,
    '7-8': 75,
    '9-10': 95,
  };

  const data = report.buckets.map(bucket => ({
    range: bucket.confidenceRange,
    accuracy: Math.round(bucket.accuracy * 100),
    perfect: perfectCalibration[bucket.confidenceRange],
    count: bucket.totalDecisions,
  }));

  return (
    <div className="space-y-2">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            dataKey="range"
            tick={{ fontSize: 11 }}
            label={{
              value: t('calibration.confidence'),
              position: 'insideBottom',
              offset: -2,
              fontSize: 10,
              fill: 'hsl(var(--muted-foreground))',
            }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => `${v}%`}
            label={{
              value: t('calibration.accuracy'),
              angle: -90,
              position: 'insideLeft',
              offset: 25,
              fontSize: 10,
              fill: 'hsl(var(--muted-foreground))',
            }}
          />
          <Tooltip
            formatter={(value: number) => [`${value}%`, t('calibration.accuracy')]}
            labelFormatter={(label) => `${t('calibration.confidence')}: ${label}`}
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Bar
            dataKey="accuracy"
            fill="hsl(217, 91%, 60%)"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
          {/* Perfect calibration diagonal reference line rendered as individual points */}
          <ReferenceLine
            y={50}
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="6 4"
            label={{
              value: t('calibration.perfectLine'),
              position: 'right',
              fontSize: 9,
              fill: 'hsl(var(--muted-foreground))',
            }}
          />
        </BarChart>
      </ResponsiveContainer>

      <p className="text-xs text-muted-foreground text-center">
        {t('calibration.brierScore')}: {report.brierScore}
      </p>
    </div>
  );
}
