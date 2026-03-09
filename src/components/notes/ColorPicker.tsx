import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

const NOTE_COLORS = [
  { id: 'red', value: '#ef4444', label: 'Red' },
  { id: 'orange', value: '#f97316', label: 'Orange' },
  { id: 'amber', value: '#f59e0b', label: 'Amber' },
  { id: 'yellow', value: '#eab308', label: 'Yellow' },
  { id: 'lime', value: '#84cc16', label: 'Lime' },
  { id: 'green', value: '#22c55e', label: 'Green' },
  { id: 'teal', value: '#14b8a6', label: 'Teal' },
  { id: 'cyan', value: '#06b6d4', label: 'Cyan' },
  { id: 'blue', value: '#3b82f6', label: 'Blue' },
  { id: 'indigo', value: '#6366f1', label: 'Indigo' },
  { id: 'purple', value: '#a855f7', label: 'Purple' },
  { id: 'pink', value: '#ec4899', label: 'Pink' },
];

interface ColorPickerProps {
  selectedColor?: string;
  onColorChange: (color: string | undefined) => void;
}

export function ColorPicker({ selectedColor, onColorChange }: ColorPickerProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide" role="radiogroup" aria-label="Note color">
      {/* Clear color button */}
      <button
        onClick={() => onColorChange(undefined)}
        className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
          'border-2 transition-all tap-target',
          !selectedColor
            ? 'border-primary bg-muted'
            : 'border-border hover:border-primary/50'
        )}
        role="radio"
        aria-checked={!selectedColor}
        aria-label="Clear color"
      >
        <X className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
      </button>

      {NOTE_COLORS.map((color) => (
        <button
          key={color.id}
          onClick={() => onColorChange(color.value)}
          className={cn(
            'w-7 h-7 rounded-full flex-shrink-0 transition-all tap-target',
            'ring-offset-2 ring-offset-background',
            selectedColor === color.value
              ? 'ring-2 ring-primary scale-110'
              : 'hover:scale-110'
          )}
          style={{ backgroundColor: color.value }}
          role="radio"
          aria-checked={selectedColor === color.value}
          aria-label={color.label}
        />
      ))}
    </div>
  );
}

export { NOTE_COLORS };
