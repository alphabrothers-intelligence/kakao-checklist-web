# 로그 수집 · 분석 계획

- 로그 설계표 + PA툴 로그: `docs/logging-spec.csv` (설계표 21행 + PA툴 로그 21행)
- 선택지 ID 매핑: `docs/logging-spec-options.csv` (20행)
- UTM 관리: `docs/utm-plan.csv` (실사용자 8건 + 관리자 4건)
- 통합 엑셀(시트 6개): `docs/kakao-logging-plan.xlsx`
- 결과-가이드 URL 매핑: 노션 표를 단일 원본으로 사용
- 기준 스키마: `data/Copy of 동작 6기 IT 서비스기획자(2 주차)` 워크북의 `로깅 시나리오 예시` 시트

---

## 1. 수집하는 로그 전체 (21종)

| 화면 | action | 무엇 | 개수 |
|---|---|---|---:|
| intro | pageview, click | 화면 진입, 진단 시작 버튼 | 2 |
| diagnosis_question | pageview, select, click | 화면 진입, 선택지 선택, 이전/다음/결과 보기 | 5 |
| result | pageview | 결과 도달 + 최종 선택 4개 + 추천 결과 | 1 |
| result | scroll | 섹션별 스크롤 도달 (선택) | 1 |
| result | click | 다시 테스트 / 다운로드 열기 / 가이드 열기 | 3 |
| result | click, error, close | 다운로드 모달: 저장 2종, 실패, 닫기 | 4 |
| result | click, close | 가이드 모달: 링크 2종, 닫기 | 3 |
| 전역 | error, click | 화면 오류 노출, 새로고침 | 2 |

### user_properties / event_properties 구분

| | 무엇이 들어가나 | 왜 |
|---|---|---|
| user_properties | utm_medium, utm_source, utm_campaign, utm_contents, is_internal | 사람에게 붙는 값. 세션 내내 안 바뀜 |
| event_properties | page_name, object_section, object_id, object_name, object_position + 그 로그의 고유값 | 행동마다 달라지는 값 |

진단 선택 4개(industry / path / situation / goal)는 **result 화면의 모든 로그**에
event_properties로 붙입니다. 참고 워크북의 `product → shop_name, category, price` 처럼
**화면별 필수 event_properties**로 정의한 것입니다.

세션 도중에 바뀌는 값이라 user_properties에는 넣지 않습니다.

### PA툴 로그 (event_type)

`docs/logging-spec.csv` 아래쪽 블록에 시나리오별로 정리돼 있습니다.

| action | event_type 규칙 | 예 |
|---|---|---|
| pageview | `pageview@{page_name}` | `pageview@result` |
| 나머지 | `{action}@{object_type}` | `click@button`, `select@option`, `click@link` |

## 2. 믹스패널에서 볼 수 있는 리포트 (13종)

### 요청하신 3가지

| # | 보고 싶은 것 | 리포트 | 설정 |
|---|---|---|---|
| 1 | 버튼별 클릭수 | Insights · Bar | `click` → Breakdown `object_id` |
| 2 | 유형별 가이드 확인률 | Funnels | `pageview`(result) → `click`(open_guide) → `click`(custom_guide/starter_kit), Breakdown `path` |
| 3 | 결과별 횟수 + 선택지 | Insights · Table | `pageview`(result) → Breakdown `result_combo`(600종) 또는 `result_type`(20종) |

### 추가로 나오는 것

| # | 보고 싶은 것 | 리포트 | 설정 |
|---|---|---|---|
| 4 | 전체 완주율 | Funnels | `pageview`(intro) → STEP1~4 → `pageview`(result) |
| 5 | 어느 질문에서 이탈하나 | Funnels | 위 퍼널의 단계별 전환율 |
| 6 | 어느 질문에서 망설이나 | Insights | `select` → Filter `is_change=true` → Breakdown `step` |
| 7 | 선택지별 인기도 | Insights · Bar | `pageview`(result) → Breakdown `industry` / `path` / `situation` / `goal` |
| 8 | 결과 저장률 | Funnels | `pageview`(result) → `click`(open_download) → `click`(download_png/pdf) |
| 9 | PNG vs PDF 선호 | Insights · Pie | `click` → Filter `object_id in (download_png, download_pdf)` → Breakdown `object_id` |
| 10 | 맞춤 가이드 vs 스타터 키트 | Insights · Bar | `click` → Filter `object_id in (custom_guide, starter_kit)` → Breakdown `object_id` |
| 11 | 유입 채널별 성과 | Funnels | 완주 퍼널 → Breakdown `utm_source` |
| 12 | 결과를 끝까지 읽었나 | Insights | `scroll` → Breakdown `object_id` (section_01~04) |
| 13 | 저장 실패율 / 장애 | Insights | `error` → Breakdown `object_id`, `error_message` |

