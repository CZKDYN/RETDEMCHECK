import { procedures } from './data';

export const STORAGE_KEY = 'retdemquest.progress.v1';
export interface Session {
  answers: number[];
  completedAt?: string;
}
export interface PracticeRun {
  id: string;
  answers: number[];
  completedAt: string;
}
export interface Progress {
  version: 1;
  name: string;
  sessions: Record<string, Session>;
  bestRuns: Record<string, number>;
  history: PracticeRun[];
  practiceDays: string[];
  notificationsSeen: number;
}
export const freshProgress = (): Progress => ({
  version: 1,
  name: 'Franchezka',
  sessions: {},
  bestRuns: {},
  history: [],
  practiceDays: [],
  notificationsSeen: 0,
});

function validAnswers(id: string, answers: unknown): answers is number[] {
  const procedure = procedures.find((item) => item.id === id);
  return (
    !!procedure &&
    Array.isArray(answers) &&
    answers.length <= procedure.questions.length &&
    answers.every(
      (answer, i) =>
        Number.isInteger(answer) &&
        answer >= 0 &&
        answer < procedure.questions[i].choices.length,
    )
  );
}
function validDate(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}
export function loadProgress(): { progress: Progress; warning: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { progress: freshProgress(), warning: '' };
    const data = JSON.parse(raw);
    if (
      !data ||
      data.version !== 1 ||
      typeof data.name !== 'string' ||
      !data.sessions ||
      typeof data.sessions !== 'object' ||
      !Array.isArray(data.history)
    )
      throw new Error('Invalid progress');
    const progress = freshProgress();
    progress.name = data.name.trim().slice(0, 30) || progress.name;
    for (const procedure of procedures) {
      const session = data.sessions[procedure.id];
      if (session && validAnswers(procedure.id, session.answers)) {
        progress.sessions[procedure.id] = { answers: session.answers };
        if (
          session.answers.length === procedure.questions.length &&
          validDate(session.completedAt)
        )
          progress.sessions[procedure.id].completedAt = session.completedAt;
      }
    }
    progress.history = data.history
      .filter(
        (run: PracticeRun) =>
          run &&
          validAnswers(run.id, run.answers) &&
          run.answers.length ===
            procedures.find((p) => p.id === run.id)!.questions.length &&
          validDate(run.completedAt),
      )
      .slice(-100);
    for (const procedure of procedures) {
      const saved = data.bestRuns?.[procedure.id];
      const completed = progress.history.filter(
        (run) => run.id === procedure.id,
      );
      if (
        (Number.isInteger(saved) &&
          saved >= 0 &&
          saved <= procedure.questions.length) ||
        completed.length
      ) {
        progress.bestRuns[procedure.id] = Math.max(
          Number.isInteger(saved) &&
            saved >= 0 &&
            saved <= procedure.questions.length
            ? saved
            : 0,
          ...completed.map((run) => correctCount(run.id, run.answers)),
        );
      }
    }
    progress.practiceDays = Array.isArray(data.practiceDays)
      ? data.practiceDays
          .filter(
            (day: unknown) =>
              typeof day === 'string' &&
              /^\d{4}-\d{2}-\d{2}$/.test(day) &&
              validDate(day),
          )
          .slice(-365)
      : [];
    progress.notificationsSeen =
      Number.isInteger(data.notificationsSeen) && data.notificationsSeen >= 0
        ? data.notificationsSeen
        : 0;
    return { progress, warning: '' };
  } catch {
    return {
      progress: freshProgress(),
      warning:
        'Saved progress could not be loaded. You can still practice; a new progress record will be saved if browser storage is available.',
    };
  }
}
export const correctCount = (id: string, answers: number[]) =>
  answers.filter(
    (answer, i) =>
      answer === procedures.find((p) => p.id === id)!.questions[i].correct,
  ).length;
export function bestCorrect(progress: Progress, id: string): number {
  return Math.max(
    0,
    progress.bestRuns[id] || 0,
    correctCount(id, progress.sessions[id]?.answers || []),
    ...progress.history
      .filter((run) => run.id === id)
      .map((run) => correctCount(id, run.answers)),
  );
}
export function localDay(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function streakCount(days: string[]): number {
  const day = new Date();
  day.setHours(12, 0, 0, 0);
  if (!days.includes(localDay(day))) day.setDate(day.getDate() - 1);
  let count = 0;
  while (days.includes(localDay(day))) {
    count++;
    day.setDate(day.getDate() - 1);
  }
  return count;
}
