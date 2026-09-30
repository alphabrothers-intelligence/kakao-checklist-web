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

## 2. 만들 리포트

전체 목록과 설정값은 `docs/kakao-logging-plan.xlsx` 의 `리포트 목록` 시트에 있습니다.
Free 플랜은 좌석당 5개까지 저장됩니다.

2026년 9월 29일에 보드 `[실운영] 카카오 광고 자가진단 체크 리스트 대시보드 / 메인 대시보드`
에 아래 4개를 만들었습니다. 한 칸은 비워 뒀습니다.

| # | 이름 | 종류 | Event / 단계 | Breakdown |
|---|---|---|---|---|
| 01 | 결과별 선택지 선택 수 집계 | Insights · Table | `pageview@result` | `result_type` → 그 아래 `industry` |
| 03 | 버튼별 클릭 수 집계 | Insights · Table | `click@button` + `click@link` + `close@dialog` | `object_id` → 그 아래 `step` |
| 04 | 유형별 가이드 확인률 | Funnels | `pageview@result` → `click@button`(open_guide) → `click@link`(custom_guide) | `result_type` |
| 05 | 진단 완주율(최종 결과 확인률) | Funnels | `pageview@intro` → `pageview@diagnosis_question` → `pageview@result` | 없음 |

- 전부 `is_internal` = **False** 필터를 겁니다. True 로 저장하면 내부 테스트만 보입니다
- 퍼널의 Window 는 **1 day**. 한 세션에 끝나는 흐름이라 기본값 7일은 길기만 합니다
- 04번의 단계 조건(`object_id`)은 **단계 안쪽**에 겁니다. 바깥 Filter 에 걸면 앞 단계에도 적용돼 전환율이 0이 됩니다

### 03번을 이 형태로 만든 이유

- 클릭 가능한 요소가 `click@button` · `click@link` · `close@dialog` 셋으로 나뉘어 있어 Metric 을 3개 겁니다. 집계는 셋 다 **Total Events**
- `step` 을 2단에 두면 `next` 가 질문 1·2·3 으로 갈립니다. 4번째 질문의 버튼은 문구가 달라 `view_result` 로 따로 찍히고 `step` 은 항상 4입니다
- `step` 이 없는 버튼은 `(non-numeric values)` 로 묶입니다. 질문 화면 밖이라 값이 없다는 뜻이고 오류가 아닙니다
- `page_name` 은 넣지 않았습니다. 지금은 `object_id` 가 정해지면 화면도 정해져서 열 하나가 같은 값만 반복합니다.
  여러 화면에 같은 `object_id` 가 생기면(예: 오류 화면의 `reload`) 그때 3단으로 추가합니다
- 행 제한은 **50**. 기본값 12로 두면 버튼이 늘었을 때 아래가 잘립니다

### 현재 문제(situation)를 보는 법

01번을 연 뒤 두 번째 Breakdown 만 `industry` → `situation` 으로 바꿉니다.
**저장하지 않으면 리포트 개수에 들어가지 않습니다.** 보고 나면 되돌리거나 새로고침합니다.

### 02번(선택지별 선택 수)은 보류

`selected_options` 를 Breakdown 하면 배열이 통째로 한 줄로 잡힙니다.
믹스패널이 이 속성을 **List 타입으로 인식해야** 항목별로 쪼개집니다.

- Lexicon(Data Management → Event Properties) 에 속성이 올라오기까지 최대 하루 걸립니다
- 올라온 뒤 타입이 List 면 자동으로 쪼개지고, 아니면 그 화면에서 List 로 바꿉니다
- 쪼개지면 01번의 두 번째 Breakdown 을 `industry` → `selected_options` 로 교체합니다.
  그러면 업종 6행과 현재 문제 5행이 **한 표에 각각** 서고, 각 그룹의 합이 부모와 같아집니다
- 정렬을 횟수순에서 이름순으로 바꾸면 `업종 ·` / `현재 문제 ·` 끼리 묶여 보입니다

### 01번이 이 형태인 이유

20가지 결과를 부모 행으로, 그 결과를 받은 업종을 자식 행으로 둡니다.

| 결과 / 업종 | 횟수 |
|---|---:|
| **오프라인 방문형 × 신규 고객 확보** | **85** |
| ㄴ 식품 | 22 |
| ㄴ 패션/뷰티 | 18 |
| ㄴ … 6개 업종 합계 85 | |

