import mixpanel from 'mixpanel-browser';
import { getDiagnosis, STEPS, STEP_LABELS, type CompleteAnswers } from './diagnosis';

// docs/logging-spec.csv 의 설계표 21행을 그대로 옮긴 것입니다. 시트를 고치면 여기도 고쳐 주세요.
// event_type 규칙: pageview 는 pageview@{page_name}, 나머지는 {action}@{object_type}.

const token = import.meta.env.VITE_MIXPANEL_TOKEN;
const INTERNAL_KEY = 'kakao-ad-check:internal';

if (token) {
  // autocapture 는 끕니다. 설계표 21종만 보내고, SDK 가 만드는 [Auto] 이벤트는 중복입니다.
  mixpanel.init(token, { persistence: 'localStorage' });
  // ?internal=1 로 한 번 들어오면 그 브라우저는 계속 내부 트래픽으로 표시합니다.
  if (new URLSearchParams(location.search).has('internal')) localStorage.setItem(INTERNAL_KEY, '1');
  mixpanel.register({ is_internal: localStorage.getItem(INTERNAL_KEY) === '1' });
}

/** 선택지 object_id — docs/logging-spec-options.csv 와 1:1로 일치해야 합니다. */
const OPTION_IDS = [
  ['industry_food', 'industry_fashion_beauty', 'industry_medical_health', 'industry_education_service', 'industry_life_leisure', 'industry_it_platform'],
  ['path_offline_visit', 'path_reservation', 'path_online_convert', 'path_platform', 'path_consult'],
  ['situation_low_traffic', 'situation_low_interest', 'situation_low_conversion', 'situation_low_repurchase', 'situation_no_measurement'],
  ['goal_acquisition', 'goal_awareness', 'goal_conversion', 'goal_retention'],
] as const;

type Props = Record<string, unknown>;
export type CloseMethod = 'button' | 'backdrop' | 'esc';

function send(eventType: string, props: Props) {
  if (token) mixpanel.track(eventType, props);
}
function pageview(page_name: string, props: Props = {}) {
  send(`pageview@${page_name}`, { page_name, ...props });
}
function click(object_type: string, props: Props) {
  send(`click@${object_type}`, props);
}
function step(index: number) {
  return { step: index + 1, step_name: STEP_LABELS[index] };
}
/** 결과 화면의 모든 로그에 붙는 필수 event_properties. */
function resultProps(answers: CompleteAnswers) {
  const { industry, path, situation, goal } = getDiagnosis(answers);
  return { page_name: 'result', result_type: `${path} × ${goal}`, industry, path, situation, goal };
}

export const logIntroView = () => pageview('intro');
export const logStartClick = () => click('button', { page_name: 'intro', object_section: 'cta', object_id: 'start_diagnosis', object_name: '광고 자가 진단 시작하기' });
export const logQuestionView = (index: number) => pageview('diagnosis_question', step(index));
export const logOptionSelect = (index: number, option: number, is_change: boolean) =>
  send('select@option', { page_name: 'diagnosis_question', object_section: 'option_list', object_type: 'option', object_id: OPTION_IDS[index][option], object_name: STEPS[index].options[option], object_position: option, ...step(index), is_change });
export const logBackClick = (index: number) => click('button', { page_name: 'diagnosis_question', object_section: 'topnav', object_id: 'back', object_name: '이전', ...step(index) });
export const logNextClick = (index: number) => click('button', { page_name: 'diagnosis_question', object_section: 'dock', object_id: index === 3 ? 'view_result' : 'next', object_name: index === 3 ? '결과 보기' : '다음', ...step(index) });

export function logResultView(answers: CompleteAnswers) {
  const { industry, path, situation, goal, products, top } = getDiagnosis(answers);
  pageview('result', {
    ...resultProps(answers),
    result_combo: `${industry} ${path} ${situation} ${goal}`,
    // 20개 선택지를 한 표에서 보려고 목록 한 칸에 담습니다. 진단 완료 1건당 4개가 각각 1씩 올라갑니다.
    selected_options: [`업종 · ${industry}`, `고객 행동 · ${path}`, `현재 문제 · ${situation}`, `목표 · ${goal}`],
    recommended_ads: products.map(([name]) => name),
    top3_ads: top.map(([name]) => name),
  });
}
export const logRestartClick = (answers: CompleteAnswers) => click('button', { ...resultProps(answers), object_section: 'actions', object_id: 'restart', object_name: '다시 테스트하기' });
export const logOpenDownloadClick = (answers: CompleteAnswers) => click('button', { ...resultProps(answers), object_section: 'actions', object_id: 'open_download', object_name: '결과 다운로드하기' });
export const logOpenGuideClick = (answers: CompleteAnswers) => click('button', { ...resultProps(answers), object_section: 'actions', object_id: 'open_guide', object_name: '광고 가이드 확인하기' });

const DOWNLOAD = { png: { object_id: 'download_png', object_name: '이미지로 저장' }, pdf: { object_id: 'download_pdf', object_name: 'PDF로 저장' } } as const;
export const logDownload = (answers: CompleteAnswers, format: 'png' | 'pdf', object_position: number) =>
  click('button', { ...resultProps(answers), object_section: 'download_dialog', ...DOWNLOAD[format], object_position, format });
export const logDownloadError = (answers: CompleteAnswers, format: 'png' | 'pdf', error_message: string) =>
  send('error@button', { ...resultProps(answers), object_section: 'download_dialog', ...DOWNLOAD[format], format, error_message });

const DIALOG = { download: { object_section: 'download_dialog', object_id: 'close_download_dialog' }, guide: { object_section: 'guide_dialog', object_id: 'close_guide_dialog' } } as const;
export const logDialogClose = (answers: CompleteAnswers, dialog: 'download' | 'guide', method: CloseMethod) =>
  send('close@dialog', { ...resultProps(answers), ...DIALOG[dialog], object_name: '닫기', method });

const GUIDE_LINK = {
  custom: { object_id: 'custom_guide', object_name: '나에게 딱 맞는 광고 가이드 확인하기', object_position: 0 },
  starter: { object_id: 'starter_kit', object_name: '스타터 키트 전체 보러가기', object_position: 1 },
} as const;
export function logGuideLinkClick(answers: CompleteAnswers, kind: 'custom' | 'starter', link_url: string) {
  const base = resultProps(answers);
  send('click@link', { ...base, object_section: 'guide_dialog', ...GUIDE_LINK[kind], guide_name: kind === 'custom' ? base.result_type : '스타터 키트 전체', link_url });
}

export const logRenderError = (page_name: string, error_message: string) =>
  send('error@screen', { page_name, object_section: 'error_boundary', object_id: 'render_error', object_name: '화면을 불러오지 못했어요', error_message });
export const logReloadClick = (page_name: string) =>
  click('button', { page_name, object_section: 'error_boundary', object_id: 'reload', object_name: '새로고침' });
