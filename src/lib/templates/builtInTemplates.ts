import type { NoteType } from '@/lib/db';

export interface BuiltInTemplate {
  id: string;
  nameKey: string;
  descriptionKey: string;
  type: NoteType;
  title: string;
  body: string;
  actionItems: string[];
  icon: string; // emoji
}

export const builtInTemplates: BuiltInTemplate[] = [
  {
    id: 'meeting-note',
    nameKey: 'templates.meetingNote',
    descriptionKey: 'templates.meetingNoteDesc',
    type: 'info',
    title: '',
    body: '## Attendees\n\n\n## Agenda\n\n\n## Discussion\n\n\n## Decisions\n\n\n## Next Steps\n',
    actionItems: [],
    icon: '📋',
  },
  {
    id: 'daily-plan',
    nameKey: 'templates.dailyPlan',
    descriptionKey: 'templates.dailyPlanDesc',
    type: 'action',
    title: '',
    body: '## Today\'s Focus\n\n\n## Notes\n',
    actionItems: ['Morning task', 'Afternoon task', 'End of day review'],
    icon: '📅',
  },
  {
    id: 'idea-evaluation',
    nameKey: 'templates.ideaEvaluation',
    descriptionKey: 'templates.ideaEvaluationDesc',
    type: 'idea',
    title: '',
    body: '## The Idea\n\n\n## Problem it Solves\n\n\n## Pros\n\n\n## Cons\n\n\n## Next Steps\n',
    actionItems: ['Research feasibility', 'Get feedback'],
    icon: '💡',
  },
  {
    id: 'decision-matrix',
    nameKey: 'templates.decisionMatrix',
    descriptionKey: 'templates.decisionMatrixDesc',
    type: 'decision',
    title: '',
    body: '## Decision to Make\n\n\n## Option A\n**Pros:**\n\n**Cons:**\n\n## Option B\n**Pros:**\n\n**Cons:**\n\n## Conclusion\n',
    actionItems: ['List all options', 'Evaluate each option', 'Make final decision'],
    icon: '⚖️',
  },
  {
    id: 'daily-journal',
    nameKey: 'templates.dailyJournal',
    descriptionKey: 'templates.dailyJournalDesc',
    type: 'journal',
    title: '',
    body: '## How am I feeling?\n\n\n## What happened today?\n\n\n## What am I grateful for?\n\n\n## Tomorrow I want to...\n',
    actionItems: [],
    icon: '📔',
  },
  {
    id: 'open-question',
    nameKey: 'templates.openQuestion',
    descriptionKey: 'templates.openQuestionDesc',
    type: 'question',
    title: '',
    body: '## The Question\n\n\n## Context / Why it matters\n\n\n## Possible Answers\n\n\n## Research / Sources\n',
    actionItems: ['Research the question', 'Ask for input'],
    icon: '❓',
  },
];
