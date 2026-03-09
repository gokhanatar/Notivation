import { useState, useMemo } from 'react';
import { useNotes } from '@/hooks/useNotes';
import { useTranslation } from '@/lib/i18n';
import { NoteCard } from '@/components/notes/NoteCard';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
} from 'date-fns';

interface CalendarViewScreenProps {
  onClose: () => void;
  onNoteSelect: (noteId: string) => void;
}

export function CalendarViewScreen({ onClose, onNoteSelect }: CalendarViewScreenProps) {
  const notes = useNotes();
  const { t } = useTranslation();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const notesByDate = useMemo(() => {
    const map = new Map<string, typeof notes>();
    notes.filter(n => !n.archived).forEach(n => {
      const key = format(new Date(n.createdAt), 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(n);
      if (n.dueDate) {
        const dueKey = format(new Date(n.dueDate), 'yyyy-MM-dd');
        if (dueKey !== key) {
          if (!map.has(dueKey)) map.set(dueKey, []);
          map.get(dueKey)!.push(n);
        }
      }
    });
    return map;
  }, [notes]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days: Date[] = [];
    let day = startDate;
    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  const selectedKey = format(selectedDate, 'yyyy-MM-dd');
  const selectedNotes = notesByDate.get(selectedKey) || [];

  const weekDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">{t('pro.calendarView')}</h2>
        <button onClick={onClose} className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center tap-target" aria-label="Close">
          <X className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-3">
        <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="font-semibold">{format(currentMonth, 'MMMM yyyy')}</span>
        <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Week Headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map(d => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {calendarDays.map((day, i) => {
          const key = format(day, 'yyyy-MM-dd');
          const count = notesByDate.get(key)?.length || 0;
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, new Date());

          return (
            <button
              key={i}
              onClick={() => setSelectedDate(day)}
              className={cn(
                'relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-colors',
                !isCurrentMonth && 'opacity-30',
                isSelected && 'bg-primary text-primary-foreground',
                !isSelected && isToday && 'bg-primary/10 font-bold',
                !isSelected && !isToday && 'hover:bg-muted'
              )}
            >
              {day.getDate()}
              {count > 0 && (
                <div className={cn(
                  'absolute bottom-0.5 w-1.5 h-1.5 rounded-full',
                  isSelected ? 'bg-primary-foreground' : 'bg-primary'
                )} />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Date Notes */}
      <div className="flex-1 overflow-y-auto pb-20 md:pb-6 space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">
          {format(selectedDate, 'EEEE, MMM d')} — {selectedNotes.length} {t('views.notes')}
        </h3>
        {selectedNotes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">{t('views.noNotes')}</p>
        ) : (
          selectedNotes.map(note => (
            <NoteCard key={note.id} note={note} onClick={() => onNoteSelect(note.id)} />
          ))
        )}
      </div>
    </div>
  );
}
