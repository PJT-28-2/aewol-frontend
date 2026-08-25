import { afterEach, describe, expect, it, vi } from 'vitest'
import { memberApi } from './member'
import api from './index'

vi.mock('./index', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('memberApi notification settings', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('현재 사용자의 알림 설정을 조회한다', async () => {
    api.get.mockResolvedValue({ data: { result: {} } })

    await memberApi.getNotificationSettings()

    expect(api.get).toHaveBeenCalledWith('/users/me/settings/notifications')
  })

  it('변경할 알림 설정만 부분 수정한다', async () => {
    const payload = { communityEnabled: false }
    const settings = {
      paymentEnabled: true,
      recurringPaymentEnabled: true,
      familyShareEnabled: true,
      communityEnabled: false,
      marketingEnabled: false,
    }
    api.patch.mockResolvedValue({ data: { result: settings } })

    const response = await memberApi.updateNotificationSettings(payload)

    expect(api.patch).toHaveBeenCalledWith('/users/me/settings/notifications', payload)
    expect(api.patch.mock.calls[0][1]).toEqual({ communityEnabled: false })
    expect(response.data.result).toEqual(settings)
  })
})

describe('memberApi phone verification', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('전화번호 변경 인증번호를 발송한다', async () => {
    api.post.mockResolvedValue({ data: { result: { expiresInSeconds: 300 } } })

    await memberApi.sendPhoneVerificationCode('01099998888')

    expect(api.post).toHaveBeenCalledWith('/users/me/phone/send-code', {
      phone: '01099998888',
    })
  })

  it('전화번호 변경 인증번호를 검증한다', async () => {
    api.post.mockResolvedValue({ data: { result: null } })

    await memberApi.verifyPhoneCode('01099998888', '123456')

    expect(api.post).toHaveBeenCalledWith('/users/me/phone/verify-code', {
      phone: '01099998888',
      verificationCode: '123456',
    })
  })
})
