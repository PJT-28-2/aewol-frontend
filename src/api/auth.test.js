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
