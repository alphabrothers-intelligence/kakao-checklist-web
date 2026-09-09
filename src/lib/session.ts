import { EMPTY_ANSWERS, RULES_VERSION, validAnswers, type Answers } from './diagnosis';
export const SESSION_KEY = 'kakao-ad-check:session';
export function readAnswers(storage?: Pick<Storage, 'getItem'>): Answers {
  try {
    const value = (storage ?? window.sessionStorage).getItem(SESSION_KEY);
    if (!value) return EMPTY_ANSWERS();
    const data: unknown = JSON.parse(value);
    if (typeof data === 'object' && data !== null && 'version' in data && data.version === RULES_VERSION && 'answers' in data && validAnswers(data.answers)) return data.answers;
  } catch { /* Session storage is optional, including in private browsers. */ }
  return EMPTY_ANSWERS();
}
export function writeAnswers(answers: Answers) {
  try { window.sessionStorage.setItem(SESSION_KEY, JSON.stringify({ version: RULES_VERSION, answers })); } catch { /* The current session remains usable in memory. */ }
}
