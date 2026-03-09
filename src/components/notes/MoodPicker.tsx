import { cn } from '@/lib/utils';
import type { MoodType } from '@/lib/db';

const moods: { value: MoodType; emoji: string; label: string }[] = [
  { value: 'great', emoji: '😄', label: 'Great' },
  { value: 'good', emoji: '🙂', label: 'Good' },
  { value: 'neutral', emoji: '😐', label: 'Neutral' },
  { value: 'bad', emoji: '😟', label: 'Bad' },
  { value: 'terrible', emoji: '😢', label: 'Terrible' },
];

export function moodEmoji(mood: MoodType): string {
  return moods.find(m => m.value === mood)?.emoji || '';
}

interface MoodPickerProps {
  selected: MoodType;
  onChange: (mood: MoodType) => void;
  size?: 'sm' | 'md';
}

export function MoodPicker({ selected, onChange, size = 'md' }: MoodPickerProps) {
  return (
    <div className="flex items-center gap-1">
      {moods.map((mood) => (
        <button
          key={mood.value}
          onClick={() => onChange(selected === mood.value ? null : mood.value)}
          className={cn(
            'rounded-full transition-all tap-target press-effect',
            size === 'sm' ? 'text-lg p-1' : 'text-2xl p-1.5',
            selected === mood.value
              ? 'bg-primary/15 scale-110 ring-2 ring-primary/30'
              : 'hover:bg-muted opacity-60 hover:opacity-100'
          )}
          title={mood.label}
        >
          {mood.emoji}
        </button>
      ))}
    </div>
  );
}