### Custom Event (믹스패널 화면에서 설정, 코드 무관)

`click`으로 뭉친 이벤트에 읽기 쉬운 이름을 붙입니다.

| 이름 | 정의 |
|---|---|
| 진단 시작 | `click` + object_id = start_diagnosis |
| 결과 도달 | `pageview` + page_name = result |
| 광고 가이드 열기 | `click` + object_id = open_guide |
| 가이드 링크 클릭 | `click` + object_id in (custom_guide, starter_kit) |
| 결과 저장 | `click` + object_id in (download_png, download_pdf) |
| 다시 테스트 | `click` + object_id = restart |

## 3. 요청하신 로그 vs 볼 수 없는 로그

### 요청하신 것 — 전부 봅니다 (CTR 문제와 무관)

| 요청 | 어떤 로그로 | 영향 있나 |
|---|---|---|
| 각 버튼의 클릭수 | `click@button` 전체 | 없음 |
| 유형별 광고 가이드 확인률 | `click@link` (custom_guide) | 없음 |
| 유형별 스타터 키트 확인률 | `click@link` (starter_kit) | 없음 |
| 20가지 결과별 발생 횟수 | `pageview@result` → result_type | 없음 |
| 600가지 조합별 발생 횟수 | `pageview@result` → result_combo | 없음 |
| 4스텝 선택지별 선택 횟수 | `pageview@result` → industry/path/situation/goal | 없음 |
| 선택지를 바꿔 고른 횟수 | `select@option` → is_change | 없음 |

**CTR을 못 보는 것은 요청하신 데이터에 아무 영향이 없습니다.**
요청하신 7가지는 전부 버튼·링크 클릭과 결과 도달이고, 그건 다 클릭 가능한 요소입니다.

### 못 보는 것

| 못 보는 것 | 이유 | 열려면 |
|---|---|---|
| TOP3 광고 CTR | 클릭할 수 없는 읽기 전용 텍스트. 클릭이 0이라 클릭률이 성립 안 함 | 링크로 바꾸고 `impression@ad` + `click@ad` 추가 |
| 추천 광고 CTR | 위와 같음 | 위와 같음 |
| 어떤 광고 설명을 오래 읽었나 | 텍스트 체류시간은 측정 안 함 | scroll 로그로 근사치만 |
| 재방문 사용자 구분 | 비로그인이라 device_id 기준. 기기 바꾸면 다른 사람 | 로그인 도입 시 |
| 다운로드한 결과를 어디에 썼나 | 파일 저장 이후는 추적 불가 | 불가 |
| 노션·우피 페이지 안에서의 행동 | 외부 서비스라 우리 스크립트가 닿지 않음 | 우피 자체 통계 또는 GA 연동 |

TOP3와 추천 광고의 **노출 횟수는 셉니다.** `pageview@result`의 `top3_ads` / `recommended_ads`로 Breakdown 하면 "카카오톡 채널 메시지가 몇 번 추천됐나"가 나옵니다. 클릭이 없으니 비율만 못 낼 뿐입니다.

## 4. 개별 로그 확인 방법 (link_url 등 전체 속성 보기)

`guide_name`은 대시보드에서 바로 보이지만, `link_url` 같은 참고용 값은
개별 로그를 열어야 보입니다. 확인 경로는 세 가지입니다.

