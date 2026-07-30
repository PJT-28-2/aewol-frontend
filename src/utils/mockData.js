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
  { inquiryId: 1, title: '정기결제 취소는 어디서 하나요?', status: 'ANSWERED', createdAt: '2026-07-15' },
  { inquiryId: 2, title: 'SOS 포켓 결제가 안 돼요', status: 'ANSWERED', createdAt: '2026-07-12' },
  { inquiryId: 3, title: '계좌 연동이 계속 실패해요', status: 'PENDING', createdAt: '2026-07-17' },
];

// 증명서 관리(목록/상세) 화면 목데이터 — ERD의 pet, pet_document 테이블 필드명을 camelCase로 매핑했어요.
// (pet_id → petId, doc_id → docId, doc_name → docName, doc_type → docType,
//  file_url → fileUrl, issued_date → issuedDate 등)
export const MOCK_PETS = [
  {
    petId: 'pet-1',
    memberId: 'member-1',
    name: '소로',
    species: 'DOG',
    breed: '포메라니안',
    birthDate: '2023-05-12',
    gender: 'MALE',
    weight: 3.2,
    neutered: 'Y',
    regNumber: '410000012345678',
    medicalHistory: 'N',
    isActive: 1,
    createdAt: '2023-06-02T00:00:00',
    updatedAt: '2023-06-02T00:00:00',
  },
  {
    petId: 'pet-2',
    memberId: 'member-1',
    name: '나비',
    species: 'CAT',
    breed: '코리안숏헤어',
    birthDate: '2022-11-03',
    gender: 'FEMALE',
    weight: 3.8,
    neutered: 'Y',
    regNumber: '', // 아직 동물등록증이 연동되지 않은 케이스(빈 상태 확인용)
    medicalHistory: 'N',
    isActive: 1,
    createdAt: '2023-01-15T00:00:00',
    updatedAt: '2023-01-15T00:00:00',
  },
];

export const MOCK_PET_DOCUMENTS = [
  {
    docId: 'doc-reg-pet-1',
    petId: 'pet-1',
    docName: '소로 · 동물등록증',
    docType: 'REGISTRATION',
    fileUrl: '',
    issuedDate: '2023-06-02',
    createdAt: '2023-06-02T00:00:00',
  },
  {
    docId: 'doc-vac-1',
    petId: 'pet-1',
    docName: '종합백신(DHPPL) 접종증명서',
    docType: 'VACCINATION',
    fileUrl: '/mock/certificates/vaccination-dhppl.jpg',
    issuedDate: '2026-03-12',
    createdAt: '2026-03-12T09:00:00',
  },
  {
    docId: 'doc-vac-2',
    petId: 'pet-1',
    docName: '광견병 예방접종 증명서',
    docType: 'VACCINATION',
    fileUrl: '/mock/certificates/vaccination-rabies.jpg',
    issuedDate: '2026-01-20',
    createdAt: '2026-01-20T09:00:00',
  },
];

// GET /api/certificates/{doc_id} 상세 응답 목데이터 (동물등록증 상세 전용, key: docId)
// CODEF 국가동물보호정보시스템 동물등록번호 조회 API의 실제 응답 필드를 참고해 구성했어요
// (resColor→furColor, resOwner→ownerName, resPhoneNo→ownerPhone, resIssueDate→issueDate,
//  resRegisterDate→registerDate, resIssueOgzNm→issueOrg, resState→regState, resType→regType).
// 현재 pet/pet_document ERD엔 이 필드들을 담을 컬럼이 없어서, 백엔드에 pet_registration류
// 신규 테이블 추가가 필요해요. 이 상세 API는 APMS를 매번 라이브로 호출하는 게 아니라, 연동 시
// 이미 저장해둔 DB 값을 그대로 반환한다는 전제로 만들어졌어요(이 목데이터는 그 값을 흉내낸 거예요).
export const MOCK_REGISTRATION_DETAIL = {
  'doc-reg-pet-1': {
    docId: 'doc-reg-pet-1',
    petId: 'pet-1',
    regNumber: '410000012345678',
    name: '소로',
    breed: '포메라니안',
    gender: 'MALE',
    neutered: 'Y',
    birthDate: '2023-05-12',
    furColor: '크림색',
    weight: 3.2,
    ownerName: '김애월',
    ownerPhone: '010-1234-5678',
    issueDate: '2023-06-02',
    registerDate: '2023-06-02',
    issueOrg: '국가동물보호정보시스템',
    regState: '승인',
    regType: '소유',
    lastSyncedAt: '2026-07-15',
  },
};