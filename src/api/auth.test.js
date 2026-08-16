import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from './index'
import { authApi } from './auth'

vi.mock('./index', () => ({
  default: {
    post: vi.fn(),
  },
}))

describe('계정 찾기 API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('이름과 숫자-only 전화번호로 인증번호를 요청한다', () => {
    authApi.requestFindAccountCode('홍길동', '01012345678')

    expect(api.post).toHaveBeenCalledWith(
      '/auth/account/find/send-code',
      { name: '홍길동', phone: '01012345678' },
      { skipAuth: true, skipAuthRefresh: true },
    )
  })

  it('requestId와 인증번호로 계정을 확인한다', () => {
    authApi.verifyFindAccountCode('request-id', '123456')

    expect(api.post).toHaveBeenCalledWith(
      '/auth/account/find/verify-code',
      { requestId: 'request-id', verificationCode: '123456' },
      { skipAuth: true, skipAuthRefresh: true },
    )
  })
})

describe('Kakao 신규회원 전화번호 인증 API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('registrationToken과 숫자 전화번호로 인증번호를 요청한다', () => {
    authApi.sendKakaoSignupPhoneCode(
      'dummy-registration-token',
      '01012345678',
    )

    expect(api.post).toHaveBeenCalledWith(
      '/auth/oauth/kakao/signup/phone/send-code',
      {
        registrationToken: 'dummy-registration-token',
        phone: '01012345678',
      },
      { skipAuth: true, skipAuthRefresh: true },
    )
  })

  it('전화번호 없이 registrationToken과 인증번호만 검증한다', () => {
    authApi.verifyKakaoSignupPhoneCode(
      'dummy-registration-token',
      '123456',
    )

    expect(api.post).toHaveBeenCalledWith(
      '/auth/oauth/kakao/signup/phone/verify-code',
      {
        registrationToken: 'dummy-registration-token',
        verificationCode: '123456',
      },
      { skipAuth: true, skipAuthRefresh: true },
    )
    expect(api.post.mock.calls[0][1]).not.toHaveProperty('phone')
  })
})

describe('Kakao 신규회원 가입 완료 API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('허용된 가입 완료 필드만 인증 없이 전송한다', () => {
    authApi.completeKakaoSignup({
      registrationToken: 'dummy-registration-token',
      zipCode: '12345',
      address: '제주특별자치도 제주시 애월읍',
      addressDetail: '101호',
      terms: true,
      privacy: true,
      marketing: false,
      phone: '01012345678',
      verificationCode: '123456',
      email: 'user@example.com',
      name: '테스트',
      providerId: 'provider-id',
      password: 'must-not-be-sent',
      accessToken: 'must-not-be-sent',
      refreshToken: 'must-not-be-sent',
    })

    expect(api.post).toHaveBeenCalledWith(
      '/auth/oauth/kakao/signup/complete',
      {
        registrationToken: 'dummy-registration-token',
        zipCode: '12345',
        address: '제주특별자치도 제주시 애월읍',
        addressDetail: '101호',
        terms: true,
        privacy: true,
        marketing: false,
      },
      { skipAuth: true, skipAuthRefresh: true },
    )
    expect(api.post.mock.calls[0][1]).not.toHaveProperty('phone')
    expect(api.post.mock.calls[0][1]).not.toHaveProperty('verificationCode')
    expect(api.post.mock.calls[0][1]).not.toHaveProperty('email')
    expect(api.post.mock.calls[0][1]).not.toHaveProperty('name')
    expect(api.post.mock.calls[0][1]).not.toHaveProperty('providerId')
    expect(api.post.mock.calls[0][1]).not.toHaveProperty('password')
    expect(api.post.mock.calls[0][1]).not.toHaveProperty('accessToken')
    expect(api.post.mock.calls[0][1]).not.toHaveProperty('refreshToken')
  })
})
