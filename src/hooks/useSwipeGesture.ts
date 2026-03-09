import { useState, useRef, useCallback } from 'react';

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

interface SwipeGestureOptions {
  threshold?: number; // minimum px to trigger
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
}

interface SwipeState {
  isDragging: boolean;
  offsetX: number;
  offsetY: number;
  direction: SwipeDirection | null;
}

export function useSwipeGesture(options: SwipeGestureOptions = {}) {
  const { threshold = 80, onSwipeLeft, onSwipeRight, onSwipeUp } = options;
  const [state, setState] = useState<SwipeState>({
    isDragging: false,
    offsetX: 0,
    offsetY: 0,
    direction: null,
  });

  const startPos = useRef<{ x: number; y: number } | null>(null);
  const triggered = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    startPos.current = { x: touch.clientX, y: touch.clientY };
    triggered.current = false;
    setState({ isDragging: true, offsetX: 0, offsetY: 0, direction: null });
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!startPos.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - startPos.current.x;
    const dy = touch.clientY - startPos.current.y;

    let direction: SwipeDirection | null = null;
    if (Math.abs(dx) > Math.abs(dy)) {
      direction = dx > 0 ? 'right' : 'left';
    } else if (dy < -20) {
      direction = 'up';
    }

    setState({ isDragging: true, offsetX: dx, offsetY: dy, direction });
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!startPos.current || triggered.current) {
      setState({ isDragging: false, offsetX: 0, offsetY: 0, direction: null });
      startPos.current = null;
      return;
    }

    const { offsetX, offsetY, direction } = state;

    if (direction === 'right' && offsetX > threshold && onSwipeRight) {
      onSwipeRight();
      triggered.current = true;
    } else if (direction === 'left' && offsetX < -threshold && onSwipeLeft) {
      onSwipeLeft();
      triggered.current = true;
    } else if (direction === 'up' && offsetY < -threshold && onSwipeUp) {
      onSwipeUp();
      triggered.current = true;
    }

    setState({ isDragging: false, offsetX: 0, offsetY: 0, direction: null });
    startPos.current = null;
  }, [state, threshold, onSwipeLeft, onSwipeRight, onSwipeUp]);

  return {
    ...state,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}
