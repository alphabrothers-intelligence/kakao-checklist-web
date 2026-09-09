import source from '../data/source.json';

export type Answers = [number | null, number | null, number | null, number | null];
export type CompleteAnswers = [number, number, number, number];
export type Route = { screen: 'intro' } | { screen: 'question'; step: number } | { screen: 'result' };
export const RULES_VERSION = '2026-09-09.1';
export const EMPTY_ANSWERS = (): Answers => [null, null, null, null];
export const OPTION_COUNTS = [7, 5, 5, 4] as const;
export const STEP_LABELS = ['우리 사업 이해하기', '전환 경로', '문제 상황 선택', '목표 선택'];
export const STEPS = source.STEPS;
export const OPTION_ICONS = source.OPTION_ICONS;
export const EMOJI = source.TOSS_EMOJI as Record<string, string>;
export const INDUSTRIES = Object.keys(source.TOP);
export const PATH_LABELS = ['오프라인 방문형', '온라인 구매형', '예약 방문형', '상담 전환형', '플랫폼 이동형'];
export const TOP = source.TOP as Record<string, string[][]>;
export const ADVICE = source.ADVICE as Record<string, string[]>;
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
  const base = ['noVisit', 'noReaction', 'noConvert', 'noReturn', 'noMeasure'][situation];
  const split = base === 'noVisit' || base === 'noMeasure';
  // Keep approved prototype behavior for unspecified mappings; do not invent advice.
  const keys = !split ? [base] : pathIndex === 0 ? [`${base}_offline`] : pathIndex === 1 ? [`${base}_online`] : [`${base}_online`, `${base}_offline`];
  return {
    industry,
    path: PATH_LABELS[pathIndex],
    situation: STEPS[2].options[situation],
    goal: STEPS[3].options[goalIndex],
    top: TOP[industry],
    advice: keys.map(key => ({ key, content: ADVICE[key], context: key.endsWith('_online') ? '온라인 사이트' : key.endsWith('_offline') ? '오프라인 매장' : null })),
    provisionalBranch: keys.length === 2,
    products: PAIRS[pathIndex][goalIndex],
  };
}
export type Diagnosis = ReturnType<typeof getDiagnosis>;
