# 개발·운영 가이드

[서비스 소개](README.md) · [추천 기준](docs/RESULT_LOGIC.md) · [최신 QA](docs/QA-2026-09-15.md)

이 문서는 2026년 9월 15일 현재 구현과 사용자가 지정한 커밋 규칙을 기준으로 합니다.

## 1. 로컬 실행

프로젝트 의존성이 지원하는 Node.js와 npm을 사용합니다. 재현 가능한 설치에는 잠금 파일을 유지하고 `npm ci`를 사용하세요. 배포 런타임은 Vercel 프로젝트 설정에서 확인합니다.

```sh
npm ci
npm run dev
```

| 명령 | 역할 |
|---|---|
| `npm run dev` | 개발 서버, 기본 주소 `http://127.0.0.1:5173` |
| `npm run test` | Vitest 테스트 |
| `npm run build` | TypeScript 검사 및 Vite 빌드 |
| `npm run check` | 테스트와 빌드 |
| `npm run preview` | 빌드 결과 미리보기, 출력된 실제 주소 사용 |
| `npm run test:browser -- http://127.0.0.1:4173` | 대표 Chrome 브라우저 검증 |

## 2. 변경 대상별 파일

| 변경 대상 | 파일 |
|---|---|
| 질문·선택지·설명·TOP3·운영 안내·추천 광고 쌍 | `src/data/source.json` |
| 답변 검증·추천 매핑·규칙 버전 | `src/lib/diagnosis.ts` |
| 답변 보관·복구 | `src/lib/session.ts` |
| 단계 및 화면 이동 | `src/hooks/useDiagnosisFlow.ts`, `src/App.tsx` |
| 메인·질문·결과 UI | `src/components/Intro.tsx`, `Question.tsx`, `Result.tsx` |
| 가이드·저장 창 | `src/components/Dialogs.tsx` |
| 저장용 레이아웃·PNG·PDF 생성 | `src/lib/exportResult.ts` |
| 측정된 결과를 Canvas에 직접 그리기 | `src/lib/renderResultCanvas.ts` |
| 글꼴·색상·반응형·모션 | `src/styles.css` |
| 이모지 렌더링 | `src/components/Emoji.tsx`, `public/emoji/` |
| 캐릭터·글꼴 | `public/kakao-main-characters.svg`, `public/kakao-characters.svg`, `public/fonts/` |
| 승인 원문·독립 기대 결과 | `tests/fixtures/approved-2026-09-15.md`, `tests/fixtures/approved.mjs` |
| 단위 테스트 | `tests/diagnosis.test.ts`, `tests/approved-content.test.mjs` |
| 브라우저 QA | `scripts/verify-browser.mjs`, `verify-all-combinations.mjs`, `verify-reported-export.mjs` |
| 배포 | `vercel.json`, `.vercelignore` |

## 3. 콘텐츠와 로직 변경

1. 사용자 요청과 승인 원문으로 변경할 문구·선택 순서·결과 매핑을 확인합니다.
2. `source.json`과 필요한 분기 코드를 수정합니다.
3. 기대 결과는 **승인 원문에서 별도로 갱신**합니다. 앱 출력을 복사해 정답으로 사용하지 않습니다.
4. 단위 테스트와 영향받는 브라우저 흐름을 검사합니다.
5. 추천 기준·README·QA 기록을 현재 구현에 맞춰 갱신합니다.

### 현재 연결 규칙

| 영역 | 규칙 |
|---|---|
| 질문 | 4개, 선택지 수 `[6, 5, 5, 4]`, 600개 조합 |
| 결과 01 | Q1~Q4 응답 요약 |
| 결과 02 | Q1 → TOP3 광고명·순서·이유 |
| 결과 03 | Q2 × Q3 → 25개 전용 안내, 각 4개 문구 |
| 결과 04 | Q2 × Q4 → 20개 추천 쌍, 광고명과 이유 |
| 세션 호환 | `RULES_VERSION = '2026-09-15.1'`, 이전 버전 답변은 초기화 |

