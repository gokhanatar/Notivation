import { useState, useEffect, useCallback } from 'react';
import {
  getScenariosForNote,
  createScenario,
  addOutcome,
  updateOutcome,
  deleteOutcome,
  resolveScenario,
  deleteScenario,
} from '@/lib/futureCast/futureCastEngine';
import type { Scenario, ScenarioOutcome } from '@/lib/db';

export function useScenarios(noteId: string) {
  const [scenarios, setScenarios] = useState<(Scenario & { outcomes: ScenarioOutcome[] })[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    getScenariosForNote(noteId).then(data => {
      setScenarios(data);
      setLoading(false);
    });
  }, [noteId]);

  useEffect(() => { refresh(); }, [refresh]);

  const addScenario = useCallback(async (condition: string) => {
    await createScenario(noteId, condition);
    refresh();
  }, [noteId, refresh]);

  const addNewOutcome = useCallback(async (scenarioId: string, description: string, probability: number, order: number) => {
    await addOutcome(scenarioId, description, probability, order);
    refresh();
  }, [refresh]);

  const editOutcome = useCallback(async (id: string, updates: Partial<ScenarioOutcome>) => {
    await updateOutcome(id, updates);
    refresh();
  }, [refresh]);

  const removeOutcome = useCallback(async (id: string) => {
    await deleteOutcome(id);
    refresh();
  }, [refresh]);

  const resolve = useCallback(async (scenarioId: string, outcomeId: string, reflection?: string) => {
    await resolveScenario(scenarioId, outcomeId, reflection);
    refresh();
  }, [refresh]);

  const remove = useCallback(async (scenarioId: string) => {
    await deleteScenario(scenarioId);
    refresh();
  }, [refresh]);

  return { scenarios, loading, refresh, addScenario, addNewOutcome, editOutcome, removeOutcome, resolve, remove };
}
