import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp, nextTick } from 'vue';

const mocks = vi.hoisted(() => ({
  routerPush: vi.fn(),
  accountStore: { hasSimplePassword: false },
  memberStore: {
    profile: { name: '테스트', email: 'test@aewol.com', provider: 'LOCAL' },
    fetchProfile: vi.fn().mockResolvedValue(),
    verifyPassword: vi.fn(),
  },
  petStore: { pets: [], representativePetId: null, fetchPets: vi.fn().mockResolvedValue() },
  themeStore: { isDark: false, toggle: vi.fn() },
  clearSession: vi.fn(),
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mocks.routerPush }),
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ clearSession: mocks.clearSession, logout: vi.fn() }),
}));

vi.mock('@/stores/account', () => ({
  useAccountStore: () => mocks.accountStore,
}));

vi.mock('@/stores/member', () => ({
  useMemberStore: () => mocks.memberStore,
}));

vi.mock('@/stores/pet', () => ({
  usePetStore: () => mocks.petStore,
}));

vi.mock('@/stores/theme', () => ({
  useThemeStore: () => mocks.themeStore,
}));

import SettingsView from './SettingsView.vue';

let app;
let host;

// PR #420 리뷰 지적: 간편 비밀번호를 설정한 적 없는 회원에게도 "재설정" 메뉴가 보여서
// 눌러도 막다른 흐름(현재 PIN이 없는데 확인하라고 나옴)으로 끝났다. hasSimplePassword
// 기준으로 메뉴 자체를 숨기는지만 확인한다.
describe('SettingsView - 간편 비밀번호 재설정 메뉴 노출', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.accountStore.hasSimplePassword = false;
    mocks.memberStore.profile = { name: '테스트', email: 'test@aewol.com', provider: 'LOCAL' };
    mocks.petStore.pets = [];
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    app?.unmount();
    host.remove();
  });

  it('hasSimplePassword가 false면 재설정 메뉴가 보이지 않는다', async () => {
    mocks.accountStore.hasSimplePassword = false;
    app = createApp(SettingsView);
    app.mount(host);
    await nextTick();
    await nextTick();

    expect(host.textContent).not.toContain('간편 비밀번호 재설정');
  });

  it('hasSimplePassword가 true면 재설정 메뉴가 보인다', async () => {
    mocks.accountStore.hasSimplePassword = true;
    app = createApp(SettingsView);
    app.mount(host);
    await nextTick();
    await nextTick();

    expect(host.textContent).toContain('간편 비밀번호 재설정');
  });
});
