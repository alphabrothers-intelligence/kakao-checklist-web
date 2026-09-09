# 사용 자산

- 카카오 큰글씨/작은글씨: 사용자가 제공한 `data/`의 WOFF2 파일. 실제 앱은 필요한 3개 파일을 `public/fonts/`에서 로드합니다.
- 토스 이모지: 사용자가 제공한 `TossFaceFontMac.ttf`의 sbix PNG 글리프를 추출한 `public/emoji/`. 브라우저 폰트별 렌더링 차이와 내보내기 누락을 줄이기 위해 이미지로 사용합니다.
- 3D 가게 및 궤도 오브젝트: 이 대화에서 제작·수정 후 사용자가 승인한 이미지. `public/assets/shop-3d-clean.png`, `public/assets/advertising-orbit-3d-clean.png`. 토스 공식 3D 자산이 아닙니다.
- 외부 라이브러리: npm 잠금 파일로 버전 관리합니다. HTML 시안의 수동 vendor 스크립트를 실제 앱에 복사하지 않습니다.
