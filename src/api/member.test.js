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
