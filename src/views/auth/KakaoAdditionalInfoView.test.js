import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { createApp, nextTick } from 'vue'

const mocks = vi.hoisted(() => ({
  sendCode: vi.fn(),
  verifyCode: vi.fn(),
  completeSignup: vi.fn(),
  fetchPets: vi.fn(),
  routerReplace: vi.fn(),
  authStore: {
    registrationToken: 'dummy-registration-token',
    clearKakaoRegistration: vi.fn(),
    completeKakaoSignup: vi.fn(),
  },
}))

vi.mock('@/api/auth', () => ({
  authApi: {
    sendKakaoSignupPhoneCode: mocks.sendCode,
    verifyKakaoSignupPhoneCode: mocks.verifyCode,
  },
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => mocks.authStore,
}))

vi.mock('@/stores/pet', () => ({
  usePetStore: () => ({ fetchPets: mocks.fetchPets }),
}))

vi.mock('@/components/common/AddressSearchLayer.vue', () => ({
  default: {
    emits: ['update:modelValue', 'select'],
    template: `
      <button
        class="mock-address-select"
        type="button"
        @click="$emit('select', { zipCode: '12345', address: '제주특별자치도 제주시 애월읍' })"
      >
        테스트 주소 선택
      </button>
      <button
        class="mock-long-address-select"
        type="button"
        @click="$emit('select', { zipCode: '12345678901', address: 'a'.repeat(301) })"
      >
        긴 주소 선택
      </button>
      <button
        class="mock-zip-only-select"
        type="button"
        @click="$emit('select', { zipCode: '12345', address: '' })"
      >
        우편번호만 선택
      </button>
      <button
        class="mock-address-only-select"
        type="button"
        @click="$emit('select', { zipCode: '', address: '제주시 애월읍' })"
      >
        주소만 선택
      </button>
    `,
  },
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ replace: mocks.routerReplace }),
}))

import KakaoAdditionalInfoView from './KakaoAdditionalInfoView.vue'

let app
let host

const flushView = async () => {
  await Promise.resolve()
  await nextTick()
  await Promise.resolve()
  await nextTick()
}

const getPhoneInput = () => host.querySelector('input[type="tel"]')
const getCodeInput = () => host.querySelector('input[inputmode="numeric"]')
const getButton = (label) =>
  [...host.querySelectorAll('button')].find((button) =>
    button.textContent.includes(label),
  )
const getCompleteForm = () => host.querySelector('form')
const getAgreementInputs = () => [
  ...host.querySelectorAll('fieldset input[type="checkbox"]'),
]
const getAddressDetailInput = () =>
  [...host.querySelectorAll('input')].find((input) =>
    input.placeholder.includes('건물'),
  )

const inputValue = async (input, value) => {
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
  await nextTick()
}

const requestCode = async (expiresInSeconds = 300) => {
  mocks.sendCode.mockResolvedValueOnce({
    data: { result: { expiresInSeconds } },
  })
  getButton('인증번호 받기')?.click()
  await flushView()
}

const verifyPhone = async () => {
  await inputValue(getPhoneInput(), '01012345678')
  await requestCode()
  await inputValue(getCodeInput(), '123456')
  mocks.verifyCode.mockResolvedValueOnce({ data: { result: null } })
  getButton('확인').click()
  await flushView()
}

const selectAddress = async () => {
  host.querySelector('.mock-address-select').click()
  await nextTick()
}

const setCheckbox = async (input, checked = true) => {
  input.checked = checked
  input.dispatchEvent(new Event('change', { bubbles: true }))
  await nextTick()
}

const submitCompleteForm = async () => {
  getCompleteForm().dispatchEvent(
    new Event('submit', { bubbles: true, cancelable: true }),
  )
  await flushView()
}

