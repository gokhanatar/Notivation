import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

interface ConfidenceSliderProps {
  value: number | undefined;
  onChange: (value: number) => void;
}

function getEmoji(value: number): string {
  if (value <= 2) return '\u{1F61F}';
  if (value <= 4) return '\u{1F914}';
  if (value <= 6) return '\u{1F610}';
  if (value <= 8) return '\u{1F60A}';
  return '\u{1F3AF}';
}

function getColor(value: number): string {
  if (value <= 2) return 'text-red-500';
  if (value <= 4) return 'text-orange-500';
  if (value <= 6) return 'text-yellow-500';
  if (value <= 8) return 'text-lime-500';
  return 'text-green-500';
}

export function ConfidenceSlider({ value, onChange }: ConfidenceSliderProps) {
  const { t } = useTranslation();
  const current = value ?? 5;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground">
        {t('calibration.howConfident')}
      </label>

      {/* Current value display */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-3xl">{getEmoji(current)}</span>
        <span className={cn('text-3xl font-bold', getColor(current))}>
          {current}
        </span>
      </div>

      {/* Slider */}
      <div className="relative">
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={current}
          onChange={(e) => onChange(Number(e.target.value))}
          className={cn(
            'w-full h-2 rounded-full appearance-none cursor-pointer',
            'bg-gradient-to-r from-red-500 via-yellow-500 to-green-500',
            '[&::-webkit-slider-thumb]:appearance-none',
            '[&::-webkit-slider-thumb]:w-5',
            '[&::-webkit-slider-thumb]:h-5',
            '[&::-webkit-slider-thumb]:rounded-full',
            '[&::-webkit-slider-thumb]:bg-white',
            '[&::-webkit-slider-thumb]:shadow-md',
            '[&::-webkit-slider-thumb]:border-2',
            '[&::-webkit-slider-thumb]:border-primary',
            '[&::-moz-range-thumb]:w-5',
            '[&::-moz-range-thumb]:h-5',
            '[&::-moz-range-thumb]:rounded-full',
            '[&::-moz-range-thumb]:bg-white',
            '[&::-moz-range-thumb]:shadow-md',
            '[&::-moz-range-thumb]:border-2',
            '[&::-moz-range-thumb]:border-primary',
          )}
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1 px-0.5">
          <span>1</span>
          <span>5</span>
          <span>10</span>
        </div>
      </div>
    </div>
  );
}
