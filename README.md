# 애월 (Aewol) Frontend

> 반려동물 전용 전자지갑 애월의 모바일 우선 웹 클라이언트

[서비스 바로가기](https://www.aewol.store) · [전체 프로젝트 소개](https://github.com/PJT-28-2) · [Backend](https://github.com/PJT-28-2/aewol-backend)

## 소개

애월 프론트엔드는 Vue 3와 Vite로 구현한 모바일 우선 SPA입니다. 반려동물 등록, 지갑과 QR 결제, 지출 분석, 보험, 함께 돌보기 및 생활 지원 기능을 하나의 사용자 경험으로 제공합니다.

Figma의 색상·타이포그래피·간격 토큰을 `variables.css`의 CSS 변수로 옮기고 Tailwind CSS 4 유틸리티와 연결했습니다. `AppButton`, `AppModal` 등의 공통 컴포넌트가 같은 토큰을 사용하므로 한 곳의 변경을 전체 화면에 일관되게 반영할 수 있습니다.

## 🛠️ 기술 스택

| 영역 | 기술 |
| --- | --- |
| **Core** | ![Vue 3](https://img.shields.io/badge/Vue_3-4FC08D?style=flat-square&logo=vuedotjs&logoColor=white) ![Vite 6](https://img.shields.io/badge/Vite_6-646CFF?style=flat-square&logo=vite&logoColor=white) ![Node.js 20](https://img.shields.io/badge/Node.js_20-339933?style=flat-square&logo=nodedotjs&logoColor=white) |
| **State · Router** | ![Pinia](https://img.shields.io/badge/Pinia-FFD859?style=flat-square&logoColor=black) ![Vue Router 4](https://img.shields.io/badge/Vue_Router_4-42B883?style=flat-square&logo=vuedotjs&logoColor=white) |
| **HTTP** | ![Axios](https://img.shields.io/badge/Axios-5A29E4?style=flat-square&logo=axios&logoColor=white) |
| **UI · Chart** | ![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white) ![Pretendard](https://img.shields.io/badge/Pretendard-222222?style=flat-square&logoColor=white) ![ECharts](https://img.shields.io/badge/ECharts-AA344D?style=flat-square&logo=apacheecharts&logoColor=white) |
| **Payment · QR · PDF** | ![TossPayments](https://img.shields.io/badge/TossPayments-0064FF?style=flat-square&logoColor=white) ![jsQR](https://img.shields.io/badge/jsQR-2D3748?style=flat-square&logoColor=white) ![jsPDF](https://img.shields.io/badge/jsPDF-EF4444?style=flat-square&logoColor=white) ![html2canvas](https://img.shields.io/badge/html2canvas-2563EB?style=flat-square&logoColor=white) |
| **Test** | ![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=flat-square&logo=vitest&logoColor=white) ![jsdom](https://img.shields.io/badge/jsdom-323330?style=flat-square&logo=javascript&logoColor=F7DF1E) |
| **Quality** | ![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=flat-square&logo=eslint&logoColor=white) ![Prettier](https://img.shields.io/badge/Prettier-F7B93E?style=flat-square&logo=prettier&logoColor=black) ![Husky](https://img.shields.io/badge/Husky-111827?style=flat-square&logoColor=white) |
| **Deployment** | ![AWS](https://img.shields.io/badge/AWS_S3_%C2%B7_CloudFront-FF9900?style=flat-square&logo=amazonwebservices&logoColor=white) ![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=flat-square&logo=githubactions&logoColor=white) ![OIDC](https://img.shields.io/badge/OIDC-F78C40?style=flat-square&logo=openid&logoColor=white) |

Vue 3 Composition API와 `<script setup>`을 사용하며, 상태는 도메인별 Pinia store로 관리합니다. API 통신은 공통 Axios 인스턴스를 통해 처리하고 Tailwind CSS 4와 디자인 토큰을 기반으로 UI를 구성합니다.

## 주요 화면

- 인증 및 온보딩
- 반려동물 맞춤형 홈 대시보드
- 반려동물 등록·조회·수정
- 지갑 충전·출금, QR 결제와 거래 내역
- 카테고리·반려동물별 지출 분석과 AI 인사이트
- 정기결제와 짜투리 저금통
- 보험 손익분기 시뮬레이션과 보험금 청구
- 함께 돌보기, 육아일기와 가족 초대
- 반려동물 상품 공동구매와 기부
- 지자체 지원사업 및 응급 병원 검색

## 프로젝트 구조

```text
src/
├── api/          # Axios 인스턴스와 도메인별 API 모듈
├── assets/       # 이미지와 전역 스타일·디자인 토큰
├── components/   # 공통 및 도메인 컴포넌트
├── composables/  # 재사용 가능한 Composition 함수
├── constants/    # 공통 상수와 도메인 설정값
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
- 로컬에서 실행 중인 Aewol Backend

### 설치 및 실행

```bash
npm install
npm run dev
```

개발 서버는 기본적으로 `http://localhost:5173`에서 실행됩니다. 개발 환경의 `/api`와 `/uploads` 요청은 Vite 프록시를 통해 `http://localhost:8080`으로 전달됩니다.

### 환경변수

`.env.example`을 복사해 `.env.local`을 만들고 필요한 값을 설정합니다.

```dotenv
# 백엔드 API 기본 경로
VITE_API_BASE_URL=/api

# 카카오 로그인
VITE_KAKAO_REST_API_KEY=
VITE_KAKAO_REDIRECT_URI=

# 카카오 지도
VITE_KAKAO_MAP_KEY=

# TossPayments 클라이언트 키
VITE_TOSS_CLIENT_KEY=
```

`VITE_KAKAO_REDIRECT_URI`를 비워두면 현재 origin의 `/callback/kakao` 경로를 사용합니다.

`VITE_*` 변수는 빌드 결과에 포함되어 브라우저에 노출될 수 있습니다. TossPayments 시크릿 키처럼 서버에서만 사용해야 하는 값은 프론트엔드 환경변수에 넣지 않습니다.

배포 환경에서 API 주소를 별도로 지정해야 할 때는 `VITE_API_BASE_URL`을 변경합니다.

## 명령어

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run test` | Vitest 감시 모드 실행 |
| `npm run test:run` | 전체 테스트 1회 실행 |
| `npm run lint` | ESLint 검사 및 자동 수정 |

## 개발 규칙

- Vue 3 Composition API와 `<script setup>`을 사용합니다.
- 서버 상태와 공유 상태는 도메인별 Pinia store에서 관리합니다.
- API 호출은 `src/api`의 공통 Axios 인스턴스와 도메인 모듈을 사용합니다.
- 공통 UI와 아이콘은 `src/components/common`의 기존 컴포넌트를 우선 재사용합니다.
- 기능성 아이콘은 `src/components/common/icons`의 SVG 컴포넌트를 사용합니다.
- 색상은 `variables.css`의 디자인 토큰을 사용하며 화면에 hex 값을 직접 작성하지 않습니다.
- 컴포넌트 UI는 Tailwind CSS 4 유틸리티 클래스로 작성합니다.
- 모바일 화면을 우선 구현한 뒤 넓은 화면에서 레이아웃을 확인합니다.

## 검증

변경 사항을 올리기 전에 다음 명령을 실행합니다.

```bash
npm run test:run
npm run build
```

CI에서는 ESLint 검사, 전체 테스트와 프로덕션 빌드를 순서대로 검증합니다.

Husky가 설정된 환경에서는 커밋 전에 `npm run precommit:test`가 실행되어 Vitest 전체 테스트를 검증합니다.

> 프로젝트 발표 시점 기준으로 75개 테스트 파일에서 560개 프론트엔드 테스트가 통과했습니다.

## 배포

`main` 브랜치에 변경 사항이 반영되면 GitHub Actions가 다음 과정을 자동으로 수행합니다.

```text
main push
  └─ 테스트
       └─ 프로덕션 빌드
            └─ S3 정적 파일 업로드
                 └─ CloudFront 캐시 무효화
                      └─ 운영 서비스 응답 확인
```

정적 자산은 장기 캐시와 `immutable` 정책을 적용해 S3에 업로드하고, `index.html`은 항상 최신 배포를 확인할 수 있도록 별도의 캐시 정책을 적용합니다.

AWS 인증에는 GitHub Actions OIDC를 사용하며, 장기 액세스 키를 저장소에 보관하지 않습니다.

## 브랜치와 PR

```text
main
└── develop
    ├── feat/#이슈번호-기능명
    ├── fix/#이슈번호-버그명
    └── refactor/#이슈번호-대상
```

기능 및 수정 브랜치는 `develop`에서 만들고, 작업 완료 후 `develop`을 대상으로 PR을 생성합니다. `develop`에서 검증된 변경 사항은 배포 단위로 `main`에 병합합니다.

## 관련 문서

- [전체 프로젝트 소개](https://github.com/PJT-28-2)
- [Backend 저장소](https://github.com/PJT-28-2/aewol-backend)
- [QR 결제 데모](./docs/qr-payment-demo.md)
