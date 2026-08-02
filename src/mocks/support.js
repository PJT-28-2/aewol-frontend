/**
 * 백엔드 API 연동 전, 고객센터 관련 화면을 미리 확인할 수 있도록 만든 목데이터예요.
 */
// 카테고리 목록 — 1:1 문의하기 카테고리와 동일 + 검색화면 전용 '전체' 필터
export const SUPPORT_CATEGORIES = ['지갑·버킷', '보험', '계좌연동', '공동양육', '회원정보', '기타'];

export const MOCK_FAQS = [
  { faqId: 1, category: '지갑·버킷', question: '버킷은 몇 개까지 만들 수 있나요?' },
  { faqId: 2, category: '지갑·버킷', question: 'SOS 포켓 잔액은 어떻게 채우나요?' },
  { faqId: 3, category: '보험', question: '보험 시뮬레이터 결과는 얼마나 정확한가요?' },
  { faqId: 4, category: '회원정보', question: '회원 탈퇴 시 데이터는 어떻게 되나요?' },
  { faqId: 5, category: '회원정보', question: '탈퇴 후에도 문의 내역이 남아있나요?' },
  { faqId: 6, category: '지갑·버킷', question: '반려동물 삭제와 회원 탈퇴는 다른가요?' },
];

export const MOCK_FAQ_ANSWERS = {
  1: '반려동물·카테고리별로 제한 없이 자유롭게 생성할 수 있어요.',
  2: '펫지갑에서 SOS 포켓으로 자유롭게 이체할 수 있어요.',
  3: '공개된 보험 상품 정보와 통계를 기반으로 한 추정치예요.',
  4: '탈퇴 즉시 펫지갑 잔액, 버킷, SOS포켓, 저금통 정보가 모두 삭제되며 복구되지 않아요.\n\n결제·정산 내역과 반려동물 프로필도 함께 삭제돼요. 가족 공유(공동양육)로 연결되어 있던 구성원과의 연결 정보, 연동된 계좌 정보도 모두 해제돼요.\n\n탈퇴 전 꼭 필요한 자료(증명서, 청구서류 등)는 미리 다운로드해두시는 걸 추천드려요.',
  5: '탈퇴 시 문의 내역도 함께 삭제되며 복구되지 않아요. 필요한 답변은 미리 저장해두세요.',
  6: '반려동물 삭제는 해당 반려동물의 기록만 없애는 거고, 회원 탈퇴는 계정 전체와 모든 데이터를 삭제하는 거예요.',
};

// FAQ 상세 화면 하단 "관련 질문"에 쓰이는 연관 FAQ 매핑
export const MOCK_FAQ_RELATED = {
  4: [5, 6],
  5: [4],
  6: [4],
};

export const MOCK_INQUIRIES = [
  { inquiryId: 1, title: '정기결제 취소는 어디서 하나요?', status: 'ANSWERED', createdAt: '2026-07-15' },
  { inquiryId: 2, title: 'SOS 포켓 결제가 안 돼요', status: 'ANSWERED', createdAt: '2026-07-12' },
  { inquiryId: 3, title: '계좌 연동이 계속 실패해요', status: 'PENDING', createdAt: '2026-07-17' },
];
