// 은행 목록은 Figma 디자인대로 8개를 항상 보여주되,
// 실제로 연동 가능한 건 KB/toss뿐이라 이 두 개만 활성화해요.
// 코드값은 실제 백엔드(bank_master)가 쓰는 금융결제원 3자리 코드 기준
// (004=KB국민은행, 092=토스뱅크) — 목데이터도 같은 코드 체계로 맞춰뒀어요.
export const ENABLED_BANK_CODES = ['004', '092']

// KB가 항상 1열 첫번째에 오도록 배열 순서 그대로 유지(화면은 이 순서대로 그림)
export const MOCK_BANKS = [
  { bankCode: '004', bankName: 'KB국민은행' },
  { bankCode: '092', bankName: '토스뱅크' },
  { bankCode: '003', bankName: 'IBK기업은행' },
  { bankCode: '011', bankName: 'NH농협은행' },
  { bankCode: '020', bankName: '우리은행' },
  { bankCode: '081', bankName: '하나은행' },
  { bankCode: '088', bankName: '신한은행' },
  { bankCode: '090', bankName: '카카오뱅크' },
]

export const MOCK_ACCOUNTS = [
  {
    accountId: 1,
    bankCode: '004',
    accountNumberMasked: '********1234',
    isPrimary: true,
  },
  {
    accountId: 2,
    bankCode: '092',
    accountNumberMasked: '********5678',
    isPrimary: false,
  },
]
