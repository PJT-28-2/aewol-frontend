/**
 * 목 모드 여부는 소스 코드에 고정하지 않고 환경변수(VITE_USE_MOCK_DATA)로 주입해요.
 * - 값을 명시적으로 'true'로 설정한 경우에만 mock이 켜짐
 * - 값이 없거나 그 외의 값이면 기본적으로 꺼짐(false) → 실제 API 호출
 * 로컬 개발 중 mock을 켜고 싶으면 프로젝트 루트에 `.env.local` 파일을 만들고
 * `VITE_USE_MOCK_DATA=true` 한 줄만 추가하면 돼요 (이 파일은 git에 커밋하지 않는 파일이라
 * 배포 빌드에는 절대 영향을 주지 않아요).
 */
export const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true';
