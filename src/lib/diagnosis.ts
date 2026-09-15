import source from '../data/source.json';

export type Answers = [number | null, number | null, number | null, number | null];
export type CompleteAnswers = [number, number, number, number];
export type Route = { screen: 'intro' } | { screen: 'question'; step: number } | { screen: 'result' };
export const RULES_VERSION = '2026-09-15.1';
export const EMPTY_ANSWERS = (): Answers => [null, null, null, null];
export const OPTION_COUNTS = [6, 5, 5, 4] as const;
export const STEP_LABELS = source.STEPS.map(step => step.label);
export const STEPS = source.STEPS;
export const OPTION_ICONS = source.OPTION_ICONS;
export const EMOJI = source.TOSS_EMOJI as Record<string, string>;
export const INDUSTRIES = Object.keys(source.TOP);
export const PATH_LABELS = source.STEPS[1].options;
export const TOP = source.TOP as Record<string, string[][]>;
export const ADVICE = source.ADVICE;
export const PAIRS = source.PAIRS;

export function validAnswers(input: unknown): input is Answers {
  return Array.isArray(input) && input.length === 4 && input.every((v, i) => v === null || (Number.isInteger(v) && v >= 0 && v < OPTION_COUNTS[i]));
}
export function isComplete(answers: Answers): answers is CompleteAnswers {
  return validAnswers(answers) && answers.every(v => v !== null);
}
export function normalizeRoute(route: Route, answers: Answers): Route {
  const first = answers.findIndex(v => v === null);
  if (route.screen === 'result' && first !== -1) return { screen: 'question', step: first };
  if (route.screen === 'question') {
    const requested = Math.min(3, Math.max(0, Math.trunc(route.step) || 0));
    return { screen: 'question', step: first === -1 ? requested : Math.min(requested, first) };
  }
  return route;
}
export function parseRoute(hash: string): Route {
  if (hash === '#/result') return { screen: 'result' };
  const match = /^#\/question\/([1-4])$/.exec(hash);
  return match ? { screen: 'question', step: Number(match[1]) - 1 } : { screen: 'intro' };
}
export function routeHash(route: Route) {
  return route.screen === 'intro' ? '#/' : route.screen === 'result' ? '#/result' : `#/question/${route.step + 1}`;
}
export function getDiagnosis(answers: CompleteAnswers) {
  if (!isComplete(answers)) throw new Error('모든 질문에 답해주세요.');
  const [industryIndex, pathIndex, situation, goalIndex] = answers;
  const industry = INDUSTRIES[industryIndex];
  return {
    industry,
    path: PATH_LABELS[pathIndex],
    situation: STEPS[2].options[situation],
    goal: STEPS[3].options[goalIndex],
    top: TOP[industry],
    advice: [{ key: `${pathIndex}_${situation}`, content: ADVICE[pathIndex][situation] }],
    products: PAIRS[pathIndex][goalIndex],
  };
}
export type Diagnosis = ReturnType<typeof getDiagnosis>;