- 선택지는 배열 인덱스로 연결됩니다. 재정렬 시 모든 매핑과 테스트를 함께 확인합니다.
- 선택 인덱스 의미가 바뀌면 `RULES_VERSION`을 갱신합니다. 문구·스타일만 바뀌면 불필요한 초기화를 피합니다.
- 업종 TOP3와 추천 쌍의 순서·이유를 보존합니다. 결과 02·04의 광고 중복은 허용합니다.
- 예약·플랫폼·상담을 온라인·오프라인 공통 문구로 대체하지 않습니다.
- Q1-1은 별도 정의가 없습니다. 임의 질문이나 규칙을 추가하지 않습니다.
- 원문의 중복 괄호·공백 정리와 사용자가 요청한 문구 변경을 원문 누락과 구분합니다.

## 4. 화면·디자인 유지 기준

- 모든 글꼴은 Kakao Big Sans Regular/Bold를 사용합니다. 화면과 저장 이미지에 같은 글꼴을 적용합니다.
- 키 컬러는 `#0C090A`, `#FAD524`입니다. 흰 배경과 키 컬러 투명도를 사용하며 원본 캐릭터·이모지 색상은 유지합니다.
- 질문 단계는 STEP 1~4, 결과 카드는 01~04입니다. 선택 안내는 ‘선택해주세요’입니다.
- 선택지는 살짝 둥근 사각형, 진행·결과 버튼은 캡슐형입니다. PC 다음 버튼은 선택지 한 칸 너비에 맞춥니다.
- 모바일 메인은 글 → 캐릭터 → 시작 버튼 순서입니다. 고정 버튼이 선택지를 가리지 않아야 합니다.
- 결과 카드는 동일한 옅은 배경·라운드이며 01 카드에 별도 테두리를 넣지 않습니다.
- 응답 값은 옅은 노란 배경, 제목 핵심 문구는 노란 밑줄, 광고 순위는 노란 원형 숫자입니다. TOP1 광고명에는 밑줄을 넣지 않습니다.
- ‘현재 문제’ 라벨은 옅게 표시합니다. 문제 아이콘과 문장은 분리된 열로 정렬합니다.
- 하단은 다시 테스트하기(흰색), 결과 다운로드하기(노랑 20%), 광고 가이드 확인하기(키 컬러) 순서입니다.
- 메인·결과 캐릭터는 SVG 원본을 사용합니다. PNG를 확대하거나 원본을 저해상도로 변환하지 않습니다.
- 01 카드 체크는 제공된 TossFace에서 추출한 `public/emoji/2705.png`입니다.
- 긴 제목은 의미 단위로 묶고 단어 유지·균형 줄바꿈을 적용합니다. 문구를 줄여 맞추거나 글자를 무조건 작게 만들지 않습니다.
- 동작 줄이기 설정을 지원합니다. 저장 시에는 정지된 최종 위치를 사용합니다.

새 자산은 `data/` 원본과 확인한 뒤 실제 서비스용 파일을 `public/`에 포함합니다. 이전 시안 자산이 남아 있다는 이유로 현재 화면에서 사용하는 것으로 문서화하지 않습니다.

## 5. 다운로드 구현과 변경 시 주의점

### 현재 처리 순서

1. 저장 창을 열 때 767px 이하이면 PNG, 그 외에는 PDF 버튼을 먼저 표시합니다. 두 형식 모두 선택 가능합니다.
2. 화면 밖 iframe에 PNG 390px / PDF 1080px의 고정 너비 레이아웃을 구성합니다.
3. viewport·글자 자동 확대 비율을 고정하고 모션을 멈춥니다.
4. Kakao Big Sans와 이미지 로딩 완료 후 크기와 글자 위치를 측정합니다.
5. `renderResultCanvas`가 배경·모서리·이미지·글자를 직접 그립니다. SVG `foreignObject`로 HTML을 다시 배치하지 않습니다.
6. PNG는 3배, PDF의 내장 이미지는 2배로 생성합니다. 파일 너비는 각각 1170px·2160px입니다.
7. PNG를 바로 다운로드하거나 pdf-lib로 단일 긴 페이지 PDF에 삽입합니다.

### 유지할 제한과 검증

