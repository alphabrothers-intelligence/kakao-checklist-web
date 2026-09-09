# 우리 가게 광고 찾기

확정한 HTML 시안을 React + TypeScript + Vite로 구현한 카카오 광고 자가진단 웹 서비스입니다.

## 실행

```sh
npm ci
npm run dev
```

개발 화면: http://127.0.0.1:5173

```sh
npm run check
npm run preview
```

`check`는 진단·세션 테스트와 TypeScript 검사, 프로덕션 빌드를 실행합니다. 실제 앱 코드는 `src/`입니다. 기존 시안과 원본 자료는 로컬 작업 폴더에 보존하며 배포 저장소에는 포함하지 않습니다.

## 구성

- `src/data/source.json`: 사용자 제공 문구·TOP3·경로×목표 매핑. 표의 순서를 보존합니다.
- `src/lib/diagnosis.ts`: 입력 검증 및 결과 계산. 7×5×5×4 = 700개 조합.
- `src/hooks/useDiagnosisFlow.ts`: 질문 이동, 브라우저 뒤로/앞으로, 새로고침 복구.
- `src/lib/exportResult.ts`: 실제 화면의 3배 PNG 및 동일 이미지를 담은 긴 단일 페이지 PDF.
- `src/components/`: 소개·질문·결과·가이드/저장 창.
- `public/`: 제공 카카오 폰트, 토스 폰트에서 추출한 이모지, 승인된 3D 이미지.
- `vercel.json`: Vercel Vite 빌드와 SPA 경로 설정.

응답은 현재 탭의 `sessionStorage`에만 저장합니다. 로그인·DB·외부 분석·API 키가 필요하지 않습니다. 결과 저장 라이브러리는 저장 시점에 불러옵니다. PDF는 화면과 같은 디자인의 무손실 이미지 기반으로, 텍스트 선택·검색은 지원하지 않습니다.

## Vercel 배포

1. 이 프로젝트를 Git 저장소에 올린 뒤 Vercel에서 Import합니다. 또는 Vercel CLI로 프로젝트 루트에서 배포합니다.
2. Framework Preset: **Vite**
3. Build Command: **npm run build**
4. Output Directory: **dist**
5. 환경 변수: **현재 없음**

Preview Deployment에서 점검 후 Production으로 승격합니다. 로컬 구현/빌드 완료와 실제 배포는 구분됩니다. 아직 Vercel 계정·프로젝트 연결이나 인터넷 공개 배포는 하지 않았습니다.

공식 안내: https://vercel.com/docs/frameworks/frontend/vite

## 현재 합의된 보류 사항

- 광고 가이드 버튼 안의 메뉴얼/스타터킷 목적지는 실무자 협의 후 연결합니다. 지금은 준비 중으로 표시합니다.
- 예약·상담·플랫폼 경로의 유입/측정 부족은 기존 시안처럼 온라인·오프라인 문안을 함께 표시합니다. 콘텐츠를 새로 만들거나 한쪽으로 임의 분류하지 않습니다. 최종 연결 정책을 정하면 `getDiagnosis`만 변경하면 됩니다.
- 원본 폰트와 생성 이미지 출처는 `docs/ASSETS.md` 참조.

## 브라우저 점검

로컬 서버 실행 후, 설치된 Chrome을 사용해 다음을 실행합니다.

```sh
node scripts/verify-browser.mjs
```

스크린샷과 저장 파일, 점검 결과는 Git에서 제외된 `artifacts/browser/`에 생성됩니다. 모바일 검증은 Chrome의 모바일 화면 에뮬레이션이며 실제 iOS Safari·카카오톡 인앱 브라우저 확인을 대체하지 않습니다.