고객 행동과 목표는 결과 이름에 이미 들어 있어 **항상 부모와 같은 수**라 뺐습니다.
같은 결과를 받아도 사람마다 다른 것은 **업종과 현재 문제** 둘뿐입니다.

Breakdown 을 `result_type` → `industry` → `situation` 3단으로 걸면 **조합 표**가 됩니다.
행 하나가 "결과 + 업종 + 현재 문제" 한 조합이라 최대 600행으로 쪼개지고,
업종별 합계는 손으로 더해야 나옵니다. 이건 07번(`result_combo`)과 같은 성격이라 만들지 않았습니다.

업종 합계와 현재 문제 합계를 **한 표에 나란히** 두려면 `selected_options` 가 List 로 잡혀야 합니다.
그전까지는 Breakdown 을 바꿔 가며 두 번 봅니다.

### 용어

| 이름 | 속성 | 뜻 |
|---|---|---|
| 추천 유형 | `result_type` | 고객 행동 × 목표 = 20종. 추천 광고가 갈리는 기준 |
| 선택 조합 | `result_combo` | 4개 선택을 모두 합친 것 = 600종 |
| 선택지 | `selected_options` | 고른 4개를 목록 한 칸에 담은 것. 항목별로 세어 20행 |

"결과"라는 말은 두 가지를 다 가리켜 혼동되므로 쓰지 않습니다.

### Custom Event (믹스패널 화면에서 설정, 코드 무관)

| 이름 | 정의 |
|---|---|
| 진단 시작 | `click@button` + object_id = start_diagnosis |
| 결과 도달 | `pageview@result` |
| 광고 가이드 열기 | `click@button` + object_id = open_guide |
| 가이드 링크 클릭 | `click@link` + object_id in (custom_guide, starter_kit) |
| 결과 저장 | `click@button` + object_id in (download_png, download_pdf) |

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
| 스텝별 다음 버튼 클릭 수 | `click@button`(next) → step | 없음 |

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

### UTM 붙이는 위치

주소 끝에 `?` 로 붙이면 됩니다. `docs/utm-plan.csv` 의 URL이 그 형태입니다.

```
https://kakao-checklist-web.vercel.app/?utm_medium=social&utm_source=instagram
```

2026년 9월 30일에 해시 라우팅(`/#/`)을 없애고 경로 라우팅으로 바꿨습니다.
그전에는 UTM 이 `#` 앞에 와야 했지만 이제 그 제약이 없습니다.
옛 주소(`/#/result`)로 들어와도 `main.tsx` 가 같은 경로로 바꿔 줍니다.

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

## 7. 믹스패널 프로젝트 설정 (한 번 걸린 것들)

같은 함정에 다시 빠지기 쉬워 적어 둡니다.

| 무엇 | 증상 | 처리 |
|---|---|---|
| 프로젝트 시간대 | 기본이 미국 태평양(PDT). 한국 오후 로그가 전날로 잡혀 `Today` 가 빈 화면 | Project Settings → Timezone → `Asia/Seoul`. **변경 이후 수집분에만 적용**되므로 실사용자 유입 전에 바꿔야 함 |
| autocapture | `[Auto] Page View` · `[Auto] Element Click` 등 7종이 설계표 21종과 중복 수집 | `src/lib/track.ts` 의 `autocapture` 옵션 제거(2026-09-29). 이미 쌓인 `[Auto]` 로그는 남으므로 Lexicon → Events → **Hide** 로 목록에서 치움 |
| Lexicon 색인 지연 | 새로 보내기 시작한 속성이 Breakdown 검색 목록에 안 뜸 | 최대 하루. 급하면 검색창에서 따옴표 붙은 이름을 직접 선택. 단 그렇게 고르면 타입 정보가 없어 List 속성이 안 쪼개짐 |
| Events 화면 검색창 | 속성 이름으로 찾으면 항상 0건 | 그 칸은 **이벤트 이름**만 찾음. 속성은 이벤트 한 건을 펼쳐서 확인 |
| 내부 트래픽 | 테스트 로그가 `is_internal: false` 로 실사용자에 섞임 | 테스트에 쓰는 브라우저마다 `?internal=1` 로 한 번 접속 |
