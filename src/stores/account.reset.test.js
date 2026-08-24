import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

vi.mock('@/api/account', () => ({
  getBanks: vi.fn(),
  getAccounts: vi.fn(),
  requestDepositVerification: vi.fn(),
  confirmDepositVerification: vi.fn(),
  registerAccount: vi.fn(),
  setPrimaryAccount: vi.fn(),
  unlinkAccount: vi.fn(),
  setSimplePassword: vi.fn(),
  verifySimplePassword: vi.fn(),
}));

import { setSimplePassword, verifySimplePassword } from '@/api/account';
import { useAccountStore } from './account';

// 간편 비밀번호 재설정 플로우(resetting 상태 + 관련 액션)만 다뤄요.
// 계좌 연동 등 나머지 account 스토어 액션은 이번 PR(#418) 범위 밖이라 건드리지 않아요.
describe('useAccountStore - 간편 비밀번호 재설정', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('resetSimplePasswordResetState()는 resetting 상태를 초기화한다', () => {
    const store = useAccountStore();
    store.resetting.currentPassword = '111111';
    store.resetting.pendingPassword = '222222';

    store.resetSimplePasswordResetState();

    expect(store.resetting).toEqual({ currentPassword: '', pendingPassword: '' });
  });

  it('verifyCurrentSimplePassword()는 검증 성공 시 true를 반환하고 currentPassword를 보관한다', async () => {
    verifySimplePassword.mockResolvedValue({ data: { result: { verified: true } } });
    const store = useAccountStore();

    const result = await store.verifyCurrentSimplePassword('111111');

    expect(result).toBe(true);
    expect(store.resetting.currentPassword).toBe('111111');
    expect(verifySimplePassword).toHaveBeenCalledWith('111111');
  });

  it('verifyCurrentSimplePassword()는 검증 실패 시 false를 반환하고 currentPassword를 보관하지 않는다', async () => {
    verifySimplePassword.mockResolvedValue({ data: { result: { verified: false } } });
    const store = useAccountStore();

    const result = await store.verifyCurrentSimplePassword('999999');

    expect(result).toBe(false);
    expect(store.resetting.currentPassword).toBe('');
  });

  it('setResetPendingPassword()는 pendingPassword를 저장한다', () => {
    const store = useAccountStore();

    store.setResetPendingPassword('333333');

    expect(store.resetting.pendingPassword).toBe('333333');
  });

  it('confirmSimplePasswordReset()는 입력값이 pendingPassword와 다르면 API를 호출하지 않고 false를 반환한다', async () => {
    const store = useAccountStore();
    store.resetting.pendingPassword = '333333';

    const result = await store.confirmSimplePasswordReset('444444');

    expect(result).toBe(false);
    expect(setSimplePassword).not.toHaveBeenCalled();
  });

  it('confirmSimplePasswordReset()는 성공하면 currentPassword와 함께 API를 호출하고 resetting 상태를 초기화한다', async () => {
    setSimplePassword.mockResolvedValue({});
    const store = useAccountStore();
    store.resetting.currentPassword = '111111';
    store.resetting.pendingPassword = '333333';

    const result = await store.confirmSimplePasswordReset('333333');

    expect(result).toBe(true);
    expect(setSimplePassword).toHaveBeenCalledWith('333333', '111111');
    expect(store.resetting).toEqual({ currentPassword: '', pendingPassword: '' });
  });

  it('confirmSimplePasswordReset()는 API 호출이 실패하면 예외를 던지고 resetting 상태를 그대로 유지한다(재시도용)', async () => {
    const apiError = new Error('network error');
    setSimplePassword.mockRejectedValue(apiError);
    const store = useAccountStore();
    store.resetting.currentPassword = '111111';
    store.resetting.pendingPassword = '333333';

    await expect(store.confirmSimplePasswordReset('333333')).rejects.toThrow(apiError);

    expect(store.resetting).toEqual({ currentPassword: '111111', pendingPassword: '333333' });
  });
});
