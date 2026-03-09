import { useEffect, useCallback, useState } from 'react';
import {
  db,
  createDecisionItem as dbCreateDecisionItem,
  updateDecisionItem as dbUpdateDecisionItem,
  deleteDecisionItem as dbDeleteDecisionItem,
  bulkPutDecisionItems as dbBulkPutDecisionItems,
  type DecisionItem,
} from '@/lib/db';
import { hapticLight } from '@/lib/native/haptics';

// ==========================================
// SIMPLE DATA STORE (same pattern as useNotes)
// ==========================================

let decisionItemsCache: DecisionItem[] = [];
const listeners: Set<() => void> = new Set();

function notifyListeners() {
  listeners.forEach(listener => listener());
}

function subscribeToDecisionData(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function loadDecisionItems() {
  decisionItemsCache = await db.decisionItems.toArray();
  notifyListeners();
}

// ==========================================
// DATA HOOK
// ==========================================

export function useDecisionItems(noteId?: string) {
  const [items, setItems] = useState<DecisionItem[]>(() => {
    if (noteId) {
      return decisionItemsCache
        .filter(i => i.noteId === noteId)
        .sort((a, b) => a.order - b.order);
    }
    return decisionItemsCache;
  });

  useEffect(() => {
    const update = () => {
      if (noteId) {
        setItems(
          decisionItemsCache
            .filter(i => i.noteId === noteId)
            .sort((a, b) => a.order - b.order)
        );
      } else {
        setItems([...decisionItemsCache]);
      }
    };

    update();
    const unsubscribe = subscribeToDecisionData(update);
    return unsubscribe;
  }, [noteId]);

  return items;
}

// ==========================================
// ACTIONS HOOK
// ==========================================

export function useDecisionActions() {
  const addDecisionItem = useCallback(async (
    noteId: string,
    text: string,
    type: 'pro' | 'con',
    weight: number = 3,
  ) => {
    hapticLight();
    const existingItems = decisionItemsCache.filter(i => i.noteId === noteId && i.type === type);
    const item = await dbCreateDecisionItem({
      noteId,
      text,
      type,
      weight: Math.max(1, Math.min(5, weight)),
      order: existingItems.length,
    });

    decisionItemsCache = [...decisionItemsCache, item];
    notifyListeners();
    return item;
  }, []);

  const updateDecisionItem = useCallback(async (id: string, updates: Partial<DecisionItem>) => {
    await dbUpdateDecisionItem(id, updates);
    decisionItemsCache = decisionItemsCache.map(i =>
      i.id === id ? { ...i, ...updates } : i
    );
    notifyListeners();
  }, []);

  const deleteDecisionItem = useCallback(async (id: string) => {
    hapticLight();
    await dbDeleteDecisionItem(id);
    decisionItemsCache = decisionItemsCache.filter(i => i.id !== id);
    notifyListeners();
  }, []);

  const reorderDecisionItems = useCallback(async (items: DecisionItem[]) => {
    const reordered = items.map((item, index) => ({ ...item, order: index }));
    await dbBulkPutDecisionItems(reordered);
    decisionItemsCache = decisionItemsCache.map(cached => {
      const updated = reordered.find(r => r.id === cached.id);
      return updated || cached;
    });
    notifyListeners();
  }, []);

  return {
    addDecisionItem,
    updateDecisionItem,
    deleteDecisionItem,
    reorderDecisionItems,
  };
}
