import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'

const mocks = vi.hoisted(() => ({
  startKakaoOAuth: vi.fn(),
  routerBack: vi.fn(),
  routerPush: vi.fn(),
  authStore: {
    sendSignupCode: vi.fn(),
    signup: vi.fn(),
    verifySignupCode: vi.fn(),
  },
}))

vi.mock('@/utils/kakaoOAuth', () => ({
  startKakaoOAuth: mocks.startKakaoOAuth,
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => mocks.authStore,
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    back: mocks.routerBack,
    push: mocks.routerPush,
  }),
}))

import SignupView from './SignupView.vue'

let app
let host

const getKakaoButton = () =>
  [...host.querySelectorAll('button')].find((button) =>
    button.textContent.includes('카카오로'),
  )

const getButton = (label) =>
  [...host.querySelectorAll('button')].find(
    (button) => button.textContent.trim() === label,
  )

const getEmailInput = () => host.querySelector('#signup-email')
const getPhoneInput = () => host.querySelector('#signup-phone')
const getVerificationCodeInput = () => host.querySelector('#signup-code')
const getSignupForm = () => host.querySelector('form')

const inputValue = async (input, value) => {
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
  await nextTick()
}

const flushView = async () => {
  await Promise.resolve()
  await Promise.resolve()
  await nextTick()
}

const createDeferred = () => {
  let resolve
  let reject
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })

  return { promise, resolve, reject }
}

const setCheckbox = async (input, checked = true) => {
  input.checked = checked
  input.dispatchEvent(new Event('change', { bubbles: true }))
  await nextTick()
}

const completeSignupPrerequisites = async () => {
  mocks.authStore.sendSignupCode.mockResolvedValueOnce()
  mocks.authStore.verifySignupCode.mockResolvedValueOnce()

  await inputValue(host.querySelector('#signup-name'), '홍길동')
  await inputValue(getEmailInput(), 'user@example.com')
  getButton('인증하기').click()
  await flushView()
  await inputValue(getVerificationCodeInput(), '123456')
  getButton('확인').click()
  await flushView()
  await inputValue(host.querySelector('#signup-password'), 'Abcd123!')
  await inputValue(host.querySelector('#signup-password-confirm'), 'Abcd123!')
  await inputValue(host.querySelector('#signup-zip-code'), '12345')
  await inputValue(host.querySelector('#signup-address'), '제주특별자치도 제주시 애월읍')

  const [, terms, privacy] = host.querySelectorAll(
    'fieldset input[type="checkbox"]',
  )
  await setCheckbox(terms)
  await setCheckbox(privacy)
}

describe('SignupView Kakao OAuth 진입', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.startKakaoOAuth.mockReturnValue(true)
    host = document.createElement('div')
    document.body.appendChild(host)
    app = createApp(SignupView)
    app.mount(host)
  })

  afterEach(() => {
    app.unmount()
    host.remove()
  })

  it('Kakao 버튼에서 login 화면을 거치지 않고 prompt=login으로 OAuth를 시작한다', async () => {
    getKakaoButton().click()
    await nextTick()

    expect(mocks.startKakaoOAuth).toHaveBeenCalledWith({ prompt: 'login' })
    expect(mocks.routerPush).not.toHaveBeenCalled()
  })

  it('OAuth 설정이 없으면 회원가입 화면에 오류를 표시한다', async () => {
    mocks.startKakaoOAuth.mockReturnValue(false)

    getKakaoButton().click()
    await nextTick()

    expect(host.textContent).toContain('카카오 로그인 설정을 확인해 주세요.')
    expect(mocks.routerPush).not.toHaveBeenCalled()
  })
})