describe('KakaoAdditionalInfoView SMS 인증', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    mocks.authStore.registrationToken = 'dummy-registration-token'
    mocks.authStore.completeKakaoSignup = mocks.completeSignup
    mocks.completeSignup.mockResolvedValue({ authStatus: 'LOGIN_COMPLETE' })
    mocks.fetchPets.mockResolvedValue([])
    host = document.createElement('div')
    document.body.appendChild(host)
    app = createApp(KakaoAdditionalInfoView)
    app.mount(host)
  })

  afterEach(() => {
    app.unmount()
    host.remove()
    vi.useRealTimers()
  })

  it('입력 행의 input과 버튼에 일관된 높이와 너비를 적용한다', async () => {
    const phoneButton = getButton('인증번호 받기')
    const verifyButton = getButton('확인')

    expect(getPhoneInput().classList).toContain('h-(--control-height-md)')
    expect(getCodeInput().classList).toContain('h-(--control-height-md)')
    for (const button of [phoneButton, verifyButton]) {
      expect(button.classList).toContain('h-(--control-height-md)')
      expect(button.classList).toContain('w-full')
      expect(button.classList).toContain('whitespace-nowrap')
      expect(button.parentElement.className).toContain('grid-cols-[minmax(0,1fr)_7rem]')
    }

    await verifyPhone()
    const zipButton = getButton('우편번호 찾기')
    const zipInput = [...host.querySelectorAll('input')]
      .find((input) => input.placeholder.includes('우편번호'))

    expect(zipInput.classList).toContain('h-(--control-height-md)')
    expect(zipButton.classList).toContain('h-(--control-height-md)')
    expect(zipButton.classList).toContain('w-full')
    expect(zipButton.parentElement.className).toContain('grid-cols-[minmax(0,1fr)_7rem]')
  })

  it('잘못된 전화번호에서는 인증번호 발송을 차단한다', async () => {
    await inputValue(getPhoneInput(), 'abc0101234')

    const sendButton = getButton('인증번호 받기')

    expect(getPhoneInput().value).toBe('010-123-4')
    expect(sendButton.disabled).toBe(true)
    sendButton.click()
    expect(mocks.sendCode).not.toHaveBeenCalled()
  })

  it('전화번호를 표시 형식으로 바꾸고 숫자 번호로 발송한 뒤 응답 시간으로 타이머를 시작한다', async () => {
    await inputValue(getPhoneInput(), '01012345678')

    expect(getPhoneInput().value).toBe('010-1234-5678')
    expect(getButton('인증번호 받기').disabled).toBe(false)

    await requestCode(300)

    expect(mocks.sendCode).toHaveBeenCalledWith(
      'dummy-registration-token',
      '01012345678',
    )
    expect(host.textContent).toContain('남은 시간 05:00')

    vi.advanceTimersByTime(1000)
    await nextTick()
    expect(host.textContent).toContain('남은 시간 04:59')
  })

  it('OTP를 숫자 6자리로 제한하고 검증 성공 상태를 표시한다', async () => {
    await inputValue(getPhoneInput(), '01012345678')
    await requestCode()
    await inputValue(getCodeInput(), '12a34b567')

    expect(getCodeInput().value).toBe('123456')
    mocks.verifyCode.mockResolvedValueOnce({ data: { result: null } })
    getButton('확인').click()
    await flushView()

    expect(mocks.verifyCode).toHaveBeenCalledWith(
      'dummy-registration-token',
      '123456',
    )
    expect(host.textContent).toContain('전화번호 인증이 완료되었습니다.')
    expect(getCodeInput().readOnly).toBe(true)
  })

  it('재전송 성공 시 OTP를 비우고 새 응답 시간으로 타이머를 다시 시작한다', async () => {
    await inputValue(getPhoneInput(), '01012345678')
    await requestCode(300)
    await inputValue(getCodeInput(), '123456')
    mocks.sendCode.mockResolvedValueOnce({
      data: { result: { expiresInSeconds: 120 } },
    })

    getButton('다시 받기').click()
    await flushView()

    expect(getCodeInput().value).toBe('')
    expect(host.textContent).toContain('남은 시간 02:00')
    expect(mocks.sendCode).toHaveBeenCalledTimes(2)
  })

  it('전화번호 변경 시 발송·OTP·인증 완료 상태를 모두 초기화한다', async () => {
    await inputValue(getPhoneInput(), '01012345678')
    await requestCode()
    await inputValue(getCodeInput(), '123456')
    mocks.verifyCode.mockResolvedValueOnce({ data: { result: null } })
    getButton('확인').click()
    await flushView()
    expect(host.textContent).toContain('전화번호 인증이 완료되었습니다.')

    await inputValue(getPhoneInput(), '01087654321')

    expect(getCodeInput().value).toBe('')
    expect(host.textContent).not.toContain('전화번호 인증이 완료되었습니다.')
    expect(host.textContent).not.toContain('남은 시간')
    expect(getButton('인증번호 받기')).toBeTruthy()
  })

  it('타이머가 0이 되면 OTP 검증을 막고 만료 상태를 표시한다', async () => {
    await inputValue(getPhoneInput(), '01012345678')
    await requestCode(1)
    await inputValue(getCodeInput(), '123456')

    vi.advanceTimersByTime(1000)
    await nextTick()

    expect(host.textContent).toContain('인증번호가 만료되었습니다.')
    expect(getButton('확인').disabled).toBe(true)
    expect(getButton('다시 받기').disabled).toBe(false)
  })

  it.each([
    [400, '전화번호 형식을 확인해주세요.'],
    [409, '이미 가입된 전화번호입니다.'],
    [429, '인증번호 요청 횟수를 초과했습니다.'],
    [503, '인증 서비스를 이용할 수 없습니다.'],
  ])('%i 발송 오류를 사용자용 메시지로 표시한다', async (status, message) => {
    await inputValue(getPhoneInput(), '01012345678')
    mocks.sendCode.mockRejectedValueOnce({ response: { status } })

    getButton('인증번호 받기').click()
    await flushView()

    expect(host.textContent).toContain(message)
  })

  it('발송 400 응답의 Backend message를 우선 표시한다', async () => {
    await inputValue(getPhoneInput(), '01012345678')
    mocks.sendCode.mockRejectedValueOnce({
      response: {
        status: 400,
        data: { message: '유효하지 않거나 만료된 카카오 가입 세션입니다.' },
      },
    })

    getButton('인증번호 받기').click()
    await flushView()

    expect(host.textContent).toContain(
      '유효하지 않거나 만료된 카카오 가입 세션입니다.',
    )
  })

  it.each([
    [
      { message: '전화번호 인증이 완료되지 않았거나 만료되었습니다.' },
      '전화번호 인증이 완료되지 않았거나 만료되었습니다.',
    ],
    [undefined, '인증번호를 확인해주세요.'],
  ])(
    '인증 400 응답에서 Backend message를 우선하고 없으면 fallback을 표시한다',
    async (data, message) => {
      await inputValue(getPhoneInput(), '01012345678')
      await requestCode()
      await inputValue(getCodeInput(), '123456')
      mocks.verifyCode.mockRejectedValueOnce({ response: { status: 400, data } })

      getButton('확인').click()
      await flushView()

      expect(host.textContent).toContain(message)
    },
  )

  it('전화번호 인증 전에는 주소와 약관 폼을 노출하지 않는다', () => {
    expect(getCompleteForm()).toBeNull()
    expect(getButton('가입 완료')).toBeUndefined()
    expect(mocks.completeSignup).not.toHaveBeenCalled()
  })

  it('전화번호 인증 후 주소와 약관 폼을 노출한다', async () => {
    await verifyPhone()

    expect(host.textContent).toContain('우편번호')
    expect(host.textContent).toContain('(필수) 이용약관 동의')
    expect(host.textContent).toContain('(선택) 마케팅 정보 수신 동의')
    expect(getButton('가입 완료').disabled).toBe(true)
  })

  it('주소가 없으면 가입 완료를 차단한다', async () => {
    await verifyPhone()
    await submitCompleteForm()

    expect(host.textContent).toContain('주소를 입력해주세요.')
    expect(mocks.completeSignup).not.toHaveBeenCalled()
  })

  it.each([
    ['.mock-address-only-select', '우편번호'],
    ['.mock-zip-only-select', '주소'],
  ])('%s 선택 시 필수 %s 누락으로 제출을 차단한다', async (selector) => {
    await verifyPhone()
    host.querySelector(selector).click()
    await nextTick()
    const [, terms, privacy] = getAgreementInputs()
    await setCheckbox(terms)
    await setCheckbox(privacy)
    await submitCompleteForm()

    expect(host.textContent).toContain('주소를 입력해주세요.')
    expect(mocks.completeSignup).not.toHaveBeenCalled()
  })

  it('상세주소 100자 초과를 차단한다', async () => {
    await verifyPhone()
    await selectAddress()
    await inputValue(getAddressDetailInput(), 'a'.repeat(101))
    const [, terms, privacy] = getAgreementInputs()
    await setCheckbox(terms)
    await setCheckbox(privacy)
    await submitCompleteForm()

    expect(host.textContent).toContain('상세주소는 100자 이하로 입력해주세요.')
    expect(mocks.completeSignup).not.toHaveBeenCalled()
  })

  it('우편번호 10자·주소 300자 제한을 초과하면 제출을 차단한다', async () => {
    await verifyPhone()
    host.querySelector('.mock-long-address-select').click()
    await nextTick()
    const [, terms, privacy] = getAgreementInputs()
    await setCheckbox(terms)
    await setCheckbox(privacy)
    await submitCompleteForm()

    expect(host.textContent).toContain('입력한 주소를 확인해주세요.')
    expect(mocks.completeSignup).not.toHaveBeenCalled()
  })

  it('필수 약관에 동의하지 않으면 가입 완료를 차단한다', async () => {
    await verifyPhone()
    await selectAddress()
    await submitCompleteForm()

    expect(host.textContent).toContain('필수 약관에 동의해주세요.')
    expect(mocks.completeSignup).not.toHaveBeenCalled()
  })

  it('전체동의와 개별 마케팅 동의 상태를 기존 약관 패턴대로 연동한다', async () => {
    await verifyPhone()
    const [all, terms, privacy, marketing] = getAgreementInputs()

    await setCheckbox(all)

    expect(terms.checked).toBe(true)
    expect(privacy.checked).toBe(true)
    expect(marketing.checked).toBe(true)
    expect(all.checked).toBe(true)

    await setCheckbox(marketing, false)

    expect(terms.checked).toBe(true)
    expect(privacy.checked).toBe(true)
    expect(marketing.checked).toBe(false)
    expect(all.checked).toBe(false)
  })

  it('상세주소 100자는 허용한다', async () => {
    await verifyPhone()
    await selectAddress()
    await inputValue(getAddressDetailInput(), 'a'.repeat(100))
    const [, terms, privacy] = getAgreementInputs()
    await setCheckbox(terms)
    await setCheckbox(privacy)

    getButton('가입 완료').click()
    await flushView()

    expect(mocks.completeSignup).toHaveBeenCalledWith(
      expect.objectContaining({ addressDetail: 'a'.repeat(100) }),
    )
  })

  it('마케팅 동의 없이 정확한 주소·약관 본문으로 가입을 완료한다', async () => {
    await verifyPhone()
    await selectAddress()
    await inputValue(getAddressDetailInput(), '101호')
    const [, terms, privacy, marketing] = getAgreementInputs()
    await setCheckbox(terms)
    await setCheckbox(privacy)

    expect(marketing.checked).toBe(false)
    getButton('가입 완료').click()
    await flushView()

    expect(mocks.completeSignup).toHaveBeenCalledWith({
      zipCode: '12345',
      address: '제주특별자치도 제주시 애월읍',
      addressDetail: '101호',
      terms: true,
      privacy: true,
      marketing: false,
    })
    expect(mocks.completeSignup.mock.calls[0][0]).not.toHaveProperty('phone')
    expect(mocks.completeSignup.mock.calls[0][0]).not.toHaveProperty(
      'verificationCode',
    )
    expect(mocks.fetchPets).toHaveBeenCalledOnce()
    expect(mocks.routerReplace).toHaveBeenLastCalledWith('/share/start')
  })

  it('가입 완료 중 중복 제출을 막는다', async () => {
    let resolveSignup
    mocks.completeSignup.mockImplementationOnce(
      () => new Promise((resolve) => {
        resolveSignup = resolve
      }),
    )
    await verifyPhone()
    await selectAddress()
    const [, terms, privacy] = getAgreementInputs()
    await setCheckbox(terms)
    await setCheckbox(privacy)

    getCompleteForm().dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    )
    getCompleteForm().dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    )
    await nextTick()

    expect(mocks.completeSignup).toHaveBeenCalledOnce()
    resolveSignup({ authStatus: 'LOGIN_COMPLETE' })
    await flushView()
  })

  it.each([
    [400, '입력한 주소와 약관 정보를 확인해주세요.'],
    [409, '이미 가입되었거나 사용 중인 정보가 있습니다.'],
    [503, '회원가입 서비스를 이용할 수 없습니다.'],
  ])('%i 가입 완료 오류를 안전한 메시지로 표시한다', async (status, message) => {
    mocks.completeSignup.mockRejectedValueOnce({ response: { status } })
    await verifyPhone()
    await selectAddress()
    const [, terms, privacy] = getAgreementInputs()
    await setCheckbox(terms)
    await setCheckbox(privacy)

    await submitCompleteForm()

    expect(host.textContent).toContain(message)
    expect(mocks.authStore.clearKakaoRegistration).not.toHaveBeenCalled()
  })

  it('가입 완료 400 응답의 Backend message를 우선 표시하고 가입 세션을 유지한다', async () => {
    mocks.completeSignup.mockRejectedValueOnce({
      response: {
        status: 400,
        data: { message: '전화번호 인증이 완료되지 않았거나 만료되었습니다.' },
      },
    })
    await verifyPhone()
    await selectAddress()
    const [, terms, privacy] = getAgreementInputs()
    await setCheckbox(terms)
    await setCheckbox(privacy)

    await submitCompleteForm()

    expect(host.textContent).toContain(
      '전화번호 인증이 완료되지 않았거나 만료되었습니다.',
    )
    expect(mocks.authStore.clearKakaoRegistration).not.toHaveBeenCalled()
  })

  it('네트워크 가입 완료 실패 후에도 가입 세션을 유지한다', async () => {
    mocks.completeSignup.mockRejectedValueOnce({ request: {} })
    await verifyPhone()
    await selectAddress()
    const [, terms, privacy] = getAgreementInputs()
    await setCheckbox(terms)
    await setCheckbox(privacy)

    await submitCompleteForm()

    expect(host.textContent).toContain(
      '네트워크 연결을 확인한 뒤 다시 시도해주세요.',
    )
    expect(mocks.authStore.clearKakaoRegistration).not.toHaveBeenCalled()
  })

  it('뒤로가기는 가입 세션을 지우고 로그인으로 이동한다', async () => {
    host.querySelector('button[aria-label="로그인 화면으로 돌아가기"]').click()
    await flushView()

    expect(mocks.authStore.clearKakaoRegistration).toHaveBeenCalledOnce()
    expect(mocks.routerReplace).toHaveBeenCalledWith('/login')
  })
})
