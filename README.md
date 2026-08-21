# 애월 (AeWol) — 반려동물 전자지갑 서비스 Frontend

## 프로젝트 소개

애월(AeWol) 프론트엔드는 Vue.js 3 기반 모바일 우선 SPA(Single Page Application)입니다. 반려동물 전자지갑 서비스의 모든 기능을 모바일 화면에 최적화하여 제공하며, Composition API와 `<script setup>` 문법을 사용합니다.

KB IT's Your Life 7기 팀 이파리 28-2팀 종합실무 프로젝트입니다.

---

## 기술 스택

| 구분 | 기술 | 비고 |
|------|------|------|
| Framework | Vue.js 3 | Composition API, `<script setup>` |
| State | Pinia | 도메인별 스토어 분리 |
| Router | Vue Router 4 | 30+ 라우트, 인증 가드 |
| HTTP | Axios | JWT 자동 갱신 인터셉터 |
| Chart | ECharts (`vue-echarts`) | 지출 대시보드 시각화 |
| Build | Vite 6 | 개발 서버 + 프록시 |
| Node | >= 20 | |

---

## 프로젝트 구조

```
src/
├── main.js                     # 앱 진입점
├── App.vue
├── assets/
│   └── styles/
│       ├── variables.css       # Figma 기반 디자인 토큰 (CSS 변수)
│       ├── reset.css
│       └── global.css
├── router/
│   └── index.js                # Vue Router 4 — 30+ 라우트 + 인증 가드
├── stores/                     # Pinia 상태 관리
│   ├── auth.js                 # 인증 (토큰, 사용자 정보)
│   ├── member.js               # 회원 프로필
│   ├── pet.js                  # 반려동물 목록/상세
│   ├── wallet.js               # 지갑 + 버킷
│   ├── transaction.js          # 거래 내역
│   ├── dashboard.js            # 지출 대시보드
│   ├── insurance.js            # 보험 시뮬레이션/청구
│   └── notification.js         # 알림함 (목데이터, WebSocket connect는 미연동)
├── api/                        # Axios API 모듈 (도메인별)
│   ├── index.js                # Axios 인스턴스 + JWT 인터셉터
│   ├── auth.js
│   ├── pet.js
│   ├── wallet.js
│   ├── transaction.js
│   └── ...                     # 15개 모듈
├── layouts/
│   ├── DefaultLayout.vue       # 기본 레이아웃 (헤더 + 하단 네비)
│   └── AuthLayout.vue          # 인증 페이지 레이아웃
├── components/
│   └── common/
│       ├── AppButton.vue       # 버튼 (4가지 variant)
│       ├── AppCard.vue         # 카드 컨테이너
│       ├── AppInput.vue        # 입력 필드
│       ├── AppModal.vue        # 모달 다이얼로그
│       ├── BottomNavBar.vue    # 하단 탭 네비게이션
│       ├── PageHeader.vue      # 상단 헤더
│       ├── LoadingSpinner.vue
│       └── EmptyState.vue
├── composables/
│   ├── useAuth.js
│   └── useLoading.js
└── views/                      # 페이지 컴포넌트 (30개)
    ├── auth/                   # 로그인, 회원가입, 이메일 인증, 카카오 콜백
    ├── home/                   # 메인 대시보드
    ├── pet/                    # 반려동물 목록/등록/상세/수정
    ├── wallet/                 # 지갑/버킷/거래내역
    ├── account/                # 연동 계좌
    ├── payment/                # 결제/정기결제
    ├── dashboard/              # 지출 대시보드 (차트)
    ├── insurance/              # 보험 시뮬레이터/청구
    ├── share/                  # 공동 양육
    ├── grouppurchase/          # 공동구매
    ├── donation/               # 짜투리 저금통/기부
    ├── support/                # 지자체 지원사업
    ├── emergency/              # 응급 병원
    └── settings/               # 설정/회원탈퇴
```

---

## 디자인 시스템

`src/assets/styles/variables.css`에 Figma 디자인 토큰이 CSS 변수로 정의되어 있습니다.

| 카테고리 | 변수 예시 | 값 |
|----------|----------|----|
| 컬러 | `--color-navy` | #1b2a49 |
| 컬러 | `--color-gold` | #d99a2b |
| 타이포 | `--font-xs` ~ `--font-3xl` | 10px ~ 32px |
| 폰트 | Pretendard | 웹폰트 |
| 스페이싱 | `--space-1` ~ `--space-10` | 4px ~ 64px |
| 라디우스 | `--radius-sm` ~ `--radius-full` | 4px ~ 999px |

모든 컴포넌트는 이 CSS 변수를 사용하므로, 디자인 토큰 변경 시 전체 UI에 일괄 적용됩니다.

---

## 로컬 개발 환경 설정

### 사전 요구사항

- Node.js 20 이상
- npm

### 의존성 설치

```bash
npm install
```

### 개발 서버 시작

```bash
npm run dev
```

개발 서버는 `http://localhost:5173`에서 실행됩니다.

### 프로덕션 빌드

```bash
npm run build
```

빌드 결과물은 `dist/` 디렉토리에 생성됩니다.

### 환경변수 설정

`.env.example`을 복사해 `.env.local`을 만들고 값을 채웁니다. `VITE_*` 값은 빌드 결과에 들어가므로 브라우저에서 보입니다.

```
VITE_USE_MOCK_DATA=false
VITE_KAKAO_REST_API_KEY=카카오_REST_API_키
VITE_KAKAO_REDIRECT_URI=
VITE_KAKAO_MAP_KEY=카카오_지도_JavaScript_키
VITE_TOSS_CLIENT_KEY=TossPayments_클라이언트_키
```

`VITE_TOSS_CLIENT_KEY`에는 브라우저용 API 개별 연동 클라이언트 키만 설정합니다.
TossPayments 시크릿 키는 백엔드에서만 관리하며 프론트 환경변수에 넣지 않습니다.

### 백엔드 API 프록시

`vite.config.js`에 `/api` 경로에 대한 프록시가 설정되어 있어, 개발 서버에서 별도의 CORS 설정 없이 백엔드(`http://localhost:8080`)와 통신할 수 있습니다.

---

## 라우트 목록

30개 이상의 라우트를 제공합니다. 대표 라우트는 아래와 같습니다.

| 경로 | 컴포넌트 | 설명 |
|------|----------|------|
| `/login` | `auth/LoginView.vue` | 로그인 |
| `/` | `home/HomeView.vue` | 메인 대시보드 (인증 필요) |
| `/pets` | `pet/PetListView.vue` | 반려동물 목록 (인증 필요) |
| `/pets/:id` | `pet/PetDetailView.vue` | 반려동물 상세 (인증 필요) |
| `/wallet` | `wallet/WalletView.vue` | 지갑 홈 (인증 필요) |
| `/dashboard` | `dashboard/DashboardView.vue` | 지출 대시보드 (인증 필요) |

인증이 필요한 라우트는 Vue Router의 내비게이션 가드(`beforeEach`)에서 토큰 유효성을 검사하며, 미인증 시 `/login`으로 리다이렉트합니다.

---

## 브랜치 전략

| 브랜치 | 용도 |
|--------|------|
| `main` | 프로덕션 |
| `develop` | 개발 통합 |
| `feature/{기능명}` | 기능 개발 |

PR은 `feature/{기능명}` → `develop` → `main` 순서로 병합합니다.

---

## 팀

KB IT's Your Life 7기 | 팀 이파리 | PJT 28-2팀