- 캔버스는 16MP 이하·높이 16,000px 이하로 제한합니다. 실패를 빈 파일이나 자동 저해상도 출력으로 숨기지 않습니다.
- 높이는 답변에 따라 달라집니다. PNG·PDF 파일 크기만으로 선명도를 판정하지 않습니다.
- PDF는 이미지 기반입니다. 검색 가능한 텍스트 PDF나 A4 여러 장 출력으로 설명하지 않습니다.
- Canvas 렌더러는 현재 결과 화면의 스타일을 지원합니다. 새로운 배경 이미지·장식·레이아웃을 추가하면 직접 그리기 코드의 지원 여부도 확인합니다.
- 모서리, 여러 줄 밑줄, 글자 기준선, 아이콘 비율, 카드 간격, 상단 축소·빈 공간을 실제 파일에서 확인합니다.
- 저장 화면 하단에 ‘파일 다운로드’, ‘파일 열기’, 공유 메뉴 안내를 다시 추가하지 않습니다.
- 가이드 자료 URL은 준비 중입니다. 현재 비활성 버튼을 정상 연결된 기능으로 표기하지 않습니다.

## 6. QA 실행 및 기록

Chrome 설치가 필요합니다. WebKit 검사를 처음 실행할 때는 해당 브라우저를 설치합니다.

```sh
npx playwright install webkit
npm run check
npm run preview
```

아래 주소는 실제 실행 중인 개발·미리보기 서버 주소로 교체하세요.

```sh
# Chrome: 대표 흐름, 반응형, 세션, 이미지·PDF 저장
node scripts/verify-browser.mjs http://127.0.0.1:4173

# Safari 계열 WebKit: 같은 대표 검증
node scripts/verify-browser.mjs http://127.0.0.1:4173 --webkit

# PC 600개 응답 조합의 실제 선택 흐름과 원문 대조
node scripts/verify-all-combinations.mjs http://127.0.0.1:4173

# 모바일 에뮬레이션 600개 응답 조합
node scripts/verify-all-combinations.mjs http://127.0.0.1:4173 --mobile

# 사용자 보고 답변: 두 엔진에서 PNG·PDF 생성 및 최신 렌더러 확인
node scripts/verify-reported-export.mjs http://127.0.0.1:4173
```

마지막 스크립트는 주소를 생략하면 운영 사이트를 검사합니다. 402×874px·3배율 및 iPhone 13 Pro 에뮬레이션 설정을 사용하므로 **실제 iPhone 17 Pro 재현으로 표기하지 않습니다.**

| 산출물 경로 | 내용 |
|---|---|
| `artifacts/browser/` | Chrome 화면·PNG·PDF·검증 결과 |
| `artifacts/browser-webkit/` | WebKit 화면·PNG·PDF·검증 결과 |
| `artifacts/qa/all-combinations-desktop.json` | PC 전체 조합 |
| `artifacts/qa/all-combinations-mobile.json` | 모바일 전체 조합 |
| `artifacts/reported-export/` | 사용자 보고 답변의 두 엔진 출력 |

### 실제 파일과 휴대폰 확인

- 다운로드 이벤트 성공만으로 통과 처리하지 않습니다. PNG를 원본 크기로 확인하고 PDF를 렌더링해 내용을 확인합니다.
- 문제 파일이 있으면 생성 시각·이미지 해상도·배포 코드와 대조합니다. 시각 정보만으로 사용자 환경 문제라고 단정하지 않습니다.
- 같은 답변으로 저장한 파일을 비교합니다. 서로 다른 답변의 높이 차이는 오류가 아닙니다.
- 실기기 확인에는 기종·OS·브라우저·카카오톡 내부 열기 여부, 저장한 형식, 직접 저장/전송 후 확인 여부를 기록합니다.
- iPhone 17 Pro의 이전 파일에서 상단 축소·공백이 보고되었습니다. 최신 엔진 검증은 통과했으나 최신 버전의 실기기 확인은 별도입니다.
- 테스트 범위를 [최신 QA](docs/QA-2026-09-15.md)에 기록합니다. 에뮬레이션을 실기기 통과로, 대표 흐름을 전체 조합 통과로 확대 해석하지 않습니다.
- 영향에 맞는 검사를 수행합니다. 문서만 바꾼 경우 링크·표·코드와의 일치를 확인하며 전체 기능 테스트를 반복할 필요는 없습니다.

## 7. 커밋 컨벤션

사용자 지정 **Udacity Style 변형**을 사용합니다. 영문 동사·대문자 규칙보다 한글 제목 지침이 우선입니다.

```text
타입: 한글 제목

필요한 경우 한글 본문

필요한 경우 푸터
```

