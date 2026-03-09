import { useState, useRef, useCallback, useEffect } from 'react';

export interface WriteSpeedData {
  wpm: number;
  level: 'fast' | 'slow' | 'normal';
  color: string;
}

/**
 * Hook to track writing speed in real-time
 * Calculates WPM based on keystrokes in a rolling window
 */
export function useWriteSpeed() {
  const [speedData, setSpeedData] = useState<WriteSpeedData>({
    wpm: 0,
    level: 'normal',
    color: '#22c55e',
  });

  const keystrokeTimes = useRef<number[]>([]);
  const wordCount = useRef(0);
  const startTime = useRef<number | null>(null);
  const totalDurationMs = useRef(0);
  const lastKeystrokeTime = useRef<number | null>(null);

  const handleKeyDown = useCallback(() => {
    const now = Date.now();
    keystrokeTimes.current.push(now);

    if (!startTime.current) {
      startTime.current = now;
    }

    // Track active writing duration (exclude pauses > 5s)
    if (lastKeystrokeTime.current && now - lastKeystrokeTime.current < 5000) {
      totalDurationMs.current += now - lastKeystrokeTime.current;
    }
    lastKeystrokeTime.current = now;

    // Keep only keystrokes from last 10 seconds for rolling WPM
    const tenSecondsAgo = now - 10000;
    keystrokeTimes.current = keystrokeTimes.current.filter(t => t > tenSecondsAgo);

    // Calculate WPM (avg 5 chars per word)
    const recentKeystrokes = keystrokeTimes.current.length;
    const timeWindowSec = Math.min(10, (now - (keystrokeTimes.current[0] || now)) / 1000);

    if (timeWindowSec > 0.5) {
      const wpm = Math.round((recentKeystrokes / 5) * (60 / timeWindowSec));

      let level: WriteSpeedData['level'];
      let color: string;

      if (wpm > 40) {
        level = 'fast';
        color = '#f97316'; // orange
      } else if (wpm < 15) {
        level = 'slow';
        color = '#3b82f6'; // blue
      } else {
        level = 'normal';
        color = '#22c55e'; // green
      }

      setSpeedData({ wpm, level, color });
    }
  }, []);

  const getWritingSpeed = useCallback((): 'fast' | 'slow' | 'normal' => {
    return speedData.level;
  }, [speedData.level]);

  const getTotalDurationMs = useCallback((): number => {
    return totalDurationMs.current;
  }, []);

  const reset = useCallback(() => {
    keystrokeTimes.current = [];
    wordCount.current = 0;
    startTime.current = null;
    totalDurationMs.current = 0;
    lastKeystrokeTime.current = null;
    setSpeedData({ wpm: 0, level: 'normal', color: '#22c55e' });
  }, []);

  return {
    speedData,
    handleKeyDown,
    getWritingSpeed,
    getTotalDurationMs,
    reset,
  };
}
