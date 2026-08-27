# 애월 (AeWol) Frontend

> 반려동물 전용 전자지갑 애월의 모바일 우선 웹 클라이언트

[서비스 바로가기](https://www.aewol.store) · [전체 프로젝트 소개](https://github.com/PJT-28-2) · [Backend](https://github.com/PJT-28-2/aewol-backend)

## 소개

애월 프론트엔드는 Vue 3와 Vite로 구현한 모바일 우선 SPA입니다. 반려동물 등록, 지갑과 QR 결제, 지출 분석, 보험, 공동 양육 및 생활 지원 기능을 하나의 사용자 경험으로 제공합니다.

## 기술 스택

| 구분 | 기술 |
| --- | --- |
| Framework | Vue 3, Composition API, `<script setup>` |
| Build | Vite 6, Node.js 20 이상 |
| State / Router | Pinia, Vue Router 4 |
| HTTP | Axios |
| UI | Tailwind CSS 4, Pretendard |
| Chart | ECharts, vue-echarts |
| Test | Vitest, jsdom |
| Quality | ESLint, Prettier, Husky |

Figma의 색상·타이포그래피·간격 토큰을 `variables.css`의 CSS 변수로 옮기고 Tailwind CSS 4 유틸리티와 연결했습니다. `AppButton`, `AppModal` 등의 공통 컴포넌트가 같은 토큰을 사용하므로 한 곳의 변경을 전체 화면에 일관되게 반영할 수 있습니다.

## 주요 화면

- 인증 및 온보딩
- 홈 대시보드
- 반려동물 등록·조회·수정
- 지갑 충전·출금, QR 결제와 거래 내역
- 지출 대시보드와 인사이트
- 정기결제와 QR 결제
- 보험 시뮬레이션 및 청구
- 공동 양육, 공동구매와 기부
- 지원사업 및 응급 병원 검색

## 프로젝트 구조

```text
src/
├── api/          # Axios 인스턴스와 도메인별 API 모듈
├── assets/       # 이미지와 전역 스타일·디자인 토큰
├── components/   # 공통 및 도메인 컴포넌트
├── composables/  # 재사용 가능한 Composition 함수
├── layouts/      # 인증·기본 레이아웃
├── router/       # 라우트와 인증 가드
├── stores/       # Pinia 도메인 스토어
├── utils/        # 공통 유틸리티
└── views/        # 페이지 단위 컴포넌트
```

## 시작하기

### 요구사항

- Node.js 20 이상
- npm
- 로컬에서 실행 중인 AeWol Backend

### 설치 및 실행

```bash
npm install
npm run dev
```

개발 서버는 기본적으로 `http://localhost:5173`에서 실행됩니다. 개발 환경의 `/api` 요청은 Vite 프록시를 통해 `http://localhost:8080`으로 전달됩니다.

### 환경변수

`.env.example`을 복사해 `.env.local`을 만들고 필요한 값을 설정합니다.

```dotenv
VITE_KAKAO_REST_API_KEY=
VITE_KAKAO_REDIRECT_URI=
VITE_KAKAO_MAP_KEY=
VITE_TOSS_CLIENT_KEY=
VITE_DEMO_MODE=false
```

`VITE_*` 변수는 빌드 결과에서 노출될 수 있습니다. TossPayments 시크릿 키처럼 서버에서만 사용해야 하는 값은 프론트엔드 환경변수에 넣지 않습니다.

배포 환경에서 API 주소를 별도로 지정할 때만 `VITE_API_BASE_URL`을 사용합니다.

## 명령어

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run test:run` | 전체 테스트 1회 실행 |
| `npm run lint` | ESLint 검사 및 자동 수정 |

## 개발 규칙

- Vue 3 Composition API와 `<script setup>`을 사용합니다.
- 서버 상태와 공유 상태는 도메인별 Pinia store에서 관리합니다.
- API 호출은 `src/api`의 공통 Axios 인스턴스와 도메인 모듈을 사용합니다.
- 공통 UI와 아이콘은 `src/components/common`의 기존 컴포넌트를 우선 재사용합니다.
- 색상은 `variables.css`의 디자인 토큰을 사용하며 화면에 hex 값을 직접 작성하지 않습니다.
- 모바일 화면을 우선 구현한 뒤 넓은 화면에서 레이아웃을 확인합니다.

## 검증

변경 사항을 올리기 전에 다음 명령을 실행합니다.

```bash
npm run test:run
npm run build
```

Husky가 설정된 환경에서는 커밋 전에 Vitest가 자동으로 실행됩니다.

프로젝트 발표 시점 기준으로 75개 테스트 파일에서 560개 프론트엔드 테스트가 통과했습니다.

## 브랜치와 PR

```text
main
└── develop
    ├── feat/#이슈번호-기능명
    ├── fix/#이슈번호-버그명
    └── refactor/#이슈번호-대상
```

기능 브랜치는 `develop`에서 만들고 완료 후 `develop`을 대상으로 PR을 생성합니다.

## 관련 문서

- [QR 결제 데모](./docs/qr-payment-demo.md)
- [Backend 저장소](https://github.com/PJT-28-2/aewol-backend)