describe('SignupView LOCAL 이메일 인증번호 발송', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.authStore.sendSignupCode.mockReset()
    mocks.authStore.verifySignupCode.mockReset()
    mocks.authStore.signup.mockReset()
    mocks.startKakaoOAuth.mockReturnValue(true)
    host = document.createElement('div')
    document.body.appendChild(host)
    app = createApp(SignupView)
    app.mount(host)
  })

  afterEach(() => {
    app.unmount()
    host.remove()
  })

  it('최초에는 인증하기를 표시하고 이메일이 비어 있으면 비활성화한다', () => {
    expect(getButton('인증하기')).toBeTruthy()
    expect(getButton('인증하기').disabled).toBe(true)
  })

  it('발송 요청 중에는 발송 중을 표시하고 중복 클릭을 막는다', async () => {
    const request = createDeferred()
    mocks.authStore.sendSignupCode.mockReturnValueOnce(request.promise)
    await inputValue(getEmailInput(), 'user@example.com')

    getButton('인증하기').click()
    await nextTick()

    const sendingButton = getButton('발송 중')
    expect(sendingButton.disabled).toBe(true)
    sendingButton.click()
    expect(mocks.authStore.sendSignupCode).toHaveBeenCalledOnce()

    request.resolve()
    await flushView()
  })

  it('최초 발송에 성공하면 다시 받기를 표시한다', async () => {
    mocks.authStore.sendSignupCode.mockResolvedValueOnce()
    await inputValue(getEmailInput(), 'user@example.com')

    getButton('인증하기').click()
    await flushView()

    expect(getButton('다시 받기')).toBeTruthy()
  })

  it('다시 받기를 누르면 동일한 발송 action을 재호출한다', async () => {
    mocks.authStore.sendSignupCode.mockResolvedValue()
    await inputValue(getEmailInput(), 'user@example.com')
    getButton('인증하기').click()
    await flushView()

    getButton('다시 받기').click()
    await flushView()

    expect(mocks.authStore.sendSignupCode).toHaveBeenCalledTimes(2)
    expect(mocks.authStore.sendSignupCode).toHaveBeenNthCalledWith(
      1,
      'user@example.com',
    )
    expect(mocks.authStore.sendSignupCode).toHaveBeenNthCalledWith(
      2,
      'user@example.com',
    )
  })

  it('재발송하면 기존 인증번호와 인증 완료 상태를 초기화한다', async () => {
    mocks.authStore.sendSignupCode.mockResolvedValue()
    mocks.authStore.verifySignupCode.mockResolvedValueOnce()
    await inputValue(getEmailInput(), 'user@example.com')
    getButton('인증하기').click()
    await flushView()
    await inputValue(getVerificationCodeInput(), '123456')
    getButton('확인').click()
    await flushView()
    expect(host.textContent).toContain('이메일 인증이 완료되었습니다.')

    getButton('다시 받기').click()
    await flushView()

    expect(getVerificationCodeInput().value).toBe('')
    expect(host.textContent).not.toContain('이메일 인증이 완료되었습니다.')
  })

  it('이메일을 변경하면 발송·인증번호·인증 완료 상태를 초기화한다', async () => {
    mocks.authStore.sendSignupCode.mockResolvedValueOnce()
    mocks.authStore.verifySignupCode.mockResolvedValueOnce()
    await inputValue(getEmailInput(), 'first@example.com')
    getButton('인증하기').click()
    await flushView()
    await inputValue(getVerificationCodeInput(), '123456')
    getButton('확인').click()
    await flushView()

    await inputValue(getEmailInput(), 'second@example.com')

    expect(getButton('인증하기')).toBeTruthy()
    expect(getVerificationCodeInput().value).toBe('')
    expect(host.textContent).not.toContain('이메일 인증이 완료되었습니다.')
  })

  it('최초 발송에 실패하면 인증하기와 기존 오류 메시지를 유지한다', async () => {
    mocks.authStore.sendSignupCode.mockRejectedValueOnce({
      response: { data: { message: '인증번호 발송 요청을 확인해주세요.' } },
    })
    await inputValue(getEmailInput(), 'user@example.com')

    getButton('인증하기').click()
    await flushView()

    expect(getButton('인증하기').disabled).toBe(false)
    expect(host.textContent).toContain('인증번호 발송 요청을 확인해주세요.')
  })

  it('재발송에 실패하면 현재 이메일의 기존 발송 성공 이력을 유지한다', async () => {
    mocks.authStore.sendSignupCode.mockResolvedValueOnce()
    mocks.authStore.verifySignupCode.mockResolvedValueOnce()
    await inputValue(getEmailInput(), 'user@example.com')
    getButton('인증하기').click()
    await flushView()
    await inputValue(getVerificationCodeInput(), '123456')
    getButton('확인').click()
    await flushView()
    mocks.authStore.sendSignupCode.mockRejectedValueOnce(new Error('network error'))

    getButton('다시 받기').click()
    await flushView()

    expect(getButton('다시 받기')).toBeTruthy()
    expect(getVerificationCodeInput().value).toBe('')
    expect(host.textContent).not.toContain('이메일 인증이 완료되었습니다.')
    expect(host.textContent).toContain('인증번호 발송에 실패했습니다.')
  })

  it('이전 이메일의 늦은 성공 응답이 현재 이메일의 발송 상태를 변경하지 않는다', async () => {
    const request = createDeferred()
    mocks.authStore.sendSignupCode.mockReturnValueOnce(request.promise)
    await inputValue(getEmailInput(), 'first@example.com')
    getButton('인증하기').click()
    await nextTick()

    await inputValue(getEmailInput(), 'second@example.com')
    request.resolve()
    await flushView()

    expect(getEmailInput().value).toBe('second@example.com')
    expect(getButton('인증하기')).toBeTruthy()
    expect(getButton('다시 받기')).toBeUndefined()
  })

  it.each([
    '',
    '123',
    '999999',
    '01112345678',
    '0101234567',
    '010123456789',
  ])('유효하지 않은 전화번호 %j는 버튼과 submit guard에서 차단한다', async (phone) => {
    await completeSignupPrerequisites()
    await inputValue(getPhoneInput(), phone)

    expect(getButton('가입하기').disabled).toBe(true)

    getSignupForm().dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    )
    await flushView()

    expect(mocks.authStore.signup).not.toHaveBeenCalled()
    expect(host.textContent).toContain(
      '010으로 시작하는 11자리 휴대폰 번호를 입력해 주세요.',
    )
  })

  it('유효한 전화번호는 화면에 포맷하고 API에는 숫자만 전달한다', async () => {
    mocks.authStore.signup.mockResolvedValueOnce()
    await completeSignupPrerequisites()
    await inputValue(getPhoneInput(), '010-1234-5678')

    expect(getPhoneInput().value).toBe('010-1234-5678')
    expect(getButton('가입하기').disabled).toBe(false)

    getButton('가입하기').click()
    await flushView()

    expect(mocks.authStore.signup).toHaveBeenCalledWith(
      expect.objectContaining({ phone: '01012345678' }),
    )
    expect(mocks.routerPush).toHaveBeenCalledWith('/signup/complete')
  })
})
