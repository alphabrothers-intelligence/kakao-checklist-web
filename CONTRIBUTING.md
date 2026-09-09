# 개발·운영 가이드

[서비스 소개](README.md) · [전체 결과 로직](docs/RESULT_LOGIC.md) · [QA 기록](docs/VERIFICATION.md)

## 로컬 실행

- Vercel 현재 런타임: Node.js 24.x.
- 로컬 개발: 의존성이 요구하는 Node.js 버전 사용·Vercel과 맞추려면 24.x 권장.
- 의존성 설치: npm·잠금 파일 기준.

```sh
npm ci
npm run dev
```

| 명령 | 역할 |
|---|---|
| `npm run dev` | 개발 서버·기본 주소 http://127.0.0.1:5173 |
| `npm run test` | Vitest 테스트 |
| `npm run build` | TypeScript 검사·Vite 빌드 |
| `npm run check` | 테스트 + 빌드 |
| `npm run preview` | 빌드 결과 미리보기·출력된 주소 사용 |

## 수정할 파일

| 변경 대상 | 파일 |
|---|---|
| 질문·선택지·TOP3·추천 이유·운영 문구·광고 쌍 | `src/data/source.json` |
| 조건 검증·결과 분기 | `src/lib/diagnosis.ts` |
| 답변 저장·복구 | `src/lib/session.ts` |
| 화면 이동 | `src/hooks/useDiagnosisFlow.ts` |
| 시작·질문·결과 UI | `src/components/Intro.tsx`, `Question.tsx`, `Result.tsx` |
| 가이드·저장 창 | `src/components/Dialogs.tsx` |
| 이미지·PDF 내보내기 | `src/lib/exportResult.ts` |
| 컬러·폰트·반응형·모션 | `src/styles.css` |
| 파비콘·이미지·폰트 | `public/`·파비콘 참조는 `index.html` |
| 기대 결과 | `tests/fixtures/approved.mjs` |
| 배포 설정 | `vercel.json`, `.vercelignore` |

## 콘텐츠 및 로직 변경

1. 실무자와 변경 문구·대상 선택 조합·출력 순서 확정.
2. `source.json` 수정·분기 변경 시 `getDiagnosis`도 수정.
3. 기대 결과는 승인된 원문으로 별도 갱신·앱 출력을 복사해 정답으로 사용하지 않기.
4. [전체 결과 로직](docs/RESULT_LOGIC.md)과 필요한 설명 갱신.
5. 영향 범위에 맞게 테스트·빌드·브라우저 검사.
6. 변경 내용·검증 결과를 기록하고 GitHub에 반영.

| 유지할 기준 | 내용 |
|---|---|
| 문구 | 승인된 원문 보존·임의 축약 지양 |
| 추천 순서 | TOP3 및 2개 광고의 순서 보존 |
| 기타 업종 | 현재 제외·추가 시 결과 데이터와 검증 범위 함께 정의 |
| 선택 순서 | 배열 인덱스로 연결되므로 항목 재정렬 시 모든 관련 매핑 확인 |
| 기존 답변 호환 | 선택 인덱스 의미 변경 시 `RULES_VERSION` 갱신 여부 검토 |
| 현재 보류 | 예약·상담·플랫폼의 유입·측정 안내 기준, 가이드 목적지 |

## 브라우저 QA

- 사전 준비: Chrome 설치·`npm run build` 후 미리보기 서버 실행.
- 아래 명령의 주소는 실제 서버 주소로 교체.

```sh
# 대표 흐름·모바일 에뮬레이션·PNG/PDF 저장
node scripts/verify-browser.mjs http://127.0.0.1:4173

# 700개 조합의 실제 선택 흐름·결과 원문 대조
node scripts/verify-all-combinations.mjs http://127.0.0.1:4173
```

- 결과 파일: `artifacts/`·Git 제외.
- 키보드·작은 화면·동작 줄이기 검사: `scripts/verify-accessibility.mjs`의 대상 주소 확인 후 실행.
- 에뮬레이션 결과를 실제 모바일 기기 검증으로 표기하지 않기.
- 문서만 바꾼 경우: 링크·표·이미지 확인·전체 기능 테스트 반복 불필요.
- 분기 검사 통과와 미정 정책의 승인을 구분하여 기록.

## GitHub·Vercel 배포

| 설정 | 현재 값 |
|---|---|
| 저장소 | https://github.com/alphabrothers-intelligence/kakao-checklist-web |
| 배포 브랜치 | `main` |
| Vercel 프로젝트 | `intelligence2/kakao-checklist-web` |
| Framework | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| 앱 필수 환경 변수 | 현재 없음 |
| 서비스 주소 | https://kakao-checklist-web.vercel.app |

1. 변경 파일·차이 확인.
2. 필요한 검사 통과 후 커밋·GitHub 반영.
3. `main` 반영에 따른 Vercel 자동 배포 상태 확인.
4. 실제 서비스 주소에서 변경 내용 확인.

- GitHub 자동 배포가 시작되면 같은 변경의 CLI 배포를 중복 실행할 필요 없음.
- `.vercelignore` 변경 시 **앱 데이터 `src/data/source.json`이 포함되는지 확인**.
- 토큰·`.env*`·`node_modules`·`dist`·`.vercel`·검증 산출물은 커밋하지 않기.
- 기존 시안·원본 자료는 로컬의 `preview/`, `data/`에 보존·배포 저장소에는 미포함.
- 공개 배포 전 새로 추가한 자산의 출처·사용 범위 확인.
