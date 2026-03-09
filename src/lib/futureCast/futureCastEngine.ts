import { db, type Scenario, type ScenarioOutcome } from '@/lib/db';

export async function createScenario(noteId: string, condition: string): Promise<Scenario> {
  const now = new Date();
  const scenario: Scenario = {
    id: crypto.randomUUID(),
    noteId,
    condition,
    resolved: false,
    createdAt: now,
    updatedAt: now,
  };
  await db.scenarios.add(scenario);
  await db.actionEvents.add({
    id: crypto.randomUUID(),
    type: 'scenario_created',
    noteId,
    timestamp: now,
    metadata: { scenarioId: scenario.id, condition },
  });
  return scenario;
}

export async function addOutcome(scenarioId: string, description: string, probability: number, order: number): Promise<ScenarioOutcome> {
  const outcome: ScenarioOutcome = {
    id: crypto.randomUUID(),
    scenarioId,
    description,
    probability,
    order,
    isActual: false,
  };
  await db.scenarioOutcomes.add(outcome);
  return outcome;
}

export async function updateOutcome(id: string, updates: Partial<ScenarioOutcome>): Promise<void> {
  await db.scenarioOutcomes.update(id, updates);
}

export async function deleteOutcome(id: string): Promise<void> {
  await db.scenarioOutcomes.delete(id);
}

export async function resolveScenario(scenarioId: string, actualOutcomeId: string, reflection?: string): Promise<void> {
  const now = new Date();
  await db.scenarios.update(scenarioId, {
    resolved: true,
    resolvedAt: now,
    resolvedOutcomeId: actualOutcomeId,
    updatedAt: now,
  });
  // Mark the actual outcome
  await db.scenarioOutcomes.where('scenarioId').equals(scenarioId).modify(o => {
    o.isActual = o.id === actualOutcomeId;
  });
  const scenario = await db.scenarios.get(scenarioId);
  if (scenario) {
    await db.actionEvents.add({
      id: crypto.randomUUID(),
      type: 'scenario_resolved',
      noteId: scenario.noteId,
      timestamp: now,
      metadata: { scenarioId, actualOutcomeId, reflection },
    });
  }
}

export async function deleteScenario(scenarioId: string): Promise<void> {
  await db.scenarioOutcomes.where('scenarioId').equals(scenarioId).delete();
  await db.scenarios.delete(scenarioId);
}

export async function getScenariosForNote(noteId: string): Promise<(Scenario & { outcomes: ScenarioOutcome[] })[]> {
  const scenarios = await db.scenarios.where('noteId').equals(noteId).toArray();
  const result = [];
  for (const s of scenarios) {
    const outcomes = await db.scenarioOutcomes.where('scenarioId').equals(s.id).sortBy('order');
    result.push({ ...s, outcomes });
  }
  return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getActiveScenarios(): Promise<(Scenario & { outcomes: ScenarioOutcome[] })[]> {
  const scenarios = await db.scenarios.filter(s => !s.resolved).toArray();
  const result = [];
  for (const s of scenarios) {
    const outcomes = await db.scenarioOutcomes.where('scenarioId').equals(s.id).sortBy('order');
    result.push({ ...s, outcomes });
  }
  return result;
}

export async function calculateAccuracy(): Promise<{ total: number; correct: number; accuracy: number }> {
  const resolved = await db.scenarios.filter(s => s.resolved && !!s.resolvedOutcomeId).toArray();
  let correct = 0;
  for (const s of resolved) {
    const outcomes = await db.scenarioOutcomes.where('scenarioId').equals(s.id).toArray();
    const highestProb = outcomes.reduce((max, o) => o.probability > max.probability ? o : max, outcomes[0]);
    if (highestProb && highestProb.id === s.resolvedOutcomeId) correct++;
  }
  return { total: resolved.length, correct, accuracy: resolved.length > 0 ? correct / resolved.length : 0 };
}
