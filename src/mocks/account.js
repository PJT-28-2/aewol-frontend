// 은행 목록은 Figma 디자인대로 8개를 항상 보여주되,
// 실제로 연동 가능한 건 KB/toss뿐이라 이 두 개만 활성화해요.
export const ENABLED_BANK_CODES = ['KB', 'TOSS']

export const MOCK_BANKS = [
  { bankCode: 'KB', bankName: 'KB국민은행' },
  { bankCode: 'TOSS', bankName: '토스뱅크' },
  { bankCode: 'SHINHAN', bankName: '신한은행' },
  { bankCode: 'HANA', bankName: '하나은행' },
  { bankCode: 'WOORI', bankName: '우리은행' },
  { bankCode: 'NH', bankName: 'NH농협은행' },
  { bankCode: 'IBK', bankName: 'IBK기업은행' },
  { bankCode: 'KAKAOBANK', bankName: '카카오뱅크' },
]

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
]

export const MOCK_RECURRING_PAYMENTS = [
  {
    id: 1,
    merchantName: '강아지 사료 정기배송',
    amount: 32000,
    dayOfMonth: 15,
    nextPaymentLabel: '다음 8/15',
    category: 'FOOD',
  },
  {
    id: 2,
    merchantName: '펫보험료',
    amount: 26000,
    dayOfMonth: 1,
    nextPaymentLabel: '다음 8/1',
    category: 'MEDICAL',
  },
]