- 제목은 50자 이하, 끝에 마침표를 붙이지 않습니다.
- 본문은 선택 사항이며 제목과 빈 줄로 구분합니다. 줄당 72자 이하로 작성합니다.
- 본문에는 무엇을 왜 변경했는지 설명합니다.
- 푸터는 관련 이슈·참조 커밋이 있을 때만 작성합니다. 설명은 한글로 쓰고 자동 연결이 필요하면 `Resolves: #123` 같은 키워드를 유지합니다.

| 타입 | 용도 |
|---|---|
| `feat` | 새 기능 |
| `fix` | 버그·사용 동작·화면 문제 수정 |
| `docs` | 문서 |
| `style` | 코드 포맷만 변경. 화면 디자인 변경과 혼동하지 않기 |
| `refactor` | 기능 변화 없는 코드 구조 개선 |
| `test` | 테스트 추가·수정 |
| `chore` | 빌드 작업·패키지 설정 등 유지보수 |
| `ci` | CI 설정 |
| `perf` | 성능 개선 |
| `rename` | 파일·폴더 이름만 변경 |
| `remove` | 파일 삭제만 수행 |

### 항목별 스테이징과 커밋

`git add .`로 한꺼번에 묶기보다 수정·개선·추가 항목별 관련 파일을 선택합니다. 한 파일에 여러 항목이 섞이면 `git add -p`로 구분하되, 각 커밋에서 코드와 테스트가 함께 동작하도록 의존 관계를 고려합니다.

```sh
git status --short
git diff

git add src/lib/exportResult.ts src/lib/renderResultCanvas.ts
git diff --cached
git commit -m "fix: 모바일 결과 이미지의 배치 깨짐 방지" \
  -m "측정된 결과 화면을 직접 그려 저장 시 재배치를 방지한다."

git add README.md CONTRIBUTING.md
git commit -m "docs: 서비스 기능과 개발 운영 기준 갱신"

git status -sb
git log -4 --oneline
```

사용자가 직접 푸시하겠다고 한 작업은 커밋 후 푸시 여부를 명확히 전달합니다. 커밋 완료와 GitHub 반영·운영 배포 완료를 구분합니다.

## 8. GitHub·Vercel 배포

| 항목 | 값 |
|---|---|
| 저장소 | https://github.com/alphabrothers-intelligence/kakao-checklist-web |
| 배포 브랜치 | `main` |
| Vercel 프로젝트 | `intelligence2/kakao-checklist-web` |
| Framework / 빌드 / 출력 | Vite / `npm run build` / `dist` |
| 앱 필수 환경 변수 | 없음 |
| 운영 주소 | https://kakao-checklist-web.vercel.app/ |

```sh
git fetch origin
git status -sb
git diff --check
# 변경 범위에 맞는 검증과 항목별 커밋을 완료한 뒤 실행
git push origin main

vercel list kakao-checklist-web --scope intelligence2
# 위 목록에서 이번 배포 URL을 확인하여 검사
vercel inspect <이번-배포-URL> --scope intelligence2
```

1. 원격 변경과 로컬 변경을 확인하고 충돌을 해결합니다. 강제 푸시로 덮어쓰지 않습니다.
2. 필요한 검사 후 컨벤션에 맞춰 커밋하고 `main`에 푸시합니다.
3. Vercel에서 해당 배포의 Production·Ready 상태와 운영 주소 연결을 확인합니다.
4. 앱 변경이 있으면 운영 주소에서 영향받는 기능과 다운로드 파일을 다시 확인합니다.

- 자동 배포가 시작됐다면 같은 변경을 Vercel CLI로 중복 배포하지 않습니다.
- 서비스 주소는 배포해도 같습니다. 배포 전 열린 화면은 새로고침 또는 창을 닫고 다시 열어 최신 코드를 받습니다.
- `?v=...`는 새로 열기 위한 확인용 쿼리이며 버전을 고정하거나 별도 사이트를 만드는 기능이 아닙니다.
- `.vercelignore` 변경 시 `src/data/source.json`과 현재 사용 중인 `public/` 자산이 배포에 포함되는지 확인합니다.
- 토큰·환경 파일·`node_modules`·`dist`·`.vercel`·검증 산출물은 커밋하지 않습니다.
- `data/`, `preview/`의 원본과 이전 시안은 배포에서 제외합니다. 재현 테스트의 원문 fixture는 별도로 Git에 포함합니다.
