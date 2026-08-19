// 공동구매 목록/상세/상태화면/마이페이지 4개 조회 API가 공통으로 내려주는
// OPEN/COMPLETED/FAILED/CANCELLED 상태값을 다루는 공용 매핑이다.
// 상태값(enum) 자체는 백엔드가 소유하는 단일 출처이고, 한글 라벨/배지 색상 같은 표시는
// 여기서만 관리해서 화면마다 표기가 따로 노는 걸 막는다.

// 목록/마이페이지 공용 짧은 한글 라벨
export const GROUP_PURCHASE_STATUS_LABEL = {
  OPEN: '진행중',
  COMPLETED: '달성',
  FAILED: '마감(미달)',
  CANCELLED: '마감(취소)',
}

// 위 라벨의 역방향 매핑 — 필터 드롭다운에서 고른 한글 라벨을 API status 파라미터로 보낼 때 사용
export const GROUP_PURCHASE_STATUS_CODE = {
  진행중: 'OPEN',
  달성: 'COMPLETED',
  '마감(미달)': 'FAILED',
  '마감(취소)': 'CANCELLED',
}

// 상태 배지 색상: 진행중은 올리브, 달성은 중립 그레이, 마감(미달)/마감(취소)는 danger 톤
export const GROUP_PURCHASE_STATUS_BADGE_CLASS = {
  OPEN: 'bg-(--color-olive-surface) text-(color:--color-olive)',
  COMPLETED: 'bg-(--color-gray-200) text-(color:--color-gray-600)',
  FAILED: 'bg-(--color-danger-soft) text-(color:--color-danger-strong)',
  CANCELLED: 'bg-(--color-danger-soft) text-(color:--color-danger-strong)',
}

/**
 * enum 상태값을 짧은 한글 라벨로 변환한다. 매핑에 없는 값은 원본을 그대로 반환해서
 * 백엔드가 새 값을 추가해도 화면이 빈 문자열 대신 원본 코드를 보여주며 안전하게 깨진다.
 *
 * @param {string | null | undefined} status OPEN/COMPLETED/FAILED/CANCELLED
 * @returns {string} 짧은 한글 라벨
 */
export function getGroupPurchaseStatusLabel(status) {
  return GROUP_PURCHASE_STATUS_LABEL[status] ?? status
}
