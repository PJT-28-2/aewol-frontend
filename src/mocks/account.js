/**
 * 백엔드 API 연동 전, 계좌 관련 화면을 미리 확인할 수 있도록 만든 목데이터예요.
 */
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
