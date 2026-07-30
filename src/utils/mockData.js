/**
 * 백엔드 API 연동 전, 화면만 먼저 확인할 수 있도록 만든 목데이터예요.
 *
 * 목 모드 여부는 소스 코드에 고정하지 않고 환경변수(VITE_USE_MOCK_DATA)로 주입해요.
 * - 값을 명시적으로 'true'로 설정한 경우에만 mock이 켜짐
 * - 값이 없거나 그 외의 값이면 기본적으로 꺼짐(false) → 실제 API 호출
 * 로컬 개발 중 mock을 켜고 싶으면 프로젝트 루트에 `.env.local` 파일을 만들고
 * `VITE_USE_MOCK_DATA=true` 한 줄만 추가하면 돼요 (이 파일은 git에 커밋하지 않는 파일이라
 * 배포 빌드에는 절대 영향을 주지 않아요).
 */
export const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true';

// 은행 목록은 Figma 디자인대로 8개를 항상 보여주되,
// 실제로 연동 가능한 건 KB/toss뿐이라 이 두 개만 활성화해요.
export const ENABLED_BANK_CODES = ['KB', 'TOSS'];

export const MOCK_BANKS = [
  { bankCode: 'KB', bankName: 'KB국민은행' },
  { bankCode: 'TOSS', bankName: '토스뱅크' },
  { bankCode: 'WOORI', bankName: '우리은행' },
  { bankCode: 'HANA', bankName: '하나은행' },
  { bankCode: 'NH', bankName: 'NH농협은행' },
  { bankCode: 'KAKAOBANK', bankName: '카카오뱅크' },
  { bankCode: 'SHINHAN', bankName: '신한은행' },
  { bankCode: 'IBK', bankName: 'IBK기업은행' },
];

export const MOCK_ACCOUNTS = [
  {
    accountId: 1,
    bankCode: 'KB',
    accountNumberMasked: '********1234',
    balance: 482600,
    isPrimary: true,
  },
  {
    accountId: 2,
    bankCode: 'TOSS',
    accountNumberMasked: '********5678',
    balance: 320000,
    isPrimary: false,
  },
];

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
  {
    inquiryId: 1,
    category: '지갑·버킷',
    title: '정기결제 취소는 어디서 하나요?',
    content: '매달 자동으로 나가는 사료 정기결제를 취소하고 싶은데 어디서 할 수 있나요?',
    status: 'ANSWERED',
    createdAt: '2026-07-15',
  },
  {
    inquiryId: 2,
    category: '지갑·버킷',
    title: 'SOS 포켓 결제가 안 돼요',
    content: 'SOS 포켓 잔액이 충분한데도 결제 시 실패했다는 메시지가 떠요.',
    status: 'ANSWERED',
    createdAt: '2026-07-12',
  },
  {
    inquiryId: 3,
    category: '계좌연동',
    title: '계좌 연동이 계속 실패해요',
    content: 'KB국민은행 계좌를 연동하려는데 1원 인증 단계에서 계속 실패로 떠요.',
    status: 'PENDING',
    createdAt: '2026-07-17',
  },
];

export const MOCK_INQUIRY_ANSWERS = {
  1: '마이페이지 > 정기 결제 관리에서 해당 항목의 취소 버튼을 눌러주시면 다음 결제일부터 자동으로 중단돼요.',
  2: 'SOS 포켓은 등록된 카드가 있어야 결제가 가능해요. 마이페이지 > 계좌 관리에서 결제 수단이 연결되어 있는지 확인해주세요. 계속 실패한다면 화면 캡처와 함께 다시 문의해주세요.',
};