| 방법 | 경로 | 언제 쓰나 |
|---|---|---|
| Events | 좌측 메뉴 **Events** → 실시간 로그 스트림 → 이벤트 한 건 클릭 | 그 로그의 모든 property가 펼쳐짐. `link_url` 포함 |
| Insights 드릴다운 | 차트의 막대·행 클릭 → View Users / 이벤트 목록 → 한 건 클릭 | 특정 `guide_name`의 실제 URL 확인 |
| 사용자 활동 | **Users** → 사용자 선택 → Activity Feed | 한 사장님의 진단 시작부터 가이드 클릭까지 전체 흐름 |

가이드 클릭 로그만 모아 보려면 Events에서 `object_id = custom_guide` 필터를 겁니다.

**`link_url`도 Breakdown 가능합니다.** 집계가 안 되는 게 아니라,
URL이 해시라 읽기 어렵고 우피 전환 시 값이 바뀌어 두 줄로 갈리기 때문에
**대시보드에서는 `guide_name`을 쓰는 것을 권장**하는 것입니다.

## 5. 내부 트래픽 분리

개발·배포 확인으로 들락거린 기록이 실제 사용자 데이터에 섞이지 않게 **2단**으로 막습니다.

### 1단: 토큰을 Production 에만 넣기 (기본 방어)

| Key | Value | 적용 환경 |
|---|---|---|
| `VITE_MIXPANEL_TOKEN` | 운영 토큰 | **Production** 만 체크 |

Preview 배포와 로컬 개발은 토큰이 없어서 **로그를 한 건도 보내지 않습니다.**
`src/lib/track.ts` 가 토큰이 없으면 초기화 자체를 건너뜁니다.

믹스패널 프로젝트는 **하나면 충분합니다.**
미리보기 배포에서 로그가 나가는지 확인해야 할 일이 생기면, 그때 개발용 프로젝트를
하나 더 만들고 Preview 환경에 개발 토큰을 넣으면 됩니다.

### 2단: 운영 URL에 내부자가 들어올 때

`https://kakao-checklist-web.vercel.app/?internal=1` 로 **한 번만** 접속하면
그 브라우저는 이후 계속 `is_internal: true`가 붙습니다.
리포트에서 `is_internal ≠ true` 필터를 기본으로 걸어 두면 제외됩니다.

### UTM은 내부 구분 수단이 아닙니다

UTM이 하는 일은 **어디서 들어왔는지** 기록하는 것 하나뿐입니다.
UTM이 없어도 21종 로그는 전부 정상 수집되고, `utm_source` 칸만 빕니다.

관리자용 UTM(`utm_medium=internal`)을 `docs/utm-plan.csv` 에 넣어 뒀지만,
내부 구분은 `?internal=1` 로 하는 것이 확실합니다.
UTM 없이 주소만 쳐서 들어오면 UTM 방식은 못 잡기 때문입니다.

### UTM 붙이는 위치 주의

해시 라우팅이라 UTM은 `#` **앞**에 와야 합니다.

| | |
|---|---|
| 맞음 | `https://kakao-checklist-web.vercel.app/?utm_source=instagram#/` |
| 틀림 | `https://kakao-checklist-web.vercel.app/#/?utm_source=instagram` |

`#` 뒤에 붙이면 주소의 질의문자열이 아니라 해시 안쪽이 되어 믹스패널이 읽지 못합니다.
`docs/utm-plan.csv` 의 URL은 전부 올바른 형태입니다.

## 6. 구현 위치

| 파일 | 내용 |
|---|---|
| `src/lib/track.ts` | 설계표 21행을 옮긴 로그 함수, 선택지 object_id, 내부 트래픽 판별 |
| `src/App.tsx` | 화면 진입 3종, 버튼 클릭 6종 |
| `src/hooks/useDiagnosisFlow.ts` | 선택지 선택 + is_change 판정 |
| `src/components/Dialogs.tsx` | 저장, 가이드 링크, 모달 닫기(방법 구분), 저장 실패 |
| `src/main.tsx` | 화면 오류, 새로고침 |

`tests/diagnosis.test.ts` 가 `logging-spec-options.csv` 와 코드의 `OPTION_IDS` 가
어긋나면 빌드를 실패시킵니다. 시트를 고치면 코드도 함께 고쳐야 합니다.

**미구현**: `scroll@section` (설계표에 '선택'으로 표시). 결과 페이지를 끝까지
내려보는지 확인이 필요해지면 추가합니다.
