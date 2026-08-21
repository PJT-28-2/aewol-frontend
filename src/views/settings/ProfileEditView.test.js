import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'

const mocks = vi.hoisted(() => ({
  authStore: {
    clearSession: vi.fn(),
  },
  memberStore: {
    profile: null,
    fetchProfile: vi.fn(),
    updateProfile: vi.fn(),
    verifyPassword: vi.fn(),
    changePassword: vi.fn(),
  },
  routerReplace: vi.fn(),
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => mocks.authStore,
}))

vi.mock('@/stores/member', () => ({
  useMemberStore: () => mocks.memberStore,
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ replace: mocks.routerReplace }),
  RouterLink: { props: ['to'], template: '<a><slot /></a>' },
}))

import ProfileEditView from './ProfileEditView.vue'

let app
let host

const profile = {
  name: '홍길동',
  phone: '01012345678',
  profileImg: null,
  zipCode: '12345',
  address: '제주특별자치도 제주시 애월읍',
  addressDetail: '1층',
  provider: 'LOCAL',
}

const flushView = async () => {
  await Promise.resolve()
  await Promise.resolve()
  await nextTick()
}

const inputValue = async (input, value) => {
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
  await nextTick()
}

const getPhoneInput = () => host.querySelector('#profile-phone')
const getProfileForm = () => host.querySelector('form')
const getSaveButton = () =>
  [...host.querySelectorAll('button')].find(
    (button) => button.textContent.trim() === '저장하기',
  )

const submitProfileForm = async () => {
  getProfileForm().dispatchEvent(
    new Event('submit', { bubbles: true, cancelable: true }),
  )
  await flushView()
}

describe('ProfileEditView 전화번호 검증', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    mocks.memberStore.profile = { ...profile }
    mocks.memberStore.fetchProfile.mockResolvedValue({ ...profile })
    mocks.memberStore.updateProfile.mockResolvedValue({ ...profile })
    host = document.createElement('div')
    document.body.appendChild(host)
    app = createApp(ProfileEditView)
    app.mount(host)
    await flushView()
  })

  afterEach(() => {
    app?.unmount()
    host?.remove()
  })

  it('기존 정상 전화번호를 포맷하고 숫자-only payload로 저장한다', async () => {
    expect(getPhoneInput().value).toBe('010-1234-5678')
    expect(getSaveButton().disabled).toBe(false)

    await submitProfileForm()

    expect(mocks.memberStore.updateProfile).toHaveBeenCalledWith({
      phone: '01012345678',
      profileImg: null,
      zipCode: '12345',
      address: '제주특별자치도 제주시 애월읍',
      addressDetail: '1층',
    })
  })

  it('하이픈이 포함된 정상 입력을 숫자-only payload로 저장한다', async () => {
    await inputValue(getPhoneInput(), '010-1234-5678')

    expect(getPhoneInput().value).toBe('010-1234-5678')
    expect(getSaveButton().disabled).toBe(false)

    await submitProfileForm()

    expect(mocks.memberStore.updateProfile).toHaveBeenCalledWith(
      expect.objectContaining({ phone: '01012345678' }),
    )
  })

  it.each(['01112345678', '0101234567'])(
    '유효하지 않은 전화번호 %s는 버튼과 submit guard에서 차단한다',
    async (phone) => {
      await inputValue(getPhoneInput(), phone)

      expect(getSaveButton().disabled).toBe(true)
      await submitProfileForm()

      expect(mocks.memberStore.updateProfile).not.toHaveBeenCalled()
      expect(host.textContent).toContain(
        '010으로 시작하는 11자리 휴대폰 번호를 입력해 주세요.',
      )
    },
  )

  it('12자리 입력은 화면에서 잘려도 overflow 상태로 저장을 차단한다', async () => {
    await inputValue(getPhoneInput(), '010123456789')

    expect(getPhoneInput().value).toBe('010-1234-5678')
    expect(getSaveButton().disabled).toBe(true)
    await submitProfileForm()

    expect(mocks.memberStore.updateProfile).not.toHaveBeenCalled()
    expect(host.textContent).toContain(
      '010으로 시작하는 11자리 휴대폰 번호를 입력해 주세요.',
    )
  })
})
