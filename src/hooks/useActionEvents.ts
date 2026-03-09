import { useState, useEffect } from 'react';
import { 
  ActionEvent, 
  getActionEvents, 
  subscribeToActionEvents, 
  getActionEventsSnapshot,
  loadActionEvents 
} from '@/lib/actions/actionEvents';

// Hook to use action events
export function useActionEvents() {
  const [events, setEvents] = useState<ActionEvent[]>(getActionEventsSnapshot());
  
  useEffect(() => {
    // Load events on mount
    loadActionEvents();
    
    // Set initial state
    setEvents(getActionEventsSnapshot());
    
    // Subscribe to updates
    const unsubscribe = subscribeToActionEvents(() => {
      setEvents([...getActionEventsSnapshot()]);
    });
    
    return unsubscribe;
  }, []);
  
  return events;
}
