/**
 * 백엔드 API 연동 전, 홈 대시보드 화면을 미리 확인할 수 있도록 만든 목데이터예요.
 * TODO: 백엔드 API 연동 후 제거하고 실제 fetch로 교체
 */
export const MOCK_MEMBER_NAME = '애월';

export const MOCK_WALLET_BALANCE = 482600;

export const MOCK_MONTHLY_EXPENSE = { total: 243000, changeRate: -12 };

export const MOCK_HOME_PETS = [
  { id: 1, name: '소로', species: 'DOG', expenseAmount: 168000 },
  { id: 2, name: '나비', species: 'CAT', expenseAmount: 75000 },
];
